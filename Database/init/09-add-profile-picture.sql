-- ============================================================================
-- Add profile_picture_url column to staff table
-- Migration: 09-add-profile-picture.sql
-- ============================================================================

-- Add profile_picture_url column to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN staff.profile_picture_url IS 'URL or base64 data for user profile picture';

-- Create index for faster lookups (optional, useful if you frequently query by this field)
CREATE INDEX IF NOT EXISTS idx_staff_profile_picture ON staff(staff_id) WHERE profile_picture_url IS NOT NULL;
