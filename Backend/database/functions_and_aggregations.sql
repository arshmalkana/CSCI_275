-- ============================================================================
-- ADVANCED AGGREGATION FUNCTIONS & MATERIALIZED VIEWS
-- For Complex Report Compilation (SUMIFS equivalent)
-- ============================================================================

-- ============================================================================
-- 1. MATERIALIZED VIEWS FOR FAST AGGREGATIONS
-- ============================================================================

-- Tehsil-level monthly aggregation (refreshed after report approval)
CREATE MATERIALIZED VIEW mv_tehsil_monthly_summary AS
SELECT
    i.tehsil_id,
    t.tehsil_name,
    i.district_id,
    d.district_name,
    mr.reporting_month,
    mr.start_date,
    mr.end_date,
    -- OPD Summary
    SUM(CASE WHEN opd.opd_type = 'Bovine' AND opd.case_category = 'New' THEN opd.total_cases ELSE 0 END) AS bovine_new_cases,
    SUM(CASE WHEN opd.opd_type = 'Bovine' AND opd.case_category = 'Old' THEN opd.total_cases ELSE 0 END) AS bovine_old_cases,
    SUM(CASE WHEN opd.opd_type = 'Equine' AND opd.case_category = 'New' THEN opd.total_cases ELSE 0 END) AS equine_new_cases,
    SUM(CASE WHEN opd.opd_type = 'Equine' AND opd.case_category = 'Old' THEN opd.total_cases ELSE 0 END) AS equine_old_cases,
    SUM(CASE WHEN opd.opd_type = 'Dogs' AND opd.case_category = 'New' THEN opd.total_cases ELSE 0 END) AS dogs_new_cases,
    SUM(CASE WHEN opd.opd_type = 'Others' AND opd.case_category = 'New' THEN opd.total_cases ELSE 0 END) AS others_new_cases,
    -- AI Summary
    SUM(ai.total_ai_done) AS total_ai_done,
    SUM(ai.animals_covered) AS total_animals_covered,
    SUM(ai.animals_tested) AS total_animals_tested,
    SUM(ai.animals_positive) AS total_animals_positive,
    SUM(ai.male_calves) AS total_male_calves,
    SUM(ai.female_calves) AS total_female_calves,
    -- Vaccination Summary
    SUM(vac.doses_used) AS total_vaccine_doses_used,
    SUM(vac.animals_vaccinated) AS total_animals_vaccinated,
    -- Certificate Summary
    SUM(cert.total_issued) AS total_certificates_issued,
    -- Surgery Summary
    SUM(surg.total_procedures) AS total_surgeries,
    -- Diagnostic Summary
    SUM(diag.tests_conducted) AS total_diagnostic_tests,
    -- Financial Summary
    SUM(fin.total_fees) AS total_fees_collected,
    -- Institute count
    COUNT(DISTINCT mr.institute_id) AS institutes_reported,
    -- Approval status
    COUNT(CASE WHEN mr.submission_status = 'Approved' THEN 1 END) AS approved_reports,
    COUNT(CASE WHEN mr.submission_status = 'Submitted' THEN 1 END) AS submitted_reports,
    COUNT(CASE WHEN mr.submission_status = 'Draft' THEN 1 END) AS draft_reports
FROM monthly_reports mr
JOIN institutes i ON mr.institute_id = i.institute_id
JOIN tehsils t ON i.tehsil_id = t.tehsil_id
JOIN districts d ON i.district_id = d.district_id
LEFT JOIN opd_report_details opd ON mr.report_id = opd.report_id
LEFT JOIN ai_report_details ai ON mr.report_id = ai.report_id
LEFT JOIN vaccination_report_details vac ON mr.report_id = vac.report_id
LEFT JOIN certificate_report_details cert ON mr.report_id = cert.report_id
LEFT JOIN surgery_report_details surg ON mr.report_id = surg.report_id
LEFT JOIN diagnostic_report_details diag ON mr.report_id = diag.report_id
LEFT JOIN financial_summaries fin ON mr.report_id = fin.report_id
GROUP BY i.tehsil_id, t.tehsil_name, i.district_id, d.district_name,
         mr.reporting_month, mr.start_date, mr.end_date;

-- Create index on materialized view
CREATE INDEX idx_mv_tehsil_month ON mv_tehsil_monthly_summary(tehsil_id, reporting_month);
CREATE INDEX idx_mv_tehsil_district ON mv_tehsil_monthly_summary(district_id, reporting_month);

-- District-level monthly aggregation
CREATE MATERIALIZED VIEW mv_district_monthly_summary AS
SELECT
    i.district_id,
    d.district_name,
    mr.reporting_month,
    mr.start_date,
    mr.end_date,
    -- OPD Summary
    SUM(CASE WHEN opd.opd_type = 'Bovine' AND opd.case_category = 'New' THEN opd.total_cases ELSE 0 END) AS bovine_new_cases,
    SUM(CASE WHEN opd.opd_type = 'Bovine' AND opd.case_category = 'Old' THEN opd.total_cases ELSE 0 END) AS bovine_old_cases,
    SUM(CASE WHEN opd.opd_type = 'Equine' AND opd.case_category = 'New' THEN opd.total_cases ELSE 0 END) AS equine_new_cases,
    SUM(CASE WHEN opd.opd_type = 'Equine' AND opd.case_category = 'Old' THEN opd.total_cases ELSE 0 END) AS equine_old_cases,
    SUM(CASE WHEN opd.opd_type = 'Dogs' AND opd.case_category = 'New' THEN opd.total_cases ELSE 0 END) AS dogs_new_cases,
    SUM(CASE WHEN opd.opd_type = 'Others' AND opd.case_category = 'New' THEN opd.total_cases ELSE 0 END) AS others_new_cases,
    -- AI Summary
    SUM(ai.total_ai_done) AS total_ai_done,
    SUM(ai.animals_covered) AS total_animals_covered,
    SUM(ai.animals_tested) AS total_animals_tested,
    SUM(ai.animals_positive) AS total_animals_positive,
    SUM(ai.male_calves) AS total_male_calves,
    SUM(ai.female_calves) AS total_female_calves,
    -- Vaccination Summary
    SUM(vac.doses_used) AS total_vaccine_doses_used,
    SUM(vac.animals_vaccinated) AS total_animals_vaccinated,
    -- Certificate Summary
    SUM(cert.total_issued) AS total_certificates_issued,
    -- Surgery Summary
    SUM(surg.total_procedures) AS total_surgeries,
    -- Diagnostic Summary
    SUM(diag.tests_conducted) AS total_diagnostic_tests,
    -- Financial Summary
    SUM(fin.total_fees) AS total_fees_collected,
    -- Institute count
    COUNT(DISTINCT mr.institute_id) AS institutes_reported,
    COUNT(DISTINCT i.tehsil_id) AS tehsils_reported,
    -- Approval status
    COUNT(CASE WHEN mr.submission_status = 'Approved' THEN 1 END) AS approved_reports,
    COUNT(CASE WHEN mr.submission_status = 'Submitted' THEN 1 END) AS submitted_reports
FROM monthly_reports mr
JOIN institutes i ON mr.institute_id = i.institute_id
JOIN districts d ON i.district_id = d.district_id
LEFT JOIN opd_report_details opd ON mr.report_id = opd.report_id
LEFT JOIN ai_report_details ai ON mr.report_id = ai.report_id
LEFT JOIN vaccination_report_details vac ON mr.report_id = vac.report_id
LEFT JOIN certificate_report_details cert ON mr.report_id = cert.report_id
LEFT JOIN surgery_report_details surg ON mr.report_id = surg.report_id
LEFT JOIN diagnostic_report_details diag ON mr.report_id = diag.report_id
LEFT JOIN financial_summaries fin ON mr.report_id = fin.report_id
GROUP BY i.district_id, d.district_name, mr.reporting_month, mr.start_date, mr.end_date;

CREATE INDEX idx_mv_district_month ON mv_district_monthly_summary(district_id, reporting_month);

-- ============================================================================
-- 2. SUMIFS EQUIVALENT FUNCTIONS
-- ============================================================================

-- Function to sum AI data across institutes for a specific period
-- Example: Get total HF AI done for an institute from 9 months ago
CREATE OR REPLACE FUNCTION sumif_ai_data(
    p_institute_id INTEGER,
    p_semen_code VARCHAR,
    p_start_date DATE,
    p_end_date DATE,
    p_field VARCHAR DEFAULT 'total_ai_done'
) RETURNS INTEGER AS $$
DECLARE
    result INTEGER;
BEGIN
    EXECUTE format(
        'SELECT COALESCE(SUM(ai.%I), 0)
         FROM ai_report_details ai
         JOIN monthly_reports mr ON ai.report_id = mr.report_id
         JOIN semen_types st ON ai.semen_type_id = st.semen_id
         WHERE mr.institute_id = $1
           AND st.semen_code = $2
           AND mr.start_date >= $3
           AND mr.end_date <= $4
           AND mr.submission_status = ''Approved''',
        p_field
    ) INTO result
    USING p_institute_id, p_semen_code, p_start_date, p_end_date;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to sum vaccination data
CREATE OR REPLACE FUNCTION sumif_vaccine_data(
    p_institute_id INTEGER,
    p_vaccine_code VARCHAR,
    p_start_date DATE,
    p_end_date DATE,
    p_field VARCHAR DEFAULT 'doses_used'
) RETURNS INTEGER AS $$
DECLARE
    result INTEGER;
BEGIN
    EXECUTE format(
        'SELECT COALESCE(SUM(vac.%I), 0)
         FROM vaccination_report_details vac
         JOIN monthly_reports mr ON vac.report_id = mr.report_id
         JOIN vaccines v ON vac.vaccine_id = v.vaccine_id
         WHERE mr.institute_id = $1
           AND v.vaccine_code = $2
           AND mr.start_date >= $3
           AND mr.end_date <= $4
           AND mr.submission_status = ''Approved''',
        p_field
    ) INTO result
    USING p_institute_id, p_vaccine_code, p_start_date, p_end_date;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to sum OPD cases
CREATE OR REPLACE FUNCTION sumif_opd_data(
    p_institute_id INTEGER,
    p_opd_type opd_case_type,
    p_case_category case_category,
    p_start_date DATE,
    p_end_date DATE
) RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(opd.total_cases), 0)
        FROM opd_report_details opd
        JOIN monthly_reports mr ON opd.report_id = mr.report_id
        WHERE mr.institute_id = p_institute_id
          AND opd.opd_type = p_opd_type
          AND opd.case_category = p_case_category
          AND mr.start_date >= p_start_date
          AND mr.end_date <= p_end_date
          AND mr.submission_status = 'Approved'
    );
END;
$$ LANGUAGE plpgsql;

-- Function for multi-institute aggregation (Tehsil/District level)
CREATE OR REPLACE FUNCTION sumif_hierarchical_ai(
    p_parent_institute_id INTEGER,
    p_semen_code VARCHAR,
    p_start_date DATE,
    p_end_date DATE,
    p_field VARCHAR DEFAULT 'total_ai_done'
) RETURNS INTEGER AS $$
DECLARE
    result INTEGER;
BEGIN
    EXECUTE format(
        'SELECT COALESCE(SUM(ai.%I), 0)
         FROM ai_report_details ai
         JOIN monthly_reports mr ON ai.report_id = mr.report_id
         JOIN institutes i ON mr.institute_id = i.institute_id
         JOIN semen_types st ON ai.semen_type_id = st.semen_id
         WHERE (i.parent_institute_id = $1 OR i.reporting_authority_id = $1)
           AND st.semen_code = $2
           AND mr.start_date >= $3
           AND mr.end_date <= $4
           AND mr.submission_status = ''Approved''',
        p_field
    ) INTO result
    USING p_parent_institute_id, p_semen_code, p_start_date, p_end_date;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. REPORT COMPILATION FUNCTIONS
-- ============================================================================

-- Compile Tehsil-level report from approved institute reports
CREATE OR REPLACE FUNCTION compile_tehsil_report(
    p_tehsil_id INTEGER,
    p_reporting_month VARCHAR
) RETURNS TABLE (
    metric_name VARCHAR,
    metric_value NUMERIC,
    unit VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        'Bovine New Cases'::VARCHAR AS metric_name,
        SUM(CASE WHEN opd.opd_type = 'Bovine' AND opd.case_category = 'New'
            THEN opd.total_cases ELSE 0 END)::NUMERIC AS metric_value,
        'cases'::VARCHAR AS unit
    FROM monthly_reports mr
    JOIN institutes i ON mr.institute_id = i.institute_id
    LEFT JOIN opd_report_details opd ON mr.report_id = opd.report_id
    WHERE i.tehsil_id = p_tehsil_id
      AND mr.reporting_month = p_reporting_month
      AND mr.submission_status = 'Approved'

    UNION ALL

    SELECT
        'Total AI Done'::VARCHAR,
        SUM(ai.total_ai_done)::NUMERIC,
        'procedures'::VARCHAR
    FROM monthly_reports mr
    JOIN institutes i ON mr.institute_id = i.institute_id
    LEFT JOIN ai_report_details ai ON mr.report_id = ai.report_id
    WHERE i.tehsil_id = p_tehsil_id
      AND mr.reporting_month = p_reporting_month
      AND mr.submission_status = 'Approved'

    UNION ALL

    SELECT
        'Total Vaccines Used'::VARCHAR,
        SUM(vac.doses_used)::NUMERIC,
        'doses'::VARCHAR
    FROM monthly_reports mr
    JOIN institutes i ON mr.institute_id = i.institute_id
    LEFT JOIN vaccination_report_details vac ON mr.report_id = vac.report_id
    WHERE i.tehsil_id = p_tehsil_id
      AND mr.reporting_month = p_reporting_month
      AND mr.submission_status = 'Approved';
END;
$$ LANGUAGE plpgsql;

-- Financial calculation with historical fee rates
CREATE OR REPLACE FUNCTION calculate_financial_summary(
    p_report_id INTEGER
) RETURNS TABLE (
    category VARCHAR,
    total_services INTEGER,
    total_fees NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    -- OPD Fees
    SELECT
        'OPD'::VARCHAR AS category,
        SUM(opd.total_cases)::INTEGER AS total_services,
        SUM(opd.total_cases * COALESCE(sc.current_rate, 0))::NUMERIC AS total_fees
    FROM opd_report_details opd
    LEFT JOIN service_charges sc ON opd.service_charge_id = sc.charge_id
    WHERE opd.report_id = p_report_id

    UNION ALL

    -- AI Fees
    SELECT
        'AI'::VARCHAR,
        SUM(ai.total_ai_done)::INTEGER,
        SUM(ai.total_ai_done * COALESCE(sc.current_rate, 0))::NUMERIC
    FROM ai_report_details ai
    LEFT JOIN service_charges sc ON ai.service_charge_id = sc.charge_id
    WHERE ai.report_id = p_report_id

    UNION ALL

    -- Vaccination Fees
    SELECT
        'Vaccination'::VARCHAR,
        SUM(vac.animals_vaccinated)::INTEGER,
        SUM(vac.animals_vaccinated * COALESCE(sc.current_rate, 0))::NUMERIC
    FROM vaccination_report_details vac
    JOIN vaccines v ON vac.vaccine_id = v.vaccine_id
    LEFT JOIN service_charges sc ON v.service_charge_id = sc.charge_id
    WHERE vac.report_id = p_report_id

    UNION ALL

    -- Certificate Fees
    SELECT
        'Certificate'::VARCHAR,
        SUM(cert.total_issued)::INTEGER,
        SUM(cert.total_issued * COALESCE(sc.current_rate, 0))::NUMERIC
    FROM certificate_report_details cert
    LEFT JOIN service_charges sc ON cert.service_charge_id = sc.charge_id
    WHERE cert.report_id = p_report_id

    UNION ALL

    -- Surgery Fees
    SELECT
        'Surgery'::VARCHAR,
        SUM(surg.total_procedures)::INTEGER,
        SUM(surg.total_procedures * COALESCE(sc.current_rate, 0))::NUMERIC
    FROM surgery_report_details surg
    LEFT JOIN service_charges sc ON surg.service_charge_id = sc.charge_id
    WHERE surg.report_id = p_report_id

    UNION ALL

    -- Diagnostic Fees
    SELECT
        'Diagnostic'::VARCHAR,
        SUM(diag.tests_conducted)::INTEGER,
        SUM(diag.tests_conducted * COALESCE(sc.current_rate, 0))::NUMERIC
    FROM diagnostic_report_details diag
    LEFT JOIN service_charges sc ON diag.service_charge_id = sc.charge_id
    WHERE diag.report_id = p_report_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. STOCK CALCULATION FUNCTIONS
-- ============================================================================

-- Update semen stock from transactions (trigger-based)
CREATE OR REPLACE FUNCTION update_semen_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stock for issuing institute (decrease)
    IF NEW.transaction_type = 'Issued' THEN
        INSERT INTO semen_stock (institute_id, semen_type_id, current_stock)
        VALUES (NEW.semen_bank_id, NEW.semen_type_id, -NEW.quantity)
        ON CONFLICT (institute_id, semen_type_id)
        DO UPDATE SET
            current_stock = semen_stock.current_stock - NEW.quantity,
            last_updated = CURRENT_TIMESTAMP;

    -- Update stock for receiving institute (increase)
    ELSIF NEW.transaction_type = 'Received' THEN
        INSERT INTO semen_stock (institute_id, semen_type_id, current_stock)
        VALUES (NEW.semen_bank_id, NEW.semen_type_id, NEW.quantity)
        ON CONFLICT (institute_id, semen_type_id)
        DO UPDATE SET
            current_stock = semen_stock.current_stock + NEW.quantity,
            last_updated = CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_semen_stock
    AFTER INSERT ON semen_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_semen_stock();

-- Update vaccine stock from transactions
CREATE OR REPLACE FUNCTION update_vaccine_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrease stock from issuing institute
    UPDATE vaccine_stock
    SET current_stock = current_stock - NEW.doses_issued,
        last_updated = CURRENT_TIMESTAMP
    WHERE institute_id = NEW.issuing_institute_id
      AND vaccine_id = NEW.vaccine_id;

    -- Increase stock for receiving institute
    INSERT INTO vaccine_stock (institute_id, vaccine_id, doses_received, current_stock)
    VALUES (NEW.receiving_institute_id, NEW.vaccine_id, NEW.doses_issued, NEW.doses_issued)
    ON CONFLICT (institute_id, vaccine_id)
    DO UPDATE SET
        doses_received = vaccine_stock.doses_received + NEW.doses_issued,
        current_stock = vaccine_stock.current_stock + NEW.doses_issued,
        last_updated = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_vaccine_stock
    AFTER INSERT ON vaccine_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_vaccine_stock();

-- ============================================================================
-- 5. REPORT APPROVAL WORKFLOW FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION approve_report_and_refresh_aggregates(
    p_report_id INTEGER,
    p_approved_by INTEGER,
    p_comment TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_reporting_month VARCHAR;
BEGIN
    -- Update report status
    UPDATE monthly_reports
    SET submission_status = 'Approved',
        verified_by = p_approved_by,
        verified_at = CURRENT_TIMESTAMP,
        admin_comment = COALESCE(p_comment, admin_comment)
    WHERE report_id = p_report_id
    RETURNING reporting_month INTO v_reporting_month;

    -- Calculate and insert financial summary
    INSERT INTO financial_summaries (report_id, category, total_services, total_fees)
    SELECT p_report_id, category, total_services, total_fees
    FROM calculate_financial_summary(p_report_id)
    ON CONFLICT (report_id, category)
    DO UPDATE SET
        total_services = EXCLUDED.total_services,
        total_fees = EXCLUDED.total_fees;

    -- Refresh materialized views (for performance)
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tehsil_monthly_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_district_monthly_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. DATE RANGE HELPER FUNCTIONS (EDATE equivalent)
-- ============================================================================

-- Get date N months before a given date
CREATE OR REPLACE FUNCTION months_ago(base_date DATE, months INTEGER)
RETURNS DATE AS $$
BEGIN
    RETURN base_date - (months || ' months')::INTERVAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get date N months after a given date
CREATE OR REPLACE FUNCTION months_later(base_date DATE, months INTEGER)
RETURNS DATE AS $$
BEGIN
    RETURN base_date + (months || ' months')::INTERVAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 7. COMPOSITE INDEX FOR COMPLEX QUERIES
-- ============================================================================

-- Composite indexes for SUMIFS-like queries
CREATE INDEX idx_ai_report_sumif ON ai_report_details(report_id, semen_type_id)
    INCLUDE (total_ai_done, animals_covered, animals_tested, animals_positive);

CREATE INDEX idx_vac_report_sumif ON vaccination_report_details(report_id, vaccine_id)
    INCLUDE (doses_used, animals_vaccinated);

CREATE INDEX idx_opd_report_sumif ON opd_report_details(report_id, opd_type, case_category)
    INCLUDE (total_cases, beneficiaries_covered);

CREATE INDEX idx_monthly_reports_sumif ON monthly_reports(institute_id, reporting_month, submission_status)
    INCLUDE (start_date, end_date);

-- ============================================================================
-- EXAMPLE USAGE COMMENTS
-- ============================================================================

/*
-- Example 1: SUMIFS equivalent for AI data (like your Excel formula)
-- Excel: =SUMIFS('Form responses'!BK2:BK, 'Form responses'!$C$2:$C, ">="&EDATE($E$28,-9))
SELECT sumif_ai_data(
    123,                          -- institute_id
    'HF',                         -- semen_code
    months_ago('2024-12-31', 9),  -- 9 months ago
    '2024-12-31',                 -- end date
    'total_ai_done'               -- field to sum
);

-- Example 2: Get tehsil-level aggregation for a specific month
SELECT * FROM compile_tehsil_report(5, '2024-12');

-- Example 3: Approve report and auto-calculate financials
SELECT approve_report_and_refresh_aggregates(456, 789, 'Approved by District Admin');

-- Example 4: Get hierarchical sum (all institutes under a tehsil)
SELECT sumif_hierarchical_ai(
    10,                           -- tehsil HQ institute_id
    'HF',                         -- semen_code
    '2024-01-01',                 -- start date
    '2024-12-31',                 -- end date
    'animals_covered'             -- field to sum
);

-- Example 5: Direct query on materialized view (very fast)
SELECT * FROM mv_district_monthly_summary
WHERE district_id = 3
  AND reporting_month BETWEEN '2024-01' AND '2024-12'
ORDER BY reporting_month;
*/
