-- ============================================================================
-- Seed Data: Semen Types
-- ============================================================================
-- This file populates the semen_types table with all supported semen breeds
-- Used by the AI Reports module for tracking artificial insemination activities
--
-- IMPORTANT: These semen codes must match the SEMEN_TYPE_MAPPING in
-- Backend/src/config/semenTypes.js (single source of truth for mappings)
-- ============================================================================

-- Insert Local Semen Types (Cattle)
INSERT INTO semen_types (semen_code, semen_name, species, semen_category, is_active)
VALUES
  ('HF_LOCAL', 'Holstein Friesian (Local)', 'Cattle', 'Local', TRUE),
  ('JERSEY_LOCAL', 'Jersey (Local)', 'Cattle', 'Local', TRUE),
  ('CB_LOCAL', 'Crossbred (Local)', 'Cattle', 'Local', TRUE),
  ('SAHIWAL_LOCAL', 'Sahiwal (Local)', 'Cattle', 'Local', TRUE)
ON CONFLICT (semen_code) DO NOTHING;

-- Insert Gir Semen Types
INSERT INTO semen_types (semen_code, semen_name, species, semen_category, is_active)
VALUES
  ('GIR', 'Gir', 'Cattle', 'Gir', TRUE),
  ('GIR_2', 'Gir 2', 'Cattle', 'Gir', TRUE)
ON CONFLICT (semen_code) DO NOTHING;

-- Insert ETT/Imported Semen Types
INSERT INTO semen_types (semen_code, semen_name, species, semen_category, is_active)
VALUES
  ('HF_ETT', 'Holstein Friesian (ETT)', 'Cattle', 'ETT', TRUE),
  ('JERSEY_ETT', 'Jersey (ETT)', 'Cattle', 'ETT', TRUE),
  ('HF_IMPORTED', 'Holstein Friesian (Imported)', 'Cattle', 'Imported', TRUE),
  ('JERSEY_IMPORTED', 'Jersey (Imported)', 'Cattle', 'Imported', TRUE)
ON CONFLICT (semen_code) DO NOTHING;

-- Insert Sexed Semen Types
INSERT INTO semen_types (semen_code, semen_name, species, semen_category, is_active)
VALUES
  ('HF_SEXED', 'Holstein Friesian (Sexed)', 'Cattle', 'Sexed', TRUE),
  ('JERSEY_SEXED', 'Jersey (Sexed)', 'Cattle', 'Sexed', TRUE),
  ('CB_SEXED', 'Crossbred (Sexed)', 'Cattle', 'Sexed', TRUE),
  ('SAHIWAL_SEXED', 'Sahiwal (Sexed)', 'Cattle', 'Sexed', TRUE)
ON CONFLICT (semen_code) DO NOTHING;

-- Insert Buffalo Semen Types
INSERT INTO semen_types (semen_code, semen_name, species, semen_category, is_active)
VALUES
  ('MURRAH', 'Murrah Buffalo', 'Buffalo', 'Local', TRUE),
  ('NILI_RAVI', 'Nili Ravi Buffalo', 'Buffalo', 'Local', TRUE),
  ('SURTI', 'Surti Buffalo', 'Buffalo', 'Local', TRUE),
  ('JAFFARABADI', 'Jaffarabadi Buffalo', 'Buffalo', 'Local', TRUE)
ON CONFLICT (semen_code) DO NOTHING;

-- Verify insertion
SELECT
  semen_code,
  semen_name,
  species,
  semen_category,
  is_active
FROM semen_types
ORDER BY
  CASE semen_category
    WHEN 'Local' THEN 1
    WHEN 'Gir' THEN 2
    WHEN 'ETT' THEN 3
    WHEN 'Imported' THEN 4
    WHEN 'Sexed' THEN 5
    ELSE 6
  END,
  semen_code;
