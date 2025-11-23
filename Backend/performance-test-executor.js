// Performance Test Executor - Measure API performance
// Executes performance tests against running backend server

const BASE_URL = 'http://localhost:8080/v1';

// Test results collector
const testResults = [];

// Helper to log test results
function logTest(testId, description, expectedResults, actualResults, status, notes = '') {
  testResults.push({
    testId,
    description,
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

async function measureResponseTime(url, method, headers = {}, body = null) {
  const start = performance.now();
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  const end = performance.now();
  const responseTime = end - start;

  return {
    responseTime,
    status: response.status,
    ok: response.ok
  };
}

async function runPerformanceTests() {
  console.log('Starting Performance Test Execution...\n');
  console.log('Date:', new Date().toLocaleString());
  console.log('Tester: Automated Test Executor');
  console.log('Backend URL:', BASE_URL);
  console.log('\n');

  // ====================================================================
  // PT-002: API Response Time - Login Endpoint
  // ====================================================================
  try {
    const testId = 'PT-002';
    console.log(`\nExecuting ${testId}...`);

    const iterations = 10;
    const responseTimes = [];

    for (let i = 0; i < iterations; i++) {
      const result = await measureResponseTime(
        `${BASE_URL}/auth/login`,
        'POST',
        { 'Content-Type': 'application/json' },
        { username: 'testuser', password: 'password123' }
      );
      responseTimes.push(result.responseTime);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
    }

    const avgResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);

    // Requirements: API should respond within 500ms for good UX
    const requirement = 500;
    const passed = avgResponseTime < requirement;

    logTest(
      testId,
      'API Response Time - Login Endpoint',
      `Average response time < ${requirement}ms`,
      `Avg: ${avgResponseTime.toFixed(2)}ms, Min: ${minResponseTime.toFixed(2)}ms, Max: ${maxResponseTime.toFixed(2)}ms`,
      passed ? 'PASS' : 'FAIL',
      passed ? `Good performance - well under ${requirement}ms requirement` : `Performance issue - exceeds ${requirement}ms requirement`
    );
  } catch (error) {
    logTest('PT-002', 'API Response Time - Login', '', '', 'FAIL', `Error: ${error.message}`);
  }

  // ====================================================================
  // PT-003: Concurrent Users - Login Endpoint
  // ====================================================================
  try {
    const testId = 'PT-003';
    console.log(`\nExecuting ${testId}...`);

    const concurrentUsers = 10;
    const start = performance.now();

    // Create concurrent requests
    const requests = [];
    for (let i = 0; i < concurrentUsers; i++) {
      requests.push(
        fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser', password: 'password123' })
        })
      );
    }

    const responses = await Promise.all(requests);
    const end = performance.now();
    const totalTime = end - start;
    const avgTimePerRequest = totalTime / concurrentUsers;

    const successCount = responses.filter(r => r.ok).length;
    const failureCount = responses.filter(r => !r.ok).length;

    // Requirements: Should handle 10 concurrent users with < 1000ms total time
    const requirement = 1000;
    const passed = totalTime < requirement && successCount === concurrentUsers;

    logTest(
      testId,
      'Concurrent Users - Login Endpoint',
      `Handle ${concurrentUsers} concurrent requests in < ${requirement}ms, all successful`,
      `Total time: ${totalTime.toFixed(2)}ms, Avg/request: ${avgTimePerRequest.toFixed(2)}ms, Success: ${successCount}/${concurrentUsers}`,
      passed ? 'PASS' : 'FAIL',
      !passed ? `Performance or reliability issue with concurrent load` : ''
    );
  } catch (error) {
    logTest('PT-003', 'Concurrent Users Test', '', '', 'FAIL', `Error: ${error.message}`);
  }

  // ====================================================================
  // PT-004: Database Query Performance - Report Retrieval
  // ====================================================================
  try {
    const testId = 'PT-004';
    console.log(`\nExecuting ${testId}...`);

    // First login to get token
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', password: 'password123' })
    });
    const loginData = await loginResponse.json();
    const token = loginData.token;

    // Measure report retrieval time
    const iterations = 5;
    const responseTimes = [];

    for (let i = 0; i < iterations; i++) {
      const result = await measureResponseTime(
        `${BASE_URL}/reports/monthly`,
        'GET',
        { 'Authorization': `Bearer ${token}` }
      );
      responseTimes.push(result.responseTime);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const avgResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;

    // Requirements: Database queries should complete within 300ms
    const requirement = 300;
    const passed = avgResponseTime < requirement;

    logTest(
      testId,
      'Database Query Performance - Report Retrieval',
      `Average response time < ${requirement}ms`,
      `Avg: ${avgResponseTime.toFixed(2)}ms`,
      passed ? 'PASS' : 'FAIL',
      passed ? 'Good database performance' : 'Database queries may need optimization'
    );
  } catch (error) {
    logTest('PT-004', 'Database Query Performance', '', '', 'FAIL', `Error: ${error.message}`);
  }

  // ====================================================================
  // Summary
  // ====================================================================
  console.log('\n' + '='.repeat(60));
  console.log('PERFORMANCE TEST SUMMARY');
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
    './performance-test-results.json',
    JSON.stringify(testResults, null, 2)
  );
  console.log('\nResults saved to performance-test-results.json');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runPerformanceTests().catch(error => {
  console.error('Fatal error during performance test execution:', error);
  process.exit(1);
});
