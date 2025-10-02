-- 1. Service Location
CREATE TABLE ServiceLocations (
    location_id INT PRIMARY KEY AUTO_INCREMENT,
    institute_id INT DEFAULT 0, -- service institute
    location_name VARCHAR(100) NOT NULL,
    tehsil_name VARCHAR(50) NOT NULL,
    district_name VARCHAR(50) NOT NULL,
    longitude INT DEFAULT 0,
    latitude INT DEFAULT 0,
    pincode VARCHAR(10),
    cow_population INT DEFAULT 0,
    buffalo_population INT DEFAULT 0,
    sheep_population INT DEFAULT 0,
    goat_population INT DEFAULT 0,
    pig_population INT DEFAULT 0,
    poultry_population INT DEFAULT 0,
) ENGINE=InnoDB;

-- 2. Institutes
CREATE TABLE Institutes (
    institute_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type ENUM('CVH', 'CVD', 'CVH_Lab', 'Semen_Cluster', 'SemenBank', 'TehsilHQ', 'PAIW', 'District_HQ', 'HQ') NOT NULL,
    village_id INT NOT NULL,
    current_incharge_id INT,
    parent_institute_id INT,
    Parent_group_id INT, -- For grouping institutes under a common parent for reportingr use id of parent institute
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
    -- FOREIGN KEY (village_id) REFERENCES Village_Master(village_id),
    -- FOREIGN KEY (parent_institute_id) REFERENCES Institute_Master(institute_id)
) ENGINE=InnoDB;

-- 3. STAFF MANAGEMENT (With Transfer Tracking)
CREATE TABLE Staff (
    staff_id INT PRIMARY KEY AUTO_INCREMENT,
    institute_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    designation ENUM(
        'Veterinary Officer', 'Senior Veterinary Officer', 'Veterinary Inspector',
        'Senior Veterinary Inspector', 'District Veterinary Inspector', 
        'Veterinary Pharmacist', 'Private AI Worker', 'Class Four', 'Sweeper',
        'Peon', 'Watchman', 'Lab Attendant',
    ) NOT NULL,
    date_of_birth DATE NOT NULL,
    mobile VARCHAR(15),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,

) ENGINE=InnoDB;

CREATE TABLE Staff_Posting (
    posting_id INT PRIMARY KEY AUTO_INCREMENT,
    institute_id INT NOT NULL,
    designation ENUM(
        'Veterinary Officer', 'Senior Veterinary Officer', 'Veterinary Inspector',
        'Senior Veterinary Inspector', 'District Veterinary Inspector', 
        'Veterinary Pharmacist', 'Private AI Worker', 'Class Four', 'Sweeper',
        'Peon', 'Watchman', 'Lab Attendant', 'Vacant'
    ) NOT NULL,
    staff_id INT, -- Nullable for vacant posts
    start_date DATE,
    end_date DATE,
    -- is_incharge BOOLEAN DEFAULT FALSE,
    -- is_current BOOLEAN DEFAULT TRUE,
    -- FOREIGN KEY (staff_id) REFERENCES Staff(staff_id),
    -- FOREIGN KEY (institute_id) REFERENCES Institute_Master(institute_id)
) ENGINE=InnoDB;

-- 4. SERVICE CHARGES (Complete Implementation)
CREATE TABLE Service_Charges (
    charge_id INT PRIMARY KEY AUTO_INCREMENT,
    service_code VARCHAR(30) UNIQUE NOT NULL, -- e.g., OPD_LARGE, PD_CHARGE
    service_name VARCHAR(100) NOT NULL,
    description VARCHAR(200),
    current_rate DECIMAL(10,2) NOT NULL,
    effective_from DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    category ENUM(
        'OPD', 'AI', 'Vaccination', 'Diagnostic', 'Surgery', 
        'Certificate', 'Extension', 'Lab', 'Followup'
    ) NOT NULL
) ENGINE=InnoDB;

-- Prepopulated Service Charges (Sample)
INSERT INTO Service_Charges (service_code, service_name, current_rate, effective_from, category) VALUES
('OPD_LARGE', 'OPD Large Animals', 10.00, '2024-01-01', 'OPD'),
('OPD_PETS', 'OPD Pets', 50.00, '2024-01-01', 'OPD'),
('PD_CHARGE', 'Pregnancy Diagnosis', 25.00, '2024-01-01', 'Diagnostic'),
('CASTRATION', 'Castration', 50.00, '2024-01-01', 'Surgery'),
('OBSTETRICAL', 'Obstetrical Cases', 250.00, '2024-01-01', 'Surgery'),
('HC_SMALL', 'Health Certificate Small Animals', 50.00, '2024-01-01', 'Certificate'),
('AI_COW_LOCAL', 'AI Cow (Local Semen)', 25.00, '2024-01-01', 'AI'),
('AI_COW_SEXED', 'AI Cow (Sexed Semen)', 250.00, '2024-01-01', 'AI'),
('US_PET', 'Ultrasound Pets', 150.00, '2024-01-01', 'Diagnostic');

-- 5. SEMEN TYPES (Complete Implementation)
CREATE TABLE Semen_Types (
    semen_id INT PRIMARY KEY AUTO_INCREMENT,
    semen_code VARCHAR(10) NOT NULL, -- e.g., HF, Gir1
    full_name VARCHAR(100) NOT NULL,
    species ENUM('Cattle', 'Buffalo', 'Goat', 'Pig') NOT NULL,
    -- Foreign Key to Service Charges for AI services
    service_charge_id INT NOT NULL,
    FOREIGN KEY (service_charge_id) REFERENCES Service_Charges(charge_id)
) ENGINE=InnoDB;

-- Prepopulated Semen Types
INSERT INTO Semen_Types (abbreviation, full_name, service_charge_id) VALUES
('HF', 'Holstein Friesian', (SELECT charge_id FROM Service_Charges WHERE service_code = 'AI_COW_LOCAL')),
('Gir1', 'Gir Breed (Premium)', (SELECT charge_id FROM Service_Charges WHERE service_code = 'AI_COW_SEXED'));

-- 6. VACCINE MASTER
CREATE TABLE Vaccines (
    vaccine_id INT PRIMARY KEY AUTO_INCREMENT,
    vaccine_code VARCHAR(20) NOT NULL, -- e.g., HS, FMD
    vaccine_name VARCHAR(100) NOT NULL,
    species ENUM('Cattle', 'Buffalo', 'Goat', 'Pig') NOT NULL,
    dose_per_animal DECIMAL(5,2) NOT NULL,  -- e.g., 1.0 or 0.5
    service_charge_id INT NOT NULL,
    FOREIGN KEY (service_charge_id) REFERENCES Service_Charges(charge_id)
) ENGINE=InnoDB;

CREATE TABLE Vaccine_Species_Dosage (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vaccine_id INT NOT NULL,
    species ENUM('Cattle','Buffalo','Sheep','Goat','Poultry','Pig','Dog','Calf') NOT NULL,
    dose_per_animal DECIMAL(5,2) NOT NULL,  -- e.g., 1.0 or 0.50
    FOREIGN KEY (vaccine_id) REFERENCES Vaccine_Master(vaccine_id)
) ENGINE=InnoDB;



-- 7. VACCINE DISTRIBUTION (With Hierarchy)
CREATE TABLE Vaccine_Distribution (
    distribution_id INT PRIMARY KEY AUTO_INCREMENT,
    vaccine_id INT NOT NULL,
    issuing_institute_id INT NOT NULL,
    receiving_institute_id INT NOT NULL,
    doses_issued INT NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    distribution_date DATE NOT NULL,
    FOREIGN KEY (vaccine_id) REFERENCES Vaccine_Master(vaccine_id),
    FOREIGN KEY (issuing_institute_id) REFERENCES Institute_Master(institute_id),
    FOREIGN KEY (receiving_institute_id) REFERENCES Institute_Master(institute_id)
) ENGINE=InnoDB;

-- 8. DAILY VACCINATION REPORTING
CREATE TABLE Daily_Vaccination (
    daily_vac_id INT PRIMARY KEY AUTO_INCREMENT,
    institute_id INT NOT NULL,
    vaccine_id INT NOT NULL,
    vaccination_date DATE NOT NULL,

    species ENUM('Cattle','Buffalo','Sheep','Goat','Poultry','Pig','Dog','Calf') NOT NULL,
    cattle_vacinated INT DEFAULT 0,
    buffalo_vacinated INT DEFAULT 0,
    sheep_vacinated INT DEFAULT 0,
    goat_vacinated INT DEFAULT 0,
    dogs_vacinated INT DEFAULT 0,
    poultry_vacinated INT DEFAULT 0,
    pigs_vacinated INT DEFAULT 0,
    cow_calves_vacinated INT DEFAULT 0,
    cow_calves_vacinated_booster INT DEFAULT 0,
    buf_calves_vacinated INT DEFAULT 0,
    buf_calves_vacinated_booster INT DEFAULT 0,
    farmers_benefited INT DEFAULT 0,
    animals_tagged INT DEFAULT 0,
    animals_found_tagged INT DEFAULT 0,
    FOREIGN KEY (institute_id) REFERENCES Institute_Master(institute_id),
    FOREIGN KEY (vaccine_id) REFERENCES Vaccine_Master(vaccine_id)
) ENGINE=InnoDB;

-- 9. MONTHLY REPORT HEADER
-- use websockets
CREATE TABLE Monthly_Reports (
    report_id INT PRIMARY KEY AUTO_INCREMENT,
    institute_id INT NOT NULL,
    reporting_month CHAR(6) NOT NULL COMMENT 'YYYYMM',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    prepared_by INT,
    verified_by INT,
    submission_status ENUM('Draft', 'Submitted', 'Rejected', 'Approved') DEFAULT 'Draft',
    admin_comment VARCHAR(100) NOT NULL,
    FOREIGN KEY (institute_id) REFERENCES Institute_Master(institute_id),
    FOREIGN KEY (prepared_by) REFERENCES Staff(staff_id),
    FOREIGN KEY (verified_by) REFERENCES Staff(staff_id),
    UNIQUE KEY uk_monthly_report (institute_id, reporting_month)
) ENGINE=InnoDB;

-- 10. OPD SERVICES REPORTING (With Beneficiaries)
CREATE TABLE OPD_Report_Details (
    detail_id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    service_charge_id INT NOT NULL,
    opd_type ENUM('Bovine','Equine','Small','Poultry','Pet') NOT NULL, -- add pc and others
    new_cases INT DEFAULT 0,
    old_cases INT DEFAULT 0,
    beneficiaries_covered INT DEFAULT 0,
    FOREIGN KEY (report_id) REFERENCES Monthly_Reports(report_id),
    FOREIGN KEY (service_charge_id) REFERENCES Service_Charges(charge_id)
) ENGINE=InnoDB;

-- 11. AI SERVICES REPORTING
CREATE TABLE AI_Report_Details (
    detail_id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    semen_type_id INT NOT NULL,
    service_charge_id INT NOT NULL,
    total_AI INT DEFAULT 0,
    animals_covered INT DEFAULT 0,
    animals_tested INT DEFAULT 0,
    positive_cases INT DEFAULT 0,
    male_calves INT DEFAULT 0,
    female_calves INT DEFAULT 0,
    beneficiaries_covered INT DEFAULT 0,
    FOREIGN KEY (report_id) REFERENCES Monthly_Reports(report_id),
    FOREIGN KEY (semen_type_id) REFERENCES Semen_Types(semen_id)
) ENGINE=InnoDB;

-- 13. DIAGNOSTIC SERVICES (Updated)
CREATE TABLE Diagnostic_Report_Details (
    detail_id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    service_charge_id INT NOT NULL,
    diagnosis_type ENUM('blood test','fecal test','...') NOT NULL, -- fix this
    tests_conducted INT DEFAULT 0,
    beneficiaries_covered INT DEFAULT 0,
    FOREIGN KEY (report_id) REFERENCES Monthly_Reports(report_id),
    FOREIGN KEY (service_charge_id) REFERENCES Service_Charges(charge_id)
) ENGINE=InnoDB;

-- -- 14. VACCINATION MONTHLY SUMMARY
-- CREATE TABLE Vaccination_Monthly_Summary (
--     summary_id INT PRIMARY KEY AUTO_INCREMENT,
--     report_id INT NOT NULL,
--     vaccine_id INT NOT NULL,
--     doses_used INT DEFAULT 0,
--     animals_vaccinated INT DEFAULT 0,
--     FOREIGN KEY (report_id) REFERENCES Monthly_Reports(report_id),
--     FOREIGN KEY (vaccine_id) REFERENCES Vaccine_Master(vaccine_id)
-- ) ENGINE=InnoDB;

-- 15. FINANCIAL SUMMARIES (Detailed Breakdown)
-- CREATE TABLE Financial_Summaries (
--     summary_id INT PRIMARY KEY AUTO_INCREMENT,
--     report_id INT NOT NULL,
--     -- Department Fees
--     opd_large_animal_fee DECIMAL(12,2) DEFAULT 0,
--     opd_pet_fee DECIMAL(12,2) DEFAULT 0,
--     pd_fee DECIMAL(12,2) DEFAULT 0,
--     castration_fee DECIMAL(12,2) DEFAULT 0,
--     hc_fee DECIMAL(12,2) DEFAULT 0,
--     pm_fee DECIMAL(12,2) DEFAULT 0,
--     lab_fee DECIMAL(12,2) DEFAULT 0,
--     obstetrical_fee DECIMAL(12,2) DEFAULT 0,
--     -- AI Fees
--     ai_cow_local_fee DECIMAL(12,2) DEFAULT 0,
--     ai_cow_ett_fee DECIMAL(12,2) DEFAULT 0,
--     ai_cow_imp_fee DECIMAL(12,2) DEFAULT 0,
--     ai_cow_sexed_fee DECIMAL(12,2) DEFAULT 0,
--     ai_buffalo_fee DECIMAL(12,2) DEFAULT 0,
--     ai_buffalo_sexed_fee DECIMAL(12,2) DEFAULT 0,
--     -- Calculated Columns
--     department_total DECIMAL(12,2) GENERATED ALWAYS AS (
--         opd_large_animal_fee + opd_pet_fee + pd_fee + 
--         castration_fee + hc_fee + pm_fee + lab_fee + obstetrical_fee
--     ) STORED,
--     ai_total DECIMAL(12,2) GENERATED ALWAYS AS (
--         ai_cow_local_fee + ai_cow_ett_fee + ai_cow_imp_fee + 
--         ai_cow_sexed_fee + ai_buffalo_fee + ai_buffalo_sexed_fee
--     ) STORED,
--     grand_total DECIMAL(12,2) GENERATED ALWAYS AS (department_total + ai_total) STORED,
--     FOREIGN KEY (report_id) REFERENCES Monthly_Reports(report_id)
-- ) ENGINE=InnoDB;

-- 16. EXTENSION ACTIVITIES
CREATE TABLE Extension_Activities_Details (
    detail_id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    service_charge_id INT NOT NULL,
    activity_type ENUM('Camp','SchoolLecture','FarmerTraining') NOT NULL,
    events_conducted INT DEFAULT 0,
    locations_covered INT DEFAULT 0,
    total_attendees INT DEFAULT 0,
    animals_treated INT DEFAULT 0,
    FOREIGN KEY (service_charge_id) REFERENCES Service_Charges(charge_id),
    FOREIGN KEY (report_id) REFERENCES Monthly_Reports(report_id)
) ENGINE=InnoDB;

CREATE TABLE Certificate_Details (
    detail_id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    certificate_type ENUM('Health','Postmortem','Export') NOT NULL,
    service_charge_id INT NOT NULL,
    large_animal INT DEFAULT 0,
    small_animal INT DEFAULT 0,
    vetro_legal INT DEFAULT 0,
    dogs INT DEFAULT 0,
    poultry INT DEFAULT 0,
    total_issued INT DEFAULT 0,
    beneficiaries_covered INT DEFAULT 0,
    FOREIGN KEY (service_charge_id) REFERENCES Service_Charges(charge_id),
    FOREIGN KEY (report_id) REFERENCES Monthly_Reports(report_id)
) ENGINE=InnoDB;

-- 17. REPORT EDITS AUDIT (Tehsil Adjustments)
CREATE TABLE Report_Edits_Audit (
    edit_id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    edited_by INT NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    old_value VARCHAR(255),
    new_value VARCHAR(255),
    edit_reason TEXT,
    edit_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES Monthly_Reports(report_id),
    FOREIGN KEY (edited_by) REFERENCES Staff(staff_id)
) ENGINE=InnoDB;