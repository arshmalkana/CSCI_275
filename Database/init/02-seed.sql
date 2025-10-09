-- AH Punjab Reporting System - Seed Data
-- Sample data for development and testing

-- ============================================================================
-- 1. DISTRICTS (Punjab)
-- ============================================================================

INSERT INTO districts (district_name, state_name) VALUES
('Amritsar', 'Punjab'),
('Ludhiana', 'Punjab'),
('Jalandhar', 'Punjab'),
('Patiala', 'Punjab'),
('Bathinda', 'Punjab'),
('Mohali', 'Punjab'),
('Gurdaspur', 'Punjab'),
('Hoshiarpur', 'Punjab')
ON CONFLICT (district_name) DO NOTHING;

-- ============================================================================
-- 2. TEHSILS (Sub-districts)
-- ============================================================================

INSERT INTO tehsils (tehsil_name, district_id) VALUES
-- Amritsar District
('Ajnala', (SELECT district_id FROM districts WHERE district_name = 'Amritsar')),
('Amritsar I', (SELECT district_id FROM districts WHERE district_name = 'Amritsar')),
('Amritsar II', (SELECT district_id FROM districts WHERE district_name = 'Amritsar')),
('Tarn Taran', (SELECT district_id FROM districts WHERE district_name = 'Amritsar')),
('Patti', (SELECT district_id FROM districts WHERE district_name = 'Amritsar')),
('Khadoor Sahib', (SELECT district_id FROM districts WHERE district_name = 'Amritsar')),

-- Ludhiana District
('Ludhiana East', (SELECT district_id FROM districts WHERE district_name = 'Ludhiana')),
('Ludhiana West', (SELECT district_id FROM districts WHERE district_name = 'Ludhiana')),
('Khanna', (SELECT district_id FROM districts WHERE district_name = 'Ludhiana')),
('Samrala', (SELECT district_id FROM districts WHERE district_name = 'Ludhiana')),
('Payal', (SELECT district_id FROM districts WHERE district_name = 'Ludhiana')),

-- Jalandhar District
('Jalandhar I', (SELECT district_id FROM districts WHERE district_name = 'Jalandhar')),
('Jalandhar II', (SELECT district_id FROM districts WHERE district_name = 'Jalandhar')),
('Nakodar', (SELECT district_id FROM districts WHERE district_name = 'Jalandhar')),
('Phillaur', (SELECT district_id FROM districts WHERE district_name = 'Jalandhar'))
ON CONFLICT (tehsil_name, district_id) DO NOTHING;

-- ============================================================================
-- 3. VILLAGES (Sample villages with population data)
-- ============================================================================

INSERT INTO villages (village_name, tehsil_id, district_id, pincode, latitude, longitude, human_population, equine, buffaloes, cows, pigs, goat, sheep, poultry_layers, poultry_broilers, dogs) VALUES
-- Amritsar - Ajnala
('Ajnala', (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Ajnala'), (SELECT district_id FROM districts WHERE district_name = 'Amritsar'), '143102', 31.8457, 74.7606, 8500, 45, 320, 580, 12, 240, 180, 1500, 800, 35),
('Attari', (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Ajnala'), (SELECT district_id FROM districts WHERE district_name = 'Amritsar'), '143104', 31.6146, 74.8531, 6200, 38, 280, 520, 8, 210, 150, 1200, 600, 28),
('Bhikhiwind', (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Ajnala'), (SELECT district_id FROM districts WHERE district_name = 'Amritsar'), '143110', 31.6536, 74.7439, 5800, 32, 250, 480, 6, 190, 140, 1100, 550, 25),

-- Amritsar - Amritsar I
('Beas', (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar I'), (SELECT district_id FROM districts WHERE district_name = 'Amritsar'), '143201', 31.6330, 75.1500, 12000, 52, 380, 650, 15, 280, 200, 1800, 950, 42),
('Budha Theh', (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar I'), (SELECT district_id FROM districts WHERE district_name = 'Amritsar'), '143001', 31.6340, 74.8723, 4500, 28, 200, 420, 5, 170, 120, 900, 450, 22),
('Chogawan', (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Amritsar I'), (SELECT district_id FROM districts WHERE district_name = 'Amritsar'), '143105', 31.5985, 74.8976, 3800, 25, 180, 380, 4, 150, 100, 800, 400, 18),

-- Amritsar - Tarn Taran
('Dalla', (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Tarn Taran'), (SELECT district_id FROM districts WHERE district_name = 'Amritsar'), '143401', 31.4500, 74.9333, 7200, 42, 310, 560, 10, 230, 170, 1400, 750, 32),
('Fatehabad', (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Tarn Taran'), (SELECT district_id FROM districts WHERE district_name = 'Amritsar'), '143112', 31.5167, 74.9667, 6500, 38, 290, 530, 9, 220, 160, 1300, 700, 30),
('Ghalib Kalan', (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Tarn Taran'), (SELECT district_id FROM districts WHERE district_name = 'Amritsar'), '143419', 31.4833, 74.9500, 5200, 32, 240, 490, 7, 200, 140, 1150, 600, 26),
('Harike', (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Tarn Taran'), (SELECT district_id FROM districts WHERE district_name = 'Amritsar'), '143419', 31.1667, 74.9667, 4800, 30, 220, 460, 6, 180, 130, 1050, 550, 24),

-- Amritsar - Patti
('Jandiala Guru', (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Patti'), (SELECT district_id FROM districts WHERE district_name = 'Amritsar'), '143115', 31.1597, 75.0194, 8200, 48, 340, 600, 12, 260, 190, 1600, 850, 38),
('Kathunangal', (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Patti'), (SELECT district_id FROM districts WHERE district_name = 'Amritsar'), '143416', 31.3000, 75.0333, 5500, 35, 260, 510, 8, 210, 150, 1200, 650, 28),
('Lopoke', (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Patti'), (SELECT district_id FROM districts WHERE district_name = 'Amritsar'), '143412', 31.2500, 74.9833, 6000, 38, 280, 540, 9, 230, 165, 1300, 700, 30),
('Majitha', (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Patti'), (SELECT district_id FROM districts WHERE district_name = 'Amritsar'), '143601', 31.7500, 74.9583, 9500, 52, 360, 630, 14, 270, 195, 1700, 900, 40),

-- Ludhiana
('Khanna', (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Khanna'), (SELECT district_id FROM districts WHERE district_name = 'Ludhiana'), '141401', 30.7056, 76.2214, 15000, 65, 450, 780, 20, 320, 240, 2200, 1200, 55),
('Samrala', (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Samrala'), (SELECT district_id FROM districts WHERE district_name = 'Ludhiana'), '141114', 30.8333, 76.1833, 12500, 58, 420, 720, 18, 290, 220, 2000, 1100, 48),
('Payal', (SELECT tehsil_id FROM tehsils WHERE tehsil_name = 'Payal'), (SELECT district_id FROM districts WHERE district_name = 'Ludhiana'), '141110', 30.5714, 76.0389, 8800, 48, 350, 620, 14, 250, 185, 1650, 880, 38)
ON CONFLICT (village_name, tehsil_id) DO NOTHING;

-- ============================================================================
-- 4. SAMPLE SERVICE CHARGES (Fee Structure)
-- ============================================================================

INSERT INTO service_charges (service_code, service_name, description, category, current_rate, effective_from, financial_year) VALUES
-- OPD Services
('OPD_EQ_NEW', 'Equine OPD - New Case', 'New equine outpatient consultation', 'OPD', 50.00, '2024-04-01', '2024-25'),
('OPD_BOV_NEW', 'Bovine OPD - New Case', 'New bovine outpatient consultation', 'OPD', 30.00, '2024-04-01', '2024-25'),
('OPD_SM_NEW', 'Small Animal OPD - New', 'Small ruminants new consultation', 'OPD', 20.00, '2024-04-01', '2024-25'),

-- AI Services
('AI_HF', 'AI - HF Semen', 'Artificial insemination with HF semen', 'AI', 100.00, '2024-04-01', '2024-25'),
('AI_JERSEY', 'AI - Jersey Semen', 'Artificial insemination with Jersey semen', 'AI', 90.00, '2024-04-01', '2024-25'),
('AI_MURRAH', 'AI - Murrah Buffalo', 'Artificial insemination for buffalo', 'AI', 80.00, '2024-04-01', '2024-25'),

-- Vaccination
('VAC_FMD', 'FMD Vaccination', 'Foot and Mouth Disease vaccination', 'Vaccination', 15.00, '2024-04-01', '2024-25'),
('VAC_HS', 'HS Vaccination', 'Hemorrhagic Septicemia vaccination', 'Vaccination', 12.00, '2024-04-01', '2024-25'),
('VAC_BQ', 'BQ Vaccination', 'Black Quarter vaccination', 'Vaccination', 10.00, '2024-04-01', '2024-25'),

-- Certificates
('CERT_HEALTH', 'Health Certificate', 'Animal health certificate', 'Certificate', 50.00, '2024-04-01', '2024-25'),
('CERT_PM', 'Post Mortem Certificate', 'Post mortem examination certificate', 'Certificate', 100.00, '2024-04-01', '2024-25')
ON CONFLICT (service_code) DO NOTHING;

-- ============================================================================
-- 5. SAMPLE SEMEN TYPES
-- ============================================================================

INSERT INTO semen_types (semen_code, semen_name, species, semen_category, service_charge_id) VALUES
('HF', 'Holstein Friesian', 'Cattle', 'Imported', (SELECT charge_id FROM service_charges WHERE service_code = 'AI_HF')),
('JERSEY', 'Jersey', 'Cattle', 'Imported', (SELECT charge_id FROM service_charges WHERE service_code = 'AI_JERSEY')),
('SAHIWAL', 'Sahiwal', 'Cattle', 'Local', NULL),
('MURRAH', 'Murrah', 'Buffalo', 'Local', (SELECT charge_id FROM service_charges WHERE service_code = 'AI_MURRAH')),
('NILI_RAVI', 'Nili Ravi', 'Buffalo', 'Local', NULL),
('CROSSBRED', 'HF x Local Cross', 'Cattle', 'Local', NULL)
ON CONFLICT (semen_code) DO NOTHING;

-- ============================================================================
-- 6. SAMPLE VACCINES
-- ============================================================================

INSERT INTO vaccines (vaccine_code, vaccine_name, description, service_charge_id) VALUES
('FMD', 'Foot and Mouth Disease', 'FMD vaccine for cattle and buffalo', (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_FMD')),
('HS', 'Hemorrhagic Septicemia', 'HS vaccine for cattle and buffalo', (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_HS')),
('BQ', 'Black Quarter', 'BQ vaccine for cattle', (SELECT charge_id FROM service_charges WHERE service_code = 'VAC_BQ')),
('BRUCELLA', 'Brucellosis', 'Brucella vaccine for cattle', NULL),
('PPR', 'Peste des Petits Ruminants', 'PPR vaccine for goat and sheep', NULL),
('RANIKHET', 'Ranikhet Disease', 'RD vaccine for poultry', NULL)
ON CONFLICT (vaccine_code) DO NOTHING;

-- ============================================================================
-- 7. SAMPLE VACCINE DOSAGE
-- ============================================================================

INSERT INTO vaccine_species_dosage (vaccine_id, species, dose_per_animal) VALUES
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'FMD'), 'Cattle', 2.00),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'FMD'), 'Buffalo', 2.00),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'HS'), 'Cattle', 1.00),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'HS'), 'Buffalo', 1.00),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'BQ'), 'Cattle', 1.00),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'PPR'), 'Goat', 1.00),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'PPR'), 'Sheep', 1.00),
((SELECT vaccine_id FROM vaccines WHERE vaccine_code = 'RANIKHET'), 'Poultry', 0.50)
ON CONFLICT (vaccine_id, species) DO NOTHING;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Seed data loaded successfully!';
    RAISE NOTICE 'Districts: %', (SELECT COUNT(*) FROM districts);
    RAISE NOTICE 'Tehsils: %', (SELECT COUNT(*) FROM tehsils);
    RAISE NOTICE 'Villages: %', (SELECT COUNT(*) FROM villages);
    RAISE NOTICE 'Service Charges: %', (SELECT COUNT(*) FROM service_charges);
    RAISE NOTICE 'Semen Types: %', (SELECT COUNT(*) FROM semen_types);
    RAISE NOTICE 'Vaccines: %', (SELECT COUNT(*) FROM vaccines);
END $$;
