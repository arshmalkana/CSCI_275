-- Refresh Token Sessions Table
-- Tracks active refresh tokens for session management

CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_id SERIAL PRIMARY KEY,
  token_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA256 hash of the refresh token
  staff_id INTEGER NOT NULL REFERENCES staff(staff_id) ON DELETE CASCADE,

  -- Session information
  device_info TEXT, -- User agent string
  ip_address INET, -- Client IP address
  device_name VARCHAR(100), -- Parsed device name (e.g., "iPhone (Safari)")

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,

  -- Status
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP,
  revoked_reason TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_staff_id ON refresh_tokens(staff_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Cleanup function to remove expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM refresh_tokens
  WHERE expires_at < CURRENT_TIMESTAMP
     OR (is_revoked = TRUE AND revoked_at < CURRENT_TIMESTAMP - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql;

-- Schedule automatic cleanup using pg_cron (if available)
-- If pg_cron is not installed, this will fail silently and manual cleanup must be used
DO $$
BEGIN
  -- Try to schedule daily cleanup at 2 AM
  -- Requires pg_cron extension: CREATE EXTENSION IF NOT EXISTS pg_cron;
  PERFORM cron.schedule(
    'cleanup-expired-refresh-tokens',
    '0 2 * * *', -- Daily at 2 AM
    'SELECT cleanup_expired_refresh_tokens()'
  );
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'pg_cron extension not available. Please run cleanup_expired_refresh_tokens() manually or install pg_cron.';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not schedule automatic cleanup: %. Please run cleanup_expired_refresh_tokens() manually.', SQLERRM;
END $$;

-- Comments
COMMENT ON TABLE refresh_tokens IS 'Stores active refresh token sessions for security and session management';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'SHA256 hash of the refresh token for security';
COMMENT ON COLUMN refresh_tokens.device_info IS 'User-Agent string from the request';
COMMENT ON COLUMN refresh_tokens.device_name IS 'Parsed human-readable device name';