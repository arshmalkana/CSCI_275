-- Migration: Update schema to match registration form features
-- Date: 2025-10-04
-- Purpose: Add missing fields from frontend registration implementation

-- ============================================================================
-- 1. UPDATE INSTITUTES TABLE - Add location and feature flags
-- ============================================================================

ALTER TABLE institutes
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS is_cluster_available BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_lab_available BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_tehsil_hq BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN institutes.latitude IS 'Institute GPS latitude coordinate';
COMMENT ON COLUMN institutes.longitude IS 'Institute GPS longitude coordinate';
COMMENT ON COLUMN institutes.is_cluster_available IS 'Whether institute has semen cluster facility';
COMMENT ON COLUMN institutes.is_lab_available IS 'Whether institute has laboratory facility';
COMMENT ON COLUMN institutes.is_tehsil_hq IS 'Whether institute serves as tehsil headquarters';

-- ============================================================================
-- 2. UPDATE VILLAGES TABLE - Add detailed animal populations
-- ============================================================================

-- Add missing animal population fields
ALTER TABLE villages
ADD COLUMN IF NOT EXISTS equine_population INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS poultry_layers_population INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS poultry_broilers_population INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS human_population INTEGER DEFAULT 0;

-- Rename existing columns for consistency (buffalo, not buffalo_population)
ALTER TABLE villages
RENAME COLUMN cow_population TO cows;
ALTER TABLE villages
RENAME COLUMN buffalo_population TO buffaloes;
ALTER TABLE villages
RENAME COLUMN sheep_population TO sheep;
ALTER TABLE villages
RENAME COLUMN goat_population TO goat;
ALTER TABLE villages
RENAME COLUMN pig_population TO pigs;
ALTER TABLE villages
RENAME COLUMN dog_population TO dogs;

-- Rename new columns for consistency
ALTER TABLE villages
RENAME COLUMN equine_population TO equine;
ALTER TABLE villages
RENAME COLUMN poultry_layers_population TO poultry_layers;
ALTER TABLE villages
RENAME COLUMN poultry_broilers_population TO poultry_broilers;

-- Drop old generic poultry_population if exists
ALTER TABLE villages
DROP COLUMN IF EXISTS poultry_population;

COMMENT ON COLUMN villages.equine IS 'Horse and equine population';
COMMENT ON COLUMN villages.cows IS 'Cow population';
COMMENT ON COLUMN villages.buffaloes IS 'Buffalo population';
COMMENT ON COLUMN villages.sheep IS 'Sheep population';
COMMENT ON COLUMN villages.goat IS 'Goat population';
COMMENT ON COLUMN villages.pigs IS 'Pig population';
COMMENT ON COLUMN villages.poultry_layers IS 'Layer chicken population';
COMMENT ON COLUMN villages.poultry_broilers IS 'Broiler chicken population';
COMMENT ON COLUMN villages.dogs IS 'Dog population';
COMMENT ON COLUMN villages.human_population IS 'Human population of village';

-- ============================================================================
-- 3. UPDATE VIEWS TO INCLUDE NEW FIELDS
-- ============================================================================

-- Drop and recreate institute hierarchy view with new fields
DROP VIEW IF EXISTS v_institute_hierarchy;

CREATE VIEW v_institute_hierarchy AS
SELECT
    i.institute_id,
    i.org_id,
    i.institute_name,
    i.institute_type,
    i.latitude,
    i.longitude,
    i.is_cluster_available,
    i.is_lab_available,
    i.is_tehsil_hq,
    v.village_name,
    v.latitude AS village_latitude,
    v.longitude AS village_longitude,
    v.human_population AS village_population,
    t.tehsil_name,
    d.district_name,
    s.full_name AS incharge_name,
    s.designation AS incharge_designation,
    s.mobile AS incharge_mobile,
    s.email AS incharge_email,
    pi.institute_name AS parent_institute_name,
    ra.institute_name AS reporting_authority_name
FROM institutes i
LEFT JOIN villages v ON i.village_id = v.village_id
LEFT JOIN tehsils t ON i.tehsil_id = t.tehsil_id
LEFT JOIN districts d ON i.district_id = d.district_id
LEFT JOIN staff s ON i.current_incharge_id = s.staff_id
LEFT JOIN institutes pi ON i.parent_institute_id = pi.institute_id
LEFT JOIN institutes ra ON i.reporting_authority_id = ra.institute_id;

-- Create view for village population details
CREATE VIEW v_village_populations AS
SELECT
    v.village_id,
    v.village_name,
    t.tehsil_name,
    d.district_name,
    v.human_population,
    v.equine,
    v.buffaloes,
    v.cows,
    v.pigs,
    v.goat,
    v.sheep,
    v.poultry_layers,
    v.poultry_broilers,
    v.dogs,
    (v.equine + v.buffaloes + v.cows + v.pigs + v.goat + v.sheep + v.poultry_layers + v.poultry_broilers + v.dogs) AS total_animals
FROM villages v
LEFT JOIN tehsils t ON v.tehsil_id = t.tehsil_id
LEFT JOIN districts d ON v.district_id = d.district_id;

COMMENT ON VIEW v_village_populations IS 'Complete village population data including all animal species';

-- ============================================================================
-- 4. CREATE INDEXES FOR NEW LOCATION FIELDS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_institutes_location ON institutes(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_villages_location ON villages(latitude, longitude);

-- ============================================================================
-- 5. UPDATE ANIMAL SPECIES ENUM (Optional - if needed in future)
-- ============================================================================

-- Note: The animal_species enum already exists but we may need to ensure consistency
-- Existing: ('Cattle', 'Buffalo', 'Goat', 'Sheep', 'Pig', 'Poultry', 'Dog')
-- Our form uses: equine, buffaloes, cows, pigs, goat, sheep, poultry_layers, poultry_broilers

COMMENT ON TYPE animal_species IS 'Animal species categories - matches village population fields';