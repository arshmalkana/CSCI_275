-- AH Punjab Reporting System - PostgreSQL Database Schema
-- Optimized based on existing Google Sheets implementation

-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. GEOGRAPHIC HIERARCHY (Village → Tehsil → District)
-- ============================================================================

CREATE TABLE districts (
    district_id SERIAL PRIMARY KEY,
    district_name VARCHAR(100) NOT NULL UNIQUE,
    state_name VARCHAR(100) DEFAULT 'Punjab',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tehsils (
    tehsil_id SERIAL PRIMARY KEY,
    tehsil_name VARCHAR(100) NOT NULL,
    district_id INTEGER NOT NULL REFERENCES districts(district_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tehsil_name, district_id)
);

CREATE TABLE villages (
    village_id SERIAL PRIMARY KEY,
    village_name VARCHAR(100) NOT NULL,
    tehsil_id INTEGER NOT NULL REFERENCES tehsils(tehsil_id),
    district_id INTEGER NOT NULL REFERENCES districts(district_id),
    pincode VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    -- Animal population data
    cow_population INTEGER DEFAULT 0,
    buffalo_population INTEGER DEFAULT 0,
    sheep_population INTEGER DEFAULT 0,
    goat_population INTEGER DEFAULT 0,
    pig_population INTEGER DEFAULT 0,
    poultry_population INTEGER DEFAULT 0,
    dog_population INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(village_name, tehsil_id)
);

-- ============================================================================
-- 2. INSTITUTES (CVH, CVD, PAIW, etc.)
-- ============================================================================

CREATE TYPE institute_type AS ENUM (
    'CVH',           -- Veterinary Hospital
    'CVD',           -- Veterinary Dispensary
    'CVH_Lab',       -- CVH with Lab
    'Semen_Cluster', -- Semen Cluster
    'SemenBank',     -- Semen Bank
    'TehsilHQ',      -- Tehsil Headquarters
    'PAIW',          -- Private AI Worker
    'District_HQ',   -- District Headquarters
    'HQ'             -- State Headquarters
);

CREATE TABLE institutes (
    institute_id SERIAL PRIMARY KEY,
    org_id VARCHAR(50) UNIQUE NOT NULL, -- From sheets: OrgIds
    institute_name VARCHAR(200) NOT NULL,
    institute_type institute_type NOT NULL,
    village_id INTEGER NOT NULL REFERENCES villages(village_id),
    tehsil_id INTEGER NOT NULL REFERENCES tehsils(tehsil_id),
    district_id INTEGER NOT NULL REFERENCES districts(district_id),
    current_incharge_id INTEGER,
    parent_institute_id INTEGER REFERENCES institutes(institute_id),
    reporting_authority_id INTEGER REFERENCES institutes(institute_id), -- From sheets: Reporting Authority
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service villages for institutes (many-to-many relationship)
CREATE TABLE institute_service_villages (
    id SERIAL PRIMARY KEY,
    institute_id INTEGER NOT NULL REFERENCES institutes(institute_id),
    village_id INTEGER NOT NULL REFERENCES villages(village_id),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institute_id, village_id)
);

-- ============================================================================
-- 3. STAFF MANAGEMENT
-- ============================================================================

CREATE TYPE designation_type AS ENUM (
    'Veterinary Officer',
    'Senior Veterinary Officer',
    'Veterinary Inspector',
    'Senior Veterinary Inspector',
    'District Veterinary Inspector',
    'Veterinary Pharmacist',
    'Private AI Worker',
    'Class Four',
    'Sweeper',
    'Peon',
    'Watchman',
    'Lab Attendant'
);

CREATE TYPE user_role AS ENUM (
    'INAPH',         -- Institute In-charge
    'AIW',           -- AI Worker
    'Tehsil_Admin',  -- Tehsil level admin
    'District_Admin',-- District level admin
    'HQ_Admin',      -- HQ level admin
    'Super_Admin'    -- System admin
);

CREATE TABLE staff (
    staff_id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE, -- From sheets: OrgIds (for login)
    full_name VARCHAR(200) NOT NULL,
    designation designation_type NOT NULL,
    date_of_birth DATE,
    mobile VARCHAR(15),
    email VARCHAR(100),
    password_hash TEXT, -- From sheets: Login_Hash
    user_role user_role NOT NULL, -- From sheets: User Roles
    current_institute_id INTEGER REFERENCES institutes(institute_id),
    is_first_time BOOLEAN DEFAULT TRUE, -- From sheets: Is First Time
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff posting history (transfer tracking)
CREATE TABLE staff_postings (
    posting_id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(staff_id),
    institute_id INTEGER NOT NULL REFERENCES institutes(institute_id),
    designation designation_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_incharge BOOLEAN DEFAULT FALSE,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update foreign key in institutes table
ALTER TABLE institutes ADD CONSTRAINT fk_institutes_incharge
    FOREIGN KEY (current_incharge_id) REFERENCES staff(staff_id);

-- ============================================================================
-- 4. SERVICE CHARGES & FEE STRUCTURE
-- ============================================================================

CREATE TYPE service_category AS ENUM (
    'OPD',
    'AI',
    'Vaccination',
    'Diagnostic',
    'Surgery',
    'Certificate',
    'Extension',
    'Lab'
);

CREATE TABLE service_charges (
    charge_id SERIAL PRIMARY KEY,
    service_code VARCHAR(50) UNIQUE NOT NULL,
    service_name VARCHAR(200) NOT NULL,
    description TEXT,
    category service_category NOT NULL,
    current_rate DECIMAL(10,2) NOT NULL,
    effective_from DATE NOT NULL,
    financial_year VARCHAR(10), -- From sheets: Financial Year
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fee changes tracking (from Fee Management sheet)
CREATE TABLE fee_changes_history (
    id SERIAL PRIMARY KEY,
    charge_id INTEGER NOT NULL REFERENCES service_charges(charge_id),
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    financial_year VARCHAR(10),
    old_rate DECIMAL(10,2),
    new_rate DECIMAL(10,2) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. SEMEN TYPES
-- ============================================================================

CREATE TYPE animal_species AS ENUM ('Cattle', 'Buffalo', 'Goat', 'Sheep', 'Pig', 'Poultry', 'Dog');

CREATE TABLE semen_types (
    semen_id SERIAL PRIMARY KEY,
    semen_code VARCHAR(20) UNIQUE NOT NULL, -- HF, Jersey, Murrah, etc.
    semen_name VARCHAR(100) NOT NULL,
    species animal_species NOT NULL,
    semen_category VARCHAR(50), -- Local, ETT, Imported, Sexed
    service_charge_id INTEGER REFERENCES service_charges(charge_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. VACCINE MASTER
-- ============================================================================

CREATE TABLE vaccines (
    vaccine_id SERIAL PRIMARY KEY,
    vaccine_code VARCHAR(20) UNIQUE NOT NULL, -- HS, FMD, BQ, etc.
    vaccine_name VARCHAR(200) NOT NULL,
    description TEXT,
    service_charge_id INTEGER REFERENCES service_charges(charge_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vaccine dosage by species
CREATE TABLE vaccine_species_dosage (
    id SERIAL PRIMARY KEY,
    vaccine_id INTEGER NOT NULL REFERENCES vaccines(vaccine_id),
    species animal_species NOT NULL,
    dose_per_animal DECIMAL(5,2) NOT NULL,
    UNIQUE(vaccine_id, species)
);

-- ============================================================================
-- 7. SEMEN BANK MANAGEMENT (From Semen Bank Management Sheet)
-- ============================================================================

CREATE TYPE transaction_type AS ENUM ('Received', 'Issued', 'Adjustment');

CREATE TABLE semen_transactions (
    transaction_id SERIAL PRIMARY KEY,
    transaction_date DATE NOT NULL,
    month VARCHAR(7) NOT NULL, -- YYYY-MM
    semen_bank_id INTEGER NOT NULL REFERENCES institutes(institute_id),
    institute_id INTEGER REFERENCES institutes(institute_id), -- Receiving/Issuing institute
    semen_type_id INTEGER NOT NULL REFERENCES semen_types(semen_id),
    transaction_type transaction_type NOT NULL,
    quantity INTEGER NOT NULL,
    batch_number VARCHAR(50),
    expiry_date DATE,
    remarks TEXT,
    created_by INTEGER REFERENCES staff(staff_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Current semen stock (calculated from transactions)
CREATE TABLE semen_stock (
    stock_id SERIAL PRIMARY KEY,
    institute_id INTEGER NOT NULL REFERENCES institutes(institute_id),
    semen_type_id INTEGER NOT NULL REFERENCES semen_types(semen_id),
    current_stock INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institute_id, semen_type_id)
);

-- ============================================================================
-- 8. VACCINE DISTRIBUTION
-- ============================================================================

CREATE TABLE vaccine_transactions (
    transaction_id SERIAL PRIMARY KEY,
    transaction_date DATE NOT NULL,
    vaccine_id INTEGER NOT NULL REFERENCES vaccines(vaccine_id),
    issuing_institute_id INTEGER NOT NULL REFERENCES institutes(institute_id),
    receiving_institute_id INTEGER NOT NULL REFERENCES institutes(institute_id),
    doses_issued INTEGER NOT NULL,
    batch_number VARCHAR(50),
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vaccine_stock (
    stock_id SERIAL PRIMARY KEY,
    institute_id INTEGER NOT NULL REFERENCES institutes(institute_id),
    vaccine_id INTEGER NOT NULL REFERENCES vaccines(vaccine_id),
    doses_received INTEGER DEFAULT 0,
    doses_used INTEGER DEFAULT 0,
    current_stock INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institute_id, vaccine_id)
);

-- ============================================================================
-- 9. MONTHLY REPORTS (Main Report from Form Responses Sheet)
-- ============================================================================

CREATE TYPE report_status AS ENUM ('Draft', 'Submitted', 'Rejected', 'Approved');

CREATE TABLE monthly_reports (
    report_id SERIAL PRIMARY KEY,
    institute_id INTEGER NOT NULL REFERENCES institutes(institute_id),
    reporting_month VARCHAR(7) NOT NULL, -- YYYY-MM
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    prepared_by INTEGER NOT NULL REFERENCES staff(staff_id),
    verified_by INTEGER REFERENCES staff(staff_id),
    submission_status report_status DEFAULT 'Draft',
    submitted_at TIMESTAMP,
    verified_at TIMESTAMP,
    admin_comment TEXT,
    receipt_number VARCHAR(50), -- From sheets: receipt number
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institute_id, reporting_month)
);

-- ============================================================================
-- 10. OPD SERVICES REPORTING (From Form Responses)
-- ============================================================================

CREATE TYPE opd_case_type AS ENUM ('Equine', 'Bovine', 'Others', 'Dogs', 'Small', 'Poultry', 'Pet');
CREATE TYPE case_category AS ENUM ('New', 'Old', 'Camp');

CREATE TABLE opd_report_details (
    detail_id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES monthly_reports(report_id) ON DELETE CASCADE,
    opd_type opd_case_type NOT NULL,
    case_category case_category NOT NULL,
    total_cases INTEGER DEFAULT 0,
    beneficiaries_covered INTEGER DEFAULT 0,
    service_charge_id INTEGER REFERENCES service_charges(charge_id),
    UNIQUE(report_id, opd_type, case_category)
);

-- ============================================================================
-- 11. SURGERY/PROCEDURES REPORTING
-- ============================================================================

CREATE TABLE surgery_report_details (
    detail_id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES monthly_reports(report_id) ON DELETE CASCADE,
    procedure_type VARCHAR(50) NOT NULL, -- Castration, Pregnancy Diagnosis, etc.
    animal_type VARCHAR(50), -- Bovine, Others
    total_procedures INTEGER DEFAULT 0,
    beneficiaries_covered INTEGER DEFAULT 0,
    service_charge_id INTEGER REFERENCES service_charges(charge_id)
);

-- ============================================================================
-- 12. CERTIFICATE SERVICES
-- ============================================================================

CREATE TYPE certificate_type AS ENUM ('Health', 'PostMortem', 'VetroLegal', 'Export');

CREATE TABLE certificate_report_details (
    detail_id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES monthly_reports(report_id) ON DELETE CASCADE,
    certificate_type certificate_type NOT NULL,
    animal_category VARCHAR(50), -- Large, Small
    total_issued INTEGER DEFAULT 0,
    beneficiaries_covered INTEGER DEFAULT 0,
    service_charge_id INTEGER REFERENCES service_charges(charge_id)
);

-- ============================================================================
-- 13. VACCINATION REPORTING (From Form Responses)
-- ============================================================================

CREATE TABLE vaccination_report_details (
    detail_id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES monthly_reports(report_id) ON DELETE CASCADE,
    vaccine_id INTEGER NOT NULL REFERENCES vaccines(vaccine_id),
    doses_received INTEGER DEFAULT 0,
    doses_used INTEGER DEFAULT 0,
    animals_vaccinated INTEGER DEFAULT 0,
    beneficiaries_covered INTEGER DEFAULT 0,
    UNIQUE(report_id, vaccine_id)
);

-- ============================================================================
-- 14. AI SERVICES REPORTING (From Form Responses - Very Detailed)
-- ============================================================================

CREATE TABLE ai_report_details (
    detail_id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES monthly_reports(report_id) ON DELETE CASCADE,
    semen_type_id INTEGER NOT NULL REFERENCES semen_types(semen_id),
    -- AI Performance
    total_ai_done INTEGER DEFAULT 0,
    animals_covered INTEGER DEFAULT 0,
    animals_tested INTEGER DEFAULT 0,
    animals_positive INTEGER DEFAULT 0,
    male_calves INTEGER DEFAULT 0,
    female_calves INTEGER DEFAULT 0,
    beneficiaries_covered INTEGER DEFAULT 0,
    -- Semen Usage (by institute INAPH)
    straws_used_inaph INTEGER DEFAULT 0,
    -- Semen issued to AIWs
    straws_issued_aiw INTEGER DEFAULT 0,
    -- Semen received during month
    straws_received INTEGER DEFAULT 0,
    service_charge_id INTEGER REFERENCES service_charges(charge_id),
    UNIQUE(report_id, semen_type_id)
);

-- ============================================================================
-- 15. DIAGNOSTIC/LAB SERVICES
-- ============================================================================

CREATE TYPE diagnostic_type AS ENUM ('Fecal', 'Blood', 'Urine', 'Milk', 'Other');

CREATE TABLE diagnostic_report_details (
    detail_id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES monthly_reports(report_id) ON DELETE CASCADE,
    diagnostic_type diagnostic_type NOT NULL,
    tests_conducted INTEGER DEFAULT 0,
    beneficiaries_covered INTEGER DEFAULT 0,
    service_charge_id INTEGER REFERENCES service_charges(charge_id),
    UNIQUE(report_id, diagnostic_type)
);

-- ============================================================================
-- 16. EXTENSION ACTIVITIES
-- ============================================================================

CREATE TYPE activity_type AS ENUM ('Camp', 'SchoolLecture', 'FarmerTraining', 'Awareness', 'Other');

CREATE TABLE extension_activities_details (
    detail_id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES monthly_reports(report_id) ON DELETE CASCADE,
    activity_type activity_type NOT NULL,
    events_conducted INTEGER DEFAULT 0,
    locations_covered INTEGER DEFAULT 0,
    total_attendees INTEGER DEFAULT 0,
    animals_treated INTEGER DEFAULT 0,
    service_charge_id INTEGER REFERENCES service_charges(charge_id)
);

-- ============================================================================
-- 17. FINANCIAL SUMMARY (Calculated from all report details)
-- ============================================================================

CREATE TABLE financial_summaries (
    summary_id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES monthly_reports(report_id) ON DELETE CASCADE,
    category service_category NOT NULL,
    total_services INTEGER DEFAULT 0,
    total_fees DECIMAL(12,2) DEFAULT 0,
    UNIQUE(report_id, category)
);

-- ============================================================================
-- 18. AUDIT TRAIL (Report Edits by Tehsil/District Admins)
-- ============================================================================

CREATE TABLE report_edits_audit (
    edit_id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES monthly_reports(report_id),
    edited_by INTEGER NOT NULL REFERENCES staff(staff_id),
    table_name VARCHAR(100) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    edit_reason TEXT,
    edit_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 19. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Geographic indexes
CREATE INDEX idx_villages_tehsil ON villages(tehsil_id);
CREATE INDEX idx_villages_district ON villages(district_id);
CREATE INDEX idx_tehsils_district ON tehsils(district_id);

-- Institute indexes
CREATE INDEX idx_institutes_village ON institutes(village_id);
CREATE INDEX idx_institutes_parent ON institutes(parent_institute_id);
CREATE INDEX idx_institutes_type ON institutes(institute_type);
CREATE INDEX idx_institutes_org_id ON institutes(org_id);

-- Staff indexes
CREATE INDEX idx_staff_institute ON staff(current_institute_id);
CREATE INDEX idx_staff_user_id ON staff(user_id);
CREATE INDEX idx_staff_postings_current ON staff_postings(staff_id, is_current);

-- Reporting indexes
CREATE INDEX idx_monthly_reports_month ON monthly_reports(reporting_month);
CREATE INDEX idx_monthly_reports_institute ON monthly_reports(institute_id);
CREATE INDEX idx_monthly_reports_status ON monthly_reports(submission_status);

-- Transaction indexes
CREATE INDEX idx_semen_transactions_date ON semen_transactions(transaction_date);
CREATE INDEX idx_semen_transactions_month ON semen_transactions(month);
CREATE INDEX idx_vaccine_transactions_date ON vaccine_transactions(transaction_date);

-- ============================================================================
-- 20. TRIGGERS FOR AUTO-UPDATE timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_districts_updated_at BEFORE UPDATE ON districts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tehsils_updated_at BEFORE UPDATE ON tehsils
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_villages_updated_at BEFORE UPDATE ON villages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_institutes_updated_at BEFORE UPDATE ON institutes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_reports_updated_at BEFORE UPDATE ON monthly_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 21. VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Complete institute hierarchy view
CREATE VIEW v_institute_hierarchy AS
SELECT
    i.institute_id,
    i.org_id,
    i.institute_name,
    i.institute_type,
    v.village_name,
    t.tehsil_name,
    d.district_name,
    s.full_name AS incharge_name,
    s.designation AS incharge_designation,
    s.mobile AS incharge_mobile,
    pi.institute_name AS parent_institute_name,
    ra.institute_name AS reporting_authority_name
FROM institutes i
LEFT JOIN villages v ON i.village_id = v.village_id
LEFT JOIN tehsils t ON i.tehsil_id = t.tehsil_id
LEFT JOIN districts d ON i.district_id = d.district_id
LEFT JOIN staff s ON i.current_incharge_id = s.staff_id
LEFT JOIN institutes pi ON i.parent_institute_id = pi.institute_id
LEFT JOIN institutes ra ON i.reporting_authority_id = ra.institute_id;

-- Current staff posting view
CREATE VIEW v_current_staff_postings AS
SELECT
    sp.posting_id,
    s.staff_id,
    s.full_name,
    s.designation,
    s.mobile,
    s.email,
    s.user_role,
    i.institute_id,
    i.institute_name,
    i.institute_type,
    sp.start_date,
    sp.is_incharge
FROM staff_postings sp
JOIN staff s ON sp.staff_id = s.staff_id
JOIN institutes i ON sp.institute_id = i.institute_id
WHERE sp.is_current = TRUE;

-- Monthly report summary view
CREATE VIEW v_monthly_report_summary AS
SELECT
    mr.report_id,
    mr.reporting_month,
    i.org_id,
    i.institute_name,
    i.institute_type,
    d.district_name,
    t.tehsil_name,
    s.full_name AS prepared_by_name,
    mr.submission_status,
    mr.submitted_at
FROM monthly_reports mr
JOIN institutes i ON mr.institute_id = i.institute_id
JOIN districts d ON i.district_id = d.district_id
JOIN tehsils t ON i.tehsil_id = t.tehsil_id
JOIN staff s ON mr.prepared_by = s.staff_id;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE institutes IS 'Veterinary institutes (CVH, CVD, PAIW, etc.) mapped from Google Sheets OrgIds';
COMMENT ON TABLE staff IS 'Staff members with login credentials (user_id = OrgIds from sheets)';
COMMENT ON TABLE monthly_reports IS 'Main monthly reporting form mapped from Form Responses sheet';
COMMENT ON TABLE semen_transactions IS 'Semen bank management from Semen Bank Management sheet';
COMMENT ON TABLE service_charges IS 'Fee structure from Fees Management sheet';
