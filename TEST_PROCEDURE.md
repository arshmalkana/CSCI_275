# Software Test Procedure Document
**AH Punjab Reporting System**

---

## Document Control

| Item | Details |
|------|---------|
| **Document**: | Test Procedure |
| **Version**: | 1.0 |
| **Date**: | January 2025 |
| **Status**: | Approved |
| **Related Documents**: | TEST_PLAN_IEEE_1012.md |

---

## Purpose

This document contains all test scripts that will be executed during testing of the AH Punjab Reporting System. Each test script includes:
- Test ID
- Test Description
- Prerequisites
- Test Steps
- Expected Results
- Actual Results (filled during execution)
- Status (Pass/Fail)
- SPR Number (if failed)

---

## Test Execution Instructions

1. Execute tests in the order listed
2. Record actual results in the "Actual Results" column
3. Mark status as PASS or FAIL
4. If FAIL, create SPR and record SPR number
5. Sign and date each completed test
6. Submit completed test report to QA Manager

---

## Section 1: Unit Tests - Authentication Module

### UT-AUTH-001: Login with Valid Credentials

**Test ID**: UT-AUTH-001
**Category**: Unit Test - Positive
**Module**: authService.js
**Priority**: P0 (Critical)

**Prerequisites**:
- Database contains test user: username='testuser', password='password123'
- Backend server running

**Test Steps**:
1. Call `authService.findStaffByUserId('testuser')`
2. Verify user object returned
3. Call `authService.verifyPassword('password123', user.password_hash)`
4. Verify password verification returns `true`
5. Call `authService.generateTokens(user)`
6. Verify accessToken and refreshToken generated

**Expected Results**:
- Step 1: User object with `staff_id=1, user_id='testuser'` returned
- Step 2: `verifyPassword` returns `true`
- Step 3: Both `accessToken` and `refreshToken` are non-empty strings
- Step 4: Tokens are valid JWT format

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___
**SPR Number** (if failed): _______________

---

### UT-AUTH-002: Login with Invalid Password

**Test ID**: UT-AUTH-002
**Category**: Unit Test - Negative
**Module**: authService.js
**Priority**: P0 (Critical)

**Prerequisites**:
- Database contains test user

**Test Steps**:
1. Call `authService.findStaffByUserId('testuser')`
2. Call `authService.verifyPassword('wrongpassword', user.password_hash)`
3. Verify password verification returns `false`
4. Ensure no tokens are generated

**Expected Results**:
- `verifyPassword` returns `false`
- Login fails, no authentication tokens generated

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___
**SPR Number** (if failed): _______________

---

### UT-AUTH-003: Find Non-Existent User

**Test ID**: UT-AUTH-003
**Category**: Unit Test - Boundary
**Module**: authService.js
**Priority**: P1 (High)

**Prerequisites**:
- Database does not contain user 'nonexistent'

**Test Steps**:
1. Call `authService.findStaffByUserId('nonexistent')`
2. Verify result is `null`

**Expected Results**:
- Function returns `null` (not undefined, not error)
- No exception thrown

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

### UT-AUTH-004: Case-Insensitive Username Lookup

**Test ID**: UT-AUTH-004
**Category**: Unit Test - Functional
**Module**: authService.js
**Priority**: P2 (Medium)

**Prerequisites**:
- Database contains user 'testuser'

**Test Steps**:
1. Call `authService.findStaffByUserId('TESTUSER')` (uppercase)
2. Verify user object returned
3. Call `authService.findStaffByUserId('TeStUsEr')` (mixed case)
4. Verify user object returned

**Expected Results**:
- Both calls return the same user object
- Username lookup is case-insensitive

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

### UT-AUTH-005: SQL Injection Prevention

**Test ID**: UT-AUTH-005
**Category**: Unit Test - Security
**Module**: authService.js
**Priority**: P0 (Critical)

**Prerequisites**:
- Database running

**Test Steps**:
1. Call `authService.findStaffByUserId("'; DROP TABLE staff; --")`
2. Verify no database error
3. Verify function returns `null` safely
4. Verify `staff` table still exists

**Expected Results**:
- No SQL injection executed
- Function handles malicious input gracefully
- Returns `null`, no error thrown
- Database integrity maintained

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

## Section 2: Unit Tests - Reports Module

### UT-REPORTS-001: Create Draft Report with Valid Data

**Test ID**: UT-REPORTS-001
**Category**: Unit Test - Positive
**Module**: reportsService.js
**Priority**: P0 (Critical)

**Prerequisites**:
- Database connection established
- Valid instituteId and staffId exist

**Test Steps**:
1. Call `reportsService.saveMonthlyReport()` with:
   ```json
   {
     "reportingMonth": "2025-01",
     "status": "Draft",
     "staffId": 1,
     "instituteId": 1,
     "opd": {
       "bovine": { "new": "10", "old": "5", "beneficiaries": "12" }
     }
   }
   ```
2. Verify function returns `{ success: true, reportId: <number> }`
3. Query database for the created report
4. Verify data matches input

**Expected Results**:
- Function executes without error
- Returns `success: true` with valid `reportId`
- Database contains new report with status='Draft'
- OPD data correctly inserted
- `start_date='2025-01-01'`, `end_date='2025-01-31'`

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

### UT-REPORTS-002: Reject Negative Values in OPD

**Test ID**: UT-REPORTS-002
**Category**: Unit Test - Negative (Validation)
**Module**: reportsService.js
**Priority**: P0 (Critical)

**Prerequisites**:
- Validation enabled in code

**Test Steps**:
1. Call `reportsService.saveMonthlyReport()` with:
   ```json
   {
     "reportingMonth": "2025-01",
     "status": "Submitted",
     "staffId": 1,
     "instituteId": 1,
     "opd": {
       "bovine": { "new": "-10", "old": "5", "beneficiaries": "12" }
     }
   }
   ```
2. Verify function throws error
3. Check error message contains "negative values"

**Expected Results**:
- Function throws validation error
- Error message: "OPD bovine - new: Cannot have negative values"
- No database record created
- Transaction rolled back

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

### UT-REPORTS-003: Reject Unusually High Values

**Test ID**: UT-REPORTS-003
**Category**: Unit Test - Boundary
**Module**: reportsService.js
**Priority**: P1 (High)

**Prerequisites**:
- Validation enabled

**Test Steps**:
1. Submit report with OPD bovine new = "150000" (> 100,000)
2. Verify warning/error generated

**Expected Results**:
- Validation error: "Value 150000 seems unusually high"
- Report not submitted without confirmation

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

### UT-REPORTS-004: AI Reports - Animals Covered Cannot Exceed AI Done

**Test ID**: UT-REPORTS-004
**Category**: Unit Test - Logical Validation
**Module**: reportsService.js
**Priority**: P0 (Critical)

**Prerequisites**:
- Validation enabled

**Test Steps**:
1. Submit report with AI data:
   ```json
   {
     "aiReports": {
       "localSemen": {
         "HF": {
           "current": { "ai": "10", "covered": "15", "beneficiaries": "5" }
         }
       }
     }
   }
   ```
2. Verify validation error thrown

**Expected Results**:
- Error: "AI Reports HF: Animals covered (15) cannot exceed AI done (10)"
- Report rejected

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

### UT-REPORTS-005: Prevent Updating Approved Report

**Test ID**: UT-REPORTS-005
**Category**: Unit Test - Business Logic
**Module**: reportsService.js
**Priority**: P0 (Critical)

**Prerequisites**:
- Database contains approved report for month '2025-01'

**Test Steps**:
1. Attempt to update approved report by calling `saveMonthlyReport()` with same month
2. Verify error thrown

**Expected Results**:
- Error: "Cannot modify an approved report"
- Database record unchanged

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

### UT-REPORTS-006: Transaction Rollback on Error

**Test ID**: UT-REPORTS-006
**Category**: Unit Test - Error Handling
**Module**: reportsService.js
**Priority**: P1 (High)

**Prerequisites**:
- Database running

**Test Steps**:
1. Mock a database error during report save
2. Verify transaction is rolled back
3. Verify no partial data in database

**Expected Results**:
- `ROLLBACK` called on database error
- No orphaned records in database
- Function re-throws error

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

### UT-REPORTS-007: Date Calculation - January

**Test ID**: UT-REPORTS-007
**Category**: Unit Test - Algorithm
**Module**: reportsService.js
**Priority**: P2 (Medium)

**Test Steps**:
1. Submit report for month "2025-01"
2. Check calculated `start_date` and `end_date` in database

**Expected Results**:
- `start_date = '2025-01-01'`
- `end_date = '2025-01-31'`

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

### UT-REPORTS-008: Date Calculation - February (Non-Leap Year)

**Test ID**: UT-REPORTS-008
**Category**: Unit Test - Boundary
**Module**: reportsService.js
**Priority**: P2 (Medium)

**Test Steps**:
1. Submit report for month "2025-02"
2. Check calculated `end_date`

**Expected Results**:
- `start_date = '2025-02-01'`
- `end_date = '2025-02-28'` (2025 is not a leap year)

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

## Section 3: Integration Tests - API Endpoints

### IT-API-001: POST /v1/auth/login - Valid Credentials

**Test ID**: IT-API-001
**Category**: Integration Test - API
**Endpoint**: POST /v1/auth/login
**Priority**: P0 (Critical)

**Prerequisites**:
- Backend running on port 8080
- Test user exists in database

**Test Steps**:
1. Send POST request to `http://localhost:8080/v1/auth/login`
   ```json
   {
     "userId": "testuser",
     "password": "password123"
   }
   ```
2. Check HTTP status code
3. Parse JSON response
4. Check for `accessToken` in response
5. Check for `refreshToken` cookie in headers

**Expected Results**:
- HTTP 200 OK
- Response body:
  ```json
  {
    "success": true,
    "accessToken": "<JWT token>",
    "user": {
      "staff_id": 1,
      "user_id": "testuser",
      "full_name": "Test User",
      "user_role": "staff"
    }
  }
  ```
- Set-Cookie header contains `refreshToken=...;  HttpOnly`

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

### IT-API-002: POST /v1/auth/login - Invalid Credentials

**Test ID**: IT-API-002
**Category**: Integration Test - Negative
**Endpoint**: POST /v1/auth/login
**Priority**: P0 (Critical)

**Test Steps**:
1. Send POST request with wrong password:
   ```json
   {
     "userId": "testuser",
     "password": "wrongpassword"
   }
   ```

**Expected Results**:
- HTTP 401 Unauthorized
- Response: `{ "error": "Invalid credentials" }`
- No cookies set

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

### IT-API-003: POST /v1/auth/login - Rate Limiting

**Test ID**: IT-API-003
**Category**: Integration Test - Security
**Endpoint**: POST /v1/auth/login
**Priority**: P1 (High)

**Test Steps**:
1. Send 5 failed login attempts with wrong password
2. Send 6th login attempt
3. Check HTTP status code

**Expected Results**:
- First 5 attempts: HTTP 401
- 6th attempt: HTTP 429 Too Many Requests
- Error: "Rate limit exceeded"

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

### IT-API-004: POST /v1/reports/monthly - Create Draft

**Test ID**: IT-API-004
**Category**: Integration Test - API
**Endpoint**: POST /v1/reports/monthly
**Priority**: P0 (Critical)

**Prerequisites**:
- Authenticated with valid access token

**Test Steps**:
1. Send POST request to `http://localhost:8080/v1/reports/monthly`
   Headers: `Authorization: Bearer <accessToken>`
   Body:
   ```json
   {
     "reportingMonth": "2025-01",
     "status": "Draft",
     "opd": {
       "bovine": { "new": "10", "old": "5", "beneficiaries": "12" }
     }
   }
   ```
2. Check response

**Expected Results**:
- HTTP 200 OK
- Response: `{ "success": true, "reportId": <number> }`
- Database contains new draft report

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

### IT-API-005: Protected Route - No Token

**Test ID**: IT-API-005
**Category**: Integration Test - Security
**Endpoint**: GET /v1/auth/sessions
**Priority**: P0 (Critical)

**Test Steps**:
1. Send GET request to protected endpoint WITHOUT Authorization header

**Expected Results**:
- HTTP 401 Unauthorized
- Error: "No token provided" or "Unauthorized"

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

## Section 4: System Tests - End-to-End Workflows

### ST-E2E-001: Complete Monthly Report Submission Workflow

**Test ID**: ST-E2E-001
**Category**: System Test - Workflow
**Priority**: P0 (Critical)

**Prerequisites**:
- Frontend and backend running
- Test user logged in
- Fresh database state

**Test Steps**:
1. **Login**: User logs in with credentials
2. **Navigate**: Click "Create Report" button
3. **Fill OPD Section**: Enter bovine data (new: 10, old: 5, beneficiaries: 12)
4. **Save Draft**: Click "Save as Draft" button
5. **Verify Draft Saved**: See success message "Draft saved successfully"
6. **Navigate Away**: Go to Home screen
7. **Return to Reports**: Click "View Reports"
8. **Open Draft**: Find and open the draft report
9. **Verify Data Preserved**: Check OPD data still shows 10, 5, 12
10. **Fill AI Section**: Enter HF data (AI: 20, Covered: 18, Beneficiaries: 15)
11. **Fill Certificates**: Health certificates - Large: 5, Small: 3
12. **Submit Report**: Click "Submit" button
13. **Verify Submission**: Status changes to "Submitted"
14. **Check Notification**: Admin receives notification

**Expected Results**:
- Each step completes without error
- Data persists correctly
- Status transitions: null → Draft → Submitted
- Notification created for admin
- Validation rules enforced

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___
**Duration**: ___ minutes
**SPR Number** (if failed): _______________

---

### ST-E2E-002: Admin Approval Workflow

**Test ID**: ST-E2E-002
**Category**: System Test - Workflow
**Priority**: P0 (Critical)

**Prerequisites**:
- Submitted report exists
- Admin user logged in

**Test Steps**:
1. **Admin Login**: Login as admin user
2. **View Dashboard**: Check pending reports count
3. **Open Pending Reports**: Navigate to pending reports list
4. **Select Report**: Open a submitted report
5. **Review Data**: Review all sections
6. **Add Comment**: Enter comment "Looks good"
7. **Approve**: Click "Approve" button
8. **Confirm**: Confirm approval action
9. **Verify Status**: Status changes to "Approved"
10. **Check Notification**: Staff receives approval notification

**Expected Results**:
- Dashboard shows correct pending count
- Report displays all data correctly
- Approval succeeds
- Status updated in database
- Notification sent to staff member
- Report is read-only after approval

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

### ST-E2E-003: Validation Error Handling

**Test ID**: ST-E2E-003
**Category**: System Test - Error Handling
**Priority**: P0 (Critical)

**Test Steps**:
1. Start creating monthly report
2. Enter negative value in OPD: bovine new = "-5"
3. Click "Submit"
4. Verify error message displayed
5. Correct value to "5"
6. Enter AI data: AI Done = 10, Animals Covered = 15 (illogical)
7. Click "Submit"
8. Verify validation error
9. Correct to: AI Done = 20, Covered = 15
10. Submit successfully

**Expected Results**:
- Clear error message for negative values
- Clear error message for illogical AI data
- Submit button disabled until errors corrected
- After correction, submission succeeds

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

## Section 5: User Acceptance Tests

### UAT-001: Field Veterinarian Monthly Workflow

**Test ID**: UAT-001
**Category**: User Acceptance Test
**User Persona**: Field Veterinarian
**Priority**: P0 (Critical)

**Scenario**:
George is a field veterinarian who visits 5 villages daily and needs to submit his monthly report by the 5th of each month.

**Test Steps**:
1. **Morning Prep**: George logs in on mobile phone
2. **Daily Work**: Takes notes on paper during field visits
3. **Data Entry**: Opens PWA in evening, starts creating report
4. **Interruption**: Saves as draft (phone call received)
5. **Resume**: Next day, opens draft and continues
6. **Complete**: Fills all sections from paper notes
7. **Review**: Reviews entire report for accuracy
8. **Submit**: Submits report
9. **Confirmation**: Receives confirmation notification
10. **Approval**: Week later, receives approval notification

**Expected Results**:
- Easy to use on mobile phone
- Draft saves and resumes work correctly
- All sections easy to understand
- Submission confirmation clear
- Notification received when approved
- Overall process faster than Google Sheets

**Actual Results**:
[To be filled during actual user testing]

**User Feedback**:
[User comments on ease of use, issues encountered]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: [User Name] **Date**: ___/___/___

---

### UAT-002: Admin Review and Approval

**Test ID**: UAT-002
**Category**: User Acceptance Test
**User Persona**: District Veterinary Officer (Admin)
**Priority**: P0 (Critical)

**Scenario**:
Dr. Sarah is a DVO who oversees 10 CVHs and needs to review and approve their monthly reports.

**Test Steps**:
1. **Monthly Review**: Sarah logs in on 1st of month
2. **Dashboard**: Views pending reports summary
3. **Bulk Review**: Opens and reviews multiple reports
4. **Identify Issues**: Notices anomaly in one report
5. **Reject**: Rejects report with comment explaining issue
6. **Approve Others**: Approves remaining reports
7. **Follow-up**: Receives revised report, re-reviews, approves

**Expected Results**:
- Dashboard provides clear overview
- Easy to navigate between reports
- Can review data quickly
- Comment system works well
- Notification system keeps her informed
- More efficient than email/phone coordination

**Actual Results**:
[To be filled during actual user testing]

**User Feedback**:
[User comments]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: [User Name] **Date**: ___/___/___

---

## Section 6: Performance Tests

### PT-001: Page Load Time (3G Network)

**Test ID**: PT-001
**Category**: Performance Test
**Priority**: P1 (High)

**Prerequisites**:
- Chrome DevTools
- Network throttling set to "Fast 3G"

**Test Steps**:
1. Open Chrome DevTools → Network tab
2. Set throttling to "Fast 3G"
3. Clear cache and hard reload
4. Navigate to login page
5. Measure load time
6. Login
7. Navigate to dashboard
8. Measure load time
9. Navigate to create report
10. Measure load time

**Expected Results**:
- Login page: < 3 seconds
- Dashboard: < 2 seconds
- Create report page: < 2 seconds
- Lighthouse Performance score: > 80

**Actual Results**:
- Login page: ___ seconds
- Dashboard: ___ seconds
- Create report: ___ seconds
- Lighthouse score: ___

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

### PT-002: API Response Time

**Test ID**: PT-002
**Category**: Performance Test
**Priority**: P1 (High)

**Test Steps**:
1. Measure POST /v1/auth/login response time (10 requests)
2. Measure GET /v1/reports/monthly response time (10 requests)
3. Measure POST /v1/reports/monthly response time (10 requests)

**Expected Results**:
- Login: < 200ms (95th percentile)
- Get reports: < 500ms (95th percentile)
- Create report: < 1000ms (95th percentile)

**Actual Results**:
- Login: ___ ms (95th percentile)
- Get reports: ___ ms
- Create report: ___ ms

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

### PT-003: Concurrent Users

**Test ID**: PT-003
**Category**: Performance Test - Load
**Priority**: P2 (Medium)

**Prerequisites**:
- Apache JMeter or similar tool

**Test Steps**:
1. Simulate 10 concurrent users logging in
2. Simulate 10 concurrent users creating reports
3. Monitor server CPU and memory
4. Check for errors or timeouts

**Expected Results**:
- All requests succeed
- No timeouts
- Server CPU < 80%
- Server memory < 80%
- Response times remain within limits

**Actual Results**:
- Successful requests: ___ / ___
- Errors: ___
- Average CPU: ___%
- Average memory: ___%

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

## Section 7: Security Tests

### SEC-001: SQL Injection Prevention

**Test ID**: SEC-001
**Category**: Security Test
**Priority**: P0 (Critical)

**Test Steps**:
1. Attempt login with username: `' OR '1'='1`
2. Attempt login with username: `'; DROP TABLE staff; --`
3. Attempt report search with: `' UNION SELECT * FROM staff --`
4. Verify all attempts fail safely

**Expected Results**:
- All malicious inputs rejected
- No SQL executed
- No database errors exposed to client
- Safe error messages returned

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

### SEC-002: XSS Prevention

**Test ID**: SEC-002
**Category**: Security Test
**Priority**: P0 (Critical)

**Test Steps**:
1. Enter `<script>alert('XSS')</script>` in username field
2. Enter `<img src=x onerror=alert('XSS')>` in report comment
3. Submit and verify script not executed
4. View saved data and verify scripts displayed as text

**Expected Results**:
- Scripts not executed
- Input sanitized
- Displayed as plain text, not HTML

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

### SEC-003: Authorization Check

**Test ID**: SEC-003
**Category**: Security Test - Access Control
**Priority**: P0 (Critical)

**Test Steps**:
1. Login as non-admin user
2. Attempt to access `/v1/admin/users` endpoint
3. Attempt to approve reports (admin function)
4. Verify access denied

**Expected Results**:
- HTTP 403 Forbidden
- Error: "Insufficient permissions"
- No data exposed

**Actual Results**:
[To be filled during execution]

**Status**: [ ] PASS [ ] FAIL
**Executed By**: _______________ **Date**: ___/___/___

---

## Test Execution Summary

**Total Tests**: 50 (documented above)
**Executed**: ___
**Passed**: ___
**Failed**: ___
**Blocked**: ___
**Pass Rate**: ___%

---

## Approval

**Test Procedure Approved By**:

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Manager | _______________ | _______________ | ___/___/___ |
| Test Lead | _______________ | _______________ | ___/___/___ |

---

**End of Test Procedure Document**

**Note**: This is a clean copy. During test execution, create a copy of this document and fill in the "Actual Results" sections. The completed copy becomes the Test Report.
