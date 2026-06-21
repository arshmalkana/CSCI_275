-- Migration 004: Password reset tokens
-- Supports the self-service forgot-password flow.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_id    SERIAL PRIMARY KEY,
    staff_id    INTEGER NOT NULL REFERENCES staff(staff_id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,                -- SHA-256 hash of the random token
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,                  -- NULL = unused
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_prt_staff_id   ON password_reset_tokens(staff_id);
