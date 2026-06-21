-- AH Punjab Reporting System - PostgreSQL Database Schema
-- Comprehensive schema with all tables and extensions
-- Version: 2.0 - Includes WebAuthn, refresh tokens, and profile features

-- Enable required extensions
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
    human_population INTEGER DEFAULT 0,
    -- Animal population data (detailed breakdown for registration form)
    equine INTEGER DEFAULT 0,          -- Horses and equines
    buffaloes INTEGER DEFAULT 0,       -- Buffalo population
    cows INTEGER DEFAULT 0,            -- Cow population
    pigs INTEGER DEFAULT 0,            -- Pig population
    goat INTEGER DEFAULT 0,            -- Goat population
    sheep INTEGER DEFAULT 0,           -- Sheep population
    poultry_layers INTEGER DEFAULT 0,  -- Layer chickens
    poultry_broilers INTEGER DEFAULT 0,-- Broiler chickens
    dogs INTEGER DEFAULT 0,            -- Dog population
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
    latitude DECIMAL(10, 8),              -- Institute GPS latitude
    longitude DECIMAL(11, 8),             -- Institute GPS longitude
    is_cluster_available BOOLEAN DEFAULT FALSE, -- Has semen cluster facility
    is_lab_available BOOLEAN DEFAULT FALSE,     -- Has laboratory facility
    is_tehsil_hq BOOLEAN DEFAULT FALSE,         -- Serves as tehsil headquarters
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
    passkey_enabled BOOLEAN DEFAULT FALSE, -- WebAuthn passkey support
    profile_picture_url TEXT, -- Profile picture URL or base64 data
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
-- 4. AUTHENTICATION & SECURITY
-- ============================================================================

-- WebAuthn/Passkey credentials storage
CREATE TABLE webauthn_credentials (
    credential_id TEXT PRIMARY KEY,  -- Base64URL encoded credential ID from authenticator
    staff_id INTEGER NOT NULL REFERENCES staff(staff_id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,  -- Base64URL encoded public key for signature verification
    counter BIGINT NOT NULL DEFAULT 0,  -- Signature counter for replay attack protection
    device_name VARCHAR(100),  -- User-friendly device name (e.g., "iPhone 15", "Windows Hello")
    aaguid TEXT,  -- Authenticator AAGUID (identifies authenticator model)
    credential_device_type VARCHAR(50),  -- 'platform' or 'cross-platform'
    transports TEXT[],  -- ['usb', 'nfc', 'ble', 'internal'] - how device connects
    last_used_at TIMESTAMPTZ,  -- Track when credential was last used for security auditing
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- WebAuthn challenges for registration and authentication
CREATE TABLE webauthn_challenges (
    challenge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_key VARCHAR(255) NOT NULL UNIQUE, -- staffId for registration, auth_{userId} for login
    challenge TEXT NOT NULL,
    staff_id INTEGER REFERENCES staff(staff_id) ON DELETE CASCADE,
    challenge_type VARCHAR(20) NOT NULL CHECK (challenge_type IN ('registration', 'authentication')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address INET,
    user_agent TEXT
);

-- Refresh token sessions for JWT authentication
CREATE TABLE refresh_tokens (
    token_id SERIAL PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA256 hash of the refresh token
    staff_id INTEGER NOT NULL REFERENCES staff(staff_id) ON DELETE CASCADE,
    -- Session information
    device_info TEXT, -- User agent string
    ip_address INET, -- Client IP address
    device_name VARCHAR(100), -- Parsed device name (e.g., "iPhone (Safari)")
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    -- Status
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT
);

-- ============================================================================
-- 5. SERVICE CHARGES & FEE STRUCTURE
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
-- 6. SEMEN TYPES
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
-- 7. VACCINE MASTER
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
-- 8. SEMEN BANK MANAGEMENT (From Semen Bank Management Sheet)
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
-- 9. VACCINE DISTRIBUTION
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
-- 10. MONTHLY REPORTS (Main Report from Form Responses Sheet)
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
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    admin_comment TEXT,
    receipt_number VARCHAR(50), -- From sheets: receipt number
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institute_id, reporting_month)
);

-- ============================================================================
-- 11. OPD SERVICES REPORTING (From Form Responses)
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
-- 12. SURGERY/PROCEDURES REPORTING
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
-- 13. CERTIFICATE SERVICES
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
-- 14. VACCINATION REPORTING (From Form Responses)
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
-- 15. AI SERVICES REPORTING (From Form Responses - Very Detailed)
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
-- 16. DIAGNOSTIC/LAB SERVICES
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
-- 17. EXTENSION ACTIVITIES
-- ============================================================================

CREATE TYPE activity_type AS ENUM ('Camp', 'SchoolLecture', 'FarmerTraining', 'Awareness', 'Other');

CREATE TABLE extension_activities_details (
    detail_id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES monthly_reports(report_id) ON DELETE CASCADE,
    activity_type activity_type NOT NULL,
    camp_subtype VARCHAR(20),      -- 'PLDB', 'ASCAD', 'Other' (added by migration 002)
    events_conducted INTEGER DEFAULT 0,
    locations_covered INTEGER DEFAULT 0,
    total_attendees INTEGER DEFAULT 0,
    ladies_attended INTEGER DEFAULT 0,  -- added by migration 002
    animals_treated INTEGER DEFAULT 0,
    service_charge_id INTEGER REFERENCES service_charges(charge_id)
);

-- ============================================================================
-- 18. FINANCIAL SUMMARY (Calculated from all report details)
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
-- 19. AUDIT TRAIL (Report Edits by Tehsil/District Admins)
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
-- 20. PERFORMANCE TARGETS (Historical tracking with effective dates)
-- ============================================================================

CREATE TYPE target_type AS ENUM ('OPD', 'AI_Cattle', 'AI_Buffalo', 'Vaccine');

CREATE TABLE institute_targets (
    target_id SERIAL PRIMARY KEY,
    institute_id INTEGER REFERENCES institutes(institute_id) ON DELETE CASCADE,
    institute_type institute_type, -- For type-based defaults (CVH, CVD, etc.)
    target_type target_type NOT NULL,
    vaccine_id INTEGER REFERENCES vaccines(vaccine_id), -- Only for Vaccine targets
    annual_target INTEGER NOT NULL,
    monthly_target INTEGER, -- Optional: can be calculated as annual_target/12
    effective_from DATE NOT NULL,
    effective_until DATE, -- NULL means currently active
    financial_year VARCHAR(10), -- e.g., "2025-26"
    notes TEXT, -- Reason for target change
    created_by INTEGER REFERENCES staff(staff_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure no overlapping date ranges for same institute/type/vaccine
    CONSTRAINT check_date_range CHECK (effective_until IS NULL OR effective_until >= effective_from),
    -- Vaccine targets must have vaccine_id, others must not
    CONSTRAINT check_vaccine_target CHECK (
        (target_type = 'Vaccine' AND vaccine_id IS NOT NULL) OR
        (target_type != 'Vaccine' AND vaccine_id IS NULL)
    ),
    -- Either institute_id OR institute_type must be set, but not both
    CONSTRAINT check_institute_or_type CHECK (
        (institute_id IS NOT NULL AND institute_type IS NULL) OR
        (institute_id IS NULL AND institute_type IS NOT NULL)
    )
);

-- Function to get active target for a specific date
-- This checks institute-specific targets first, then falls back to institute type defaults
CREATE OR REPLACE FUNCTION get_active_target(
    p_institute_id INTEGER,
    p_target_type target_type,
    p_vaccine_id INTEGER,
    p_date DATE
)
RETURNS INTEGER AS $$
DECLARE
    v_target INTEGER;
    v_institute_type institute_type;
BEGIN
    -- First, try to get institute-specific target
    SELECT annual_target INTO v_target
    FROM institute_targets
    WHERE institute_id = p_institute_id
      AND target_type = p_target_type
      AND (vaccine_id = p_vaccine_id OR (vaccine_id IS NULL AND p_vaccine_id IS NULL))
      AND effective_from <= p_date
      AND (effective_until IS NULL OR effective_until >= p_date)
    ORDER BY effective_from DESC
    LIMIT 1;

    -- If no institute-specific target, get institute type and look for type-based default
    IF v_target IS NULL THEN
        SELECT i.institute_type INTO v_institute_type
        FROM institutes i
        WHERE i.institute_id = p_institute_id;

        IF v_institute_type IS NOT NULL THEN
            SELECT annual_target INTO v_target
            FROM institute_targets
            WHERE institute_targets.institute_type = v_institute_type
              AND target_type = p_target_type
              AND (vaccine_id = p_vaccine_id OR (vaccine_id IS NULL AND p_vaccine_id IS NULL))
              AND effective_from <= p_date
              AND (effective_until IS NULL OR effective_until >= p_date)
            ORDER BY effective_from DESC
            LIMIT 1;
        END IF;
    END IF;

    RETURN COALESCE(v_target, 0);
END;
$$ LANGUAGE plpgsql;

-- View to show current active targets
CREATE VIEW v_current_targets AS
SELECT
    it.target_id,
    it.institute_id,
    i.institute_name,
    it.institute_type,
    it.target_type,
    it.vaccine_id,
    v.vaccine_name,
    it.annual_target,
    it.monthly_target,
    it.effective_from,
    it.financial_year,
    CASE
        WHEN it.institute_id IS NOT NULL THEN 'Institute-Specific'
        WHEN it.institute_type IS NOT NULL THEN 'Type-Default'
    END AS target_scope
FROM institute_targets it
LEFT JOIN institutes i ON it.institute_id = i.institute_id
LEFT JOIN vaccines v ON it.vaccine_id = v.vaccine_id
WHERE it.effective_until IS NULL OR it.effective_until >= CURRENT_DATE
ORDER BY target_scope, i.institute_name, it.institute_type, it.target_type, v.vaccine_name;

-- ============================================================================
-- 21. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Geographic indexes
CREATE INDEX idx_villages_tehsil ON villages(tehsil_id);
CREATE INDEX idx_villages_district ON villages(district_id);
CREATE INDEX idx_tehsils_district ON tehsils(district_id);
CREATE INDEX idx_villages_location ON villages(latitude, longitude);

-- Institute indexes
CREATE INDEX idx_institutes_village ON institutes(village_id);
CREATE INDEX idx_institutes_parent ON institutes(parent_institute_id);
CREATE INDEX idx_institutes_type ON institutes(institute_type);
CREATE INDEX idx_institutes_org_id ON institutes(org_id);
CREATE INDEX idx_institutes_location ON institutes(latitude, longitude);

-- Staff indexes
CREATE INDEX idx_staff_institute ON staff(current_institute_id);
CREATE INDEX idx_staff_user_id ON staff(user_id);
CREATE INDEX idx_staff_postings_current ON staff_postings(staff_id, is_current);
CREATE INDEX idx_staff_profile_picture ON staff(staff_id) WHERE profile_picture_url IS NOT NULL;

-- Authentication indexes
CREATE INDEX idx_webauthn_staff_id ON webauthn_credentials(staff_id);
CREATE INDEX idx_webauthn_challenges_key ON webauthn_challenges(challenge_key);
CREATE INDEX idx_webauthn_challenges_expires ON webauthn_challenges(expires_at);
CREATE INDEX idx_refresh_tokens_staff_id ON refresh_tokens(staff_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Reporting indexes
CREATE INDEX idx_monthly_reports_month ON monthly_reports(reporting_month);
CREATE INDEX idx_monthly_reports_institute ON monthly_reports(institute_id);
CREATE INDEX idx_monthly_reports_status ON monthly_reports(submission_status);

-- Transaction indexes
CREATE INDEX idx_semen_transactions_date ON semen_transactions(transaction_date);
CREATE INDEX idx_semen_transactions_month ON semen_transactions(month);
CREATE INDEX idx_vaccine_transactions_date ON vaccine_transactions(transaction_date);

-- Target indexes
CREATE INDEX idx_institute_targets_institute ON institute_targets(institute_id) WHERE institute_id IS NOT NULL;
CREATE INDEX idx_institute_targets_inst_type ON institute_targets(institute_type) WHERE institute_type IS NOT NULL;
CREATE INDEX idx_institute_targets_target_type ON institute_targets(target_type);
CREATE INDEX idx_institute_targets_vaccine ON institute_targets(vaccine_id) WHERE vaccine_id IS NOT NULL;
CREATE INDEX idx_institute_targets_effective ON institute_targets(effective_from, effective_until);
CREATE INDEX idx_institute_targets_active ON institute_targets(institute_id, target_type, effective_from, effective_until) WHERE institute_id IS NOT NULL;

-- ============================================================================
-- 22. TRIGGERS FOR AUTO-UPDATE timestamps
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

CREATE TRIGGER trigger_webauthn_credentials_updated_at
    BEFORE UPDATE ON webauthn_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_institute_targets_updated_at BEFORE UPDATE ON institute_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 23. CLEANUP FUNCTIONS FOR SECURITY
-- ============================================================================

-- Auto-cleanup expired WebAuthn challenges
CREATE OR REPLACE FUNCTION cleanup_expired_challenges()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM webauthn_challenges WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired refresh tokens
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM refresh_tokens
    WHERE expires_at < CURRENT_TIMESTAMP
       OR (is_revoked = TRUE AND revoked_at < CURRENT_TIMESTAMP - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 24. VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Complete institute hierarchy view with location and features
CREATE VIEW v_institute_hierarchy AS
SELECT
    i.institute_id,
    i.org_id,
    i.institute_name,
    i.institute_type,
    i.latitude AS institute_latitude,
    i.longitude AS institute_longitude,
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

-- Village population details view
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
-- 25. NOTIFICATIONS SYSTEM
-- ============================================================================

-- Notifications table for in-app and push notifications
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    recipient_id INTEGER NOT NULL REFERENCES staff(staff_id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES staff(staff_id) ON DELETE SET NULL, -- NULL for system-generated
    notification_type VARCHAR(50) NOT NULL, -- 'system', 'broadcast', 'user'
    category VARCHAR(50) NOT NULL, -- 'report_submitted', 'report_approved', 'deadline_reminder', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'

    -- Action buttons (JSONB array)
    -- Example: [{"label": "View Report", "type": "navigate", "path": "/reports/monthly/2024-06", "requiredPermission": "view_reports"}]
    actions JSONB,

    -- Attachments (JSONB array)
    -- Example: [{"type": "pdf", "filename": "circular.pdf", "path": "/attachments/circular.pdf"}]
    attachments JSONB,

    -- Metadata for linking to related entities
    related_entity_type VARCHAR(50), -- 'monthly_report', 'circular', 'announcement', etc.
    related_entity_id INTEGER, -- report_id, circular_id, etc.

    -- State tracking
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP,

    -- Timestamps and retention
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- Auto-delete after this date (90 days default)
    deleted_at TIMESTAMP -- Soft delete
);

-- Indexes for performance
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_expires ON notifications(expires_at) WHERE deleted_at IS NULL AND expires_at IS NOT NULL;
CREATE INDEX idx_notifications_category ON notifications(category) WHERE deleted_at IS NULL;

-- Push notification subscriptions
CREATE TABLE push_subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(staff_id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE, -- Push service endpoint URL
    p256dh_key TEXT NOT NULL, -- Encryption key for push payload
    auth_key TEXT NOT NULL, -- Authentication secret
    user_agent TEXT, -- Browser/device identifier
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_push_subscriptions_staff ON push_subscriptions(staff_id) WHERE is_active = TRUE;

-- Function to auto-set expiry date on notification insert
CREATE OR REPLACE FUNCTION set_notification_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- Set expiry to 90 days from creation if not explicitly set
    -- Critical notifications (approvals/rejections) should set expires_at = NULL to keep forever
    IF NEW.expires_at IS NULL AND NEW.category NOT IN ('report_approved', 'report_rejected') THEN
        NEW.expires_at := NEW.created_at + INTERVAL '90 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_notification_expiry
    BEFORE INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION set_notification_expiry();

-- ============================================================================
-- 26. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE institutes IS 'Veterinary institutes (CVH, CVD, PAIW, etc.) mapped from Google Sheets OrgIds';
COMMENT ON TABLE staff IS 'Staff members with login credentials (user_id = OrgIds from sheets)';
COMMENT ON TABLE monthly_reports IS 'Main monthly reporting form mapped from Form Responses sheet';
COMMENT ON TABLE semen_transactions IS 'Semen bank management from Semen Bank Management sheet';
COMMENT ON TABLE service_charges IS 'Fee structure from Fees Management sheet';
COMMENT ON TABLE webauthn_credentials IS 'Stores WebAuthn/FIDO2 credentials (passkeys) for biometric authentication';
COMMENT ON TABLE webauthn_challenges IS 'Stores WebAuthn challenges for registration and authentication flows';
COMMENT ON TABLE refresh_tokens IS 'Stores active refresh token sessions for security and session management';
COMMENT ON TABLE institute_targets IS 'Performance targets with historical tracking - stores OPD, AI, and vaccine targets with effective date ranges';
COMMENT ON TABLE notifications IS 'In-app and push notifications with action buttons and attachments - 90 day retention policy (critical notifications kept forever)';
COMMENT ON TABLE push_subscriptions IS 'Web Push API subscription endpoints for browser push notifications when PWA is closed';
COMMENT ON COLUMN staff.profile_picture_url IS 'URL or base64 data for user profile picture';
COMMENT ON COLUMN staff.passkey_enabled IS 'Indicates if user has WebAuthn passkey authentication enabled';
COMMENT ON COLUMN institute_targets.effective_until IS 'NULL means currently active, otherwise historical record';
COMMENT ON COLUMN notifications.actions IS 'JSONB array of action buttons with permission checks - e.g., [{"label": "View Report", "type": "navigate", "path": "/reports/monthly/2024-06"}]';
COMMENT ON COLUMN notifications.expires_at IS 'Auto-set to 90 days from creation unless category is report_approved/report_rejected (kept forever)';
COMMENT ON FUNCTION get_active_target IS 'Returns active target for a given institute, target type, and date - supports historical target queries';
COMMENT ON FUNCTION set_notification_expiry IS 'Auto-sets notification expiry to 90 days unless it is a critical audit notification';
