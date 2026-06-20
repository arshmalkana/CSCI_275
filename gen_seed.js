const XLSX = require('xlsx');
const fs = require('fs');
const wb = XLSX.readFile('Talwandi Sabo Ah Punjab DB.xlsx');
const ws = wb.Sheets['Form responses'];
const rawData = XLSX.utils.sheet_to_json(ws, { defval: 0 });

const toDateStr = (n) => {
  if (!n || typeof n !== 'number' || n < 1) return null;
  const d = XLSX.SSF.parse_date_code(n);
  return d.y + '-' + String(d.m).padStart(2,'0') + '-' + String(d.d).padStart(2,'0');
};
const toMonthStr = (n) => {
  if (!n || typeof n !== 'number' || n < 1) return null;
  const d = XLSX.SSF.parse_date_code(n);
  return d.y + '-' + String(d.m).padStart(2,'0');
};
const esc = (s) => s ? String(s).replace(/'/g, "''") : '';
const v = (x) => Number(x) || 0;
const q = (s) => s === null ? 'NULL' : `'${esc(String(s))}'`;

const valid = rawData.filter(r => r['Institute Name'] && r['Start Date of reporting Month'] > 1);
const latestByKey = {};
valid.forEach(r => {
  const key = r['Institute Name'] + '|' + toMonthStr(r['Start Date of reporting Month']);
  if (!latestByKey[key] || r['Timestamp'] > latestByKey[key]['Timestamp']) {
    latestByKey[key] = r;
  }
});
const records = Object.values(latestByKey);
const institutes = [...new Set(records.map(r => r['Institute Name']))];

// Institute type from name prefix
const getType = (name) => name.startsWith('CVH') ? 'CVH' : name.startsWith('CVD') ? 'CVD' : 'PAW';
// org_id: uppercase, alphanumeric+underscore
const getOrgId = (name) => 'TS_' + name.replace(/[^A-Za-z0-9]/g, '_').toUpperCase().replace(/_+/g, '_').replace(/_$/, '');
// user_id: lowercase login name
const getUserId = (name) => 'ts_' + name.replace(/[^A-Za-z0-9]/g, '_').toLowerCase().replace(/_+/g, '_').replace(/_$/, '');
// village name by stripping prefix
const getVillage = (name) => name.replace(/^(CVH|CVD|PAW)\s+/, '');
// designation must match designation_type enum
const getDesignation = (type) => type === 'PAW' ? 'Private AI Worker' : 'Veterinary Officer';
// user_role must match user_role enum
const getUserRole = (type) => type === 'PAW' ? 'AIW' : 'INAPH';
// default password (plain text — authService.verifyPassword currently uses plain text comparison)
const DEFAULT_PASSWORD = 'Talwandi@2025';

const SEMEN_MAP = [
  { ai: 'AI HF Straws', cov: 'Cover HF Straws', rec: 'HF Straws Received This Month', aiw: 'HF Straws Issued to AIW This Month', inaph: null, tested: 'HF Tested', pos: 'HF Found Postive', maleC: 'HF Male Calves', femC: 'HF female Calves', code: 'HF_LOCAL' },
  { ai: 'AI Jersey Straws', cov: 'Cover Jersey Straws', rec: 'Jesey Straws Received This Month', aiw: 'Jersey Straws Issued To AIW This Month', inaph: 'Jesey Straws Used INAPH during month', tested: 'Jersey Tested', pos: 'Jersey Found Postive', maleC: 'Jersey Male Calves', femC: 'Jersey female Calves', code: 'JERSEY_LOCAL' },
  { ai: 'AI Cross Breed Straws', cov: 'Cover Cross Breed Straws', rec: 'Cross Breed Straws Received This Month', aiw: 'Cross Breed Straws Issued to AIW during Month', inaph: null, tested: 'Cross Breed Tested', pos: 'Cross Breed Found Postive', maleC: 'Cross Breed Male Calves', femC: 'Cross Breed female Calves', code: 'CB_LOCAL' },
  { ai: 'AI Sahiwal Straws', cov: 'Cover Sahiwal Straws', rec: 'Sahiwal Straws Received This Month', aiw: 'Sahiwal Straws Issued to AIW during Month', inaph: 'Sahiwal Straws Used INAPH during month', tested: 'Sahiwal Cow Tested', pos: 'Sahiwal Found Postive', maleC: 'Sahiwal Male Calves', femC: 'Sahiwal female Calves', code: 'SAHIWAL_LOCAL' },
  { ai: 'AI HF ETT Straws', cov: 'Cover HF ETT Straws', rec: 'HF ETT Straws Received This Month', aiw: 'HF ETT Straws Issued to AIW during Month', inaph: 'HF ETT Straws Used INAPH during month', tested: 'HF ETT Tested', pos: 'HF ETT Found Postive', maleC: 'HF ETT Male Calves', femC: 'HF ETT female Calves', code: 'HF_ETT' },
  { ai: 'AI Jersey ETT Straws', cov: 'Cover Jersey ETT Straws', rec: 'Jersey ETT Straws Received This Month', aiw: 'Jersey ETT Straws Issued to AIW during Month', inaph: 'Jersey ETT Straws Used INAPH This month', tested: 'Jessey ETT Tested', pos: 'Jessey ETT Found Postive', maleC: 'Jersey ETT Male Calves', femC: 'Jersey ETT female Calves', code: 'JERSEY_ETT' },
  { ai: 'AI Sexed HF Straws', cov: 'Cover Sexed HF Straws', rec: 'Sexed HF Straws Received This Month', aiw: 'Sexed HF Straws Issued to AIW during Month', inaph: 'HF Sexed Straws Used INAPH during month', tested: 'Sexed HF Tested', pos: 'Sexed HF Found Postive', maleC: 'Sexed HF Male Calves', femC: 'Sexed HF female Calves', code: 'HF_SEXED' },
  { ai: 'AI Jersey Sexed Straws', cov: 'Cow Cover Jersey Sexed', rec: 'Jersey Sexed Straws Received This Month', aiw: 'Jersey Sexed Straws Issued to AIW This Month', inaph: 'Jersey Sexed Straws Used INAPH during month', tested: 'Jersey Sexed Tested', pos: 'Jersey Sexed Found Positive', maleC: 'Jersey Sexed Male Calves', femC: 'Jersey Sexed female Calves', code: 'JERSEY_SEXED' },
  { ai: 'AI Cross Breed Sexed Straws', cov: 'Cover Cross Breed Sexed', rec: 'CB Sexed Straws Received This Month', aiw: 'CB Sexed Straws Issued to AIW This Month', inaph: 'CB Sexed Straws Used INAPH during month', tested: 'CB Sexed Tested', pos: 'CB Sexed Found Positive', maleC: 'CB Sexed Male Calves', femC: 'CB Sexed female Calves', code: 'CB_SEXED' },
  { ai: 'AI Sahiwal Sexed Straws', cov: 'Cow Cover Sahiwal Sexed', rec: 'Sahiwal Sexed Straws Received This Month', aiw: 'Sahiwal Sexed Straws Issued to AIW This Month', inaph: 'Sahiwal Sexed Straws Used INAPH during month', tested: 'sahiwal Sexed Tested', pos: 'sahiwal Sexed found positive', maleC: 'Sahiwal Sexed Male Calves', femC: 'Sahiwal Sexed female Calves', code: 'SAHIWAL_SEXED' },
  { ai: 'AI Done With Murrah Straws', cov: 'Cover Murrah Straws', rec: 'Murrah Recieved This Month', aiw: 'Murrah Straws Issued to AIW during Month', inaph: 'Murrah Straws Used INAPH This month', tested: 'Murrah Tested', pos: 'Murrah Found Postive', maleC: 'Murrah Male Calves', femC: 'Murrah Female Calves', code: 'MURRAH' },
  { ai: 'AI Nili-Ravi Straws', cov: 'Cover Nili-Ravi Straws', rec: 'Nili Ravi Straws Received This Month', aiw: 'Nili Ravi Straws Issued to AIW during Month', inaph: 'Nili Ravi Straws Used INAPH This month', tested: 'Nili Ravi Tested', pos: 'Nili Found Postive', maleC: 'Nili Ravi Male Calves', femC: 'Nili Ravi Female Calves', code: 'NILI_RAVI' },
  { ai: 'AI Sexed MU Straws', cov: 'Cover Sexed MU Straws', rec: 'MU Sexed Straws Received This Month', aiw: 'Sexed MU Straws Issued to AIW during Month', inaph: 'MU Sexed Straws Used INAPH during month', tested: 'Sexed MU Tested', pos: 'Sexed MU Found Postive', maleC: 'Sexed MU Male Calves', femC: 'Sexed MU female Calves', code: 'MURRAH_SEXED' },
  { ai: 'AI Nili-Ravi Sexed Straws', cov: 'Buffalo Cover Nili-Ravi Sexed', rec: 'Nilli-Ravi Sexed Straws Received This Month', aiw: 'Nilli-Ravi Sexed Straws Issued to AIW This Month', inaph: 'Nili Ravi Sexed INAPH during', tested: 'Nilli-ravi Sexed  tested', pos: 'Nilli-ravi Sexed  found Positive', maleC: 'Nilli-Ravi Sexed Male Calves', femC: 'Nilli-Ravi Sexed female Calves', code: 'NILI_RAVI_SEXED' },
];

const VAC_MAP = [
  { rcv: 'H.S. Vaccine Doses Received ', used: 'H.S. Vaccine Doses Used', vac: 'H.S. Vaccine Animal Vaccinated ', code: 'HS' },
  { rcv: 'FMD. Vaccine Doses Received ', used: 'FMD. Vaccine Doses Used', vac: 'FMD. Vaccine Animal Vaccinated ', code: 'FMD' },
  { rcv: 'Black Quarter Doses Received ', used: 'Black Quarter Doses Used', vac: 'Black Quarter Animal Vaccinated ', code: 'BQ' },
  { rcv: 'Brucellosis Vaccine Doses Received ', used: 'Brucellosis Vaccine Doses Used', vac: 'Brucellosis Vaccine Animal Vaccinated ', code: 'BRUC' },
  { rcv: 'Entero Toximia Vaccine Doses Received ', used: 'Entero Toximia Vaccine Doses Used', vac: 'Entero Toximia Vaccine Animals Vaccinated', code: 'ETV' },
  { rcv: 'Swine Fever Vaccine Doses Received ', used: 'Swine Fever Vaccine Doses Used', vac: 'Swine Fever Vaccine Animal Vaccinated', code: 'SWINE_FEVER' },
  { rcv: 'Goat Pox Vaccine Doses Received ', used: 'Goat Pox Vaccine Doses Used', vac: 'Goat Pox Vaccine Animal Vaccinated ', code: 'GOAT_POX' },
  { rcv: 'PPR Doses Received', used: 'PPR Doses Used', vac: 'PPR Animal Cover', code: 'PPR' },
  { rcv: 'Rabies Doses Received', used: 'Rabies Doses Used', vac: 'Rabies animal vaccinated', code: 'RABIES' },
];

const lines = [];
lines.push('-- ============================================================================');
lines.push('-- 07-seed-talwandi-sabo.sql');
lines.push('-- Real data from Talwandi Sabo Ah Punjab DB.xlsx (form responses)');
lines.push('-- ' + records.length + ' monthly reports across ' + institutes.length + ' institutes');
lines.push('-- Date range: 2025-03 to 2026-04');
lines.push('-- Default login password for all seeded users: ' + DEFAULT_PASSWORD);
lines.push('-- ============================================================================');
lines.push('');

// ── 1. Institutes ────────────────────────────────────────────────────────────
lines.push('-- 1. INSTITUTES (Talwandi Sabo, Bathinda)');
lines.push('');
institutes.forEach(name => {
  const orgId = getOrgId(name);
  const iType = getType(name);
  const village = getVillage(name);
  lines.push('INSERT INTO institutes (org_id, institute_name, institute_type, village_id, tehsil_id, district_id, is_active)');
  lines.push('SELECT ' + q(orgId) + ', ' + q(name) + ', ' + q(iType) + ',');
  lines.push('  (SELECT village_id FROM villages WHERE village_name = ' + q(village) + ' AND district_id = (SELECT district_id FROM districts WHERE district_name = \'Bathinda\') LIMIT 1),');
  lines.push('  (SELECT tehsil_id FROM tehsils WHERE tehsil_name = \'Talwandi Sabo\' AND district_id = (SELECT district_id FROM districts WHERE district_name = \'Bathinda\')),');
  lines.push('  (SELECT district_id FROM districts WHERE district_name = \'Bathinda\'), TRUE');
  lines.push('WHERE NOT EXISTS (SELECT 1 FROM institutes WHERE org_id = ' + q(orgId) + ');');
  lines.push('');
});

// ── 2. Staff (one per institute — directly in staff table, no separate users table) ──
lines.push('-- 2. STAFF USERS (user_id = login username, password_hash = plain text for now)');
lines.push('');
institutes.forEach(name => {
  const orgId = getOrgId(name);
  const userId = getUserId(name);
  const iType = getType(name);
  const desig = getDesignation(iType);
  const role = getUserRole(iType);
  const fullName = 'Staff - ' + name;
  lines.push('INSERT INTO staff (user_id, full_name, designation, password_hash, user_role, current_institute_id, is_first_time, is_active)');
  lines.push('SELECT ' + q(userId) + ', ' + q(fullName) + ', ' + q(desig) + ', ' + q(DEFAULT_PASSWORD) + ', ' + q(role) + ',');
  lines.push('  (SELECT institute_id FROM institutes WHERE org_id = ' + q(orgId) + ' LIMIT 1), FALSE, TRUE');
  lines.push('WHERE NOT EXISTS (SELECT 1 FROM staff WHERE user_id = ' + q(userId) + ');');
  lines.push('');
});

// ── 3. Monthly Reports ───────────────────────────────────────────────────────
lines.push('-- 3. MONTHLY REPORTS');
lines.push('');
records.forEach((r, idx) => {
  const instName = r['Institute Name'];
  const orgId = getOrgId(instName);
  const userId = getUserId(instName);
  const startDate = toDateStr(r['Start Date of reporting Month']);
  const endDate = toDateStr(r['End Date of reporting Month']);
  const month = toMonthStr(r['Start Date of reporting Month']);
  if (!startDate || !endDate || !month) return;
  const receiptNum = v(r['reciept number']);
  const receiptSql = receiptNum > 0 ? q(String(receiptNum)) : 'NULL';

  lines.push('-- ' + (idx+1) + ': ' + instName + ' / ' + month);
  lines.push('DO $BODY$ DECLARE');
  lines.push('  v_inst_id INTEGER := (SELECT institute_id FROM institutes WHERE org_id = ' + q(orgId) + ' LIMIT 1);');
  lines.push('  v_staff_id INTEGER := (SELECT staff_id FROM staff WHERE user_id = ' + q(userId) + ' LIMIT 1);');
  lines.push('  v_report_id INTEGER;');
  lines.push('BEGIN');
  lines.push('  IF v_inst_id IS NULL OR v_staff_id IS NULL THEN RETURN; END IF;');
  lines.push('  IF EXISTS (SELECT 1 FROM monthly_reports WHERE institute_id = v_inst_id AND reporting_month = ' + q(month) + ') THEN RETURN; END IF;');
  lines.push('  INSERT INTO monthly_reports (institute_id, reporting_month, start_date, end_date, receipt_number, submission_status, submitted_at, prepared_by)');
  lines.push('  VALUES (v_inst_id, ' + q(month) + ', ' + q(startDate) + ', ' + q(endDate) + ', ' + receiptSql + ', \'Submitted\', NOW(), v_staff_id)');
  lines.push('  RETURNING report_id INTO v_report_id;');
  lines.push('');

  // OPD — only valid opd_case_type enum values: Equine, Bovine, Others, Dogs
  // case_category: New, Old, Camp
  const opdData = [
    ['Equine', v(r['New Case Equine']), v(r['Old Case Equine'])],
    ['Bovine', v(r['New Case Bovine']), v(r['Old Case Bovine'])],
    ['Others', v(r['New Case Other']), v(r['Old Case Other'])],
    ['Dogs',   v(r['New Case Dogs']),  v(r['Old Case Dogs'])],
  ];
  opdData.forEach(([type, nc, oc]) => {
    if (nc > 0) lines.push('  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES (v_report_id, \'' + type + '\', \'New\', ' + nc + ') ON CONFLICT DO NOTHING;');
    if (oc > 0) lines.push('  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES (v_report_id, \'' + type + '\', \'Old\', ' + oc + ') ON CONFLICT DO NOTHING;');
  });

  // Camp cases → Bovine Camp
  const camp = v(r['Case Treated In Camp']);
  if (camp > 0) lines.push('  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES (v_report_id, \'Bovine\', \'Camp\', ' + camp + ') ON CONFLICT (report_id, opd_type, case_category) DO UPDATE SET total_cases = opd_report_details.total_cases + ' + camp + ';');

  // Gaushala cases → add to Bovine New (Gaushala is govt cattle shelter, still Bovine OPD)
  const gsh = v(r['Gaushala Cases']);
  if (gsh > 0) lines.push('  INSERT INTO opd_report_details (report_id, opd_type, case_category, total_cases) VALUES (v_report_id, \'Bovine\', \'New\', ' + gsh + ') ON CONFLICT (report_id, opd_type, case_category) DO UPDATE SET total_cases = opd_report_details.total_cases + ' + gsh + ';');

  // Castrations → surgery_report_details
  const bovCast = v(r['Bovine Castrations']);
  const othCast = v(r['Other Castrations']);
  if (bovCast > 0) lines.push('  INSERT INTO surgery_report_details (report_id, procedure_type, animal_type, total_procedures) VALUES (v_report_id, \'Castration\', \'Bovine\', ' + bovCast + ');');
  if (othCast > 0) lines.push('  INSERT INTO surgery_report_details (report_id, procedure_type, animal_type, total_procedures) VALUES (v_report_id, \'Castration\', \'Others\', ' + othCast + ');');

  // PD → surgery_report_details
  const pd = v(r['No. of Pregnancy Diagnosis (Paid)']);
  if (pd > 0) lines.push('  INSERT INTO surgery_report_details (report_id, procedure_type, animal_type, total_procedures) VALUES (v_report_id, \'Pregnancy Diagnosis\', \'Cattle\', ' + pd + ');');

  // Certificates — column is animal_category (not species_category)
  // certificate_type enum: Health, PostMortem, VetroLegal, Export
  const hcSm = v(r['A.H. Certificate Small Animals']), hcLg = v(r['A.H. Certificate Large Animals']);
  const pmSm = v(r['Post Mortem Small Animals']), pmLg = v(r['Post Mortem Large Animals']);
  const pmVL = v(r['Post Mortem Vetro Legal']);
  if (hcSm > 0) lines.push('  INSERT INTO certificate_report_details (report_id, certificate_type, animal_category, total_issued) VALUES (v_report_id, \'Health\', \'Small\', ' + hcSm + ');');
  if (hcLg > 0) lines.push('  INSERT INTO certificate_report_details (report_id, certificate_type, animal_category, total_issued) VALUES (v_report_id, \'Health\', \'Large\', ' + hcLg + ');');
  if (pmSm > 0) lines.push('  INSERT INTO certificate_report_details (report_id, certificate_type, animal_category, total_issued) VALUES (v_report_id, \'PostMortem\', \'Small\', ' + pmSm + ');');
  if (pmLg > 0) lines.push('  INSERT INTO certificate_report_details (report_id, certificate_type, animal_category, total_issued) VALUES (v_report_id, \'PostMortem\', \'Large\', ' + pmLg + ');');
  if (pmVL > 0) lines.push('  INSERT INTO certificate_report_details (report_id, certificate_type, animal_category, total_issued) VALUES (v_report_id, \'VetroLegal\', \'Large\', ' + pmVL + ');');

  // Vaccinations
  VAC_MAP.forEach(vm => {
    const rcv = v(r[vm.rcv]), used = v(r[vm.used]), vac = v(r[vm.vac]);
    if (rcv > 0 || used > 0) {
      lines.push('  INSERT INTO vaccination_report_details (report_id, vaccine_id, doses_received, doses_used, animals_vaccinated)');
      lines.push('  SELECT v_report_id, vaccine_id, ' + rcv + ', ' + used + ', ' + vac + ' FROM vaccines WHERE vaccine_code = \'' + vm.code + '\' LIMIT 1');
      lines.push('  ON CONFLICT (report_id, vaccine_id) DO NOTHING;');
    }
  });

  // AI / Semen
  SEMEN_MAP.forEach(sm => {
    const aiD = v(r[sm.ai]), cov = v(r[sm.cov]), rec = v(r[sm.rec]);
    const aiw = sm.aiw ? v(r[sm.aiw]) : 0;
    const inaph = sm.inaph ? v(r[sm.inaph]) : 0;
    const tested = v(r[sm.tested]), pos = v(r[sm.pos]);
    const maleC = v(r[sm.maleC]), femC = v(r[sm.femC]);
    if (aiD > 0 || cov > 0 || rec > 0 || aiw > 0) {
      lines.push('  INSERT INTO ai_report_details (report_id, semen_type_id, total_ai_done, animals_covered, animals_tested, animals_positive, male_calves, female_calves, straws_received, straws_used_inaph, straws_issued_aiw)');
      lines.push('  SELECT v_report_id, semen_id, ' + aiD + ', ' + cov + ', ' + tested + ', ' + pos + ', ' + maleC + ', ' + femC + ', ' + rec + ', ' + inaph + ', ' + aiw + ' FROM semen_types WHERE semen_code = \'' + sm.code + '\' LIMIT 1');
      lines.push('  ON CONFLICT (report_id, semen_type_id) DO NOTHING;');
    }
  });

  // Lab diagnostics — diagnostic_type enum: Fecal, Blood, Urine, Milk, Other
  const fecal = v(r['Fecal Test']), blood = v(r['Blood Test']), urine = v(r['Urine Test']), milk = v(r['Milk Test']);
  if (fecal > 0) lines.push('  INSERT INTO diagnostic_report_details (report_id, diagnostic_type, tests_conducted) VALUES (v_report_id, \'Fecal\', ' + fecal + ');');
  if (blood > 0) lines.push('  INSERT INTO diagnostic_report_details (report_id, diagnostic_type, tests_conducted) VALUES (v_report_id, \'Blood\', ' + blood + ');');
  if (urine > 0) lines.push('  INSERT INTO diagnostic_report_details (report_id, diagnostic_type, tests_conducted) VALUES (v_report_id, \'Urine\', ' + urine + ');');
  if (milk  > 0) lines.push('  INSERT INTO diagnostic_report_details (report_id, diagnostic_type, tests_conducted) VALUES (v_report_id, \'Milk\', ' + milk + ');');

  lines.push('END $BODY$;');
  lines.push('');
});

fs.writeFileSync('Database/init/07-seed-talwandi-sabo.sql', lines.join('\n'));
console.log('Written! Lines: ' + lines.length + ', Records: ' + records.length + ', Institutes: ' + institutes.length);
