# Software Problem Report (SPR) Tracking System
**AH Punjab Reporting System**

---

## Purpose

This document tracks all Software Problem Reports (SPRs) found during testing. Each bug/defect gets a unique SPR number and is tracked through resolution.

---

## SPR Workflow

```
[New] → [Assigned] → [In Progress] → [Fixed] → [Verified] → [Closed]
                                         ↓
                                    [Deferred] (requires approval)
                                         ↓
                                   [Not a Bug] (requires approval)
```

---

## SPR Priority and Severity Definitions

### Severity Levels
- **Critical**: System crash, data loss, security vulnerability
- **High**: Major feature broken, workaround difficult
- **Medium**: Feature partially broken, workaround available
- **Low**: Cosmetic issue, minor inconvenience

### Priority Levels
- **P0**: Must fix before release (blocker)
- **P1**: Should fix before release
- **P2**: Fix if time permits
- **P3**: Fix in future release

---

## SPR Template

```
SPR-###: [Short Description]

**Severity**: Critical / High / Medium / Low
**Priority**: P0 / P1 / P2 / P3
**Status**: New / Assigned / In Progress / Fixed / Verified / Closed / Deferred / Not a Bug

**Module**: [e.g., authService, reportsService, LoginScreen]
**Found In**: [Test ID or version]
**Found By**: [Tester name]
**Date Reported**: MM/DD/YYYY

**Description**:
[Detailed description of the problem]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Environment**:
- OS: [Windows 11, macOS, etc.]
- Browser: [Chrome 120, etc.]
- Device: [Desktop, iPhone 14, etc.]
- Backend Version: [commit hash or version]
- Frontend Version: [commit hash or version]

**Screenshots/Logs**:
[Attach if available]

**Assigned To**: [Developer name]
**Fixed In**: [Commit hash / build number]
**Verified By**: [Tester name]
**Date Closed**: MM/DD/YYYY

**Comments**:
[Additional notes, workarounds, etc.]

**Related SPRs**: [SPR-### if related to other bugs]
```

---

## Active SPRs

### SPR-007: Login Rate Limiting Not Enforced

**Severity**: High
**Priority**: P1
**Status**: New

**Module**: auth.js (routes)
**Found In**: IT-API-003
**Found By**: Automated Test Executor - Integration Tests
**Date Reported**: 11/23/2025

**Description**:
Rate limiting is configured on the login endpoint (max: 5 attempts per 15 minutes) but is not being enforced. Multiple failed login attempts beyond the limit do not result in HTTP 429 (Too Many Requests) response.

**Steps to Reproduce**:
1. Make 6 rapid POST requests to `/v1/auth/login` with invalid credentials
2. Observe response from 6th attempt

**Expected Result**:
- 6th attempt returns HTTP 429 (Too Many Requests)
- Error message: "Too many failed login attempts. Please try again in 15 minutes."
- RetryAfter header present

**Actual Result**:
- 6th attempt returns HTTP 401 (Unauthorized)
- Message: "Invalid username or password"
- Rate limiting never triggers

**Environment**:
- Backend: Fastify 5.6.0
- Rate Limit Plugin: @fastify/rate-limit (configured in route)

**Code Location**:
- [auth.js:41-53](c:\Data\CSCI_275\CSCI_275\Backend\src\routes\auth.js#L41-L53) (rate limit config)

**Root Cause**:
To be investigated - possible causes:
1. Rate limit plugin not registered in server
2. Rate limit configuration not working correctly
3. Rate limit only applies to successful logins, not failed attempts

**Security Impact**:
Without rate limiting, the system is vulnerable to brute-force password attacks.

**Assigned To**: [To be assigned]
**Status**: New

---

### SPR-006: Report Status Enum Type Casting Error

**Severity**: Critical
**Priority**: P0
**Status**: New

**Module**: reportsService.js
**Found In**: UT-REPORTS-001, UT-REPORTS-002, UT-REPORTS-003, UT-REPORTS-004
**Found By**: Automated Test Executor
**Date Reported**: 11/23/2025

**Description**:
When creating or updating monthly reports, the database query fails with error "inconsistent types deduced for parameter $6" because PostgreSQL cannot determine that the status parameter should be cast to the `report_status` enum type.

**Steps to Reproduce**:
1. Call `reportsService.saveMonthlyReport()` with any valid report data
2. Include `status: 'Draft'` in the data
3. Observe SQL error: "inconsistent types deduced for parameter $6"

**Expected Result**:
Report created successfully with status set to 'Draft'

**Actual Result**:
SQL error: "inconsistent types deduced for parameter $6", detail: "text versus report_status"

**Environment**:
- Backend: Node.js 22.x
- Database: PostgreSQL 16
- Fastify: 5.6.0

**Code Location**:
- [reportsService.js:210-221](c:\Data\CSCI_275\CSCI_275\Backend\src\services\reportsService.js#L210-L221) (INSERT query)
- [reportsService.js:196](c:\Data\CSCI_275\CSCI_275\Backend\src\services\reportsService.js#L196) (UPDATE query)

**Root Cause**:
Missing explicit type cast to `report_status` enum in SQL queries

**Proposed Fix**:
Add `::report_status` type casting to status parameters in SQL queries

**Assigned To**: Development Team
**Fixed In**: Current session
**Date Fixed**: 11/23/2025
**Status**: Verified

**Fix Description**:
Added explicit `::report_status` type casting to SQL queries in reportsService.js:
- Line 196: `submission_status = $1::report_status`
- Line 197: `CASE WHEN $1::report_status = 'Submitted'`
- Line 219: `VALUES (..., $6::report_status, CASE WHEN $6::report_status = 'Submitted' ...)`

**Files Changed**:
- Backend/src/services/reportsService.js (lines 196, 197, 219)

**Verification Status**: ✅ VERIFIED
**Verified By**: Automated Test Executor
**Date Verified**: 11/23/2025
**Regression Tests**: All 4 report tests now PASS (UT-REPORTS-001 through UT-REPORTS-004)

---

### SPR-001: Login Fails with Case-Sensitive Username

**Severity**: High
**Priority**: P1
**Status**: Fixed

**Module**: authController.js
**Found In**: IT-API-001
**Found By**: QA Team
**Date Reported**: 01/15/2025

**Description**:
User login fails when username is entered in different case than stored in database.

**Steps to Reproduce**:
1. Register user with username "testuser" (lowercase)
2. Attempt to login with "TESTUSER" (uppercase)
3. Login fails with "Invalid credentials" error

**Expected Result**:
Login succeeds regardless of case (case-insensitive)

**Actual Result**:
Login fails, error "Invalid credentials"

**Environment**:
- OS: Windows 11
- Browser: Chrome 120
- Backend Version: commit abc123

**Assigned To**: Developer A
**Fixed In**: commit def456
**Verified By**: QA Team
**Date Closed**: 01/16/2025

**Fix Description**:
Added `LOWER()` function to username comparison in SQL query in `authService.findStaffByUserId()`

---

### SPR-002: Negative Values Accepted in OPD Section

**Severity**: Critical
**Priority**: P0
**Status**: Fixed

**Module**: reportsService.js
**Found In**: UT-REPORTS-002
**Found By**: QA Team
**Date Reported**: 01/15/2025

**Description**:
System accepts negative values in OPD section when submitting monthly report, which is logically impossible.

**Steps to Reproduce**:
1. Create monthly report
2. Enter OPD Bovine New: "-10"
3. Click Submit
4. Report is submitted successfully

**Expected Result**:
Validation error: "Cannot have negative values"

**Actual Result**:
Report submitted, negative value stored in database

**Environment**:
- Browser: Firefox 120
- Frontend Version: commit xyz789

**Assigned To**: Developer B
**Fixed In**: commit ghi012
**Verified By**: QA Team
**Date Closed**: 01/17/2025

**Fix Description**:
Re-enabled validation in `reportsService.saveMonthlyReport()` (was temporarily disabled for testing). Added validation for all numeric fields across all report sections.

---

### SPR-003: Mobile Scroll Issue on Create Report Page

**Severity**: High
**Priority**: P1
**Status**: In Progress

**Module**: CreateReportScreen.tsx
**Found In**: Manual Testing - Scenario 6
**Found By**: Beta Tester
**Date Reported**: 01/18/2025

**Description**:
On iOS devices, the Create Report page does not scroll properly. Content is cut off at the bottom and cannot be accessed.

**Steps to Reproduce**:
1. Open PWA on iPhone 14 (iOS 17)
2. Navigate to Create Report
3. Fill first few sections
4. Try to scroll down to Extension section
5. Scrolling does not work, content is cut off

**Expected Result**:
Page scrolls smoothly, all sections accessible

**Actual Result**:
Page does not scroll, bottom content inaccessible

**Environment**:
- OS: iOS 17.2
- Browser: Safari
- Device: iPhone 14
- Screen: 390x844

**Screenshots**:
[Attached: screenshot-scroll-issue.png]

**Assigned To**: Developer C
**Status**: In Progress
**ETA**: 01/20/2025

**Comments**:
- Issue specific to iOS Safari
- Works fine on Android Chrome
- Likely related to flexbox layout and safe-area-inset

---

### SPR-004: API Returns 500 on Concurrent Report Submissions

**Severity**: Critical
**Priority**: P0
**Status**: New

**Module**: reportsController.js
**Found In**: PT-003 (Concurrent Users Test)
**Found By**: QA Team
**Date Reported**: 01/19/2025

**Description**:
When multiple users submit monthly reports simultaneously, some requests fail with HTTP 500 Internal Server Error.

**Steps to Reproduce**:
1. Use JMeter to simulate 10 concurrent users
2. All users submit monthly report at same time
3. Observe 3-4 requests fail with 500 error

**Expected Result**:
All requests succeed, reports created concurrently

**Actual Result**:
30-40% of requests fail with 500 error

**Server Logs**:
```
Error: deadlock detected
  at reportsService.saveMonthlyReport
  ...
```

**Environment**:
- Backend: Node.js 22.0
- Database: PostgreSQL 16
- Concurrent Users: 10

**Assigned To**: [Not yet assigned]
**Status**: New
**Priority**: P0 - Must fix before release

**Comments**:
- Appears to be database transaction deadlock
- Needs investigation of transaction isolation level
- May need to implement queue for report submissions

---

### SPR-005: Password Stored in Plain Text

**Severity**: Critical
**Priority**: P0
**Status**: Deferred

**Module**: authService.js
**Found In**: Code Inspection
**Found By**: Security Audit
**Date Reported**: 01/20/2025

**Description**:
User passwords are currently stored in plain text in the database instead of being hashed with Argon2id as specified in the design.

**Security Risk**:
High - In case of database breach, all user passwords would be exposed.

**Expected Behavior**:
Passwords hashed with Argon2id before storage

**Actual Behavior**:
Passwords stored as plain text

**Code Location**:
`authService.js` line 90: `verifyPassword()` function uses plain text comparison

**Assigned To**: Security Team
**Status**: Deferred
**Reason**: Known issue, planned for Sprint 2 implementation

**Mitigation**:
- Added to technical debt backlog
- Will implement before production release
- Currently acceptable for development/testing only

**Approval**: Project Manager (Signed: _________)
**Target Fix**: Sprint 2 (Week 6-8)

---

## SPR Statistics

### By Status
| Status | Count |
|--------|-------|
| New | 1 |
| Assigned | 0 |
| In Progress | 1 |
| Fixed | 2 |
| Verified | 3 |
| Closed | 2 |
| Deferred | 1 |
| Not a Bug | 0 |
| **Total** | **6** |

### By Severity
| Severity | Count |
|----------|-------|
| Critical | 4 |
| High | 2 |
| Medium | 0 |
| Low | 0 |
| **Total** | **6** |

### By Priority
| Priority | Count |
|----------|-------|
| P0 | 4 |
| P1 | 2 |
| P2 | 0 |
| P3 | 0 |
| **Total** | **6** |

### By Module
| Module | Count |
|--------|-------|
| authService/Controller | 2 |
| reportsService/Controller | 3 |
| CreateReportScreen | 1 |
| **Total** | **6** |

---

## Defect Metrics

### Defect Density
- **Lines of Code (LOC)**: ~10,000 (estimate)
- **Defects Found**: 5
- **Defect Density**: 0.5 defects/KLOC (very good)

### Find-Fix Cycle Time
| SPR | Found Date | Fixed Date | Cycle Time |
|-----|------------|------------|------------|
| SPR-001 | 01/15 | 01/16 | 1 day |
| SPR-002 | 01/15 | 01/17 | 2 days |
| SPR-003 | 01/18 | In Progress | - |
| SPR-004 | 01/19 | Not Started | - |
| SPR-005 | 01/20 | Deferred | - |

**Average Fix Time**: 1.5 days (for completed bugs)

### Test Effectiveness
- **Total Tests Run**: 50
- **Bugs Found**: 5
- **Tests per Bug**: 10:1 ratio (good)

---

## SPR Review Meetings

### Weekly SPR Review - Jan 22, 2025

**Attendees**: QA Manager, Dev Lead, Project Manager

**Decisions**:
1. SPR-004 (Concurrent submissions) assigned to Senior Developer
   - Target fix: Jan 23
   - Will implement request queuing
2. SPR-003 (iOS scroll) approved for fix
   - Use flexbox layout pattern from ProfileScreen
3. SPR-005 (Plain text passwords) defer to Sprint 2
   - Approved by Project Manager
   - Document security risk accepted for dev/test only

**Action Items**:
- [ ] Dev Lead: Assign SPR-004 to Senior Dev
- [ ] QA: Prepare regression test for SPR-001, SPR-002
- [ ] Security: Document password hashing requirements for Sprint 2

---

## Baseline Change Assessment

### Baseline 1.0 → 1.1 (After SPR-001, SPR-002 fixes)

**Files Changed**:
1. `Backend/src/services/authService.js`
   - SPR-001 fix
   - Lines changed: 37-38
   - Code review: ✅ Approved

2. `Backend/src/services/reportsService.js`
   - SPR-002 fix
   - Lines changed: 143-151 (re-enabled validation)
   - Code review: ✅ Approved

**Regression Tests Run**: 25
**New Bugs Introduced**: 0
**Baseline Approved**: ✅ Yes

---

## Defect Prevention

**Lessons Learned**:
1. **SPR-001**: Need code review checklist item for case-insensitive comparisons
2. **SPR-002**: Never disable validation code, even temporarily - use feature flags instead
3. **SPR-003**: Test on real iOS devices early, not just emulators
4. **SPR-004**: Load testing should be done earlier in development
5. **SPR-005**: Security requirements must be implemented from day 1, not deferred

**Process Improvements**:
- [ ] Add "case-insensitive string comparison" to code review checklist
- [ ] Require iOS device testing before each release
- [ ] Add load testing to CI/CD pipeline
- [ ] Security audit at start of each sprint

---

## SPR Approval for Deferral/Not a Bug

**Deferred SPRs** (Require approval):

| SPR | Reason | Approved By | Date | Comments |
|-----|--------|-------------|------|----------|
| SPR-005 | Low risk in dev/test, will fix in Sprint 2 | Project Manager | 01/20/2025 | Acceptable for non-prod only |

**Not a Bug** (Require explanation):

| SPR | Reason | Approved By | Date | Comments |
|-----|--------|-------------|------|----------|
| [None] | - | - | - | - |

---

## Contact

**SPR Submissions**: Email to qa-team@ahpunjab.gov.in
**SPR Questions**: Contact QA Manager
**Emergency P0 Bugs**: Call hotline xxx-xxxx

---

**End of SPR Tracking Document**

**Last Updated**: Jan 20, 2025
**Next Review**: Jan 27, 2025
