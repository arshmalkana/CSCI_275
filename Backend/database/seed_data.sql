-- ============================================================================
-- SEED DATA FOR AH PUNJAB REPORTING SYSTEM
-- Initial data population based on existing sheets structure
-- ============================================================================

-- ============================================================================
-- 1. SERVICE CHARGES (From Fee Management Sheet)
-- ============================================================================

INSERT INTO service_charges (service_code, service_name, category, current_rate, effective_from, financial_year) VALUES
-- OPD Charges
('OPD_LARGE', 'OPD Large Animals', 'OPD', 10.00, '2024-04-01', '2024-25'),
('OPD_PETS', 'OPD Pets/Dogs', 'OPD', 50.00, '2024-04-01', '2024-25'),

-- Diagnostic Charges
('PD_CHARGE', 'Pregnancy Diagnosis', 'Diagnostic', 25.00, '2024-04-01', '2024-25'),
('FECAL_TEST', 'Fecal Test', 'Diagnostic', 50.00, '2024-04-01', '2024-25'),
('BLOOD_TEST', 'Blood Test', 'Diagnostic', 100.00, '2024-04-01', '2024-25'),
('URINE_TEST', 'Urine Test', 'Diagnostic', 75.00, '2024-04-01', '2024-25'),
('MILK_TEST', 'Milk Test', 'Diagnostic', 80.00, '2024-04-01', '2024-25'),
('US_PET', 'Ultrasound Pets', 'Diagnostic', 150.00, '2024-04-01', '2024-25'),

-- Surgery Charges
('CASTRATION_BOVINE', 'Castration Bovine', 'Surgery', 50.00, '2024-04-01', '2024-25'),
('CASTRATION_OTHERS', 'Castration Others', 'Surgery', 30.00, '2024-04-01', '2024-25'),
('OBSTETRICAL', 'Obstetrical Cases', 'Surgery', 250.00, '2024-04-01', '2024-25'),

-- Certificate Charges
('HC_SMALL', 'Health Certificate Small Animals', 'Certificate', 50.00, '2024-04-01', '2024-25'),
('HC_LARGE', 'Health Certificate Large Animals', 'Certificate', 100.00, '2024-04-01', '2024-25'),
('PM_SMALL', 'Post Mortem Small Animals', 'Certificate', 75.00, '2024-04-01', '2024-25'),
('PM_LARGE', 'Post Mortem Large Animals', 'Certificate', 150.00, '2024-04-01', '2024-25'),
('PM_VETRO', 'Post Mortem Vetro Legal', 'Certificate', 300.00, '2024-04-01', '2024-25'),

-- AI Charges
('AI_COW_LOCAL', 'AI Cow (Local Semen)', 'AI', 25.00, '2024-04-01', '2024-25'),
('AI_COW_ETT', 'AI Cow (ETT Semen)', 'AI', 100.00, '2024-04-01', '2024-25'),
('AI_COW_IMP', 'AI Cow (Imported Semen)', 'AI', 200.00, '2024-04-01', '2024-25'),
('AI_COW_SEXED', 'AI Cow (Sexed Semen)', 'AI', 250.00, '2024-04-01', '2024-25'),
('AI_BUFFALO', 'AI Buffalo', 'AI', 50.00, '2024-04-01', '2024-25'),

-- Vaccination Charges
('VAC_HS', 'HS Vaccine', 'Vaccination', 5.00, '2024-04-01', '2024-25'),
('VAC_FMD', 'FMD Vaccine', 'Vaccination', 10.00, '2024-04-01', '2024-25'),
('VAC_BQ', 'Black Quarter Vaccine', 'Vaccination', 8.00, '2024-04-01', '2024-25'),
('VAC_BRUC', 'Brucellosis Vaccine', 'Vaccination', 15.00, '2024-04-01', '2024-25'),
('VAC_THEI', 'Theilaria Vaccine', 'Vaccination', 20.00, '2024-04-01', '2024-25'),
('VAC_RABIES', 'Rabies Vaccine', 'Vaccination', 12.00, '2024-04-01', '2024-25'),
('VAC_ETV', 'Entero Toximia Vaccine', 'Vaccination', 10.00, '2024-04-01', '2024-25');

-- ============================================================================
-- 2. SEMEN TYPES (From Form Responses)
-- ============================================================================

INSERT INTO semen_types (semen_code, semen_name, species, semen_category, service_charge_id) VALUES
-- Cattle - Local
('HF', 'Holstein Friesian', 'Cattle', 'Local', (SELECT charge_id FROM service_charges WHERE service_code = 'AI_COW_LOCAL')),
('JERSEY', 'Jersey', 'Cattle', 'Local', (SELECT charge_id FROM service_charges WHERE service_code = 'AI_COW_LOCAL')),
('CROSS', 'Cross Breed', 'Cattle', 'Local', (SELECT charge_id FROM service_charges WHERE service_code = 'AI_COW_LOCAL')),
('SAHIWAL', 'Sahiwal', 'Cattle', 'Local', (SELECT charge_id FROM service_charges WHERE service_code = 'AI_COW_LOCAL')),

-- Cattle - ETT
('HF_ETT', 'HF ETT', 'Cattle', 'ETT', (SELECT charge_id FROM service_charges WHERE service_code = 'AI_COW_ETT')),
('JERSEY_ETT', 'Jersey ETT', 'Cattle', 'ETT', (SELECT charge_id FROM service_charges WHERE service_code = 'AI_COW_ETT')),

-- Cattle - Imported
('HF_IMP', 'Imported HF', 'Cattle', 'Imported', (SELECT charge_id FROM service_charges WHERE service_code = 'AI_COW_IMP')),
('JERSEY_IMP', 'Imported Jersey', 'Cattle', 'Imported', (SELECT charge_id FROM service_charges WHERE service_code = 'AI_COW_IMP')),

-- Cattle - Sexed
('SEXED', 'Sexed Semen', 'Cattle', 'Sexed', (SELECT charge_id FROM service_charges WHERE service_code = 'AI_COW_SEXED')),

-- Buffalo
('MURRAH', 'Murrah', 'Buffalo', 'Local', (SELECT charge_id FROM service_charges WHERE service_code = 'AI_BUFFALO')),
('NILI_RAVI', 'Nili Ravi', 'Buffalo', 'Local', (SELECT charge_id FROM service_charges WHERE service_code = 'AI_BUFFALO'));

-- ============================================================================
-- 3. VACCINES (From Form Responses)
-- ============================================================================

INSERT INTO vaccines (vaccine_code, vaccine_name, service_charge_id) VALUES
('HS', 'Haemorrhagic Septicaemia', (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_HS')),
('FMD', 'Foot and Mouth Disease', (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_FMD')),
('BQ', 'Black Quarter', (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_BQ')),
('BRUC', 'Brucellosis', (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_BRUC')),
('THEI', 'Theilaria', (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_THEI')),
('RABIES', 'Rabies', (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_RABIES')),
('ETV', 'Entero Toximia', (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_ETV'));

-- Vaccine species dosage
INSERT INTO vaccine_species_dosage (vaccine_id, species, dose_per_animal) VALUES
-- HS
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'HS'), 'Cattle', 2.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'HS'), 'Buffalo', 2.0),

-- FMD
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'FMD'), 'Cattle', 2.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'FMD'), 'Buffalo', 2.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'FMD'), 'Sheep', 1.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'FMD'), 'Goat', 1.0),

-- BQ
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'BQ'), 'Cattle', 1.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'BQ'), 'Buffalo', 1.0),

-- Brucellosis
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'BRUC'), 'Cattle', 1.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'BRUC'), 'Buffalo', 1.0),

-- Theilaria
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'THEI'), 'Cattle', 2.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'THEI'), 'Buffalo', 2.0),

-- Rabies
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'RABIES'), 'Dog', 1.0),

-- ETV
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'ETV'), 'Sheep', 1.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'ETV'), 'Goat', 1.0);

-- ============================================================================
-- 4. SAMPLE GEOGRAPHIC DATA
-- ============================================================================

-- Sample Districts (Add all Punjab districts as needed)
INSERT INTO districts (district_name) VALUES
('Amritsar'),
('Ludhiana'),
('Jalandhar'),
('Patiala'),
('Bathinda'),
('Ferozepur'),
('Sangrur'),
('Gurdaspur'),
('Hoshiarpur'),
('Kapurthala');

-- Sample Tehsils
INSERT INTO tehsils (tehsil_name, district_id) VALUES
('Amritsar-I', (SELECT district_id FROM districts WHERE district_name = 'Amritsar')),
('Amritsar-II', (SELECT district_id FROM districts WHERE district_name = 'Amritsar')),
('Ajnala', (SELECT district_id FROM districts WHERE district_name = 'Amritsar')),
('Ludhiana East', (SELECT district_id FROM districts WHERE district_name = 'Ludhiana')),
('Ludhiana West', (SELECT district_id FROM districts WHERE district_name = 'Ludhiana')),
('Jalandhar-I', (SELECT district_id FROM districts WHERE district_name = 'Jalandhar')),
('Jalandhar-II', (SELECT district_id FROM districts WHERE district_name = 'Jalandhar'));

-- Sample Villages
INSERT INTO villages (village_name, tehsil_id, district_id, cow_population, buffalo_population) VALUES
('Malkana',
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar-I'),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
 1500, 2000),
('Chabhal',
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar-I'),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
 1200, 1800),
('Khalra',
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Ajnala'),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
 1800, 2200);

-- ============================================================================
-- 5. SAMPLE INSTITUTES (Based on existing sheet structure)
-- ============================================================================

INSERT INTO institutes (org_id, institute_name, institute_type, village_id, tehsil_id, district_id) VALUES
-- CVD Malkana
('CVD_MALKANA_001',
 'Veterinary Dispensary Malkana',
 'CVD',
 (SELECT village_id FROM villages WHERE village_name = 'Malkana'),
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar-I'),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar')),

-- Tehsil HQ
('TEHSIL_AMRITSAR1',
 'Tehsil Veterinary Office Amritsar-I',
 'TehsilHQ',
 (SELECT village_id FROM villages WHERE village_name = 'Malkana'),
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar-I'),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar')),

-- District HQ
('DISTRICT_AMRITSAR',
 'District Veterinary Office Amritsar',
 'District_HQ',
 (SELECT village_id FROM villages WHERE village_name = 'Malkana'),
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar-I'),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar'));

-- Update parent relationships
UPDATE institutes SET
    parent_institute_id = (SELECT institute_id FROM institutes WHERE org_id = 'TEHSIL_AMRITSAR1'),
    reporting_authority_id = (SELECT institute_id FROM institutes WHERE org_id = 'TEHSIL_AMRITSAR1')
WHERE org_id = 'CVD_MALKANA_001';

UPDATE institutes SET
    parent_institute_id = (SELECT institute_id FROM institutes WHERE org_id = 'DISTRICT_AMRITSAR'),
    reporting_authority_id = (SELECT institute_id FROM institutes WHERE org_id = 'DISTRICT_AMRITSAR')
WHERE org_id = 'TEHSIL_AMRITSAR1';

-- ============================================================================
-- 6. SAMPLE STAFF (Based on credential sheet)
-- ============================================================================

INSERT INTO staff (user_id, full_name, designation, date_of_birth, mobile, email, password_hash, user_role, current_institute_id) VALUES
-- INAPH for CVD Malkana
('CVD_MALKANA_001',
 'Dr. Gurmeet Singh',
 'Veterinary Officer',
 '1985-06-15',
 '9876543210',
 'gurmeet.singh@ahpunjab.gov.in',
 '$2b$10$placeholder_hash', -- This should be properly hashed in production
 'INAPH',
 (SELECT institute_id FROM institutes WHERE org_id = 'CVD_MALKANA_001')),

-- Tehsil Admin
('TEHSIL_AMRITSAR1',
 'Dr. Manjit Kaur',
 'Senior Veterinary Officer',
 '1980-03-20',
 '9876543211',
 'manjit.kaur@ahpunjab.gov.in',
 '$2b$10$placeholder_hash',
 'Tehsil_Admin',
 (SELECT institute_id FROM institutes WHERE org_id = 'TEHSIL_AMRITSAR1')),

-- District Admin
('DISTRICT_AMRITSAR',
 'Dr. Rajinder Kumar',
 'District Veterinary Inspector',
 '1975-09-10',
 '9876543212',
 'rajinder.kumar@ahpunjab.gov.in',
 '$2b$10$placeholder_hash',
 'District_Admin',
 (SELECT institute_id FROM institutes WHERE org_id = 'DISTRICT_AMRITSAR'));

-- Update current incharge
UPDATE institutes SET current_incharge_id = (SELECT staff_id FROM staff WHERE user_id = 'CVD_MALKANA_001')
WHERE org_id = 'CVD_MALKANA_001';

UPDATE institutes SET current_incharge_id = (SELECT staff_id FROM staff WHERE user_id = 'TEHSIL_AMRITSAR1')
WHERE org_id = 'TEHSIL_AMRITSAR1';

UPDATE institutes SET current_incharge_id = (SELECT staff_id FROM staff WHERE user_id = 'DISTRICT_AMRITSAR')
WHERE org_id = 'DISTRICT_AMRITSAR';

-- ============================================================================
-- 7. SAMPLE POSTING HISTORY
-- ============================================================================

INSERT INTO staff_postings (staff_id, institute_id, designation, start_date, is_incharge, is_current) VALUES
((SELECT staff_id FROM staff WHERE user_id = 'CVD_MALKANA_001'),
 (SELECT institute_id FROM institutes WHERE org_id = 'CVD_MALKANA_001'),
 'Veterinary Officer',
 '2020-01-01',
 TRUE,
 TRUE),

((SELECT staff_id FROM staff WHERE user_id = 'TEHSIL_AMRITSAR1'),
 (SELECT institute_id FROM institutes WHERE org_id = 'TEHSIL_AMRITSAR1'),
 'Senior Veterinary Officer',
 '2018-06-01',
 TRUE,
 TRUE),

((SELECT staff_id FROM staff WHERE user_id = 'DISTRICT_AMRITSAR'),
 (SELECT institute_id FROM institutes WHERE org_id = 'DISTRICT_AMRITSAR'),
 'District Veterinary Inspector',
 '2015-04-01',
 TRUE,
 TRUE);

-- ============================================================================
-- HELPFUL QUERIES FOR VERIFICATION
-- ============================================================================

/*
-- Verify geographic hierarchy
SELECT
    d.district_name,
    t.tehsil_name,
    v.village_name,
    v.cow_population,
    v.buffalo_population
FROM villages v
JOIN tehsils t ON v.tehsil_id = t.tehsil_id
JOIN districts d ON v.district_id = d.district_id
ORDER BY d.district_name, t.tehsil_name, v.village_name;

-- Verify institute hierarchy
SELECT * FROM v_institute_hierarchy;

-- Verify staff postings
SELECT * FROM v_current_staff_postings;

-- Verify service charges
SELECT
    service_code,
    service_name,
    category,
    current_rate,
    financial_year
FROM service_charges
ORDER BY category, service_code;

-- Verify semen types with charges
SELECT
    st.semen_code,
    st.semen_name,
    st.species,
    st.semen_category,
    sc.service_name,
    sc.current_rate
FROM semen_types st
LEFT JOIN service_charges sc ON st.service_charge_id = sc.charge_id
ORDER BY st.species, st.semen_category;

-- Verify vaccines with dosage
SELECT
    v.vaccine_code,
    v.vaccine_name,
    vsd.species,
    vsd.dose_per_animal,
    sc.current_rate
FROM vaccines v
LEFT JOIN vaccine_species_dosage vsd ON v.vaccine_id = vsd.vaccine_id
LEFT JOIN service_charges sc ON v.service_charge_id = sc.charge_id
ORDER BY v.vaccine_code, vsd.species;
*/
