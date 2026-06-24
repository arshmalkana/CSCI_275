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
       OR  i.reporting_institute_id = p_institute_id
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
