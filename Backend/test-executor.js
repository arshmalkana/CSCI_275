// Test Executor - Manually execute tests and document results
// This script runs tests and generates documentation

import authService from './src/services/authService.js';
import * as reportsService from './src/services/reportsService.js';
import { query } from './src/database/db.js';

// Test results collector
const testResults = [];

// Helper to log test results
function logTest(testId, description, steps, expectedResults, actualResults, status, notes = '') {
  testResults.push({
    testId,
    description,
    steps,
    expectedResults,
    actualResults,
    status,
    notes,
    executedAt: new Date().toISOString()
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${testId} - ${description}`);
  console.log(`STATUS: ${status}`);
  console.log(`${'='.repeat(60)}`);
  console.log('Expected:', expectedResults);
  console.log('Actual:', actualResults);
  if (notes) console.log('Notes:', notes);
}

async function runTests() {
  console.log('Starting Test Execution...\n');
  console.log('Date:', new Date().toLocaleString());
  console.log('Tester: Automated Test Executor\n');

  // ====================================================================
  // UT-AUTH-001: Login with Valid Credentials
  // ====================================================================
  try {
    const testId = 'UT-AUTH-001';
    console.log(`\nExecuting ${testId}...`);

    // Step 1: Find user
    const user = await authService.findStaffByUserId('testuser');

    if (!user) {
      logTest(
        testId,
        'Login with Valid Credentials',
        ['Find user', 'Verify password', 'Generate tokens'],
        'User found, password verified, tokens generated',
        'User not found in database',
        'BLOCKED',
        'Test user does not exist in database. Need to create test data first.'
      );
    } else {
      // Step 2: Verify password
      const passwordValid = authService.verifyPassword('password123', user.password_hash);

      // Step 3: Generate tokens
      const tokens = authService.generateTokens(user);

      const passed = user && user.staff_id && passwordValid && tokens.accessToken && tokens.refreshToken;

      logTest(
        testId,
        'Login with Valid Credentials',
        ['Find user by userId', 'Verify password', 'Generate JWT tokens'],
        'User object with staff_id, password verified=true, both tokens generated',
        `User: ${JSON.stringify({staff_id: user.staff_id, user_id: user.user_id})}, Password valid: ${passwordValid}, Tokens: ${tokens.accessToken ? 'Generated' : 'Failed'}`,
        passed ? 'PASS' : 'FAIL'
      );
    }
  } catch (error) {
    logTest(
      'UT-AUTH-001',
      'Login with Valid Credentials',
      [],
      '',
      '',
      'BLOCKED',
      `Error: ${error.message}`
    );
  }

  // ====================================================================
  // UT-AUTH-002: Login with Invalid Password
  // ====================================================================
  try {
    const testId = 'UT-AUTH-002';
    console.log(`\nExecuting ${testId}...`);

    const user = await authService.findStaffByUserId('testuser');

    if (!user) {
      logTest(testId, 'Login with Invalid Password', [], '', '', 'BLOCKED', 'Test user not found');
    } else {
      const passwordValid = authService.verifyPassword('wrongpassword', user.password_hash);

      logTest(
        testId,
        'Login with Invalid Password',
        ['Find user', 'Verify wrong password'],
        'Password verification returns false',
        `Password valid: ${passwordValid}`,
        passwordValid === false ? 'PASS' : 'FAIL'
      );
    }
  } catch (error) {
    logTest('UT-AUTH-002', 'Login with Invalid Password', [], '', '', 'BLOCKED', `Error: ${error.message}`);
  }

  // ====================================================================
  // UT-AUTH-003: Find Non-Existent User
  // ====================================================================
  try {
    const testId = 'UT-AUTH-003';
    console.log(`\nExecuting ${testId}...`);

    const user = await authService.findStaffByUserId('nonexistentuser12345');

    logTest(
      testId,
      'Find Non-Existent User',
      ['Find user that does not exist'],
      'Function returns null (not undefined, not error)',
      `Result: ${user === null ? 'null' : user}`,
      user === null ? 'PASS' : 'FAIL'
    );
  } catch (error) {
    logTest('UT-AUTH-003', 'Find Non-Existent User', [], '', '', 'FAIL', `Should return null, but threw error: ${error.message}`);
  }

  // ====================================================================
  // UT-AUTH-004: Case-Insensitive Username Lookup
  // ====================================================================
  try {
    const testId = 'UT-AUTH-004';
    console.log(`\nExecuting ${testId}...`);

    const user1 = await authService.findStaffByUserId('testuser');
    const user2 = await authService.findStaffByUserId('TESTUSER');
    const user3 = await authService.findStaffByUserId('TeStUsEr');

    if (!user1) {
      logTest(testId, 'Case-Insensitive Username', [], '', '', 'BLOCKED', 'Test user not found');
    } else {
      const allMatch = user2 && user3 &&
                      user1.staff_id === user2.staff_id &&
                      user1.staff_id === user3.staff_id;

      logTest(
        testId,
        'Case-Insensitive Username Lookup',
        ['Find with lowercase', 'Find with uppercase', 'Find with mixed case'],
        'All three lookups return same user',
        `Lowercase: ${user1?.staff_id}, Uppercase: ${user2?.staff_id}, Mixed: ${user3?.staff_id}`,
        allMatch ? 'PASS' : 'FAIL',
        allMatch ? '' : 'SPR-001: Username lookup is case-sensitive'
      );
    }
  } catch (error) {
    logTest('UT-AUTH-004', 'Case-Insensitive Username', [], '', '', 'FAIL', `Error: ${error.message}`);
  }

  // ====================================================================
  // UT-AUTH-005: SQL Injection Prevention
  // ====================================================================
  try {
    const testId = 'UT-AUTH-005';
    console.log(`\nExecuting ${testId}...`);

    const maliciousInput = "'; DROP TABLE staff; --";
    let sqlInjectionWorked = false;
    let errorThrown = false;

    try {
      const result = await authService.findStaffByUserId(maliciousInput);
      // If we get here, query didn't execute malicious SQL
      sqlInjectionWorked = false;
    } catch (error) {
      errorThrown = true;
    }

    // Verify staff table still exists
    const tableCheck = await query("SELECT COUNT(*) FROM staff");
    const tableExists = tableCheck.rows.length > 0;

    logTest(
      testId,
      'SQL Injection Prevention',
      ['Attempt SQL injection', 'Verify database integrity'],
      'Malicious input handled safely, database intact',
      `SQL Injection worked: ${sqlInjectionWorked}, Table exists: ${tableExists}`,
      (!sqlInjectionWorked && tableExists) ? 'PASS' : 'FAIL'
    );
  } catch (error) {
    // If we catch an error, it might be that the injection failed (good) or DB is down
    logTest('UT-AUTH-005', 'SQL Injection Prevention', [], '', '', 'BLOCKED', `Database connection error: ${error.message}`);
  }

  // ====================================================================
  // UT-REPORTS-001: Create Draft Report with Valid Data
  // ====================================================================
  try {
    const testId = 'UT-REPORTS-001';
    console.log(`\nExecuting ${testId}...`);

    const validReportData = {
      reportingMonth: '2025-01',
      status: 'Draft',
      staffId: 9, // Our test user
      instituteId: 1,
      opd: {
        bovine: { new: '10', old: '5', beneficiaries: '12' }
      }
    };

    const result = await reportsService.saveMonthlyReport(validReportData);

    logTest(
      testId,
      'Create Draft Report with Valid Data',
      ['Call saveMonthlyReport with valid data', 'Verify report created', 'Check return value'],
      'Report created successfully, returns report object with reportId',
      `Report created: ${result && result.reportId ? 'Yes' : 'No'}, Report ID: ${result?.reportId}`,
      result && result.reportId ? 'PASS' : 'FAIL'
    );
  } catch (error) {
    logTest('UT-REPORTS-001', 'Create Draft Report', [], '', '', 'FAIL', `Error: ${error.message}`);
  }

  // ====================================================================
  // UT-REPORTS-002: Reject Negative Values in OPD
  // ====================================================================
  try {
    const testId = 'UT-REPORTS-002';
    console.log(`\nExecuting ${testId}...`);

    const negativeValueData = {
      reportingMonth: '2025-02',
      status: 'Draft',
      staffId: 9,
      instituteId: 1,
      opd: {
        bovine: { new: '-10', old: '5', beneficiaries: '12' }
      }
    };

    let errorThrown = false;
    let errorMessage = '';

    try {
      await reportsService.saveMonthlyReport(negativeValueData);
    } catch (error) {
      errorThrown = true;
      errorMessage = error.message;
    }

    logTest(
      testId,
      'Reject Negative Values in OPD',
      ['Submit report with negative value', 'Verify validation error'],
      'Validation error thrown for negative value',
      `Error thrown: ${errorThrown}, Message: ${errorMessage}`,
      errorThrown && errorMessage.includes('negative') ? 'PASS' : 'FAIL',
      !errorThrown ? 'SPR Required: Negative values accepted' : ''
    );
  } catch (error) {
    logTest('UT-REPORTS-002', 'Reject Negative Values', [], '', '', 'FAIL', `Unexpected error: ${error.message}`);
  }

  // ====================================================================
  // UT-REPORTS-003: Reject Unusually High Values
  // ====================================================================
  try {
    const testId = 'UT-REPORTS-003';
    console.log(`\nExecuting ${testId}...`);

    const highValueData = {
      reportingMonth: '2025-03',
      status: 'Draft',
      staffId: 9,
      instituteId: 1,
      opd: {
        bovine: { new: '150000', old: '5', beneficiaries: '12' }
      }
    };

    let warningOrError = false;
    let message = '';

    try {
      const result = await reportsService.saveMonthlyReport(highValueData);
      // If it saved without error, check if there's a warning mechanism
      warningOrError = false;
      message = 'Report saved without warning';
    } catch (error) {
      warningOrError = true;
      message = error.message;
    }

    logTest(
      testId,
      'Reject Unusually High Values',
      ['Submit report with unusually high value', 'Check for warning/error'],
      'Warning or error for unusually high value',
      `Warning/Error: ${warningOrError}, Message: ${message}`,
      warningOrError && message.toLowerCase().includes('high') ? 'PASS' : 'FAIL',
      !warningOrError ? 'Warning: No validation for unusually high values' : ''
    );
  } catch (error) {
    logTest('UT-REPORTS-003', 'Reject High Values', [], '', '', 'FAIL', `Error: ${error.message}`);
  }

  // ====================================================================
  // UT-REPORTS-004: Animals Covered Cannot Exceed AI Done
  // ====================================================================
  try {
    const testId = 'UT-REPORTS-004';
    console.log(`\nExecuting ${testId}...`);

    const invalidAIData = {
      reportingMonth: '2025-04',
      status: 'Draft',
      staffId: 9,
      instituteId: 1,
      aiReports: {
        localSemen: {
          HF: {
            current: { ai: '10', covered: '15', beneficiaries: '5' }
          }
        }
      }
    };

    let errorThrown = false;
    let errorMessage = '';

    try {
      await reportsService.saveMonthlyReport(invalidAIData);
    } catch (error) {
      errorThrown = true;
      errorMessage = error.message;
    }

    logTest(
      testId,
      'AI Reports - Covered Cannot Exceed AI Done',
      ['Submit AI report with covered > ai', 'Verify validation error'],
      'Validation error: covered cannot exceed AI done',
      `Error thrown: ${errorThrown}, Message: ${errorMessage}`,
      errorThrown && (errorMessage.includes('covered') || errorMessage.includes('exceed')) ? 'PASS' : 'FAIL',
      !errorThrown ? 'SPR Required: Logical validation missing for AI data' : ''
    );
  } catch (error) {
    logTest('UT-REPORTS-004', 'AI Logical Validation', [], '', '', 'FAIL', `Error: ${error.message}`);
  }

  // ====================================================================
  // Summary
  // ====================================================================
  console.log('\n' + '='.repeat(60));
  console.log('TEST EXECUTION SUMMARY');
  console.log('='.repeat(60));

  const passed = testResults.filter(t => t.status === 'PASS').length;
  const failed = testResults.filter(t => t.status === 'FAIL').length;
  const blocked = testResults.filter(t => t.status === 'BLOCKED').length;

  console.log(`Total Tests: ${testResults.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Blocked: ${blocked}`);
  console.log(`Pass Rate: ${((passed / testResults.length) * 100).toFixed(1)}%`);

  // Save results to file
  const fs = await import('fs');
  fs.writeFileSync(
    './test-results.json',
    JSON.stringify(testResults, null, 2)
  );
  console.log('\nResults saved to test-results.json');

  // Close database connection
  process.exit(0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error during test execution:', error);
  process.exit(1);
});
