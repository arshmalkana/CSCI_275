// src/routes/webauthnDebugRoutes.js
import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import { query } from '../database/db.js';

const RP_ID     = process.env.RP_ID     || 'ahpunjabdev.itsarsh.dev';
const RP_ORIGIN = process.env.RP_ORIGIN || 'https://ahpunjabdev.itsarsh.dev';

// store challenge for usernameless *debug* flow
const debugChallenge = new Map();
const key = 'debug';

function unwrapIfDoubleEncoded(id) {
  try {
    const ascii = Buffer.from(id, 'base64url').toString('utf8');
    return /^[A-Za-z0-9_-]+$/.test(ascii) ? ascii : null;
  } catch { return null; }
}

export default async function webauthnDebugRoutes(app) {
  // mount EVERYTHING under /v1/auth/webauthn/debug
  app.register(async (fastify) => {
    // POST /v1/auth/webauthn/debug/usernameless-options
    fastify.post('/usernameless-options', async (_req, reply) => {
      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        userVerification: 'preferred',
        timeout: 30_000,
        // no allowCredentials → usernameless
      });
      debugChallenge.set(key, options.challenge);
      return reply.send({ options });
    });

    // GET /v1/auth/webauthn/debug/creds?username=...&staffId=...
    fastify.get('/creds', async (req, reply) => {
      const { username, staffId } = req.query ?? {};
      let userRow = null;
      if (staffId) {
        userRow = (await query('SELECT staff_id, user_id FROM staff WHERE staff_id=$1', [Number(staffId)])).rows[0];
      } else if (username) {
        userRow = (await query('SELECT staff_id, user_id FROM staff WHERE user_id=$1', [username])).rows[0];
      }
      if (!userRow) return reply.code(404).send({ ok: false, message: 'user not found' });

      const creds = (await query(
        'SELECT credential_id, transports, device_name FROM webauthn_credentials WHERE staff_id=$1 ORDER BY created_at DESC',
        [userRow.staff_id],
      )).rows;

      const out = creds.map((c) => {
        let alias = unwrapIfDoubleEncoded(c.credential_id);
        let bytes = -1;
        try { bytes = Buffer.from(alias ?? c.credential_id, 'base64url').length; } catch {}
        return { id: c.credential_id, alias, bytes, transports: c.transports, deviceName: c.device_name };
      });

      return reply.send({ ok: true, count: out.length, creds: out });
    });

    // POST /v1/auth/webauthn/debug/verify-usernameless
    fastify.post('/verify-usernameless', async (req, reply) => {
      const assertion = req.body?.response;
      if (!assertion?.id) return reply.code(400).send({ success: false, message: 'Missing assertion' });

      const assertedId = assertion.id;
      const wrapped = Buffer.from(assertedId, 'utf8').toString('base64url');

      const credRow = (await query(
        'SELECT wc.*, s.user_id FROM webauthn_credentials wc JOIN staff s ON wc.staff_id=s.staff_id WHERE wc.credential_id=$1 OR wc.credential_id=$2 LIMIT 1',
        [assertedId, wrapped],
      )).rows[0];
      if (!credRow) return reply.code(404).send({ success: false, message: 'Credential not recognized' });

      const expectedChallenge = debugChallenge.get(key);

      const verification = await verifyAuthenticationResponse({
        response: assertion,
        expectedRPID: RP_ID,
        expectedOrigin: RP_ORIGIN,
        expectedChallenge,
        authenticator: {
          credentialID: Buffer.from(assertedId, 'base64url'),
          credentialPublicKey: Buffer.from(credRow.public_key, 'base64url'),
          counter: parseInt(credRow.counter, 10) || 0,
          transports: credRow.transports || undefined,
        },
        requireUserVerification: false,
      });

      if (!verification.verified) return reply.code(401).send({ success: false, message: 'Verification failed' });

      await query(
        'UPDATE webauthn_credentials SET counter=$1, last_used_at=CURRENT_TIMESTAMP WHERE credential_id=$2',
        [verification.authenticationInfo.newCounter, credRow.credential_id],
      );

      debugChallenge.delete(key);
      return reply.send({ success: true, user: { id: credRow.staff_id, username: credRow.user_id } });
    });
  }, { prefix: '/v1/auth/webauthn/debug' }); // <<< the prefix prevents duplicates
}
