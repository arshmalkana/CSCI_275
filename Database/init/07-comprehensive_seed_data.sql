-- ============================================================================
-- COMPREHENSIVE SEED DATA FOR AH PUNJAB REPORTING SYSTEM
-- Complete test data for all tables to enable full app testing
-- ============================================================================

-- Clean existing data (in correct order to avoid foreign key constraints)
TRUNCATE TABLE
  report_edits_audit,
  financial_summaries,
  extension_activities_details,
  diagnostic_report_details,
  ai_report_details,
  vaccination_report_details,
  certificate_report_details,
  surgery_report_details,
  opd_report_details,
  monthly_reports,
  vaccine_stock,
  vaccine_transactions,
  semen_stock,
  semen_transactions,
  staff_postings,
  staff,
  institute_service_villages,
  institutes,
  vaccine_species_dosage,
  vaccines,
  semen_types,
  service_charges,
  villages,
  tehsils,
  districts
CASCADE;

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
('NILI_RAVI', 'Nili Ravi', 'Buffalo', 'Local', (SELECT charge_id FROM service_charges WHERE service_code = 'AI_BUFFALO'));

-- ============================================================================
-- 3. VACCINES
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
-- 4. GEOGRAPHIC DATA - Punjab Districts, Tehsils, and Villages
-- ============================================================================

-- Districts (Major Punjab districts)
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

-- Tehsils
INSERT INTO tehsils (tehsil_name, district_id) VALUES
-- Amritsar
('Amritsar-I', (SELECT district_id FROM districts WHERE district_name = 'Amritsar')),
('Amritsar-II', (SELECT district_id FROM districts WHERE district_name = 'Amritsar')),
('Ajnala', (SELECT district_id FROM districts WHERE district_name = 'Amritsar')),
('Tarn Taran', (SELECT district_id FROM districts WHERE district_name = 'Amritsar')),

-- Bathinda
('Bathinda', (SELECT district_id FROM districts WHERE district_name = 'Bathinda')),
('Rampura Phul', (SELECT district_id FROM districts WHERE district_name = 'Bathinda')),
('Talwandi Sabo', (SELECT district_id FROM districts WHERE district_name = 'Bathinda')),

-- Ludhiana
('Ludhiana East', (SELECT district_id FROM districts WHERE district_name = 'Ludhiana')),
('Ludhiana West', (SELECT district_id FROM districts WHERE district_name = 'Ludhiana')),

-- Jalandhar
('Jalandhar-I', (SELECT district_id FROM districts WHERE district_name = 'Jalandhar')),
('Jalandhar-II', (SELECT district_id FROM districts WHERE district_name = 'Jalandhar'));

-- Villages with Animal Population Data
INSERT INTO villages (village_name, tehsil_id, district_id, pincode, human_population, equine, buffaloes, cows, pigs, goat, sheep, poultry_layers, poultry_broilers, dogs) VALUES
-- Amritsar District Villages
('Kotra Kalan',
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar-I' LIMIT 1),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
 '143001', 3050, 28, 295, 540, 9, 225, 165, 1320, 710, 15),

('Bhucho Khurd',
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar-I' LIMIT 1),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
 '143001', 2740, 31, 255, 510, 7, 205, 145, 1180, 630, 12),

('Lehra Mohabbat',
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar-I' LIMIT 1),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
 '143001', 2080, 19, 190, 360, 6, 150, 100, 860, 450, 10),

('Ghuman Mandi',
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar-I' LIMIT 1),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
 '143001', 2510, 33, 245, 470, 11, 185, 125, 1060, 560, 14),

('Malkana',
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar-I' LIMIT 1),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
 '143001', 1500, 20, 200, 300, 5, 120, 80, 800, 400, 8),

('Chabhal',
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar-I' LIMIT 1),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
 '143001', 1200, 15, 180, 250, 4, 100, 70, 750, 350, 7),

('Khalra',
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Ajnala' LIMIT 1),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
 '143102', 1800, 22, 220, 400, 8, 140, 95, 900, 500, 11),

-- Bathinda District Villages
('Goniana',
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Bathinda' LIMIT 1),
 (SELECT district_id FROM districts WHERE district_name = 'Bathinda'),
 '151201', 2200, 25, 240, 450, 10, 175, 110, 1000, 520, 13),

('Maur Mandi',
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Bathinda' LIMIT 1),
 (SELECT district_id FROM districts WHERE district_name = 'Bathinda'),
 '151509', 1900, 18, 210, 380, 6, 155, 95, 880, 470, 9),

('Rampura Phul Town',
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Rampura Phul' LIMIT 1),
 (SELECT district_id FROM districts WHERE district_name = 'Bathinda'),
 '151103', 2450, 27, 260, 480, 12, 190, 120, 1100, 580, 15);

-- ============================================================================
-- 5. INSTITUTES (CVH, CVD, Tehsil HQ, District HQ)
-- ============================================================================

INSERT INTO institutes (org_id, institute_name, institute_type, village_id, tehsil_id, district_id, latitude, longitude, is_cluster_available, is_lab_available, is_tehsil_hq, is_active) VALUES
-- Kotra Kalan - Main Institute
('CVD_KOTRA_001',
 'Veterinary Dispensary Kotra Kalan',
 'CVD',
 (SELECT village_id FROM villages WHERE village_name = 'Kotra Kalan' LIMIT 1),
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar-I' LIMIT 1),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
 30.4681, 72.6503, TRUE, TRUE, FALSE, TRUE),

-- Bhucho Khurd
('CVD_BHUCHO_002',
 'Veterinary Dispensary Bhucho Khurd',
 'CVD',
 (SELECT village_id FROM villages WHERE village_name = 'Bhucho Khurd' LIMIT 1),
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar-I' LIMIT 1),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
 30.4512, 72.6234, FALSE, FALSE, FALSE, TRUE),

-- Lehra Mohabbat
('CVD_LEHRA_003',
 'Veterinary Dispensary Lehra',
 'CVD',
 (SELECT village_id FROM villages WHERE village_name = 'Lehra Mohabbat' LIMIT 1),
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar-I' LIMIT 1),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
 30.4389, 72.5987, FALSE, FALSE, FALSE, TRUE),

-- Ghuman Mandi
('CVD_GHUMAN_004',
 'Veterinary Dispensary Ghuman',
 'CVD',
 (SELECT village_id FROM villages WHERE village_name = 'Ghuman Mandi' LIMIT 1),
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar-I' LIMIT 1),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
 30.4598, 72.6401, FALSE, FALSE, FALSE, TRUE),

-- Malkana
('CVD_MALKANA_005',
 'Veterinary Dispensary Malkana',
 'CVD',
 (SELECT village_id FROM villages WHERE village_name = 'Malkana' LIMIT 1),
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar-I' LIMIT 1),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
 30.4456, 72.6123, FALSE, FALSE, FALSE, TRUE),

-- Tehsil HQ
('TEHSIL_AMRITSAR1',
 'Tehsil Veterinary Office Amritsar-I',
 'TehsilHQ',
 (SELECT village_id FROM villages WHERE village_name = 'Kotra Kalan' LIMIT 1),
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar-I' LIMIT 1),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
 30.4681, 72.6503, FALSE, TRUE, TRUE, TRUE),

-- District HQ
('DISTRICT_AMRITSAR',
 'District Veterinary Office Amritsar',
 'District_HQ',
 (SELECT village_id FROM villages WHERE village_name = 'Kotra Kalan' LIMIT 1),
 (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar-I' LIMIT 1),
 (SELECT district_id FROM districts WHERE district_name = 'Amritsar'),
 30.4681, 72.6503, FALSE, TRUE, FALSE, TRUE);

-- Institute Service Villages (Many-to-Many relationship)
INSERT INTO institute_service_villages (institute_id, village_id, is_primary) VALUES
-- Kotra Kalan CVD serves all 4 villages
((SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'), (SELECT village_id FROM villages WHERE village_name = 'Kotra Kalan' LIMIT 1), TRUE),
((SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'), (SELECT village_id FROM villages WHERE village_name = 'Bhucho Khurd' LIMIT 1), FALSE),
((SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'), (SELECT village_id FROM villages WHERE village_name = 'Lehra Mohabbat' LIMIT 1), FALSE),
((SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'), (SELECT village_id FROM villages WHERE village_name = 'Ghuman Mandi' LIMIT 1), FALSE);

-- ============================================================================
-- 6. STAFF (Based on credential sheet structure)
-- ============================================================================

INSERT INTO staff (user_id, full_name, designation, date_of_birth, mobile, email, password_hash, user_role, current_institute_id, is_first_time, is_active) VALUES
-- Dr. Rajdeep Sandhu - INAPH for Kotra Kalan
('CVD_KOTRA_001',
 'Dr. Rajdeep Sandhu',
 'Veterinary Officer',
 '1985-06-15',
 '+919834562107',
 'rajdeep.sandhu@ahpunjab.gov.in',
 '$2a$10$placeholder_hash', -- Will be replaced with real argon2id hash in production
 'INAPH',
 (SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'),
 FALSE,
 TRUE),

-- Assistant Staff for Kotra Kalan
('ASSIST_KOTRA_001',
 'Manpreet Kaur',
 'Veterinary Inspector',
 '1990-03-20',
 '+919872041356',
 'manpreet.kaur@ahpunjab.gov.in',
 '$2a$10$placeholder_hash',
 'AIW',
 (SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'),
 FALSE,
 TRUE),

-- Lab Technician for Kotra Kalan
('LAB_KOTRA_001',
 'Arvinder Singh',
 'Lab Attendant',
 '1988-09-10',
 '+919798125463',
 'arvinder.singh@ahpunjab.gov.in',
 '$2a$10$placeholder_hash',
 'AIW',
 (SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'),
 FALSE,
 TRUE),

-- Tehsil Admin
('TEHSIL_AMRITSAR1',
 'Dr. Manjit Kaur',
 'Senior Veterinary Officer',
 '1980-03-20',
 '+919876543211',
 'manjit.kaur@ahpunjab.gov.in',
 '$2a$10$placeholder_hash',
 'Tehsil_Admin',
 (SELECT institute_id FROM institutes WHERE org_id = 'TEHSIL_AMRITSAR1'),
 FALSE,
 TRUE),

-- District Admin
('DISTRICT_AMRITSAR',
 'Dr. Rajinder Kumar',
 'District Veterinary Inspector',
 '1975-09-10',
 '+919876543212',
 'rajinder.kumar@ahpunjab.gov.in',
 '$2a$10$placeholder_hash',
 'District_Admin',
 (SELECT institute_id FROM institutes WHERE org_id = 'DISTRICT_AMRITSAR'),
 FALSE,
 TRUE);

-- Update institute current incharge
UPDATE institutes SET current_incharge_id = (SELECT staff_id FROM staff WHERE user_id = 'CVD_KOTRA_001')
WHERE org_id = 'CVD_KOTRA_001';

UPDATE institutes SET current_incharge_id = (SELECT staff_id FROM staff WHERE user_id = 'TEHSIL_AMRITSAR1')
WHERE org_id = 'TEHSIL_AMRITSAR1';

UPDATE institutes SET current_incharge_id = (SELECT staff_id FROM staff WHERE user_id = 'DISTRICT_AMRITSAR')
WHERE org_id = 'DISTRICT_AMRITSAR';

-- Update parent/reporting relationships for institutes
UPDATE institutes SET
    parent_institute_id = (SELECT institute_id FROM institutes WHERE org_id = 'TEHSIL_AMRITSAR1'),
    reporting_authority_id = (SELECT institute_id FROM institutes WHERE org_id = 'TEHSIL_AMRITSAR1')
WHERE org_id IN ('CVD_KOTRA_001', 'CVD_BHUCHO_002', 'CVD_LEHRA_003', 'CVD_GHUMAN_004', 'CVD_MALKANA_005');

UPDATE institutes SET
    parent_institute_id = (SELECT institute_id FROM institutes WHERE org_id = 'DISTRICT_AMRITSAR'),
    reporting_authority_id = (SELECT institute_id FROM institutes WHERE org_id = 'DISTRICT_AMRITSAR')
WHERE org_id = 'TEHSIL_AMRITSAR1';

-- ============================================================================
-- 7. STAFF POSTING HISTORY
-- ============================================================================

INSERT INTO staff_postings (staff_id, institute_id, designation, start_date, is_incharge, is_current) VALUES
-- Dr. Rajdeep Sandhu
((SELECT staff_id FROM staff WHERE user_id = 'CVD_KOTRA_001'),
 (SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'),
 'Veterinary Officer',
 '2020-01-01',
 TRUE,
 TRUE),

-- Manpreet Kaur
((SELECT staff_id FROM staff WHERE user_id = 'ASSIST_KOTRA_001'),
 (SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'),
 'Veterinary Inspector',
 '2021-06-01',
 FALSE,
 TRUE),

-- Arvinder Singh
((SELECT staff_id FROM staff WHERE user_id = 'LAB_KOTRA_001'),
 (SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'),
 'Lab Attendant',
 '2022-03-01',
 FALSE,
 TRUE),

-- Tehsil Admin
((SELECT staff_id FROM staff WHERE user_id = 'TEHSIL_AMRITSAR1'),
 (SELECT institute_id FROM institutes WHERE org_id = 'TEHSIL_AMRITSAR1'),
 'Senior Veterinary Officer',
 '2018-06-01',
 TRUE,
 TRUE),

-- District Admin
((SELECT staff_id FROM staff WHERE user_id = 'DISTRICT_AMRITSAR'),
 (SELECT institute_id FROM institutes WHERE org_id = 'DISTRICT_AMRITSAR'),
 'District Veterinary Inspector',
 '2015-04-01',
 TRUE,
 TRUE);

-- ============================================================================
-- 8. SEMEN & VACCINE STOCK FOR KOTRA KALAN
-- ============================================================================

-- Semen Stock
INSERT INTO semen_stock (institute_id, semen_type_id, current_stock) VALUES
((SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'),
 (SELECT semen_id FROM semen_types WHERE semen_code = 'HF'),
 150),
((SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'),
 (SELECT semen_id FROM semen_types WHERE semen_code = 'MURRAH'),
 200),
((SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'),
 (SELECT semen_id FROM semen_types WHERE semen_code = 'JERSEY'),
 100);

-- Vaccine Stock
INSERT INTO vaccine_stock (institute_id, vaccine_id, doses_received, doses_used, current_stock) VALUES
((SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'),
 (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'FMD'),
 6000, 3850, 2150),
((SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'),
 (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'HS'),
 3600, 3120, 480),
((SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'),
 (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'BQ'),
 2400, 1650, 750),
((SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'),
 (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'BRUC'),
 1800, 1320, 480),
((SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'),
 (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'THEI'),
 1200, 1045, 155),
((SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'),
 (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'RABIES'),
 960, 770, 190),
((SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'),
 (SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'ETV'),
 1440, 1100, 340);

-- ============================================================================
-- 9. MONTHLY REPORTS (Sample for testing)
-- ============================================================================

INSERT INTO monthly_reports (institute_id, reporting_month, start_date, end_date, prepared_by, submission_status, submitted_at) VALUES
-- Kotra Kalan - Submitted Reports
((SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'),
 '2024-06',
 '2024-06-01',
 '2024-06-30',
 (SELECT staff_id FROM staff WHERE user_id = 'CVD_KOTRA_001'),
 'Submitted',
 '2024-07-05 10:30:00'),

((SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'),
 '2024-05',
 '2024-05-01',
 '2024-05-31',
 (SELECT staff_id FROM staff WHERE user_id = 'CVD_KOTRA_001'),
 'Submitted',
 '2024-06-03 14:15:00'),

-- Draft Report
((SELECT institute_id FROM institutes WHERE org_id = 'CVD_KOTRA_001'),
 '2024-08',
 '2024-08-01',
 '2024-08-31',
 (SELECT staff_id FROM staff WHERE user_id = 'CVD_KOTRA_001'),
 'Draft',
 NULL),

-- Attached Institutes Reports
((SELECT institute_id FROM institutes WHERE org_id = 'CVD_BHUCHO_002'),
 '2024-09',
 '2024-09-01',
 '2024-09-30',
 (SELECT staff_id FROM staff WHERE user_id = 'CVD_KOTRA_001'),
 'Submitted',
 '2024-10-02 09:00:00'),

((SELECT institute_id FROM institutes WHERE org_id = 'CVD_LEHRA_003'),
 '2024-09',
 '2024-09-01',
 '2024-09-30',
 (SELECT staff_id FROM staff WHERE user_id = 'CVD_KOTRA_001'),
 'Submitted',
 '2024-10-08 16:45:00'),

((SELECT institute_id FROM institutes WHERE org_id = 'CVD_GHUMAN_004'),
 '2024-09',
 '2024-09-01',
 '2024-09-30',
 (SELECT staff_id FROM staff WHERE user_id = 'CVD_KOTRA_001'),
 'Draft',
 NULL);

-- ============================================================================
-- VERIFICATION QUERIES (Uncomment to test)
-- ============================================================================

/*
-- Verify institute hierarchy
SELECT * FROM v_institute_hierarchy WHERE org_id = 'CVD_KOTRA_001';

-- Verify staff postings
SELECT * FROM v_current_staff_postings WHERE institute_name LIKE '%Kotra%';

-- Verify village populations
SELECT * FROM v_village_populations WHERE district_name = 'Amritsar';

-- Verify semen stock
SELECT
    i.institute_name,
    st.semen_name,
    ss.current_stock
FROM semen_stock ss
JOIN institutes i ON ss.institute_id = i.institute_id
JOIN semen_types st ON ss.semen_type_id = st.semen_id
WHERE i.org_id = 'CVD_KOTRA_001';

-- Verify vaccine stock
SELECT
    i.institute_name,
    v.vaccine_name,
    vs.current_stock,
    vs.doses_used
FROM vaccine_stock vs
JOIN institutes i ON vs.institute_id = i.institute_id
JOIN vaccines v ON vs.vaccine_id = v.vaccine_id
WHERE i.org_id = 'CVD_KOTRA_001';
*/