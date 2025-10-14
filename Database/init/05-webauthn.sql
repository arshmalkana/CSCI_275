-- WebAuthn/Passkey Support
-- Add passkey support for biometric authentication

-- Create webauthn_credentials table to store user passkeys
CREATE TABLE webauthn_credentials (
    credential_id TEXT PRIMARY KEY,  -- Base64URL encoded credential ID from authenticator
    staff_id INTEGER NOT NULL REFERENCES staff(staff_id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,  -- Base64URL encoded public key for signature verification
    counter BIGINT NOT NULL DEFAULT 0,  -- Signature counter for replay attack protection
    device_name VARCHAR(100),  -- User-friendly device name (e.g., "iPhone 15", "Windows Hello")
    aaguid TEXT,  -- Authenticator AAGUID (identifies authenticator model)
    credential_device_type VARCHAR(50),  -- 'platform' or 'cross-platform'
    transports TEXT[],  -- ['usb', 'nfc', 'ble', 'internal'] - how device connects
    last_used_at TIMESTAMP,  -- Track when credential was last used for security auditing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups by staff_id
CREATE INDEX idx_webauthn_staff_id ON webauthn_credentials(staff_id);

-- Add passkey_enabled flag to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS passkey_enabled BOOLEAN DEFAULT FALSE;

-- Update trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_webauthn_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_webauthn_credentials_updated_at
    BEFORE UPDATE ON webauthn_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_webauthn_credentials_updated_at();

-- Comments for documentation
COMMENT ON TABLE webauthn_credentials IS 'Stores WebAuthn/FIDO2 credentials (passkeys) for biometric authentication';
COMMENT ON COLUMN webauthn_credentials.credential_id IS 'Unique identifier for the credential, provided by the authenticator';
COMMENT ON COLUMN webauthn_credentials.public_key IS 'Public key used to verify signatures from the authenticator';
COMMENT ON COLUMN webauthn_credentials.counter IS 'Signature counter that must always increment, used to detect cloned credentials';
COMMENT ON COLUMN webauthn_credentials.device_name IS 'Human-readable name for the device (e.g., "My iPhone", "Work Laptop")';
COMMENT ON COLUMN webauthn_credentials.aaguid IS 'Authenticator Attestation GUID identifying the authenticator model';
COMMENT ON COLUMN webauthn_credentials.credential_device_type IS 'Type of authenticator: platform (built-in) or cross-platform (external key)';
COMMENT ON COLUMN webauthn_credentials.transports IS 'Array of supported transport methods for this credential';
