-- ============================================================================
-- Migration 002: Align schema with Bathinda AH Punjab DB spreadsheet
-- Adds missing columns, views, and functions that mirror spreadsheet formulas
-- ============================================================================

-- 1. Add ladies_attended to extension_activities_details
--    Spreadsheet tracks "No. of Ladies attended" separately from farmers
ALTER TABLE extension_activities_details
  ADD COLUMN IF NOT EXISTS ladies_attended INTEGER DEFAULT 0;

-- 2. Add camp_subtype for Fertility Camps (PLDB / ASCAD / Other)
--    Spreadsheet tracks three distinct fertility camp programmes
ALTER TABLE extension_activities_details
  ADD COLUMN IF NOT EXISTS camp_subtype VARCHAR(20);
-- Allowed values: 'PLDB', 'ASCAD', 'Other', NULL (for non-camp activities)

-- ============================================================================
-- 3. VIEW: v_opd_progressive_totals
--    Mirrors the "Progressive Total" rows in the Reports sheet.
--    Cumulative sum from the start of the fiscal year (April) up to and
--    including each reporting_month, per institute / opd_type / case_category.
-- ============================================================================
CREATE OR REPLACE VIEW v_opd_progressive_totals AS
SELECT
  mr.institute_id,
  mr.reporting_month,
  opd.opd_type,
  opd.case_category,
  SUM(opd.total_cases) OVER (
    PARTITION BY
      mr.institute_id,
      opd.opd_type,
      opd.case_category,
      -- Fiscal year bucket: April of year X to March of year X+1
      CASE
        WHEN EXTRACT(MONTH FROM TO_DATE(mr.reporting_month, 'YYYY-MM')) >= 4
          THEN EXTRACT(YEAR  FROM TO_DATE(mr.reporting_month, 'YYYY-MM'))::INTEGER
        ELSE (EXTRACT(YEAR  FROM TO_DATE(mr.reporting_month, 'YYYY-MM')) - 1)::INTEGER
      END
    ORDER BY mr.reporting_month
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS progressive_total
FROM monthly_reports mr
JOIN opd_report_details opd ON opd.report_id = mr.report_id;

-- ============================================================================
-- 4. VIEW: v_vaccination_progressive_totals
--    Mirrors the "This Year" row in the Vaccination section of Reports sheet.
-- ============================================================================
CREATE OR REPLACE VIEW v_vaccination_progressive_totals AS
SELECT
  mr.institute_id,
  mr.reporting_month,
  vr.vaccine_id,
  SUM(vr.doses_received)   OVER w AS progressive_received,
  SUM(vr.doses_used)       OVER w AS progressive_used,
  SUM(vr.animals_vaccinated) OVER w AS progressive_vaccinated
FROM monthly_reports mr
JOIN vaccination_report_details vr ON vr.report_id = mr.report_id
WINDOW w AS (
  PARTITION BY
    mr.institute_id,
    vr.vaccine_id,
    CASE
      WHEN EXTRACT(MONTH FROM TO_DATE(mr.reporting_month, 'YYYY-MM')) >= 4
        THEN EXTRACT(YEAR  FROM TO_DATE(mr.reporting_month, 'YYYY-MM'))::INTEGER
      ELSE (EXTRACT(YEAR  FROM TO_DATE(mr.reporting_month, 'YYYY-MM')) - 1)::INTEGER
    END
  ORDER BY mr.reporting_month
  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
);

-- ============================================================================
-- 5. VIEW: v_ai_progressive_totals
--    Mirrors the "Progressive Total" rows in AI and PD sections.
-- ============================================================================
CREATE OR REPLACE VIEW v_ai_progressive_totals AS
SELECT
  mr.institute_id,
  mr.reporting_month,
  ai.semen_type_id,
  SUM(ai.total_ai_done)      OVER w AS progressive_ai_done,
  SUM(ai.animals_covered)    OVER w AS progressive_covered,
  SUM(ai.animals_tested)     OVER w AS progressive_tested,
  SUM(ai.animals_positive)   OVER w AS progressive_positive,
  SUM(ai.male_calves)        OVER w AS progressive_male_calves,
  SUM(ai.female_calves)      OVER w AS progressive_female_calves,
  SUM(ai.straws_received)    OVER w AS progressive_received,
  SUM(ai.straws_used_inaph)  OVER w AS progressive_used_inaph,
  SUM(ai.straws_issued_aiw)  OVER w AS progressive_issued_aiw
FROM monthly_reports mr
JOIN ai_report_details ai ON ai.report_id = mr.report_id
WINDOW w AS (
  PARTITION BY
    mr.institute_id,
    ai.semen_type_id,
    CASE
      WHEN EXTRACT(MONTH FROM TO_DATE(mr.reporting_month, 'YYYY-MM')) >= 4
        THEN EXTRACT(YEAR  FROM TO_DATE(mr.reporting_month, 'YYYY-MM'))::INTEGER
      ELSE (EXTRACT(YEAR  FROM TO_DATE(mr.reporting_month, 'YYYY-MM')) - 1)::INTEGER
    END
  ORDER BY mr.reporting_month
  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
);

-- ============================================================================
-- 6. FUNCTION: get_straw_balance(institute_id, reporting_month)
--    Mirrors the "Account of STRAW Record During Month" section (rows 39-51)
--    of the Reports sheet.
--
--    Rows reproduced:
--      last_year_balance   – running balance up to end of PREVIOUS fiscal year
--      last_month_balance  – running balance up to end of PREVIOUS month
--      received_this_month – straws_received in the target month
--      used_ai_this_month  – total_ai_done  in the target month
--      used_inaph_month    – straws_used_inaph in the target month
--      issued_aiw_month    – straws_issued_aiw  in the target month
--      received_this_year  – cumulative received in current fiscal year
--      used_ai_this_year   – cumulative AI done  in current fiscal year
--      used_inaph_year     – cumulative INAPH    in current fiscal year
--      issued_aiw_year     – cumulative AIW      in current fiscal year
--      balance_in_hand     – last_year_balance + received_this_year
--                            − used_ai_year − used_inaph_year − issued_aiw_year
-- ============================================================================
CREATE OR REPLACE FUNCTION get_straw_balance(
  p_institute_id   INTEGER,
  p_reporting_month VARCHAR(7)
)
RETURNS TABLE(
  semen_type_id        INTEGER,
  semen_code           VARCHAR,
  semen_name           VARCHAR,
  last_year_balance    BIGINT,
  last_month_balance   BIGINT,
  received_this_month  BIGINT,
  used_ai_this_month   BIGINT,
  used_inaph_month     BIGINT,
  issued_aiw_month     BIGINT,
  received_this_year   BIGINT,
  used_ai_this_year    BIGINT,
  used_inaph_year      BIGINT,
  issued_aiw_year      BIGINT,
  balance_in_hand      BIGINT
) AS $$
DECLARE
  v_year           INTEGER;
  v_month          INTEGER;
  v_fiscal_start   VARCHAR(7);   -- 'YYYY-04' for current fiscal year
  v_prev_month     VARCHAR(7);
  v_prev_fy_start  VARCHAR(7);   -- 'YYYY-04' for previous fiscal year
BEGIN
  v_year  := EXTRACT(YEAR  FROM TO_DATE(p_reporting_month, 'YYYY-MM'))::INTEGER;
  v_month := EXTRACT(MONTH FROM TO_DATE(p_reporting_month, 'YYYY-MM'))::INTEGER;

  -- Current fiscal year starts in April
  IF v_month >= 4 THEN
    v_fiscal_start  := v_year       || '-04';
    v_prev_fy_start := (v_year - 1) || '-04';
  ELSE
    v_fiscal_start  := (v_year - 1) || '-04';
    v_prev_fy_start := (v_year - 2) || '-04';
  END IF;

  -- Previous calendar month
  IF v_month = 1 THEN
    v_prev_month := (v_year - 1) || '-12';
  ELSE
    v_prev_month := v_year || '-' || LPAD((v_month - 1)::TEXT, 2, '0');
  END IF;

  RETURN QUERY
  SELECT
    st.semen_id::INTEGER,
    st.semen_code,
    st.semen_name,

    -- Last Year Balance: all received before this fiscal year minus all consumed
    COALESCE(SUM(CASE WHEN mr.reporting_month < v_fiscal_start
                       THEN air.straws_received  ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN mr.reporting_month < v_fiscal_start
                         THEN air.total_ai_done + air.straws_used_inaph + air.straws_issued_aiw
                         ELSE 0 END), 0)                           AS last_year_balance,

    -- Last Month Balance: all received up to prev month minus all consumed
    COALESCE(SUM(CASE WHEN mr.reporting_month <= v_prev_month
                       THEN air.straws_received  ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN mr.reporting_month <= v_prev_month
                         THEN air.total_ai_done + air.straws_used_inaph + air.straws_issued_aiw
                         ELSE 0 END), 0)                           AS last_month_balance,

    -- Received This Month
    COALESCE(SUM(CASE WHEN mr.reporting_month = p_reporting_month
                       THEN air.straws_received  ELSE 0 END), 0)  AS received_this_month,

    -- Used Local AI This Month
    COALESCE(SUM(CASE WHEN mr.reporting_month = p_reporting_month
                       THEN air.total_ai_done    ELSE 0 END), 0)  AS used_ai_this_month,

    -- Used INAPH This Month
    COALESCE(SUM(CASE WHEN mr.reporting_month = p_reporting_month
                       THEN air.straws_used_inaph ELSE 0 END), 0) AS used_inaph_month,

    -- Issued To AIW This Month
    COALESCE(SUM(CASE WHEN mr.reporting_month = p_reporting_month
                       THEN air.straws_issued_aiw ELSE 0 END), 0) AS issued_aiw_month,

    -- Received This Year (fiscal year to date)
    COALESCE(SUM(CASE WHEN mr.reporting_month >= v_fiscal_start
                           AND mr.reporting_month <= p_reporting_month
                       THEN air.straws_received  ELSE 0 END), 0)  AS received_this_year,

    -- Used AI This Year
    COALESCE(SUM(CASE WHEN mr.reporting_month >= v_fiscal_start
                           AND mr.reporting_month <= p_reporting_month
                       THEN air.total_ai_done    ELSE 0 END), 0)  AS used_ai_this_year,

    -- Used INAPH This Year
    COALESCE(SUM(CASE WHEN mr.reporting_month >= v_fiscal_start
                           AND mr.reporting_month <= p_reporting_month
                       THEN air.straws_used_inaph ELSE 0 END), 0) AS used_inaph_year,

    -- Issued AIW This Year
    COALESCE(SUM(CASE WHEN mr.reporting_month >= v_fiscal_start
                           AND mr.reporting_month <= p_reporting_month
                       THEN air.straws_issued_aiw ELSE 0 END), 0) AS issued_aiw_year,

    -- Balance In Hand = Last Year Balance + Received This Year - (Used AI + INAPH + AIW) This Year
    (
      COALESCE(SUM(CASE WHEN mr.reporting_month < v_fiscal_start
                         THEN air.straws_received ELSE 0 END), 0)
      - COALESCE(SUM(CASE WHEN mr.reporting_month < v_fiscal_start
                           THEN air.total_ai_done + air.straws_used_inaph + air.straws_issued_aiw
                           ELSE 0 END), 0)
      + COALESCE(SUM(CASE WHEN mr.reporting_month >= v_fiscal_start
                               AND mr.reporting_month <= p_reporting_month
                           THEN air.straws_received ELSE 0 END), 0)
      - COALESCE(SUM(CASE WHEN mr.reporting_month >= v_fiscal_start
                               AND mr.reporting_month <= p_reporting_month
                           THEN air.total_ai_done + air.straws_used_inaph + air.straws_issued_aiw
                           ELSE 0 END), 0)
    )                                                              AS balance_in_hand

  FROM semen_types st
  LEFT JOIN ai_report_details air ON air.semen_type_id = st.semen_id
  LEFT JOIN monthly_reports mr    ON air.report_id = mr.report_id
    AND mr.institute_id = p_institute_id
  WHERE st.is_active = TRUE
  GROUP BY st.semen_id, st.semen_code, st.semen_name
  ORDER BY st.semen_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. FUNCTION: get_fee_summary(institute_id, reporting_month)
--    Mirrors the "TOTAL FEE DEPOSITED" section (rows 58-75) of Reports sheet.
--    Uses fee rates from service_charges table.
--    Returns one row per institute (the reporting institute + its sub-institutes
--    that have reporting_authority_id = p_institute_id).
-- ============================================================================
CREATE OR REPLACE FUNCTION get_fee_summary(
  p_institute_id    INTEGER,
  p_reporting_month VARCHAR(7)
)
RETURNS TABLE(
  institute_id    INTEGER,
  institute_name  VARCHAR,
  opd_fee         NUMERIC,
  opd_dogs_fee    NUMERIC,
  cast_fee        NUMERIC,
  pd_fee          NUMERIC,
  lab_fee         NUMERIC,
  hc_fee          NUMERIC,
  pm_fee          NUMERIC,
  total_opd_fee   NUMERIC,
  cow_ai_fee      NUMERIC,
  ett_ai_fee      NUMERIC,
  imp_ai_fee      NUMERIC,
  sexed_ai_fee    NUMERIC,
  total_cow_ai    NUMERIC,
  buff_ai_fee     NUMERIC,
  total_ai_fee    NUMERIC,
  grand_total     NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH institutes_in_scope AS (
    -- The reporting institute itself plus any sub-institutes it oversees
    SELECT i.institute_id, i.institute_name
    FROM   institutes i
    WHERE  i.institute_id = p_institute_id
       OR  i.reporting_authority_id = p_institute_id
  ),
  report_ids AS (
    SELECT mr.report_id, mr.institute_id
    FROM   monthly_reports mr
    JOIN   institutes_in_scope iis ON mr.institute_id = iis.institute_id
    WHERE  mr.reporting_month = p_reporting_month
  ),
  -- Fee rates (latest active rates for this month)
  fee_rates AS (
    SELECT service_code, current_rate
    FROM   service_charges
    WHERE  is_active = TRUE
  ),
  opd_agg AS (
    SELECT
      r.institute_id,
      SUM(CASE WHEN opd.opd_type IN ('Equine','Bovine','Others','Small') AND opd.case_category != 'Camp'
               THEN opd.total_cases ELSE 0 END) AS large_opd,
      SUM(CASE WHEN opd.opd_type = 'Dogs' AND opd.case_category != 'Camp'
               THEN opd.total_cases ELSE 0 END) AS dogs_opd
    FROM report_ids r
    JOIN opd_report_details opd ON opd.report_id = r.report_id
    GROUP BY r.institute_id
  ),
  cert_agg AS (
    SELECT
      r.institute_id,
      SUM(CASE WHEN cert.certificate_type IN ('Health') THEN cert.total_issued ELSE 0 END) AS hc_count,
      SUM(CASE WHEN cert.certificate_type IN ('PostMortem','VetroLegal') THEN cert.total_issued ELSE 0 END) AS pm_count
    FROM report_ids r
    JOIN certificate_report_details cert ON cert.report_id = r.report_id
    GROUP BY r.institute_id
  ),
  cast_pd_agg AS (
    SELECT
      r.institute_id,
      SUM(CASE WHEN opd.opd_type IN ('Bovine','Others') AND opd.case_category = 'Camp'
               THEN opd.total_cases ELSE 0 END) AS castrations,
      0 AS pd_count  -- PD stored separately; placeholder
    FROM report_ids r
    JOIN opd_report_details opd ON opd.report_id = r.report_id
    GROUP BY r.institute_id
  ),
  lab_agg AS (
    SELECT
      r.institute_id,
      SUM(diag.tests_conducted) AS lab_count
    FROM report_ids r
    JOIN diagnostic_report_details diag ON diag.report_id = r.report_id
    GROUP BY r.institute_id
  ),
  ai_agg AS (
    SELECT
      r.institute_id,
      SUM(CASE WHEN st.species = 'Cattle' AND st.semen_category IN ('Local','Gir','Sahiwal')
               THEN ai.total_ai_done ELSE 0 END) AS cow_local_ai,
      SUM(CASE WHEN st.species = 'Cattle' AND st.semen_category = 'ETT'
               THEN ai.total_ai_done ELSE 0 END) AS cow_ett_ai,
      SUM(CASE WHEN st.species = 'Cattle' AND st.semen_category = 'Imported'
               THEN ai.total_ai_done ELSE 0 END) AS cow_imp_ai,
      SUM(CASE WHEN st.species = 'Cattle' AND st.semen_category = 'Sexed'
               THEN ai.total_ai_done ELSE 0 END) AS cow_sexed_ai,
      SUM(CASE WHEN st.species = 'Buffalo'
               THEN ai.total_ai_done ELSE 0 END) AS buff_ai
    FROM report_ids r
    JOIN ai_report_details ai ON ai.report_id = r.report_id
    JOIN semen_types st ON ai.semen_type_id = st.semen_id
    GROUP BY r.institute_id
  )
  SELECT
    iis.institute_id::INTEGER,
    iis.institute_name,
    -- OPD fee (large animals @ rate for OPD)
    COALESCE(oa.large_opd, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'OPD_LARGE'), 10) AS opd_fee,
    -- Dogs OPD fee
    COALESCE(oa.dogs_opd, 0)  * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'OPD_DOGS'),  50) AS opd_dogs_fee,
    -- Castration fee
    COALESCE(cpa.castrations, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'CASTRATION'), 50) AS cast_fee,
    -- PD fee (pregnancy diagnosis)
    COALESCE(cpa.pd_count, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'PD'), 25) AS pd_fee,
    -- Lab fee
    COALESCE(la.lab_count, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'LAB_FECAL'), 40) AS lab_fee,
    -- Health Certificate fee
    COALESCE(ca.hc_count, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'HC_LARGE'), 100) AS hc_fee,
    -- Post Mortem fee
    COALESCE(ca.pm_count, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'PM_LARGE'), 100) AS pm_fee,
    -- Total OPD-category fee
    (
      COALESCE(oa.large_opd, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'OPD_LARGE'), 10)
      + COALESCE(oa.dogs_opd, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'OPD_DOGS'),  50)
      + COALESCE(cpa.castrations, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'CASTRATION'), 50)
      + COALESCE(cpa.pd_count, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'PD'), 25)
      + COALESCE(la.lab_count, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'LAB_FECAL'), 40)
      + COALESCE(ca.hc_count, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'HC_LARGE'), 100)
      + COALESCE(ca.pm_count, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'PM_LARGE'), 100)
    ) AS total_opd_fee,
    -- Cow AI (local semen)
    COALESCE(aa.cow_local_ai, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'AI_COW_LOCAL'), 25) AS cow_ai_fee,
    -- ETT AI
    COALESCE(aa.cow_ett_ai, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'AI_COW_ETT'), 35) AS ett_ai_fee,
    -- Imported AI
    COALESCE(aa.cow_imp_ai, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'AI_COW_IMP'), 50) AS imp_ai_fee,
    -- Sexed AI
    COALESCE(aa.cow_sexed_ai, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'AI_COW_SEXED'), 200) AS sexed_ai_fee,
    -- Total Cow AI
    (
      COALESCE(aa.cow_local_ai, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'AI_COW_LOCAL'), 25)
      + COALESCE(aa.cow_ett_ai, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'AI_COW_ETT'), 35)
      + COALESCE(aa.cow_imp_ai, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'AI_COW_IMP'), 50)
      + COALESCE(aa.cow_sexed_ai, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'AI_COW_SEXED'), 200)
    ) AS total_cow_ai,
    -- Buffalo AI
    COALESCE(aa.buff_ai, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'AI_BUFFALO'), 25) AS buff_ai_fee,
    -- Total AI fee
    (
      COALESCE(aa.cow_local_ai, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'AI_COW_LOCAL'), 25)
      + COALESCE(aa.cow_ett_ai, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'AI_COW_ETT'), 35)
      + COALESCE(aa.cow_imp_ai, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'AI_COW_IMP'), 50)
      + COALESCE(aa.cow_sexed_ai, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'AI_COW_SEXED'), 200)
      + COALESCE(aa.buff_ai, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'AI_BUFFALO'), 25)
    ) AS total_ai_fee,
    -- Grand Total
    (
      COALESCE(oa.large_opd, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'OPD_LARGE'), 10)
      + COALESCE(oa.dogs_opd, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'OPD_DOGS'),  50)
      + COALESCE(cpa.castrations, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'CASTRATION'), 50)
      + COALESCE(cpa.pd_count, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'PD'), 25)
      + COALESCE(la.lab_count, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'LAB_FECAL'), 40)
      + COALESCE(ca.hc_count, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'HC_LARGE'), 100)
      + COALESCE(ca.pm_count, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'PM_LARGE'), 100)
      + COALESCE(aa.cow_local_ai, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'AI_COW_LOCAL'), 25)
      + COALESCE(aa.cow_ett_ai, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'AI_COW_ETT'), 35)
      + COALESCE(aa.cow_imp_ai, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'AI_COW_IMP'), 50)
      + COALESCE(aa.cow_sexed_ai, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'AI_COW_SEXED'), 200)
      + COALESCE(aa.buff_ai, 0) * COALESCE((SELECT current_rate FROM fee_rates WHERE service_code = 'AI_BUFFALO'), 25)
    ) AS grand_total

  FROM institutes_in_scope iis
  LEFT JOIN opd_agg    oa  ON oa.institute_id  = iis.institute_id
  LEFT JOIN cert_agg   ca  ON ca.institute_id  = iis.institute_id
  LEFT JOIN cast_pd_agg cpa ON cpa.institute_id = iis.institute_id
  LEFT JOIN lab_agg    la  ON la.institute_id  = iis.institute_id
  LEFT JOIN ai_agg     aa  ON aa.institute_id  = iis.institute_id
  ORDER BY iis.institute_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. Ensure service_charges has the standard fee codes used by get_fee_summary
--    (seed only if not already present; safe to run multiple times)
-- ============================================================================
INSERT INTO service_charges (service_code, service_name, category, current_rate, effective_from, is_active)
VALUES
  ('OPD_LARGE',   'OPD Fee (Large Animals)',          'OPD',        10,   '2021-04-01', TRUE),
  ('OPD_DOGS',    'OPD Fee (Dogs/Small Animals)',      'OPD',        50,   '2021-04-01', TRUE),
  ('CASTRATION',  'Castration Fee',                    'OPD',        50,   '2021-04-01', TRUE),
  ('PD',          'Pregnancy Diagnosis Fee',           'AI',         25,   '2021-04-01', TRUE),
  ('HC_SMALL',    'Health Certificate (Small)',        'Certificate', 50,  '2021-04-01', TRUE),
  ('HC_LARGE',    'Health Certificate (Large)',        'Certificate', 100, '2021-04-01', TRUE),
  ('PM_SMALL',    'Post Mortem (Small Animals)',       'Certificate', 20,  '2021-04-01', TRUE),
  ('PM_LARGE',    'Post Mortem (Large Animals)',       'Certificate', 100, '2021-04-01', TRUE),
  ('PM_VETRO',    'Post Mortem (Vetro Legal)',         'Certificate', 200, '2021-04-01', TRUE),
  ('AI_COW_LOCAL','AI Cow Fee (Local Semen)',          'AI',         25,   '2021-04-01', TRUE),
  ('AI_COW_ETT',  'AI Cow Fee (ETT Semen)',            'AI',         35,   '2021-04-01', TRUE),
  ('AI_COW_IMP',  'AI Cow Fee (Imported Semen)',       'AI',         50,   '2021-04-01', TRUE),
  ('AI_COW_SEXED','AI Cow Fee (Sexed Semen)',          'AI',         200,  '2021-04-01', TRUE),
  ('AI_BUFFALO',  'AI Buffalo Fee',                    'AI',         25,   '2021-04-01', TRUE),
  ('LAB_FECAL',   'Faecal Test Fee',                   'Diagnostic', 40,  '2021-04-01', TRUE),
  ('LAB_BLOOD',   'Blood Test Fee',                    'Diagnostic', 40,  '2021-04-01', TRUE),
  ('LAB_URINE',   'Urine Test Fee',                    'Diagnostic', 2,   '2021-04-01', TRUE),
  ('LAB_MILK',    'Milk Test Fee',                     'Diagnostic', 2,   '2021-04-01', TRUE),
  ('VAC_HS',      'HS Vaccine Fee',                    'Vaccination', 5,  '2021-04-01', TRUE),
  ('VAC_RABIES',  'Rabies Vaccine Fee',                'Vaccination', 10, '2021-04-01', TRUE)
ON CONFLICT (service_code) DO NOTHING;
