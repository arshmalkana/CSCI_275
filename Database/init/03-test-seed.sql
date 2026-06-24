-- ============================================================================
-- AH PUNJAB - TEST SEED DATA
-- Complete test data including "test" user with password "test"
-- All data is associated with the test user for comprehensive testing
-- ============================================================================

-- ============================================================================
-- 1. SERVICE CHARGES (Fee Structure)
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
('PM_LARGE', 'Post Mortem Large Animals', 'Certificate', 100.00, '2024-04-01', '2024-25'),
('PM_VETRO', 'Post Mortem Vetro Legal', 'Certificate', 300.00, '2024-04-01', '2024-25'),

-- AI Charges
('AI_COW_LOCAL', 'AI Cow (Local Semen)', 'AI', 25.00, '2024-04-01', '2024-25'),
('AI_COW_ETT', 'AI Cow (ETT Semen)', 'AI', 35.00, '2024-04-01', '2024-25'),
('AI_COW_IMP', 'AI Cow (Imported Semen)', 'AI', 50.00, '2024-04-01', '2024-25'),
('AI_COW_SEXED', 'AI Cow (Sexed Semen)', 'AI', 200.00, '2024-04-01', '2024-25'),
('AI_BUFFALO', 'AI Buffalo', 'AI', 25.00, '2024-04-01', '2024-25'),

-- Vaccination Charges
('VAC_HS', 'HS Vaccine', 'Vaccination', 5.00, '2024-04-01', '2024-25'),
('VAC_FMD', 'FMD Vaccine', 'Vaccination', 10.00, '2024-04-01', '2024-25'),
('VAC_BQ', 'Black Quarter Vaccine', 'Vaccination', 8.00, '2024-04-01', '2024-25'),
('VAC_BRUC', 'Brucellosis Vaccine', 'Vaccination', 15.00, '2024-04-01', '2024-25'),
('VAC_THEI', 'Theilaria Vaccine', 'Vaccination', 20.00, '2024-04-01', '2024-25'),
('VAC_RABIES', 'Rabies Vaccine', 'Vaccination', 12.00, '2024-04-01', '2024-25'),
('VAC_ETV', 'Entero Toximia Vaccine', 'Vaccination', 10.00, '2024-04-01', '2024-25')
ON CONFLICT (service_code) DO NOTHING;

-- ============================================================================
-- 2. SEMEN TYPES
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
('NILI_RAVI', 'Nili Ravi', 'Buffalo', 'Local', (SELECT charge_id FROM service_charges WHERE service_code = 'AI_BUFFALO'))
ON CONFLICT (semen_code) DO NOTHING;

-- ============================================================================
-- 3. VACCINES
-- ============================================================================

INSERT INTO vaccines (vaccine_code, vaccine_name, service_charge_id) VALUES
('HS', 'Haemorrhagic Septicaemia', (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_HS')),
('FMD', 'Foot and Mouth Disease', (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_FMD')),
('BQ', 'Black Quarter', (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_BQ')),
('BRUCELLOSIS', 'Brucellosis', (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_BRUC')),
('THEILARIA', 'Theilariosis', (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_THEI')),
('RABIES', 'Rabies', (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_RABIES')),
('ETV', 'Entero Toximia', (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_ETV'))
ON CONFLICT (vaccine_code) DO NOTHING;

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
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'BRUCELLOSIS'), 'Cattle', 1.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'BRUCELLOSIS'), 'Buffalo', 1.0),

-- Theilariosis
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'THEILARIA'), 'Cattle', 2.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'THEILARIA'), 'Buffalo', 2.0),

-- Rabies
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'RABIES'), 'Dog', 1.0),

-- ETV
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'ETV'), 'Sheep', 1.0),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'ETV'), 'Goat', 1.0)
ON CONFLICT (vaccine_id, species) DO NOTHING;

-- ============================================================================
-- 4. TEST INSTITUTE
-- ============================================================================

-- Create test institute in Ludhiana (East) - Assi Kalan village
INSERT INTO institutes (
    org_id,
    institute_name,
    institute_type,
    village_id,
    tehsil_id,
    district_id,
    latitude,
    longitude,
    is_active
) VALUES (
    'TEST001',
    'Test Veterinary Hospital - Ludhiana',
    'CVH',
    (SELECT village_id FROM villages WHERE village_name = 'Assi Kalan' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana') LIMIT 1),
    (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Ludhiana (East)' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana') LIMIT 1),
    (SELECT district_id FROM districts WHERE district_name = 'Ludhiana'),
    30.9010,
    75.8573,
    TRUE
)
ON CONFLICT (org_id) DO NOTHING;

-- Additional institutes for testing parent institute selection
INSERT INTO institutes (org_id, institute_name, institute_type, village_id, tehsil_id, district_id, latitude, longitude, is_active) VALUES
-- Ludhiana (East) - Same tehsil as TEST001
(
    'TEST002',
    'CVD Veterinary Dispensary - Assi Kalan',
    'CVD',
    (SELECT village_id FROM villages WHERE village_name = 'Assi Kalan' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana') LIMIT 1),
    (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Ludhiana (East)' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana') LIMIT 1),
    (SELECT district_id FROM districts WHERE district_name = 'Ludhiana'),
    30.9015,
    75.8580,
    TRUE
),
(
    'TEST003',
    'PAIW Center - Assi Kalan',
    'PAIW',
    (SELECT village_id FROM villages WHERE village_name = 'Assi Kalan' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana') LIMIT 1),
    (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Ludhiana (East)' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana') LIMIT 1),
    (SELECT district_id FROM districts WHERE district_name = 'Ludhiana'),
    30.9020,
    75.8585,
    TRUE
),
-- Ludhiana (West) - Different tehsil, same district
(
    'TEST004',
    'CVH Veterinary Hospital - Ayali Kalan',
    'CVH',
    (SELECT village_id FROM villages WHERE village_name = 'Ayali Kalan' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana') LIMIT 1),
    (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Ludhiana (West)' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana') LIMIT 1),
    (SELECT district_id FROM districts WHERE district_name = 'Ludhiana'),
    30.9100,
    75.8000,
    TRUE
),
(
    'TEST005',
    'CVD Veterinary Dispensary - Ayali Kalan',
    'CVD',
    (SELECT village_id FROM villages WHERE village_name = 'Ayali Kalan' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana') LIMIT 1),
    (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Ludhiana (West)' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana') LIMIT 1),
    (SELECT district_id FROM districts WHERE district_name = 'Ludhiana'),
    30.9110,
    75.8010,
    TRUE
),
(
    'TEST006',
    'PAIW Center - Ayali Khurd',
    'PAIW',
    (SELECT village_id FROM villages WHERE village_name = 'Ayali Khurd' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana') LIMIT 1),
    (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Ludhiana (West)' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana') LIMIT 1),
    (SELECT district_id FROM districts WHERE district_name = 'Ludhiana'),
    30.9120,
    75.8020,
    TRUE
),
-- Amritsar - Different district
(
    'TEST007',
    'CVH Veterinary Hospital - Abdal',
    'CVH',
    (SELECT village_id FROM villages WHERE village_name = 'Abdal' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Amritsar') LIMIT 1),
    (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar  - I' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Amritsar') LIMIT 1),
    (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
    31.6340,
    74.8723,
    TRUE
),
(
    'TEST008',
    'CVD Veterinary Dispensary - Alkare',
    'CVD',
    (SELECT village_id FROM villages WHERE village_name = 'Alkare' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Amritsar') LIMIT 1),
    (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar  - I' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Amritsar') LIMIT 1),
    (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
    31.6350,
    74.8730,
    TRUE
),
-- Headquarters
(
    'LUDHQ',
    'District Veterinary Office - Ludhiana',
    'District_HQ',
    (SELECT village_id FROM villages WHERE village_name = 'Assi Kalan' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana') LIMIT 1),
    (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Ludhiana (East)' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana') LIMIT 1),
    (SELECT district_id FROM districts WHERE district_name = 'Ludhiana'),
    30.9000,
    75.8500,
    TRUE
),
(
    'AMRHQ',
    'District Veterinary Office - Amritsar',
    'District_HQ',
    (SELECT village_id FROM villages WHERE village_name = 'Athwal' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Amritsar') LIMIT 1),
    (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar  - I' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Amritsar') LIMIT 1),
    (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
    31.6300,
    74.8700,
    TRUE
),
(
    'LUETHQ',
    'Tehsil Veterinary Office - Ludhiana East',
    'TehsilHQ',
    (SELECT village_id FROM villages WHERE village_name = 'Assi Kalan' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana') LIMIT 1),
    (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Ludhiana (East)' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana') LIMIT 1),
    (SELECT district_id FROM districts WHERE district_name = 'Ludhiana'),
    30.9005,
    75.8505,
    TRUE
)
ON CONFLICT (org_id) DO NOTHING;

-- ============================================================================
-- 5. TEST USER (username: test, password: test)
-- ============================================================================

-- Insert test staff member
-- NOTE: In production, password should be hashed with Argon2id
-- For testing purposes, using plain text "test"
INSERT INTO staff (
    user_id,
    full_name,
    designation,
    date_of_birth,
    mobile,
    email,
    password_hash,
    user_role,
    current_institute_id,
    is_first_time,
    is_active
) VALUES (
    'test',
    'Dr. Test User',
    'Veterinary Officer',
    '1990-01-01',
    '+919999999999',
    'test@ahpunjab.gov.in',
    'testtest',  -- Password: test (should be Argon2id hashed in production)
    'CVH',
    (SELECT institute_id FROM institutes WHERE org_id = 'TEST001'),
    FALSE,
    TRUE
)
ON CONFLICT (user_id) DO NOTHING;

-- Add additional staff members to the test institute
INSERT INTO staff (
    full_name,
    designation,
    date_of_birth,
    mobile,
    email,
    password_hash,
    user_role,
    current_institute_id,
    is_first_time,
    is_active
) VALUES
    (
        'Dr. Harpreet Singh',
        'Senior Veterinary Officer',
        '1985-05-15',
        '+919876543210',
        'harpreet.singh@ahpunjab.gov.in',
        'test123',
        'CVH',
        (SELECT institute_id FROM institutes WHERE org_id = 'TEST001'),
        FALSE,
        TRUE
    ),
    (
        'Dr. Simran Kaur',
        'Veterinary Inspector',
        '1992-08-22',
        '+919876543211',
        'simran.kaur@ahpunjab.gov.in',
        'test123',
        'PAIW',
        (SELECT institute_id FROM institutes WHERE org_id = 'TEST001'),
        FALSE,
        TRUE
    ),
    (
        'Rajveer Kumar',
        'Veterinary Pharmacist',
        '1988-03-10',
        '+919876543212',
        'rajveer.kumar@ahpunjab.gov.in',
        'test123',
        'PAIW',
        (SELECT institute_id FROM institutes WHERE org_id = 'TEST001'),
        FALSE,
        TRUE
    )
ON CONFLICT DO NOTHING;

-- Update institute incharge
UPDATE institutes
SET current_incharge_id = (SELECT staff_id FROM staff WHERE user_id = 'test')
WHERE org_id = 'TEST001';

-- Create staff posting for test user
INSERT INTO staff_postings (
    staff_id,
    institute_id,
    designation,
    start_date,
    is_incharge,
    is_current
) VALUES (
    (SELECT staff_id FROM staff WHERE user_id = 'test'),
    (SELECT institute_id FROM institutes WHERE org_id = 'TEST001'),
    'Veterinary Officer',
    '2024-01-01',
    TRUE,
    TRUE
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. SAMPLE SERVICE VILLAGES FOR TEST INSTITUTE
-- ============================================================================

-- Add 5 service villages for the test institute
INSERT INTO institute_service_villages (institute_id, village_id, is_primary)
SELECT
    (SELECT institute_id FROM institutes WHERE org_id = 'TEST001'),
    village_id,
    (ROW_NUMBER() OVER ()) = 1 AS is_primary
FROM villages
WHERE district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana')
  AND tehsil_id = (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Ludhiana (East)' AND district_id = (SELECT district_id FROM districts WHERE district_name = 'Ludhiana') LIMIT 1)
LIMIT 5
ON CONFLICT (institute_id, village_id) DO NOTHING;

-- ============================================================================
-- 7. SAMPLE MONTHLY REPORTS FOR TEST USER
-- ============================================================================

-- Create current month report (Submitted - so statistics will show)
INSERT INTO monthly_reports (
    institute_id,
    reporting_month,
    start_date,
    end_date,
    prepared_by,
    submission_status,
    submitted_at
) VALUES (
    (SELECT institute_id FROM institutes WHERE org_id = 'TEST001'),
    TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
    DATE_TRUNC('month', CURRENT_DATE),
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE,
    (SELECT staff_id FROM staff WHERE user_id = 'test'),
    'Submitted',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
)
ON CONFLICT (institute_id, reporting_month) DO NOTHING;

-- Create previous months reports (Approved) - for financial year statistics
INSERT INTO monthly_reports (
    institute_id,
    reporting_month,
    start_date,
    end_date,
    prepared_by,
    submission_status,
    submitted_at,
    verified_at
) VALUES
    -- September 2025
    (
        (SELECT institute_id FROM institutes WHERE org_id = 'TEST001'),
        TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'),
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'),
        (DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '1 month - 1 day')::DATE,
        (SELECT staff_id FROM staff WHERE user_id = 'test'),
        'Approved',
        CURRENT_TIMESTAMP - INTERVAL '1 month',
        CURRENT_TIMESTAMP - INTERVAL '25 days'
    ),
    -- August 2025
    (
        (SELECT institute_id FROM institutes WHERE org_id = 'TEST001'),
        TO_CHAR(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'),
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months'),
        (DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months') + INTERVAL '1 month - 1 day')::DATE,
        (SELECT staff_id FROM staff WHERE user_id = 'test'),
        'Approved',
        CURRENT_TIMESTAMP - INTERVAL '2 months',
        CURRENT_TIMESTAMP - INTERVAL '55 days'
    ),
    -- July 2025
    (
        (SELECT institute_id FROM institutes WHERE org_id = 'TEST001'),
        TO_CHAR(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'),
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months'),
        (DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months') + INTERVAL '1 month - 1 day')::DATE,
        (SELECT staff_id FROM staff WHERE user_id = 'test'),
        'Approved',
        CURRENT_TIMESTAMP - INTERVAL '3 months',
        CURRENT_TIMESTAMP - INTERVAL '85 days'
    ),
    -- June 2025
    (
        (SELECT institute_id FROM institutes WHERE org_id = 'TEST001'),
        TO_CHAR(CURRENT_DATE - INTERVAL '4 months', 'YYYY-MM'),
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '4 months'),
        (DATE_TRUNC('month', CURRENT_DATE - INTERVAL '4 months') + INTERVAL '1 month - 1 day')::DATE,
        (SELECT staff_id FROM staff WHERE user_id = 'test'),
        'Approved',
        CURRENT_TIMESTAMP - INTERVAL '4 months',
        CURRENT_TIMESTAMP - INTERVAL '115 days'
    ),
    -- May 2025
    (
        (SELECT institute_id FROM institutes WHERE org_id = 'TEST001'),
        TO_CHAR(CURRENT_DATE - INTERVAL '5 months', 'YYYY-MM'),
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months'),
        (DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months') + INTERVAL '1 month - 1 day')::DATE,
        (SELECT staff_id FROM staff WHERE user_id = 'test'),
        'Approved',
        CURRENT_TIMESTAMP - INTERVAL '5 months',
        CURRENT_TIMESTAMP - INTERVAL '145 days'
    )
ON CONFLICT (institute_id, reporting_month) DO NOTHING;

-- ============================================================================
-- 8. SAMPLE OPD DATA FOR TEST REPORTS (all months in financial year)
-- ============================================================================

INSERT INTO opd_report_details (
    report_id,
    opd_type,
    case_category,
    total_cases,
    beneficiaries_covered,
    service_charge_id
)
SELECT
    r.report_id,
    opd_type_val,
    case_cat_val,
    FLOOR(RANDOM() * 60 + 20)::INTEGER,  -- Increased from 10-60 to 20-80
    FLOOR(RANDOM() * 50 + 10)::INTEGER,
    (SELECT charge_id FROM service_charges WHERE service_code = 'OPD_LARGE' LIMIT 1)
FROM monthly_reports r
CROSS JOIN (
    SELECT unnest(ARRAY['Equine', 'Bovine', 'Others', 'Dogs']::opd_case_type[]) AS opd_type_val
) AS opd_types
CROSS JOIN (
    SELECT unnest(ARRAY['New', 'Old', 'Camp']::case_category[]) AS case_cat_val
) AS case_cats
WHERE r.institute_id = (SELECT institute_id FROM institutes WHERE org_id = 'TEST001')
ON CONFLICT (report_id, opd_type, case_category) DO NOTHING;

-- ============================================================================
-- 9. SAMPLE VACCINATION DATA FOR TEST REPORTS (all months)
-- ============================================================================

INSERT INTO vaccination_report_details (
    report_id,
    vaccine_id,
    doses_received,
    doses_used,
    animals_vaccinated,
    beneficiaries_covered
)
SELECT
    r.report_id,
    v.vaccine_id,
    FLOOR(RANDOM() * 600 + 200)::INTEGER AS doses_received,    -- Increased from 100-600 to 200-800
    FLOOR(RANDOM() * 500 + 100)::INTEGER AS doses_used,        -- Increased from 50-450 to 100-600
    FLOOR(RANDOM() * 250 + 50)::INTEGER AS animals_vaccinated, -- Increased from 25-225 to 50-300
    FLOOR(RANDOM() * 200 + 30)::INTEGER AS beneficiaries_covered
FROM monthly_reports r
CROSS JOIN (SELECT vaccine_id FROM vaccines ORDER BY vaccine_id LIMIT 5) v
WHERE r.institute_id = (SELECT institute_id FROM institutes WHERE org_id = 'TEST001')
ON CONFLICT (report_id, vaccine_id) DO NOTHING;

-- ============================================================================
-- 10. SAMPLE AI DATA FOR TEST REPORTS (all months, Cattle and Buffalo)
-- ============================================================================

INSERT INTO ai_report_details (
    report_id,
    semen_type_id,
    total_ai_done,
    animals_covered,
    animals_tested,
    animals_positive,
    male_calves,
    female_calves,
    beneficiaries_covered,
    straws_used_inaph,
    straws_received,
    service_charge_id
)
SELECT
    r.report_id,
    st.semen_id,
    FLOOR(RANDOM() * 100 + 40)::INTEGER AS total_ai_done,        -- Increased from 20-100 to 40-140
    FLOOR(RANDOM() * 90 + 35)::INTEGER AS animals_covered,       -- Increased from 15-90 to 35-125
    FLOOR(RANDOM() * 80 + 20)::INTEGER AS animals_tested,        -- Increased from 10-70 to 20-100
    FLOOR(RANDOM() * 60 + 10)::INTEGER AS animals_positive,      -- Increased from 5-55 to 10-70
    FLOOR(RANDOM() * 30 + 5)::INTEGER AS male_calves,            -- Increased from 0-25 to 5-35
    FLOOR(RANDOM() * 30 + 5)::INTEGER AS female_calves,          -- Increased from 0-25 to 5-35
    FLOOR(RANDOM() * 80 + 20)::INTEGER AS beneficiaries_covered, -- Increased from 10-70 to 20-100
    FLOOR(RANDOM() * 120 + 30)::INTEGER AS straws_used_inaph,    -- Increased from 20-120 to 30-150
    FLOOR(RANDOM() * 180 + 50)::INTEGER AS straws_received,      -- Increased from 30-180 to 50-230
    st.service_charge_id
FROM monthly_reports r
CROSS JOIN semen_types st
WHERE r.institute_id = (SELECT institute_id FROM institutes WHERE org_id = 'TEST001')
  AND st.semen_code IN ('HF', 'JERSEY', 'MURRAH')
ON CONFLICT (report_id, semen_type_id) DO NOTHING;

-- ============================================================================
-- 11. SAMPLE DIAGNOSTIC DATA FOR TEST REPORTS (all months)
-- ============================================================================

INSERT INTO diagnostic_report_details (
    report_id,
    diagnostic_type,
    tests_conducted,
    beneficiaries_covered,
    service_charge_id
)
SELECT
    r.report_id,
    diag_type,
    FLOOR(RANDOM() * 30 + 5)::INTEGER,
    FLOOR(RANDOM() * 25 + 3)::INTEGER,
    (SELECT charge_id FROM service_charges WHERE category = 'Diagnostic' LIMIT 1)
FROM monthly_reports r
CROSS JOIN (
    SELECT unnest(ARRAY['Fecal', 'Blood', 'Urine', 'Milk']::diagnostic_type[]) AS diag_type
) AS diag_types
WHERE r.institute_id = (SELECT institute_id FROM institutes WHERE org_id = 'TEST001')
ON CONFLICT (report_id, diagnostic_type) DO NOTHING;

-- ============================================================================
-- 12. SAMPLE VACCINE STOCK FOR TEST INSTITUTE
-- ============================================================================

INSERT INTO vaccine_stock (
    institute_id,
    vaccine_id,
    doses_received,
    doses_used,
    current_stock
)
SELECT
    (SELECT institute_id FROM institutes WHERE org_id = 'TEST001'),
    vaccine_id,
    FLOOR(RANDOM() * 1000 + 500)::INTEGER AS doses_received,
    FLOOR(RANDOM() * 400 + 100)::INTEGER AS doses_used,
    FLOOR(RANDOM() * 600 + 200)::INTEGER AS current_stock
FROM vaccines
ON CONFLICT (institute_id, vaccine_id) DO UPDATE SET
    doses_received = EXCLUDED.doses_received,
    doses_used = EXCLUDED.doses_used,
    current_stock = EXCLUDED.current_stock;

-- ============================================================================
-- 13. SAMPLE SEMEN STOCK FOR TEST INSTITUTE
-- ============================================================================

INSERT INTO semen_stock (
    institute_id,
    semen_type_id,
    current_stock
)
SELECT
    (SELECT institute_id FROM institutes WHERE org_id = 'TEST001'),
    semen_id,
    FLOOR(RANDOM() * 200 + 50)::INTEGER AS current_stock
FROM semen_types
ON CONFLICT (institute_id, semen_type_id) DO UPDATE SET
    current_stock = EXCLUDED.current_stock;

-- ============================================================================
-- 14. PERFORMANCE TARGETS
-- ============================================================================

-- Type-based default targets (apply to all institutes of that type)
-- Individual institutes can override these with institute-specific targets

INSERT INTO institute_targets (
    institute_id,
    institute_type,
    target_type,
    vaccine_id,
    annual_target,
    monthly_target,
    effective_from,
    effective_until,
    financial_year,
    notes,
    created_by
) VALUES
    -- CVH (Veterinary Hospital) Type Defaults - Higher capacity
    (NULL, 'CVH', 'OPD', NULL, 6000, 500, '2025-04-01', NULL, '2025-26',
     'CVH default: Higher OPD capacity', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    (NULL, 'CVH', 'AI_Cattle', NULL, 1800, 150, '2025-04-01', NULL, '2025-26',
     'CVH default: AI cattle services', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    (NULL, 'CVH', 'AI_Buffalo', NULL, 900, 75, '2025-04-01', NULL, '2025-26',
     'CVH default: AI buffalo services', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    (NULL, 'CVH', 'Vaccine', (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'HS'), 4500, 375, '2025-04-01', NULL, '2025-26',
     'CVH HS vaccine default', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    (NULL, 'CVH', 'Vaccine', (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'FMD'), 5000, 417, '2025-04-01', NULL, '2025-26',
     'CVH FMD vaccine default', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    (NULL, 'CVH', 'Vaccine', (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'BQ'), 4000, 333, '2025-04-01', NULL, '2025-26',
     'CVH BQ vaccine default', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    (NULL, 'CVH', 'Vaccine', (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'BRUCELLOSIS'), 3500, 292, '2025-04-01', NULL, '2025-26',
     'CVH Brucellosis vaccine default', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    (NULL, 'CVH', 'Vaccine', (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'THEILARIA'), 3800, 317, '2025-04-01', NULL, '2025-26',
     'CVH Theilaria vaccine default', (SELECT staff_id FROM staff WHERE user_id = 'test')),

    -- CVD (Veterinary Dispensary) Type Defaults - Standard capacity
    (NULL, 'CVD', 'OPD', NULL, 3000, 250, '2025-04-01', NULL, '2025-26',
     'CVD default: Standard OPD capacity', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    (NULL, 'CVD', 'AI_Cattle', NULL, 1000, 83, '2025-04-01', NULL, '2025-26',
     'CVD default: AI cattle services', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    (NULL, 'CVD', 'AI_Buffalo', NULL, 500, 42, '2025-04-01', NULL, '2025-26',
     'CVD default: AI buffalo services', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    (NULL, 'CVD', 'Vaccine', (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'HS'), 2500, 208, '2025-04-01', NULL, '2025-26',
     'CVD HS vaccine default', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    (NULL, 'CVD', 'Vaccine', (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'FMD'), 3000, 250, '2025-04-01', NULL, '2025-26',
     'CVD FMD vaccine default', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    (NULL, 'CVD', 'Vaccine', (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'BQ'), 2200, 183, '2025-04-01', NULL, '2025-26',
     'CVD BQ vaccine default', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    (NULL, 'CVD', 'Vaccine', (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'BRUCELLOSIS'), 2000, 167, '2025-04-01', NULL, '2025-26',
     'CVD Brucellosis vaccine default', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    (NULL, 'CVD', 'Vaccine', (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'THEILARIA'), 2100, 175, '2025-04-01', NULL, '2025-26',
     'CVD Theilaria vaccine default', (SELECT staff_id FROM staff WHERE user_id = 'test')),

    -- Institute-specific overrides for TEST001 (CVH) - Override the CVH defaults
    ((SELECT institute_id FROM institutes WHERE org_id = 'TEST001'), NULL, 'OPD', NULL, 4000, 333, '2025-04-01', NULL, '2025-26',
     'TEST001 specific: Custom OPD target', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    ((SELECT institute_id FROM institutes WHERE org_id = 'TEST001'), NULL, 'AI_Cattle', NULL, 1200, 100, '2025-04-01', NULL, '2025-26',
     'TEST001 specific: Custom AI cattle target', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    ((SELECT institute_id FROM institutes WHERE org_id = 'TEST001'), NULL, 'AI_Buffalo', NULL, 600, 50, '2025-04-01', NULL, '2025-26',
     'TEST001 specific: Custom AI buffalo target', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    ((SELECT institute_id FROM institutes WHERE org_id = 'TEST001'), NULL, 'Vaccine', (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'HS'), 3000, 250, '2025-04-01', NULL, '2025-26',
     'TEST001 specific: HS vaccine target', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    ((SELECT institute_id FROM institutes WHERE org_id = 'TEST001'), NULL, 'Vaccine', (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'FMD'), 3500, 292, '2025-04-01', NULL, '2025-26',
     'TEST001 specific: FMD vaccine target', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    ((SELECT institute_id FROM institutes WHERE org_id = 'TEST001'), NULL, 'Vaccine', (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'BQ'), 2800, 233, '2025-04-01', NULL, '2025-26',
     'TEST001 specific: BQ vaccine target', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    ((SELECT institute_id FROM institutes WHERE org_id = 'TEST001'), NULL, 'Vaccine', (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'BRUCELLOSIS'), 2500, 208, '2025-04-01', NULL, '2025-26',
     'TEST001 specific: Brucellosis vaccine target', (SELECT staff_id FROM staff WHERE user_id = 'test')),
    ((SELECT institute_id FROM institutes WHERE org_id = 'TEST001'), NULL, 'Vaccine', (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'THEILARIA'), 2600, 217, '2025-04-01', NULL, '2025-26',
     'TEST001 specific: Theilaria vaccine target', (SELECT staff_id FROM staff WHERE user_id = 'test'))
ON CONFLICT DO NOTHING;

-- Add historical target example (previous year, now expired)
INSERT INTO institute_targets (
    institute_id,
    institute_type,
    target_type,
    vaccine_id,
    annual_target,
    monthly_target,
    effective_from,
    effective_until,
    financial_year,
    notes,
    created_by
) VALUES
    (
        (SELECT institute_id FROM institutes WHERE org_id = 'TEST001'),
        NULL,
        'OPD',
        NULL,
        3500,  -- Last year's target was lower
        292,
        '2024-04-01',
        '2025-03-31',  -- Expired at end of FY 2024-25
        '2024-25',
        'Previous year target - exceeded by 8%',
        (SELECT staff_id FROM staff WHERE user_id = 'test')
    )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 15. SUCCESS MESSAGE
-- ============================================================================

DO $$
DECLARE
    test_staff_id INTEGER;
    test_institute_id INTEGER;
    report_count INTEGER;
    staff_count INTEGER;
    opd_count INTEGER;
    target_count INTEGER;
BEGIN
    SELECT staff_id INTO test_staff_id FROM staff WHERE user_id = 'test';
    SELECT institute_id INTO test_institute_id FROM institutes WHERE org_id = 'TEST001';
    SELECT COUNT(*) INTO report_count FROM monthly_reports WHERE institute_id = test_institute_id;
    SELECT COUNT(*) INTO staff_count FROM staff WHERE current_institute_id = test_institute_id;
    SELECT COUNT(*) INTO opd_count FROM opd_report_details ord
        JOIN monthly_reports mr ON ord.report_id = mr.report_id
        WHERE mr.institute_id = test_institute_id;
    SELECT COUNT(*) INTO target_count FROM institute_targets
        WHERE institute_id = test_institute_id
        AND (effective_until IS NULL OR effective_until >= CURRENT_DATE);

    RAISE NOTICE '=========================================';
    RAISE NOTICE 'TEST SEED DATA LOADED SUCCESSFULLY!';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Test User Credentials:';
    RAISE NOTICE '  Username: test';
    RAISE NOTICE '  Password: test';
    RAISE NOTICE '  Staff ID: %', test_staff_id;
    RAISE NOTICE '  Institute: Test Veterinary Hospital - Ludhiana';
    RAISE NOTICE '  Institute ID: %', test_institute_id;
    RAISE NOTICE '  Role: INAPH (Institute In-charge)';
    RAISE NOTICE '';
    RAISE NOTICE 'Test Data Summary:';
    RAISE NOTICE '  Service Charges: %', (SELECT COUNT(*) FROM service_charges);
    RAISE NOTICE '  Semen Types: %', (SELECT COUNT(*) FROM semen_types);
    RAISE NOTICE '  Vaccines: %', (SELECT COUNT(*) FROM vaccines);
    RAISE NOTICE '  Staff Members: %', staff_count;
    RAISE NOTICE '  Service Villages: %', (SELECT COUNT(*) FROM institute_service_villages WHERE institute_id = test_institute_id);
    RAISE NOTICE '  Monthly Reports: % (May-Oct 2025, Submitted/Approved)', report_count;
    RAISE NOTICE '  OPD Records: %', opd_count;
    RAISE NOTICE '  Performance Targets: % (including 5 vaccines)', target_count;
    RAISE NOTICE '';
    RAISE NOTICE 'HOME PAGE DATA:';
    RAISE NOTICE '  ✓ Statistics will show (reports are Submitted/Approved)';
    RAISE NOTICE '  ✓ Staff list populated (% members)', staff_count;
    RAISE NOTICE '  ✓ Villages populated (5 service villages)';
    RAISE NOTICE '  ✓ OPD, AI, Vaccination data available';
    RAISE NOTICE '  ✓ Targets loaded from database (OPD: 4000, AI Cattle: 1200, AI Buffalo: 600)';
    RAISE NOTICE '  ✓ Historical targets example (FY 2024-25 target expired)';
    RAISE NOTICE '=========================================';
END $$;
-- Seed Monthly Reports with Comprehensive Data
-- This file creates fake monthly reports spread across multiple fiscal years
-- for testing purposes

BEGIN;

-- ============================================================================
-- Fiscal Year 2024-25 Reports (April 2024 - March 2025)
-- ============================================================================

-- Report 1: October 2024 (Submitted)
DO $$
DECLARE
  v_report_id INTEGER;
BEGIN
  INSERT INTO monthly_reports (institute_id, reporting_month, start_date, end_date, prepared_by, submission_status, submitted_at, created_at, updated_at)
  VALUES (1, '2024-10', '2024-10-01', '2024-10-31', 1, 'Submitted', '2024-11-02 10:30:00+00', '2024-11-01 08:00:00+00', '2024-11-02 10:30:00+00')
  RETURNING report_id INTO v_report_id;

  -- OPD data
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
  VALUES
    (v_report_id, 'Equine', 'New', 45, 38),
    (v_report_id, 'Equine', 'Old', 12, 10),
    (v_report_id, 'Bovine', 'New', 156, 142),
    (v_report_id, 'Bovine', 'Old', 67, 61),
    (v_report_id, 'Small', 'New', 89, 78),
    (v_report_id, 'Small', 'Old', 34, 29),
    (v_report_id, 'Dogs', 'New', 23, 21),
    (v_report_id, 'Dogs', 'Old', 8, 7),
    (v_report_id, 'Poultry', 'New', 234, 45),
    (v_report_id, 'Poultry', 'Old', 89, 18);

  -- Certificates
  INSERT INTO certificate_report_details (report_id, certificate_type, total_issued, beneficiaries_covered)
  VALUES
    (v_report_id, 'Health', 89, 89),
    (v_report_id, 'PostMortem', 12, 12),
    (v_report_id, 'VetroLegal', 34, 34),
    (v_report_id, 'Export', 45, 45);

  -- Vaccination
  INSERT INTO vaccination_report_details (report_id, vaccine_id, doses_received, doses_used, animals_vaccinated, beneficiaries_covered)
  VALUES
    (v_report_id, 1, 200, 156, 156, 142),
    (v_report_id, 2, 100, 89, 89, 78),
    (v_report_id, 3, 50, 45, 45, 38),
    (v_report_id, 4, 30, 23, 23, 21),
    (v_report_id, 5, 50, 34, 34, 29),
    (v_report_id, 6, 150, 234, 234, 45),
    (v_report_id, 7, 20, 12, 12, 10);

  -- AI Reports
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, beneficiaries_covered, straws_received, straws_used_inaph)
  VALUES
    (v_report_id, 1, 45, 42, 42, 50, 45),
    (v_report_id, 2, 67, 61, 61, 40, 67),
    (v_report_id, 3, 34, 31, 31, 30, 34),
    (v_report_id, 4, 23, 21, 21, 20, 23),
    (v_report_id, 5, 12, 11, 11, 10, 12);
END $$;

-- Report 2: September 2024 (Approved)
DO $$
DECLARE
  v_report_id INTEGER;
BEGIN
  INSERT INTO monthly_reports (institute_id, reporting_month, start_date, end_date, prepared_by, verified_by, submission_status, submitted_at, verified_at, created_at, updated_at)
  VALUES (1, '2024-09', '2024-09-01', '2024-09-30', 1, 2, 'Approved', '2024-10-02 09:00:00+00', '2024-10-03 14:30:00+00', '2024-10-01 08:00:00+00', '2024-10-03 14:30:00+00')
  RETURNING report_id INTO v_report_id;

  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
  VALUES
    (v_report_id, 'Equine', 'New', 38, 32),
    (v_report_id, 'Equine', 'Old', 10, 8),
    (v_report_id, 'Bovine', 'New', 142, 128),
    (v_report_id, 'Bovine', 'Old', 56, 51),
    (v_report_id, 'Small', 'New', 76, 67),
    (v_report_id, 'Small', 'Old', 29, 25),
    (v_report_id, 'Dogs', 'New', 19, 17),
    (v_report_id, 'Dogs', 'Old', 6, 5),
    (v_report_id, 'Poultry', 'New', 198, 38),
    (v_report_id, 'Poultry', 'Old', 72, 15);

  INSERT INTO certificate_report_details (report_id, certificate_type, total_issued, beneficiaries_covered)
  VALUES
    (v_report_id, 'Health', 76, 76),
    (v_report_id, 'PostMortem', 10, 10),
    (v_report_id, 'VetroLegal', 28, 28),
    (v_report_id, 'Export', 38, 38);

  INSERT INTO vaccination_report_details (report_id, vaccine_id, doses_received, doses_used, animals_vaccinated, beneficiaries_covered)
  VALUES
    (v_report_id, 1, 150, 142, 142, 128),
    (v_report_id, 2, 80, 76, 76, 67),
    (v_report_id, 3, 40, 38, 38, 32),
    (v_report_id, 4, 30, 19, 19, 17),
    (v_report_id, 5, 30, 29, 29, 25),
    (v_report_id, 6, 120, 198, 198, 38),
    (v_report_id, 7, 20, 10, 10, 8);
END $$;

-- Report 3: August 2024 (Approved)
DO $$
DECLARE
  v_report_id INTEGER;
BEGIN
  INSERT INTO monthly_reports (institute_id, reporting_month, start_date, end_date, prepared_by, verified_by, submission_status, submitted_at, verified_at, created_at, updated_at)
  VALUES (1, '2024-08', '2024-08-01', '2024-08-31', 1, 2, 'Approved', '2024-09-02 11:00:00+00', '2024-09-03 16:00:00+00', '2024-09-01 08:00:00+00', '2024-09-03 16:00:00+00')
  RETURNING report_id INTO v_report_id;

  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
  VALUES
    (v_report_id, 'Equine', 'New', 52, 45),
    (v_report_id, 'Bovine', 'New', 167, 153),
    (v_report_id, 'Small', 'New', 95, 84),
    (v_report_id, 'Dogs', 'New', 28, 25),
    (v_report_id, 'Poultry', 'New', 256, 52);
END $$;

-- Report 4: July 2024 (Draft)
DO $$
DECLARE
  v_report_id INTEGER;
BEGIN
  INSERT INTO monthly_reports (institute_id, reporting_month, start_date, end_date, prepared_by, submission_status, created_at, updated_at)
  VALUES (1, '2024-07', '2024-07-01', '2024-07-31', 1, 'Draft', '2024-07-15 10:00:00+00', '2024-07-20 14:00:00+00')
  RETURNING report_id INTO v_report_id;

  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
  VALUES
    (v_report_id, 'Bovine', 'New', 134, 120),
    (v_report_id, 'Small', 'New', 67, 59);
END $$;

-- Report 5: June 2024 (Approved)
DO $$
DECLARE
  v_report_id INTEGER;
BEGIN
  INSERT INTO monthly_reports (institute_id, reporting_month, start_date, end_date, prepared_by, verified_by, submission_status, submitted_at, verified_at, created_at, updated_at)
  VALUES (1, '2024-06', '2024-06-01', '2024-06-30', 1, 2, 'Approved', '2024-07-02 10:00:00+00', '2024-07-03 15:00:00+00', '2024-07-01 08:00:00+00', '2024-07-03 15:00:00+00')
  RETURNING report_id INTO v_report_id;

  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
  VALUES
    (v_report_id, 'Equine', 'New', 41, 35),
    (v_report_id, 'Bovine', 'New', 149, 135),
    (v_report_id, 'Small', 'New', 82, 72),
    (v_report_id, 'Poultry', 'New', 212, 43);
END $$;

-- Report 6: May 2024 (Approved)
DO $$
DECLARE
  v_report_id INTEGER;
BEGIN
  INSERT INTO monthly_reports (institute_id, reporting_month, start_date, end_date, prepared_by, verified_by, submission_status, submitted_at, verified_at, created_at, updated_at)
  VALUES (1, '2024-05', '2024-05-01', '2024-05-31', 1, 2, 'Approved', '2024-06-02 09:30:00+00', '2024-06-03 14:00:00+00', '2024-06-01 08:00:00+00', '2024-06-03 14:00:00+00')
  RETURNING report_id INTO v_report_id;

  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
  VALUES
    (v_report_id, 'Equine', 'New', 36, 31),
    (v_report_id, 'Bovine', 'New', 138, 125),
    (v_report_id, 'Small', 'New', 71, 63),
    (v_report_id, 'Poultry', 'New', 189, 37);
END $$;

-- Report 7: April 2024 (Approved) - Start of fiscal year
DO $$
DECLARE
  v_report_id INTEGER;
BEGIN
  INSERT INTO monthly_reports (institute_id, reporting_month, start_date, end_date, prepared_by, verified_by, submission_status, submitted_at, verified_at, created_at, updated_at)
  VALUES (1, '2024-04', '2024-04-01', '2024-04-30', 1, 2, 'Approved', '2024-05-02 10:00:00+00', '2024-05-03 15:30:00+00', '2024-05-01 08:00:00+00', '2024-05-03 15:30:00+00')
  RETURNING report_id INTO v_report_id;

  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
  VALUES
    (v_report_id, 'Equine', 'New', 48, 41),
    (v_report_id, 'Bovine', 'New', 161, 145),
    (v_report_id, 'Small', 'New', 88, 77),
    (v_report_id, 'Poultry', 'New', 245, 49);
END $$;

-- ============================================================================
-- Fiscal Year 2023-24 Reports (April 2023 - March 2024)
-- ============================================================================

-- Report 8: March 2024 (Approved) - End of previous fiscal year
DO $$
DECLARE
  v_report_id INTEGER;
BEGIN
  INSERT INTO monthly_reports (institute_id, reporting_month, start_date, end_date, prepared_by, verified_by, submission_status, submitted_at, verified_at, created_at, updated_at)
  VALUES (1, '2024-03', '2024-03-01', '2024-03-31', 1, 2, 'Approved', '2024-04-02 09:00:00+00', '2024-04-03 14:00:00+00', '2024-04-01 08:00:00+00', '2024-04-03 14:00:00+00')
  RETURNING report_id INTO v_report_id;

  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
  VALUES
    (v_report_id, 'Equine', 'New', 43, 37),
    (v_report_id, 'Bovine', 'New', 152, 138),
    (v_report_id, 'Small', 'New', 79, 69),
    (v_report_id, 'Poultry', 'New', 223, 45);
END $$;

-- Report 9: February 2024 (Rejected - needs revision)
DO $$
DECLARE
  v_report_id INTEGER;
BEGIN
  INSERT INTO monthly_reports (institute_id, reporting_month, start_date, end_date, prepared_by, verified_by, submission_status, submitted_at, verified_at, admin_comment, created_at, updated_at)
  VALUES (1, '2024-02', '2024-02-01', '2024-02-29', 1, 2, 'Rejected', '2024-03-02 10:00:00+00', '2024-03-03 16:00:00+00', 'Vaccination data incomplete. Please provide opening and closing stock details.', '2024-03-01 08:00:00+00', '2024-03-03 16:00:00+00')
  RETURNING report_id INTO v_report_id;

  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
  VALUES
    (v_report_id, 'Bovine', 'New', 145, 131),
    (v_report_id, 'Small', 'New', 74, 65);
END $$;

-- Report 10: January 2024 (Approved)
DO $$
DECLARE
  v_report_id INTEGER;
BEGIN
  INSERT INTO monthly_reports (institute_id, reporting_month, start_date, end_date, prepared_by, verified_by, submission_status, submitted_at, verified_at, created_at, updated_at)
  VALUES (1, '2024-01', '2024-01-01', '2024-01-31', 1, 2, 'Approved', '2024-02-02 09:30:00+00', '2024-02-03 14:30:00+00', '2024-02-01 08:00:00+00', '2024-02-03 14:30:00+00')
  RETURNING report_id INTO v_report_id;

  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
  VALUES
    (v_report_id, 'Equine', 'New', 39, 33),
    (v_report_id, 'Bovine', 'New', 147, 133),
    (v_report_id, 'Small', 'New', 76, 67),
    (v_report_id, 'Poultry', 'New', 201, 41);
END $$;

-- Report 11: December 2023 (Approved)
DO $$
DECLARE
  v_report_id INTEGER;
BEGIN
  INSERT INTO monthly_reports (institute_id, reporting_month, start_date, end_date, prepared_by, verified_by, submission_status, submitted_at, verified_at, created_at, updated_at)
  VALUES (1, '2023-12', '2023-12-01', '2023-12-31', 1, 2, 'Approved', '2024-01-02 10:00:00+00', '2024-01-03 15:00:00+00', '2024-01-01 08:00:00+00', '2024-01-03 15:00:00+00')
  RETURNING report_id INTO v_report_id;

  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
  VALUES
    (v_report_id, 'Equine', 'New', 46, 39),
    (v_report_id, 'Bovine', 'New', 158, 143),
    (v_report_id, 'Small', 'New', 85, 75),
    (v_report_id, 'Poultry', 'New', 234, 47);
END $$;

-- Report 12: November 2023 (Approved)
DO $$
DECLARE
  v_report_id INTEGER;
BEGIN
  INSERT INTO monthly_reports (institute_id, reporting_month, start_date, end_date, prepared_by, verified_by, submission_status, submitted_at, verified_at, created_at, updated_at)
  VALUES (1, '2023-11', '2023-11-01', '2023-11-30', 1, 2, 'Approved', '2023-12-02 09:00:00+00', '2023-12-03 14:00:00+00', '2023-12-01 08:00:00+00', '2023-12-03 14:00:00+00')
  RETURNING report_id INTO v_report_id;

  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
  VALUES
    (v_report_id, 'Bovine', 'New', 151, 137),
    (v_report_id, 'Small', 'New', 80, 70),
    (v_report_id, 'Poultry', 'New', 218, 44);
END $$;

-- Report 13: October 2023 (Approved)
DO $$
DECLARE
  v_report_id INTEGER;
BEGIN
  INSERT INTO monthly_reports (institute_id, reporting_month, start_date, end_date, prepared_by, verified_by, submission_status, submitted_at, verified_at, created_at, updated_at)
  VALUES (1, '2023-10', '2023-10-01', '2023-10-31', 1, 2, 'Approved', '2023-11-02 10:30:00+00', '2023-11-03 15:30:00+00', '2023-11-01 08:00:00+00', '2023-11-03 15:30:00+00')
  RETURNING report_id INTO v_report_id;

  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
  VALUES
    (v_report_id, 'Bovine', 'New', 143, 129),
    (v_report_id, 'Small', 'New', 73, 64),
    (v_report_id, 'Poultry', 'New', 195, 39);
END $$;

-- ============================================================================
-- Fiscal Year 2022-23 Reports (April 2022 - March 2023) - Sparse data
-- ============================================================================

-- Report 14: December 2022 (Approved)
DO $$
DECLARE
  v_report_id INTEGER;
BEGIN
  INSERT INTO monthly_reports (institute_id, reporting_month, start_date, end_date, prepared_by, verified_by, submission_status, submitted_at, verified_at, created_at, updated_at)
  VALUES (1, '2022-12', '2022-12-01', '2022-12-31', 1, 2, 'Approved', '2023-01-02 10:00:00+00', '2023-01-03 15:00:00+00', '2023-01-01 08:00:00+00', '2023-01-03 15:00:00+00')
  RETURNING report_id INTO v_report_id;

  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
  VALUES
    (v_report_id, 'Bovine', 'New', 128, 116),
    (v_report_id, 'Small', 'New', 61, 54);
END $$;

-- Report 15: August 2022 (Approved)
DO $$
DECLARE
  v_report_id INTEGER;
BEGIN
  INSERT INTO monthly_reports (institute_id, reporting_month, start_date, end_date, prepared_by, verified_by, submission_status, submitted_at, verified_at, created_at, updated_at)
  VALUES (1, '2022-08', '2022-08-01', '2022-08-31', 1, 2, 'Approved', '2022-09-02 09:00:00+00', '2022-09-03 14:00:00+00', '2022-09-01 08:00:00+00', '2022-09-03 14:00:00+00')
  RETURNING report_id INTO v_report_id;

  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
  VALUES
    (v_report_id, 'Bovine', 'New', 135, 122),
    (v_report_id, 'Small', 'New', 68, 60);
END $$;

-- Report 16: May 2022 (Approved)
DO $$
DECLARE
  v_report_id INTEGER;
BEGIN
  INSERT INTO monthly_reports (institute_id, reporting_month, start_date, end_date, prepared_by, verified_by, submission_status, submitted_at, verified_at, created_at, updated_at)
  VALUES (1, '2022-05', '2022-05-01', '2022-05-31', 1, 2, 'Approved', '2022-06-02 10:00:00+00', '2022-06-03 15:00:00+00', '2022-06-01 08:00:00+00', '2022-06-03 15:00:00+00')
  RETURNING report_id INTO v_report_id;

  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases, beneficiaries_covered)
  VALUES
    (v_report_id, 'Bovine', 'New', 119, 108),
    (v_report_id, 'Small', 'New', 55, 49);
END $$;

COMMIT;

-- Display summary
SELECT
  CASE
    WHEN SUBSTRING(reporting_month FROM 6 FOR 2)::INTEGER >= 4 THEN
      SUBSTRING(reporting_month FROM 1 FOR 4) || '-' || SUBSTRING((SUBSTRING(reporting_month FROM 1 FOR 4)::INTEGER + 1)::TEXT FROM 3 FOR 2)
    ELSE
      (SUBSTRING(reporting_month FROM 1 FOR 4)::INTEGER - 1)::TEXT || '-' || SUBSTRING(reporting_month FROM 3 FOR 2)
  END as fiscal_year,
  COUNT(*) as report_count,
  COUNT(CASE WHEN submission_status = 'Approved' THEN 1 END) as approved,
  COUNT(CASE WHEN submission_status = 'Submitted' THEN 1 END) as submitted,
  COUNT(CASE WHEN submission_status = 'Draft' THEN 1 END) as draft,
  COUNT(CASE WHEN submission_status = 'Rejected' THEN 1 END) as rejected
FROM monthly_reports
WHERE institute_id = 1
GROUP BY fiscal_year
ORDER BY fiscal_year DESC;
