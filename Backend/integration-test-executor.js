// Integration Test Executor - Test API endpoints
// Executes integration tests against running backend server

const BASE_URL = 'http://localhost:8080/v1';

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

async function runIntegrationTests() {
  console.log('Starting Integration Test Execution...\n');
  console.log('Date:', new Date().toLocaleString());
  console.log('Tester: Automated Test Executor');
  console.log('Backend URL:', BASE_URL);
  console.log('\n');

  // ====================================================================
  // IT-API-001: POST /v1/auth/login - Valid Credentials
  // ====================================================================
  try {
    const testId = 'IT-API-001';
    console.log(`\nExecuting ${testId}...`);

    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
      })
    });

    const statusCode = response.status;
    const data = await response.json();
    const hasToken = data.token && data.token.length > 0;
    const hasUserData = data.user && data.user.id;

    logTest(
      testId,
      'POST /v1/auth/login - Valid Credentials',
      ['Send POST to /v1/auth/login', 'Check status code', 'Verify token in response', 'Verify user data'],
      'HTTP 200, success=true, token present, user object returned',
      `HTTP ${statusCode}, success=${data.success}, token=${hasToken ? 'present' : 'missing'}, user=${hasUserData ? 'present' : 'missing'}`,
      statusCode === 200 && data.success && hasToken && hasUserData ? 'PASS' : 'FAIL'
    );
  } catch (error) {
    logTest('IT-API-001', 'POST /v1/auth/login - Valid', [], '', '', 'FAIL', `Error: ${error.message}`);
  }

  // ====================================================================
  // IT-API-002: POST /v1/auth/login - Invalid Credentials
  // ====================================================================
  try {
    const testId = 'IT-API-002';
    console.log(`\nExecuting ${testId}...`);

    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'wrongpassword'
      })
    });

    const statusCode = response.status;
    const data = await response.json();

    logTest(
      testId,
      'POST /v1/auth/login - Invalid Credentials',
      ['Send POST with wrong password', 'Check status code', 'Verify error message'],
      'HTTP 401, success=false, appropriate error message',
      `HTTP ${statusCode}, success=${data.success}, message=${data.message}`,
      statusCode === 401 && data.success === false ? 'PASS' : 'FAIL'
    );
  } catch (error) {
    logTest('IT-API-002', 'POST /v1/auth/login - Invalid', [], '', '', 'FAIL', `Error: ${error.message}`);
  }

  // ====================================================================
  // IT-API-003: POST /v1/auth/login - Rate Limiting
  // ====================================================================
  try {
    const testId = 'IT-API-003';
    console.log(`\nExecuting ${testId}...`);

    // Make 6 rapid failed login attempts (rate limit is 5 per 15 minutes)
    let lastResponse;
    for (let i = 0; i < 6; i++) {
      lastResponse = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'wrong' + i
        })
      });
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const statusCode = lastResponse.status;
    const data = await lastResponse.json();

    logTest(
      testId,
      'POST /v1/auth/login - Rate Limiting',
      ['Make 6 rapid failed login attempts', 'Check if 6th attempt is blocked'],
      'HTTP 429 on 6th attempt, rate limit error message',
      `HTTP ${statusCode}, error=${data.error || data.message}`,
      statusCode === 429 ? 'PASS' : 'FAIL',
      statusCode !== 429 ? 'Warning: Rate limiting may not be working' : ''
    );
  } catch (error) {
    logTest('IT-API-003', 'Rate Limiting Test', [], '', '', 'FAIL', `Error: ${error.message}`);
  }

  // ====================================================================
  // IT-API-004: POST /v1/reports/monthly - Create Draft (requires auth)
  // ====================================================================
  try {
    const testId = 'IT-API-004';
    console.log(`\nExecuting ${testId}...`);

    // First login to get token
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
      })
    });
    const loginData = await loginResponse.json();
    const token = loginData.token;

    // Now create a report
    const reportResponse = await fetch(`${BASE_URL}/reports/monthly`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        reportingMonth: '2025-05',
        status: 'Draft',
        staffId: 9,
        instituteId: 1,
        opd: {
          bovine: { new: '20', old: '10', beneficiaries: '25' }
        }
      })
    });

    const statusCode = reportResponse.status;
    let data;
    try {
      data = await reportResponse.json();
    } catch (e) {
      data = { error: 'Failed to parse JSON response' };
    }
    const hasReportId = data.reportId || data.report_id || data.report?.reportId || data.data?.reportId;

    logTest(
      testId,
      'POST /v1/reports/monthly - Create Draft',
      ['Login to get token', 'POST report with Authorization header', 'Check response'],
      'HTTP 200/201, report created with reportId',
      `HTTP ${statusCode}, reportId=${hasReportId || 'missing'}, success=${data.success}`,
      (statusCode === 200 || statusCode === 201) && hasReportId ? 'PASS' : 'FAIL'
    );
  } catch (error) {
    logTest('IT-API-004', 'Create Monthly Report', [], '', '', 'FAIL', `Error: ${error.message}`);
  }

  // ====================================================================
  // IT-API-005: Protected Route - No Token
  // ====================================================================
  try {
    const testId = 'IT-API-005';
    console.log(`\nExecuting ${testId}...`);

    const response = await fetch(`${BASE_URL}/auth/sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // No Authorization header
      }
    });

    const statusCode = response.status;

    logTest(
      testId,
      'Protected Route - No Token',
      ['GET /v1/auth/sessions without token', 'Check status code'],
      'HTTP 401, authentication required error',
      `HTTP ${statusCode}`,
      statusCode === 401 ? 'PASS' : 'FAIL',
      statusCode !== 401 ? 'SECURITY ISSUE: Protected route accessible without token' : ''
    );
  } catch (error) {
    logTest('IT-API-005', 'Protected Route Test', [], '', '', 'FAIL', `Error: ${error.message}`);
  }

  // ====================================================================
  // Summary
  // ====================================================================
  console.log('\n' + '='.repeat(60));
  console.log('INTEGRATION TEST SUMMARY');
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
    './integration-test-results.json',
    JSON.stringify(testResults, null, 2)
  );
  console.log('\nResults saved to integration-test-results.json');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runIntegrationTests().catch(error => {
  console.error('Fatal error during integration test execution:', error);
  process.exit(1);
});
