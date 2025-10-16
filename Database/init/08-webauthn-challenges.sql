-- ============================================================================
-- Migration: Add challenges table for WebAuthn challenge storage
-- Replaces in-memory Map storage with database storage for security
-- ============================================================================

-- Create challenges table
CREATE TABLE IF NOT EXISTS webauthn_challenges (
  challenge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_key VARCHAR(255) NOT NULL UNIQUE, -- staffId for registration, auth_{userId} for login
  challenge TEXT NOT NULL,
  staff_id INTEGER REFERENCES staff(staff_id) ON DELETE CASCADE,
  challenge_type VARCHAR(20) NOT NULL CHECK (challenge_type IN ('registration', 'authentication')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  ip_address INET,
  user_agent TEXT
);

-- Index for fast lookup by key
CREATE INDEX idx_webauthn_challenges_key ON webauthn_challenges(challenge_key);

-- Index for cleanup of expired challenges
CREATE INDEX idx_webauthn_challenges_expires ON webauthn_challenges(expires_at);

-- Auto-cleanup expired challenges function
CREATE OR REPLACE FUNCTION cleanup_expired_challenges()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM webauthn_challenges WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE webauthn_challenges IS 'Stores WebAuthn challenges for registration and authentication flows. Replaces in-memory storage for better security and scalability.';
COMMENT ON COLUMN webauthn_challenges.challenge_key IS 'Unique key: staffId for registration, auth_{userId} for authentication';
COMMENT ON COLUMN webauthn_challenges.challenge_type IS 'Type of challenge: registration (5 min expiry) or authentication (1 min expiry)';
COMMENT ON COLUMN webauthn_challenges.expires_at IS 'Challenge expiration timestamp. Expired challenges are automatically cleaned up.';
COMMENT ON COLUMN webauthn_challenges.ip_address IS 'IP address of the client requesting the challenge (for audit/security)';
COMMENT ON COLUMN webauthn_challenges.user_agent IS 'User agent of the client (for audit/security)';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON webauthn_challenges TO ahpunjab;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO ahpunjab;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'WebAuthn challenges table created successfully';
  RAISE NOTICE 'Challenge storage moved from memory to database for improved security';
END $$;