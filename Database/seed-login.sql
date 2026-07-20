-- AH Punjab — Login Seed
-- Minimal master data + one test user to boot the app.
-- Run AFTER seed-geo.sql (requires districts/tehsils/villages).
-- Credentials: username=test, password=test (Argon2id hash in production)

-- ============================================================================
-- 1. SERVICE CHARGES
--    Codes must match the service_code references in get_fee_summary()
-- ============================================================================

INSERT INTO service_charges (service_code, service_name, category, current_rate, effective_from, financial_year) VALUES
-- OPD
('OPD_LARGE',      'OPD Large Animals',              'OPD',         10.00,  '2024-04-01', '2024-25'),
('OPD_DOGS',       'OPD Pets / Dogs',                'OPD',         50.00,  '2024-04-01', '2024-25'),
-- Diagnostic
('PD',             'Pregnancy Diagnosis',            'Diagnostic',  25.00,  '2024-04-01', '2024-25'),
('LAB_FECAL',      'Fecal Test',                     'Diagnostic',  40.00,  '2024-04-01', '2024-25'),
('LAB_BLOOD',      'Blood Test',                     'Diagnostic', 100.00,  '2024-04-01', '2024-25'),
('LAB_URINE',      'Urine Test',                     'Diagnostic',  75.00,  '2024-04-01', '2024-25'),
('LAB_MILK',       'Milk Test',                      'Diagnostic',  80.00,  '2024-04-01', '2024-25'),
-- Surgery
('CASTRATION',     'Castration (Bovine)',             'Surgery',     50.00,  '2024-04-01', '2024-25'),
('CASTRATION_OTH', 'Castration (Others)',             'Surgery',     30.00,  '2024-04-01', '2024-25'),
('OBSTETRICAL',    'Obstetrical Cases',               'Surgery',    250.00,  '2024-04-01', '2024-25'),
-- Certificates
('HC_SMALL',       'Health Certificate (Small)',      'Certificate', 50.00,  '2024-04-01', '2024-25'),
('HC_LARGE',       'Health Certificate (Large)',      'Certificate',100.00,  '2024-04-01', '2024-25'),
('PM_SMALL',       'Post Mortem (Small)',             'Certificate', 75.00,  '2024-04-01', '2024-25'),
('PM_LARGE',       'Post Mortem (Large)',             'Certificate',100.00,  '2024-04-01', '2024-25'),
('PM_VETRO',       'Post Mortem Vetro Legal',         'Certificate',300.00,  '2024-04-01', '2024-25'),
-- AI
('AI_COW_LOCAL',   'AI Cow (Local Semen)',            'AI',          25.00,  '2024-04-01', '2024-25'),
('AI_COW_ETT',     'AI Cow (ETT Semen)',              'AI',          35.00,  '2024-04-01', '2024-25'),
('AI_COW_IMP',     'AI Cow (Imported Semen)',         'AI',          50.00,  '2024-04-01', '2024-25'),
('AI_COW_SEXED',   'AI Cow (Sexed Semen)',            'AI',         200.00,  '2024-04-01', '2024-25'),
('AI_BUFFALO',     'AI Buffalo',                      'AI',          25.00,  '2024-04-01', '2024-25'),
-- Vaccination
('VAC_HS',         'HS Vaccine',                     'Vaccination',   5.00, '2024-04-01', '2024-25'),
('VAC_FMD',        'FMD Vaccine',                    'Vaccination',  10.00, '2024-04-01', '2024-25'),
('VAC_BQ',         'Black Quarter Vaccine',           'Vaccination',   8.00, '2024-04-01', '2024-25'),
('VAC_BRUC',       'Brucellosis Vaccine',             'Vaccination',  15.00, '2024-04-01', '2024-25'),
('VAC_THEI',       'Theilaria Vaccine',               'Vaccination',  20.00, '2024-04-01', '2024-25'),
('VAC_RABIES',     'Rabies Vaccine',                  'Vaccination',  12.00, '2024-04-01', '2024-25'),
('VAC_ETV',        'Entero Toximia Vaccine',          'Vaccination',  10.00, '2024-04-01', '2024-25')
ON CONFLICT (service_code) DO NOTHING;

-- ============================================================================
-- 2. SEMEN TYPES
-- ============================================================================

INSERT INTO semen_types (semen_code, semen_name, species, semen_category, service_charge_id) VALUES
-- Cattle — Local
('HF',          'Holstein Friesian',   'Cattle',  'Local',    (SELECT charge_id FROM service_charges WHERE service_code = 'AI_COW_LOCAL')),
('JERSEY',      'Jersey',              'Cattle',  'Local',    (SELECT charge_id FROM service_charges WHERE service_code = 'AI_COW_LOCAL')),
('CROSS',       'Cross Breed',         'Cattle',  'Local',    (SELECT charge_id FROM service_charges WHERE service_code = 'AI_COW_LOCAL')),
('SAHIWAL',     'Sahiwal',             'Cattle',  'Local',    (SELECT charge_id FROM service_charges WHERE service_code = 'AI_COW_LOCAL')),
-- Cattle — ETT
('HF_ETT',      'HF ETT',              'Cattle',  'ETT',      (SELECT charge_id FROM service_charges WHERE service_code = 'AI_COW_ETT')),
('JERSEY_ETT',  'Jersey ETT',          'Cattle',  'ETT',      (SELECT charge_id FROM service_charges WHERE service_code = 'AI_COW_ETT')),
-- Cattle — Imported
('HF_IMP',      'Imported HF',         'Cattle',  'Imported', (SELECT charge_id FROM service_charges WHERE service_code = 'AI_COW_IMP')),
('JERSEY_IMP',  'Imported Jersey',     'Cattle',  'Imported', (SELECT charge_id FROM service_charges WHERE service_code = 'AI_COW_IMP')),
-- Cattle — Sexed
('SEXED',       'Sexed Semen',         'Cattle',  'Sexed',    (SELECT charge_id FROM service_charges WHERE service_code = 'AI_COW_SEXED')),
-- Buffalo
('MURRAH',      'Murrah',              'Buffalo', 'Local',    (SELECT charge_id FROM service_charges WHERE service_code = 'AI_BUFFALO')),
('NILI_RAVI',   'Nili Ravi',           'Buffalo', 'Local',    (SELECT charge_id FROM service_charges WHERE service_code = 'AI_BUFFALO'))
ON CONFLICT (semen_code) DO NOTHING;

-- ============================================================================
-- 3. VACCINES
-- ============================================================================

INSERT INTO vaccines (vaccine_code, vaccine_name, service_charge_id) VALUES
('HS',           'Haemorrhagic Septicaemia', (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_HS')),
('FMD',          'Foot and Mouth Disease',   (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_FMD')),
('BQ',           'Black Quarter',            (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_BQ')),
('BRUCELLOSIS',  'Brucellosis',              (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_BRUC')),
('THEILARIA',    'Theilariosis',             (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_THEI')),
('RABIES',       'Rabies',                   (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_RABIES')),
('ETV',          'Entero Toximia',           (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_ETV'))
ON CONFLICT (vaccine_code) DO NOTHING;

INSERT INTO vaccine_species_dosage (vaccine_id, species, dose_per_animal) VALUES
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'HS'),          'Cattle',  2.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'HS'),          'Buffalo', 2.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'FMD'),         'Cattle',  2.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'FMD'),         'Buffalo', 2.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'FMD'),         'Sheep',   1.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'FMD'),         'Goat',    1.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'BQ'),          'Cattle',  1.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'BQ'),          'Buffalo', 1.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'BRUCELLOSIS'), 'Cattle',  1.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'BRUCELLOSIS'), 'Buffalo', 1.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'THEILARIA'),   'Cattle',  2.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'THEILARIA'),   'Buffalo', 2.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'RABIES'),      'Dog',     1.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'ETV'),         'Sheep',   1.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'ETV'),         'Goat',    1.0)
ON CONFLICT (vaccine_id, species) DO NOTHING;

-- ============================================================================
-- 4. TEST INSTITUTE
-- ============================================================================

INSERT INTO institutes (org_id, institute_name, institute_type, village_id, tehsil_id, district_id, latitude, longitude, is_active)
VALUES (
    'TEST001',
    'Test Veterinary Hospital - Ludhiana',
    'CVH',
    (SELECT village_id FROM villages WHERE village_name = 'Assi Kalan'
       AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana') LIMIT 1),
    (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Ludhiana (East)'
       AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana') LIMIT 1),
    (SELECT district_id FROM districts WHERE district_name = 'Ludhiana'),
    30.9010, 75.8573, TRUE
)
ON CONFLICT (org_id) DO NOTHING;

-- ============================================================================
-- 5. TEST STAFF (username: test, password: test)
-- ============================================================================

INSERT INTO staff (user_id, full_name, designation, date_of_birth, mobile, email,
                   password_hash, user_role, current_institute_id, is_first_time, is_active)
VALUES (
    'test',
    'Dr. Test User',
    'Veterinary Officer',
    '1990-01-01',
    '+919999999999',
    'test@ahpunjab.gov.in',
    'testtest',
    'CVH',
    (SELECT institute_id FROM institutes WHERE org_id = 'TEST001'),
    FALSE, TRUE
)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO staff_postings (staff_id, institute_id, designation, start_date, is_incharge, is_current)
VALUES (
    (SELECT staff_id FROM staff WHERE user_id = 'test'),
    (SELECT institute_id FROM institutes WHERE org_id = 'TEST001'),
    'Veterinary Officer',
    '2024-01-01',
    TRUE, TRUE
)
ON CONFLICT DO NOTHING;

UPDATE institutes
SET current_incharge_id = (SELECT staff_id FROM staff WHERE user_id = 'test')
WHERE org_id = 'TEST001';
