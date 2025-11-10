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
