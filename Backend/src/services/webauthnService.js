// src/services/webauthnService.js
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { query } from '../database/db.js';

// RP config
const RP_NAME   = process.env.RP_NAME   || 'AH Punjab Reporting';
const RP_ID     = process.env.RP_ID     || 'ahpunjabdev.itsarsh.dev';
const RP_ORIGIN = process.env.RP_ORIGIN || 'https://ahpunjabdev.itsarsh.dev';

// Temp challenge store (swap to Redis in prod)
const challengeStore = new Map();

/** Unwraps an accidentally “double-encoded” credential id.
 *  If `id` is base64url of the ASCII string of a base64url id, return the inner id; else null.
 */
function unwrapIfDoubleEncoded(id) {
  try {
    const ascii = Buffer.from(id, 'base64url').toString('utf8');
    return /^[A-Za-z0-9_-]+$/.test(ascii) ? ascii : null;
  } catch { return null; }
}

const webauthnService = {
  /**
   * Registration options (forces platform, discoverable passkey)
   * @param {{staff_id:number, user_id:string, full_name:string}} user
   */
  async generateRegistrationOptions(user) {
    if (!user || !user.staff_id) throw new Error('Invalid user object: staff_id is required');

    const existingCredentials = await this.getUserCredentials(user.staff_id);

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      // v10+ wants a BufferSource for userID:
      userID: new Uint8Array(Buffer.from(String(user.staff_id), 'utf-8')),
      userName: user.user_id,
      userDisplayName: user.full_name,
      timeout: 300_000,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'required',       // ensure discoverable
        requireResidentKey: true,
        userVerification: 'required',
      },
      // IMPORTANT: excludeCredentials IDs must be raw bytes
      excludeCredentials: existingCredentials.map((cred) => ({
        id: cred.credential_id,
        type: 'public-key',
        transports: cred.transports || [],
      })),
      attestationType: 'none',
      extensions: { credProps: true },
    });

    challengeStore.set(user.staff_id, {
      challenge: options.challenge,
      timestamp: Date.now(),
    });

    return options;
  },

  /**
   * Verify registration & store credential (no double encoding)
   */
  async verifyRegistration(staffId, response, deviceName = null) {
    const stored = challengeStore.get(staffId);
    if (!stored) throw new Error('Challenge not found or expired');
    if (Date.now() - stored.timestamp > 300_000) {
      challengeStore.delete(staffId);
      throw new Error('Challenge expired');
    }

    try {
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: stored.challenge,
        expectedOrigin: RP_ORIGIN,
        expectedRPID: RP_ID,
        requireUserVerification: false,
      });

      if (!verification.verified) throw new Error('Registration verification failed');

      const { registrationInfo } = verification;
      const {
        credential,
        credentialID,
        credentialPublicKey,
        counter,
        aaguid,
        credentialDeviceType,
      } = registrationInfo;

      const finalDeviceName = deviceName || this.generateDeviceName(response);

      // Normalize ID/pubkey:
      const credIdB64u =
        typeof credentialID === 'string'
          ? credentialID
          : credentialID
          ? Buffer.from(credentialID).toString('base64url')
          : typeof credential?.id === 'string'
          ? credential.id
          : (() => { throw new Error('Missing credential ID'); })();

      let pubKeyB64u;
    if (credentialPublicKey instanceof Uint8Array || Array.isArray(credentialPublicKey)) {
      pubKeyB64u = Buffer.from(credentialPublicKey).toString('base64url');
    } else if (typeof credentialPublicKey === 'string') {
      // Some versions may return a base64 string; normalize to base64url
      pubKeyB64u = credentialPublicKey.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
    } else if (credential?.publicKey) {
      // Very old shapes (avoid if possible)
      const pk = credential.publicKey;
      pubKeyB64u = typeof pk === 'string'
        ? pk.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'')
        : Buffer.from(pk).toString('base64url');
    } else {
      // If you hit this, your @simplewebauthn version doesn’t expose the public key as expected
      // Print the full object for inspection and bail out with a clear error
      console.error('registrationInfo without credentialPublicKey:', ri);
      throw new Error('Missing credentialPublicKey in registrationInfo');
    }

      const finalCounter = typeof counter === 'number'
        ? counter
        : (credential?.counter ?? 0);

      const aaguidHex = aaguid ? Buffer.from(aaguid).toString('hex') : null;

      await this.saveCredential({
        credentialId: credIdB64u,       // ✅ store base64url of raw bytes (not double-encoded)
        staffId,
        publicKey: pubKeyB64u,          // stored as base64url
        counter: finalCounter,
        deviceName: finalDeviceName,
        aaguid: aaguidHex,
        credentialDeviceType,
        transports: response?.response?.transports || ['internal'],
      });

      await query('UPDATE staff SET passkey_enabled = true WHERE staff_id = $1', [staffId]);

      challengeStore.delete(staffId);

      return { verified: true, credentialId: credIdB64u, deviceName: finalDeviceName };
    } catch (err) {
      challengeStore.delete(staffId);
      throw err;
    }
  },

  /**
   * Authentication options (username → staff → all creds)
   * Returns correct IDs and also an alias for any old double-encoded rows.
   */
  async generateAuthenticationOptions(userId) {
    const userResult = await query(
      'SELECT staff_id FROM staff WHERE user_id = $1 AND is_active = true',
      [userId],
    );
    if (userResult.rows.length === 0) throw new Error('User not found');

    const staffId = userResult.rows[0].staff_id;
    console.log(staffId)
    const credentials = await this.getUserCredentials(staffId);
    console.log(credentials)
    if (credentials.length === 0) throw new Error('No passkeys registered for this user');

    const allowCredentials = [];
    for (const cred of credentials) {
      const id = cred.credential_id;                 // base64url string
      const alias = unwrapIfDoubleEncoded(id);       // handle old rows
      const transports =
        Array.isArray(cred.transports) && cred.transports.length
          ? cred.transports
          : ['internal'];                             // good default for platform

      allowCredentials.push({ id, type: 'public-key', transports });
      if (alias && alias !== id) {
        allowCredentials.push({ id: alias, type: 'public-key', transports });
      }
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      timeout: 60_000,
      allowCredentials,
      userVerification: 'preferred',
    });

    challengeStore.set(`auth_${userId}`, {
      challenge: options.challenge,
      staffId,
      timestamp: Date.now(),
    });

    return options;
  },

  /**
   * Verify authentication (lookup by asserted id, with unwrap fallback)
   */
  async verifyAuthentication(userId, response) {
    const stored = challengeStore.get(`auth_${userId}`);
    if (!stored) throw new Error('Challenge not found or expired');
    if (Date.now() - stored.timestamp > 60_000) {
      challengeStore.delete(`auth_${userId}`);
      throw new Error('Challenge expired');
    }

    try {
      const assertedId = response.id; // base64url string from browser
      const maybeWrapped = Buffer.from(assertedId, 'utf8').toString('base64url');

      const credResult = await query(
        `SELECT wc.*, s.user_id, s.full_name, s.user_role, s.designation,
                s.current_institute_id, s.is_first_time, s.mobile, s.email,
                i.institute_name, i.institute_type,
                d.district_name, t.tehsil_name
           FROM webauthn_credentials wc
           JOIN staff s ON wc.staff_id = s.staff_id
           LEFT JOIN institutes i ON s.current_institute_id = i.institute_id
           LEFT JOIN districts d ON i.district_id = d.district_id
           LEFT JOIN tehsils t ON i.tehsil_id = t.tehsil_id
          WHERE s.is_active = true
            AND (wc.credential_id = $1 OR wc.credential_id = $2)
          LIMIT 1`,
        [assertedId, maybeWrapped],
      );

      if (credResult.rows.length === 0) throw new Error('Credential not found');

      const cred = credResult.rows[0];

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: stored.challenge,
        expectedOrigin: RP_ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: assertedId,
          publicKey: Buffer.from(cred.public_key, 'base64url'),
          counter: parseInt(cred.counter, 10) || 0,
          transports: cred.transports || undefined,
        },
        requireUserVerification: false,
      });

      if (!verification.verified) throw new Error('Authentication verification failed');

      await query(
        'UPDATE webauthn_credentials SET counter = $1, last_used_at = CURRENT_TIMESTAMP WHERE credential_id = $2',
        [verification.authenticationInfo.newCounter, cred.credential_id],
      );

      challengeStore.delete(`auth_${userId}`);

      return {
        staff_id: cred.staff_id,
        user_id: cred.user_id,
        full_name: cred.full_name,
        user_role: cred.user_role,
        designation: cred.designation,
        current_institute_id: cred.current_institute_id,
        is_first_time: cred.is_first_time,
        mobile: cred.mobile,
        email: cred.email,
        institute_name: cred.institute_name,
        institute_type: cred.institute_type,
        district_name: cred.district_name,
        tehsil_name: cred.tehsil_name,
      };
    } catch (err) {
      challengeStore.delete(`auth_${userId}`);
      throw err;
    }
  },

  /** Credentials for a staff member */
  async getUserCredentials(staffId) {
    const result = await query(
      `SELECT credential_id, device_name, transports, created_at, last_used_at
         FROM webauthn_credentials
        WHERE staff_id = $1
        ORDER BY created_at DESC`,
      [staffId],
    );
    return result.rows;
  },

  /** Delete a credential for a staff member */
  async deleteCredential(credentialId, staffId) {
    const result = await query(
      'DELETE FROM webauthn_credentials WHERE credential_id = $1 AND staff_id = $2',
      [credentialId, staffId],
    );

    const remaining = await query(
      'SELECT COUNT(*) FROM webauthn_credentials WHERE staff_id = $1',
      [staffId],
    );

    if (parseInt(remaining.rows[0].count, 10) === 0) {
      await query('UPDATE staff SET passkey_enabled = false WHERE staff_id = $1', [staffId]);
    }

    return result.rowCount > 0;
  },

  /** Insert a credential row */
  async saveCredential(credential) {
    await query(
      `INSERT INTO webauthn_credentials
         (credential_id, staff_id, public_key, counter, device_name, aaguid,
          credential_device_type, transports)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        credential.credentialId,
        credential.staffId,
        credential.publicKey,
        credential.counter,
        credential.deviceName,
        credential.aaguid,
        credential.credentialDeviceType,
        credential.transports,
      ],
    );
  },

  /** Best-effort device name */
  generateDeviceName(response) {
    const transports = response?.response?.transports || [];
    if (transports.includes('internal')) return 'This Device';
    if (transports.includes('usb'))      return 'Security Key (USB)';
    if (transports.includes('nfc'))      return 'Security Key (NFC)';
    if (transports.includes('ble'))      return 'Security Key (Bluetooth)';
    return 'Unknown Device';
  },
};

export default webauthnService;
