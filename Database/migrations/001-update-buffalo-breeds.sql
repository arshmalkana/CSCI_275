-- ============================================================================
-- Migration: Update Buffalo Breeds
-- ============================================================================
-- Replace Surti and Jaffarabadi with Murrah Sexed and Nili Ravi Sexed
--
-- Date: 2025-11-12
-- Description: Updates buffalo semen types to align with current
--              breeding program requirements
-- ============================================================================

-- Step 1: Deactivate old buffalo breeds (don't delete to preserve data integrity)
UPDATE semen_types
SET is_active = FALSE
WHERE semen_code IN ('SURTI', 'JAFFARABADI');

-- Step 2: Add new sexed buffalo breeds
INSERT INTO semen_types (semen_code, semen_name, species, semen_category, is_active)
VALUES
  ('MURRAH_SEXED', 'Murrah Buffalo (Sexed)', 'Buffalo', 'Sexed', TRUE),
  ('NILI_RAVI_SEXED', 'Nili Ravi Buffalo (Sexed)', 'Buffalo', 'Sexed', TRUE)
ON CONFLICT (semen_code) DO UPDATE
SET
  semen_name = EXCLUDED.semen_name,
  species = EXCLUDED.species,
  semen_category = EXCLUDED.semen_category,
  is_active = EXCLUDED.is_active;

-- Step 3: Verify the changes
SELECT
  semen_code,
  semen_name,
  species,
  semen_category,
  is_active,
  created_at
FROM semen_types
WHERE species = 'Buffalo'
ORDER BY is_active DESC, semen_code;

-- Step 4: Report any existing AI reports using deactivated breeds
SELECT
  COUNT(*) as reports_with_old_breeds,
  'WARNING: These reports use deactivated buffalo breeds' as message
FROM ai_report_details ard
JOIN semen_types st ON ard.semen_type_id = st.semen_id
WHERE st.semen_code IN ('SURTI', 'JAFFARABADI');
