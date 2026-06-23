-- Migration 005: Master-data fixup
--
-- 1. Fix vaccine codes so reportsService.js lookups work
-- 2. Ensure all 7 expected vaccine codes exist
-- 3. Add performance index on fee_changes_history
-- 4. Replace get_fee_summary with historical-rate-aware version

-- ============================================================================
-- 1. Fix vaccine codes (03-test-seed.sql used BRUC/THEI; service uses BRUCELLOSIS/THEILARIA)
-- ============================================================================
UPDATE vaccines SET vaccine_code = 'BRUCELLOSIS' WHERE vaccine_code = 'BRUC';
UPDATE vaccines SET vaccine_code = 'THEILARIA'   WHERE vaccine_code = 'THEI';

-- ============================================================================
-- 2. Ensure all 7 expected vaccine codes exist (idempotent)
-- ============================================================================
INSERT INTO vaccines (vaccine_code, vaccine_name, is_active)
VALUES
  ('HS',          'Haemorrhagic Septicaemia',  TRUE),
  ('FMD',         'Foot and Mouth Disease',    TRUE),
  ('BQ',          'Black Quarter',             TRUE),
  ('BRUCELLOSIS', 'Brucellosis',               TRUE),
  ('ETV',         'Ecto-theileriosis Vaccine', TRUE),
  ('THEILARIA',   'Theileriosis',              TRUE),
  ('RABIES',      'Rabies',                    TRUE)
ON CONFLICT (vaccine_code) DO NOTHING;

-- ============================================================================
-- 3. Performance index for historical rate lookups
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_fee_changes_charge_month
  ON fee_changes_history(charge_id, month);

-- ============================================================================
-- 4. Replace get_fee_summary with historical-rate-aware version
--
--    For a given reporting_month X, finds the earliest fee_changes_history entry
--    with month > X. Uses its old_rate (the rate that was in effect during X).
--    Falls back to current_rate if no history entry exists after X.
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
  -- Historical-rate-aware: for reporting_month X, use the old_rate from the
  -- earliest fee_changes_history entry with month > X (i.e. the rate before
  -- that change). Fall back to current_rate if no change has happened since X.
  fee_rates AS (
    SELECT
      sc.service_code,
      COALESCE(
        (SELECT fch.old_rate
         FROM   fee_changes_history fch
         WHERE  fch.charge_id = sc.charge_id
           AND  fch.month > p_reporting_month
         ORDER BY fch.month ASC
         LIMIT  1),
        sc.current_rate
      ) AS rate
    FROM service_charges sc
    WHERE sc.is_active = TRUE
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
      0 AS pd_count
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
    COALESCE(oa.large_opd, 0)     * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'OPD_LARGE'),   10)  AS opd_fee,
    COALESCE(oa.dogs_opd, 0)      * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'OPD_DOGS'),    50)  AS opd_dogs_fee,
    COALESCE(cpa.castrations, 0)  * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'CASTRATION'),  50)  AS cast_fee,
    COALESCE(cpa.pd_count, 0)     * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'PD'),          25)  AS pd_fee,
    COALESCE(la.lab_count, 0)     * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'LAB_FECAL'),   40)  AS lab_fee,
    COALESCE(ca.hc_count, 0)      * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'HC_LARGE'),   100)  AS hc_fee,
    COALESCE(ca.pm_count, 0)      * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'PM_LARGE'),   100)  AS pm_fee,
    (
      COALESCE(oa.large_opd, 0)     * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'OPD_LARGE'),   10)
      + COALESCE(oa.dogs_opd, 0)    * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'OPD_DOGS'),    50)
      + COALESCE(cpa.castrations, 0)* COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'CASTRATION'),  50)
      + COALESCE(cpa.pd_count, 0)   * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'PD'),          25)
      + COALESCE(la.lab_count, 0)   * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'LAB_FECAL'),   40)
      + COALESCE(ca.hc_count, 0)    * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'HC_LARGE'),   100)
      + COALESCE(ca.pm_count, 0)    * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'PM_LARGE'),   100)
    ) AS total_opd_fee,
    COALESCE(aa.cow_local_ai, 0)  * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_LOCAL'), 25) AS cow_ai_fee,
    COALESCE(aa.cow_ett_ai, 0)    * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_ETT'),   35) AS ett_ai_fee,
    COALESCE(aa.cow_imp_ai, 0)    * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_IMP'),   50) AS imp_ai_fee,
    COALESCE(aa.cow_sexed_ai, 0)  * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_SEXED'),200) AS sexed_ai_fee,
    (
      COALESCE(aa.cow_local_ai, 0) * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_LOCAL'), 25)
      + COALESCE(aa.cow_ett_ai, 0) * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_ETT'),   35)
      + COALESCE(aa.cow_imp_ai, 0) * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_IMP'),   50)
      + COALESCE(aa.cow_sexed_ai, 0)*COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_SEXED'),200)
    ) AS total_cow_ai,
    COALESCE(aa.buff_ai, 0)       * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_BUFFALO'),   25) AS buff_ai_fee,
    (
      COALESCE(aa.cow_local_ai, 0) * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_LOCAL'), 25)
      + COALESCE(aa.cow_ett_ai, 0) * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_ETT'),   35)
      + COALESCE(aa.cow_imp_ai, 0) * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_IMP'),   50)
      + COALESCE(aa.cow_sexed_ai, 0)*COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_SEXED'),200)
      + COALESCE(aa.buff_ai, 0)    * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_BUFFALO'),   25)
    ) AS total_ai_fee,
    (
      COALESCE(oa.large_opd, 0)     * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'OPD_LARGE'),   10)
      + COALESCE(oa.dogs_opd, 0)    * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'OPD_DOGS'),    50)
      + COALESCE(cpa.castrations, 0)* COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'CASTRATION'),  50)
      + COALESCE(cpa.pd_count, 0)   * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'PD'),          25)
      + COALESCE(la.lab_count, 0)   * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'LAB_FECAL'),   40)
      + COALESCE(ca.hc_count, 0)    * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'HC_LARGE'),   100)
      + COALESCE(ca.pm_count, 0)    * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'PM_LARGE'),   100)
      + COALESCE(aa.cow_local_ai, 0)* COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_LOCAL'), 25)
      + COALESCE(aa.cow_ett_ai, 0)  * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_ETT'),   35)
      + COALESCE(aa.cow_imp_ai, 0)  * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_IMP'),   50)
      + COALESCE(aa.cow_sexed_ai, 0)* COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_SEXED'),200)
      + COALESCE(aa.buff_ai, 0)     * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_BUFFALO'),   25)
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
-- Migration 006: Fix fee formula + correct Talwandi Sabo April 2026 activity data
--
-- 1. Add LAB_FECAL service charge at ₹50 (formula defaulted to ₹40 → 4 tests × 40 = 160 not 200)
-- 2. Fix get_fee_summary: OPD charges only 'New' cases, not 'Old' (both counted before)
-- 3. Overwrite all 28 Talwandi Sabo institutes' April 2026 detail records with exact Excel values

-- ============================================================================
-- 1. LAB_FECAL service charge
-- ============================================================================
INSERT INTO service_charges (service_code, service_name, category, current_rate, effective_from, financial_year)
VALUES ('LAB_FECAL', 'Laboratory/Diagnostic Tests', 'Diagnostic', 50.00, '2024-04-01', '2024-25')
ON CONFLICT (service_code) DO UPDATE SET current_rate = 50.00;

-- ============================================================================
-- 2. Fix get_fee_summary: case_category = 'New' (was != 'Camp', which included Old)
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
  fee_rates AS (
    SELECT
      sc.service_code,
      COALESCE(
        (SELECT fch.old_rate
         FROM   fee_changes_history fch
         WHERE  fch.charge_id = sc.charge_id
           AND  fch.month > p_reporting_month
         ORDER BY fch.month ASC
         LIMIT  1),
        sc.current_rate
      ) AS rate
    FROM service_charges sc
    WHERE sc.is_active = TRUE
  ),
  opd_agg AS (
    SELECT
      r.institute_id,
      SUM(CASE WHEN opd.opd_type IN ('Equine','Bovine','Others','Small') AND opd.case_category = 'New'
               THEN opd.total_cases ELSE 0 END) AS large_opd,
      SUM(CASE WHEN opd.opd_type = 'Dogs' AND opd.case_category = 'New'
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
      0 AS pd_count
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
    COALESCE(oa.large_opd, 0)     * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'OPD_LARGE'),   10)  AS opd_fee,
    COALESCE(oa.dogs_opd, 0)      * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'OPD_DOGS'),    50)  AS opd_dogs_fee,
    COALESCE(cpa.castrations, 0)  * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'CASTRATION'),  50)  AS cast_fee,
    COALESCE(cpa.pd_count, 0)     * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'PD'),          25)  AS pd_fee,
    COALESCE(la.lab_count, 0)     * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'LAB_FECAL'),   40)  AS lab_fee,
    COALESCE(ca.hc_count, 0)      * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'HC_LARGE'),   100)  AS hc_fee,
    COALESCE(ca.pm_count, 0)      * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'PM_LARGE'),   100)  AS pm_fee,
    (
      COALESCE(oa.large_opd, 0)     * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'OPD_LARGE'),   10)
      + COALESCE(oa.dogs_opd, 0)    * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'OPD_DOGS'),    50)
      + COALESCE(cpa.castrations, 0)* COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'CASTRATION'),  50)
      + COALESCE(cpa.pd_count, 0)   * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'PD'),          25)
      + COALESCE(la.lab_count, 0)   * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'LAB_FECAL'),   40)
      + COALESCE(ca.hc_count, 0)    * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'HC_LARGE'),   100)
      + COALESCE(ca.pm_count, 0)    * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'PM_LARGE'),   100)
    ) AS total_opd_fee,
    COALESCE(aa.cow_local_ai, 0)  * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_LOCAL'), 25) AS cow_ai_fee,
    COALESCE(aa.cow_ett_ai, 0)    * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_ETT'),   35) AS ett_ai_fee,
    COALESCE(aa.cow_imp_ai, 0)    * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_IMP'),   50) AS imp_ai_fee,
    COALESCE(aa.cow_sexed_ai, 0)  * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_SEXED'),200) AS sexed_ai_fee,
    (
      COALESCE(aa.cow_local_ai, 0) * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_LOCAL'), 25)
      + COALESCE(aa.cow_ett_ai, 0) * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_ETT'),   35)
      + COALESCE(aa.cow_imp_ai, 0) * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_IMP'),   50)
      + COALESCE(aa.cow_sexed_ai, 0)*COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_SEXED'),200)
    ) AS total_cow_ai,
    COALESCE(aa.buff_ai, 0)       * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_BUFFALO'),   25) AS buff_ai_fee,
    (
      COALESCE(aa.cow_local_ai, 0) * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_LOCAL'), 25)
      + COALESCE(aa.cow_ett_ai, 0) * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_ETT'),   35)
      + COALESCE(aa.cow_imp_ai, 0) * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_IMP'),   50)
      + COALESCE(aa.cow_sexed_ai, 0)*COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_SEXED'),200)
      + COALESCE(aa.buff_ai, 0)    * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_BUFFALO'),   25)
    ) AS total_ai_fee,
    (
      COALESCE(oa.large_opd, 0)     * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'OPD_LARGE'),   10)
      + COALESCE(oa.dogs_opd, 0)    * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'OPD_DOGS'),    50)
      + COALESCE(cpa.castrations, 0)* COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'CASTRATION'),  50)
      + COALESCE(cpa.pd_count, 0)   * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'PD'),          25)
      + COALESCE(la.lab_count, 0)   * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'LAB_FECAL'),   40)
      + COALESCE(ca.hc_count, 0)    * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'HC_LARGE'),   100)
      + COALESCE(ca.pm_count, 0)    * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'PM_LARGE'),   100)
      + COALESCE(aa.cow_local_ai, 0)* COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_LOCAL'), 25)
      + COALESCE(aa.cow_ett_ai, 0)  * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_ETT'),   35)
      + COALESCE(aa.cow_imp_ai, 0)  * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_IMP'),   50)
      + COALESCE(aa.cow_sexed_ai, 0)* COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_COW_SEXED'),200)
      + COALESCE(aa.buff_ai, 0)     * COALESCE((SELECT rate FROM fee_rates WHERE service_code = 'AI_BUFFALO'),   25)
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
-- 3. Correct April 2026 detail records for all 28 Talwandi Sabo institutes
--    Strategy: DELETE and re-INSERT opd/cert/diagnostic; zero-then-upsert AI.
--    Uses report_id looked up per institute — safe if a report doesn't exist (RETURN).
-- ============================================================================

-- helper macro used in every block:
-- v_rid = report_id for this institute's 2026-04 report

-- ── CVH Talwandi Sabo ────────────────────────────────────────────────────────
-- OPD: Eq/New=1, Bov/New=75, Oth/New=7, Dog/New=32
-- Cert: Health/Large=14
-- Diag: Fecal=2, Blood=2
-- AI: HF_LOCAL=15, SAHIWAL_LOCAL=15, HF_ETT=15, MURRAH=30, NILI_RAVI=30
-- Expected grand total: 6,805
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVH_TALWANDI_SABO' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Equine', 'New', 1),
    (v_rid, 'Bovine', 'New', 75),
    (v_rid, 'Others', 'New', 7),
    (v_rid, 'Dogs',   'New', 32);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  INSERT INTO certificate_report_details (report_id, certificate_type, animal_category, total_issued) VALUES
    (v_rid, 'Health', 'Large', 14);

  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;
  INSERT INTO diagnostic_report_details (report_id, diagnostic_type, tests_conducted) VALUES
    (v_rid, 'Fecal', 2),
    (v_rid, 'Blood', 2);

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'SAHIWAL_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'HF_ETT'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 30, 30, 0, 0, 0, 0, 30, 0, 0 FROM semen_types WHERE semen_code = 'MURRAH'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 30, animals_covered = 30;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 30, 30, 0, 0, 0, 0, 30, 0, 0 FROM semen_types WHERE semen_code = 'NILI_RAVI'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 30, animals_covered = 30;
END $M$;

-- ── CVD Teona Pujarian ────────────────────────────────────────────────────────
-- OPD: Bov/New=113, Oth/New=2
-- AI: HF_LOCAL=15, MURRAH=15
-- Expected: 1,900
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVD_TEONA_PUJARIAN' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 113),
    (v_rid, 'Others', 'New', 2);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'MURRAH'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;
END $M$;

-- ── CVD Jaga Ram Tirath ───────────────────────────────────────────────────────
-- OPD: Bov/New=33, Oth/New=1
-- AI: HF_LOCAL=15, SAHIWAL_LOCAL=15, NILI_RAVI=15
-- Expected: 1,465
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVD_JAGA_RAM_TIRATH' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 33),
    (v_rid, 'Others', 'New', 1);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'SAHIWAL_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'NILI_RAVI'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;
END $M$;

-- ── CVD Nangla ────────────────────────────────────────────────────────────────
-- OPD: Bov/New=64, Oth/New=1
-- AI: HF_LOCAL=30, SAHIWAL_LOCAL=15, MURRAH=15
-- Expected: 2,150
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVD_NANGLA' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 64),
    (v_rid, 'Others', 'New', 1);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 30, 30, 0, 0, 0, 0, 30, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 30, animals_covered = 30;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'SAHIWAL_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'MURRAH'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;
END $M$;

-- ── CVH Natheha ───────────────────────────────────────────────────────────────
-- OPD: Bov/New=103
-- AI: MURRAH=45
-- Expected: 2,155
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVH_NATHEHA' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 103);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 45, 45, 0, 0, 0, 0, 45, 0, 0 FROM semen_types WHERE semen_code = 'MURRAH'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 45, animals_covered = 45;
END $M$;

-- ── CVD Rayia ─────────────────────────────────────────────────────────────────
-- OPD: Bov/New=45
-- AI: HF_LOCAL=12, SAHIWAL_LOCAL=10, HF_ETT=6, MURRAH=8
-- Expected: 1,410
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVD_RAYIA' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 45);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 12, 12, 0, 0, 0, 0, 12, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 12, animals_covered = 12;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 10, 10, 0, 0, 0, 0, 10, 0, 0 FROM semen_types WHERE semen_code = 'SAHIWAL_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 10, animals_covered = 10;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 6, 6, 0, 0, 0, 0, 6, 0, 0 FROM semen_types WHERE semen_code = 'HF_ETT'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 6, animals_covered = 6;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 8, 8, 0, 0, 0, 0, 8, 0, 0 FROM semen_types WHERE semen_code = 'MURRAH'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 8, animals_covered = 8;
END $M$;

-- ── CVD Kalalwala ─────────────────────────────────────────────────────────────
-- OPD: Bov/New=61
-- AI: HF_LOCAL=9, SAHIWAL_LOCAL=15, MURRAH=4, NILI_RAVI=2
-- Expected: 1,360
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVD_KALALWALA' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 61);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 9, 9, 0, 0, 0, 0, 9, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 9, animals_covered = 9;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'SAHIWAL_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 4, 4, 0, 0, 0, 0, 4, 0, 0 FROM semen_types WHERE semen_code = 'MURRAH'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 4, animals_covered = 4;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 2, 2, 0, 0, 0, 0, 2, 0, 0 FROM semen_types WHERE semen_code = 'NILI_RAVI'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 2, animals_covered = 2;
END $M$;

-- ── CVD Chathewala ────────────────────────────────────────────────────────────
-- OPD: Bov/New=46
-- AI: SAHIWAL_LOCAL=15, MURRAH=7
-- Expected: 1,010
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVD_CHATHEWALA' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 46);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'SAHIWAL_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 7, 7, 0, 0, 0, 0, 7, 0, 0 FROM semen_types WHERE semen_code = 'MURRAH'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 7, animals_covered = 7;
END $M$;

-- ── CVH Raman Mandi ───────────────────────────────────────────────────────────
-- OPD: Bov/New=60
-- AI: HF_LOCAL=25, JERSEY_LOCAL=30, CB_LOCAL=45, HF_ETT=70, NILI_RAVI=90
-- Expected: 7,800
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVH_RAMAN_MANDI' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 60);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 25, 25, 0, 0, 0, 0, 25, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 25, animals_covered = 25;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 30, 30, 0, 0, 0, 0, 30, 0, 0 FROM semen_types WHERE semen_code = 'JERSEY_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 30, animals_covered = 30;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 45, 45, 0, 0, 0, 0, 45, 0, 0 FROM semen_types WHERE semen_code = 'CB_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 45, animals_covered = 45;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 70, 70, 0, 0, 0, 0, 70, 0, 0 FROM semen_types WHERE semen_code = 'HF_ETT'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 70, animals_covered = 70;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 90, 90, 0, 0, 0, 0, 90, 0, 0 FROM semen_types WHERE semen_code = 'NILI_RAVI'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 90, animals_covered = 90;
END $M$;

-- ── CVD Gatwali ───────────────────────────────────────────────────────────────
-- OPD: Bov/New=70, Oth/New=3
-- AI: HF_LOCAL=15, HF_ETT=15, MURRAH=5
-- Expected: 1,755
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVD_GATWALI' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 70),
    (v_rid, 'Others', 'New', 3);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'HF_ETT'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 5, 5, 0, 0, 0, 0, 5, 0, 0 FROM semen_types WHERE semen_code = 'MURRAH'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 5, animals_covered = 5;
END $M$;

-- ── CVD Sekhu ─────────────────────────────────────────────────────────────────
-- OPD: Bov/New=60
-- AI: HF_LOCAL=15, HF_ETT=15, MURRAH=30
-- Expected: 2,250
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVD_SEKHU' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 60);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'HF_ETT'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 30, 30, 0, 0, 0, 0, 30, 0, 0 FROM semen_types WHERE semen_code = 'MURRAH'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 30, animals_covered = 30;
END $M$;

-- ── CVH Behman Jassa Singh ────────────────────────────────────────────────────
-- OPD: Bov/New=150
-- AI: HF_LOCAL=20, NILI_RAVI=15
-- Expected: 2,375
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVH_BEHMAN_JASSA_SINGH' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 150);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 20, 20, 0, 0, 0, 0, 20, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 20, animals_covered = 20;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'NILI_RAVI'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;
END $M$;

-- ── CVH Bangi Deepa ───────────────────────────────────────────────────────────
-- OPD: Bov/New=122
-- Cert: PostMortem/Large=1
-- AI: HF_LOCAL=30, MURRAH=15, NILI_RAVI=15
-- Expected: 2,820
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVH_BANGI_DEEPA' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 122);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  INSERT INTO certificate_report_details (report_id, certificate_type, animal_category, total_issued) VALUES
    (v_rid, 'PostMortem', 'Large', 1);

  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 30, 30, 0, 0, 0, 0, 30, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 30, animals_covered = 30;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'MURRAH'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'NILI_RAVI'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;
END $M$;

-- ── CVH Pakka Kalan ───────────────────────────────────────────────────────────
-- OPD: Bov/New=165
-- Cert: Health/Large=20
-- AI: HF_LOCAL=15, MURRAH=45
-- Expected: 5,150
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVH_PAKKA_KALAN' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 165);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  INSERT INTO certificate_report_details (report_id, certificate_type, animal_category, total_issued) VALUES
    (v_rid, 'Health', 'Large', 20);

  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 45, 45, 0, 0, 0, 0, 45, 0, 0 FROM semen_types WHERE semen_code = 'MURRAH'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 45, animals_covered = 45;
END $M$;

-- ── CVD Phallar ───────────────────────────────────────────────────────────────
-- OPD: Bov/New=57, Oth/New=3
-- AI: HF_LOCAL=15, NILI_RAVI=30
-- Expected: 1,725
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVD_PHALLAR' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 57),
    (v_rid, 'Others', 'New', 3);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 30, 30, 0, 0, 0, 0, 30, 0, 0 FROM semen_types WHERE semen_code = 'NILI_RAVI'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 30, animals_covered = 30;
END $M$;

-- ── CVD Malwala ───────────────────────────────────────────────────────────────
-- OPD: Bov/New=50
-- AI: HF_LOCAL=15, SAHIWAL_LOCAL=15
-- Expected: 1,250
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVD_MALWALA' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 50);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'SAHIWAL_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;
END $M$;

-- ── CVH Shekhpura ─────────────────────────────────────────────────────────────
-- OPD: Bov/New=63
-- AI: HF_LOCAL=15, MURRAH=15, NILI_RAVI=15
-- Expected: 1,755
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVH_SHEKHPURA' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 63);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'MURRAH'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'NILI_RAVI'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;
END $M$;

-- ── CVH Singo ─────────────────────────────────────────────────────────────────
-- OPD: Bov/New=80
-- AI: SAHIWAL_LOCAL=10, HF_ETT=10, MURRAH=10
-- Expected: 1,650
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVH_SINGO' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 80);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 10, 10, 0, 0, 0, 0, 10, 0, 0 FROM semen_types WHERE semen_code = 'SAHIWAL_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 10, animals_covered = 10;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 10, 10, 0, 0, 0, 0, 10, 0, 0 FROM semen_types WHERE semen_code = 'HF_ETT'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 10, animals_covered = 10;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 10, 10, 0, 0, 0, 0, 10, 0, 0 FROM semen_types WHERE semen_code = 'MURRAH'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 10, animals_covered = 10;
END $M$;

-- ── CVH Bangi Kalan ───────────────────────────────────────────────────────────
-- OPD: Bov/New=115
-- AI: SAHIWAL_LOCAL=15, HF_ETT=15, MURRAH=15, NILI_RAVI=15
-- Expected: 2,800
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVH_BANGI_KALAN' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 115);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'SAHIWAL_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'HF_ETT'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'MURRAH'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'NILI_RAVI'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;
END $M$;

-- ── CVH Bhagiwander ───────────────────────────────────────────────────────────
-- OPD: Bov/New=102
-- AI: HF_LOCAL=15, SAHIWAL_LOCAL=15, MURRAH=30, NILI_RAVI=15
-- Expected: 2,895
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVH_BHAGIWANDER' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 102);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'SAHIWAL_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 30, 30, 0, 0, 0, 0, 30, 0, 0 FROM semen_types WHERE semen_code = 'MURRAH'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 30, animals_covered = 30;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'NILI_RAVI'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;
END $M$;

-- ── CVH Bhagwangarh ───────────────────────────────────────────────────────────
-- OPD: Bov/New=125
-- AI: HF_LOCAL=15, SAHIWAL_LOCAL=15, MURRAH=15, NILI_RAVI=15
-- Expected: 2,750
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVH_BHAGWANGARH' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 125);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'SAHIWAL_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'MURRAH'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'NILI_RAVI'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;
END $M$;

-- ── CVH Kanakwal ──────────────────────────────────────────────────────────────
-- OPD: Bov/New=117
-- AI: SAHIWAL_LOCAL=15, HF_ETT=30, MURRAH=15, NILI_RAVI=15
-- Expected: 3,345
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVH_KANAKWAL' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 117);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'SAHIWAL_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 30, 30, 0, 0, 0, 0, 30, 0, 0 FROM semen_types WHERE semen_code = 'HF_ETT'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 30, animals_covered = 30;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'MURRAH'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'NILI_RAVI'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;
END $M$;

-- ── CVH Malkana ───────────────────────────────────────────────────────────────
-- OPD: Bov/New=40  (no AI)
-- Expected: 400
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVH_MALKANA' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 40);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;
  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
END $M$;

-- ── CVH Laleana ───────────────────────────────────────────────────────────────
-- OPD: Bov/New=20  (no AI)
-- Expected: 200
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_CVH_LALEANA' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES
    (v_rid, 'Bovine', 'New', 20);

  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;
  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
END $M$;

-- ── PAW Kamalu ────────────────────────────────────────────────────────────────
-- No OPD; AI: HF_LOCAL=30
-- Expected: 750
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_PAW_KAMALU' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 30, 30, 0, 0, 0, 0, 30, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 30, animals_covered = 30;
END $M$;

-- ── PAW Gurthari ──────────────────────────────────────────────────────────────
-- No OPD; AI: HF_LOCAL=15, MURRAH=30
-- Expected: 1,125
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_PAW_GURTHARI' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 30, 30, 0, 0, 0, 0, 30, 0, 0 FROM semen_types WHERE semen_code = 'MURRAH'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 30, animals_covered = 30;
END $M$;

-- ── PAW Behman Kaur Singh ─────────────────────────────────────────────────────
-- No OPD; AI: HF_LOCAL=25, MURRAH=15
-- Expected: 1,000
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_PAW_BEHMAN_KAUR_SINGH' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 25, 25, 0, 0, 0, 0, 25, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 25, animals_covered = 25;

  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'MURRAH'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;
END $M$;

-- ── PAW Chak Heera Singh Wala ─────────────────────────────────────────────────
-- No OPD; AI: HF_LOCAL=15
-- Expected: 375
DO $M$ DECLARE
  v_rid INTEGER;
BEGIN
  SELECT mr.report_id INTO v_rid
  FROM monthly_reports mr JOIN institutes i ON mr.institute_id = i.institute_id
  WHERE i.org_id = 'TS_PAW_CHAK_HEERA_SINGH_WALA' AND mr.reporting_month = '2026-04';
  IF v_rid IS NULL THEN RETURN; END IF;

  DELETE FROM opd_report_details WHERE report_id = v_rid;
  DELETE FROM certificate_report_details WHERE report_id = v_rid;
  DELETE FROM diagnostic_report_details WHERE report_id = v_rid;

  UPDATE ai_report_details SET total_ai_done = 0, animals_covered = 0 WHERE report_id = v_rid;
  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)
  SELECT v_rid, semen_id, 15, 15, 0, 0, 0, 0, 15, 0, 0 FROM semen_types WHERE semen_code = 'HF_LOCAL'
  ON CONFLICT (report_id, semen_type_id) DO UPDATE SET total_ai_done = 15, animals_covered = 15;
END $M$;
