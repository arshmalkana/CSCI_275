# Manual Testing Guide - AH Punjab Reporting System

## Overview
This document provides manual testing scenarios covering critical user workflows, UI testing, and acceptance criteria based on Software Engineering Chapter 8 testing principles.

---

## Testing Preparation

### Test Environment Setup
1. **Backend**: Ensure backend is running on `http://localhost:8080`
2. **Frontend**: Ensure frontend is running on `http://localhost:3000`
3. **Database**: PostgreSQL with test data seeded
4. **Browser**: Test on Chrome, Firefox, Safari (mobile: iOS Safari, Android Chrome)
5. **Test Accounts**:
   - Staff User: `testuser` / `password123`
   - Admin User: `admin` / `admin123`

---

## Phase 1: Validation Testing (30 minutes)

### Scenario 1: User Authentication Flow

**Objective**: Verify complete authentication workflow

**Test Steps**:
1. Navigate to `http://localhost:3000`
2. Verify login screen displays correctly
3. Test **invalid credentials**:
   - Username: `wronguser` / Password: `wrongpassword`
   - Expected: Error message "Invalid credentials"
4. Test **empty fields**:
   - Leave username blank, click login
   - Expected: Validation error "Username is required"
   - Leave password blank, click login
   - Expected: Validation error "Password is required"
5. Test **valid credentials**:
   - Username: `testuser` / Password: `password123`
   - Expected: Redirect to Home screen, see dashboard
6. Verify **user info displayed**:
   - Check header shows user name
   - Check profile icon visible
7. Test **logout**:
   - Click profile → Logout
   - Expected: Redirect to login screen

**Pass Criteria**: ✅ All validations work, successful login/logout

---

### Scenario 2: Passkey (WebAuthn) Setup and Usage

**Objective**: Test biometric authentication flow

**Test Steps**:
1. Login with password
2. Navigate to Profile → Security → Passkey Setup
3. Click "Setup Passkey"
4. Follow browser prompts for biometric/PIN setup
5. Verify passkey created successfully
6. Logout
7. Login again - enter username
8. System should detect passkey available
9. Click "Use Passkey" button
10. Authenticate with biometric
11. Verify login successful

**Pass Criteria**: ✅ Passkey setup works, login with passkey succeeds

---

### Scenario 3: Monthly Report Creation - Draft Flow

**Objective**: Test report creation with draft saving

**Test Steps**:
1. Login as staff user
2. Click "Create Report" or navigate to Reports → New Report
3. Select reporting month: Current month
4. **OPD Section**:
   - Enter data for Bovine: New: `10`, Old: `5`, Beneficiaries: `12`
   - Enter data for Small Animals: New: `8`, Old: `3`, Beneficiaries: `9`
5. Click "Save as Draft"
6. Expected: Success message, report saved
7. Navigate away (go to Home)
8. Return to Reports → View Reports
9. Find the draft report (status: "Draft")
10. Open the draft
11. Verify data is preserved
12. **AI Section**:
    - Select breed: HF (Holstein Friesian)
    - Current Period: AI Done: `20`, Animals Covered: `18`, Beneficiaries: `15`
13. **Certificate Section**:
    - Health Certificates: Large Animals: `5`, Small Animals: `3`
14. **Lab Section**:
    - Blood Test: Count: `10`, Beneficiaries: `8`
15. **Extension Section**:
    - Farmer Awareness: Camps: `2`, Villages: `2`, Farmers: `50`, Animals: `80`
16. Click "Save as Draft" again
17. Verify draft updated successfully

**Pass Criteria**: ✅ Draft created, data saved, can resume editing

---

### Scenario 4: Monthly Report Submission with Validation

**Objective**: Test report submission and validation rules

**Test Steps**:
1. Open a draft report
2. **Test Negative Value Validation**:
   - In OPD section, enter `-5` for Bovine New cases
   - Click "Submit"
   - Expected: Error message "Cannot have negative values"
3. Correct the value to `10`
4. **Test Logical Validation (AI Reports)**:
   - AI Done: `10`, Animals Covered: `15` (covered > AI done)
   - Click "Submit"
   - Expected: Error "Animals covered cannot exceed AI done"
5. Correct the values: AI Done: `20`, Animals Covered: `15`
6. **Test High Value Warning**:
   - Enter OPD Bovine New: `150000` (> 100,000)
   - Expected: Warning about unusually high value
7. Correct to reasonable value: `100`
8. Fill all required sections
9. Click "Submit"
10. Expected: Success message, status changes to "Submitted"
11. Verify notification sent to admin

**Pass Criteria**: ✅ Validations work, submission succeeds with valid data

---

### Scenario 5: Admin Report Approval Workflow

**Objective**: Test admin review and approval flow

**Test Steps**:
1. Logout from staff account
2. Login as admin: `admin` / `admin123`
3. Navigate to Dashboard
4. Verify "Pending Reports" count shows submitted reports
5. Click "View Pending Reports"
6. Select a submitted report
7. Review the data in each section
8. **Test Approval**:
   - Click "Approve" button
   - Add comment: "Report looks good"
   - Confirm approval
   - Expected: Report status changes to "Approved"
9. Verify notification sent to staff member
10. **Test Rejection** (on another report):
    - Click "Reject" button
    - Add comment: "Please correct OPD numbers"
    - Confirm rejection
    - Expected: Report status changes to "Rejected"
11. Verify staff member receives notification

**Pass Criteria**: ✅ Approval/rejection works, notifications sent

---

## Phase 2: Defect Testing (30 minutes)

### Scenario 6: Mobile Responsiveness Testing

**Objective**: Verify PWA works on mobile devices

**Test Steps**:
1. Open on mobile browser (iOS Safari or Android Chrome)
2. Test portrait and landscape orientations
3. Verify:
   - Login screen fits without scrolling
   - Buttons are tap-friendly (not too small)
   - Forms are easy to fill on mobile
   - Scrolling works smoothly (especially in Create Report)
   - Fixed header/footer don't overlap content
4. **Test PWA Installation**:
   - iOS: Share → Add to Home Screen
   - Android: Browser menu → Install App
5. Open installed PWA
6. Verify app icon and splash screen
7. Test offline detection:
   - Turn on airplane mode
   - App should show "You are offline" message

**Pass Criteria**: ✅ Mobile UI works, PWA installs, offline detection works

---

### Scenario 7: Concurrent User Testing

**Objective**: Test system with multiple users simultaneously

**Test Steps**:
1. Open 3 browser tabs/windows
2. **Tab 1**: Login as staff user 1
3. **Tab 2**: Login as staff user 2
4. **Tab 3**: Login as admin
5. **Tab 1**: Create and submit a report
6. **Tab 3** (admin): Verify report appears in pending list immediately
7. **Tab 2**: Create a draft report
8. **Tab 1**: Edit same draft (if shared) - test concurrent editing
9. Verify no data corruption
10. **Tab 3**: Approve Tab 1's report
11. **Tab 1**: Verify notification received in real-time (or on refresh)

**Pass Criteria**: ✅ Concurrent access works, no data conflicts

---

### Scenario 8: Data Integrity Testing

**Objective**: Verify data is saved correctly and consistently

**Test Steps**:
1. Create a monthly report with specific data:
   - OPD Bovine New: `25`
   - AI HF Current: `15`
   - Certificates Health: `10`
2. Submit the report
3. **Browser DevTools**: Open Network tab
4. Verify API request payload contains correct data
5. **Database Verification** (if access available):
   ```sql
   SELECT * FROM monthly_reports WHERE reporting_month = '2025-01';
   SELECT * FROM opd_report_details WHERE report_id = 1;
   ```
6. Verify database values match entered values
7. Reload the page
8. Open the report again
9. Verify all data displays correctly
10. Export or print report (if feature exists)
11. Verify exported data matches

**Pass Criteria**: ✅ Data saved correctly, no data loss on reload

---

### Scenario 9: Error Handling and Recovery

**Objective**: Test system behavior under error conditions

**Test Steps**:
1. **Network Interruption**:
   - Start creating a report
   - Midway through, disconnect internet
   - Try to save draft
   - Expected: Error message "Network error, please try again"
   - Reconnect internet
   - Save draft again
   - Expected: Success
2. **Server Timeout**:
   - Submit a report
   - If backend is slow, observe loading state
   - Expected: Loading indicator shown, no double submission
3. **Invalid Token**:
   - Clear localStorage (Dev Tools → Application → Local Storage)
   - Try to access protected page
   - Expected: Redirect to login
4. **Session Expiry**:
   - Login and wait 16 minutes (token expires after 15 min)
   - Try to access a page
   - Expected: Token refresh automatic, or redirect to login

**Pass Criteria**: ✅ Errors handled gracefully, recovery works

---

### Scenario 10: Cross-Browser Compatibility

**Objective**: Verify app works across different browsers

**Test Steps**:
1. Test on **Chrome**:
   - Login, create report, submit
   - Verify all features work
2. Test on **Firefox**:
   - Repeat same workflow
   - Check for any styling issues
3. Test on **Safari** (Mac/iOS):
   - Repeat same workflow
   - Pay attention to date pickers, dropdowns
4. Test on **Edge**:
   - Repeat same workflow
5. **Specific Checks**:
   - Floating labels animation
   - Date picker format
   - Dropdown styling
   - Button hover effects
   - Form validation messages

**Pass Criteria**: ✅ Works consistently across all browsers

---

## Phase 3: Performance Testing (20 minutes)

### Scenario 11: Load Time Testing

**Objective**: Verify app loads quickly

**Test Steps**:
1. Open Chrome DevTools → Network tab
2. Set throttling to "Fast 3G" (simulates mobile network)
3. Clear cache and hard reload
4. Measure:
   - **Initial load**: Should be < 3 seconds
   - **Login**: Should respond < 1 second
   - **Dashboard load**: Should be < 2 seconds
   - **Report submission**: Should be < 1 second
5. Check Lighthouse score:
   - Open DevTools → Lighthouse
   - Run audit for Performance
   - Expected: Score > 80

**Pass Criteria**: ✅ Load times acceptable, Lighthouse score > 80

---

### Scenario 12: Large Data Volume Testing

**Objective**: Test with many records

**Test Steps**:
1. Navigate to Reports list
2. If possible, create 50+ reports (use script or manual)
3. **Test Pagination**:
   - Verify reports list loads quickly
   - Test scrolling through many records
4. **Test Filtering**:
   - Filter by status: "Approved"
   - Filter by fiscal year
   - Filter by month
5. **Test Search**:
   - Search for specific report
6. Verify response time remains fast

**Pass Criteria**: ✅ App remains responsive with large datasets

---

## Phase 4: User Acceptance Testing (30 minutes)

### Scenario 13: Real-World Workflow - Field Veterinarian

**User Persona**: George, Field Veterinarian in rural Punjab

**Context**: George visits 5 villages daily, treats animals, and needs to report monthly

**Test Steps**:
1. **Morning**: George logs in on mobile
2. Checks notifications for pending tasks
3. **During Day**: Takes notes on paper:
   - Village 1: 5 cattle OPD cases
   - Village 2: 3 AI services on buffalo
   - Village 3: 2 health certificates issued
4. **Evening**: Opens PWA on phone
5. Creates monthly report
6. Enters all data from paper notes
7. Realizes he forgot one entry
8. Saves as draft
9. **Next Day**: Reopens draft
10. Completes missing data
11. Reviews entire report
12. Submits
13. Receives confirmation
14. **Week Later**: Admin approves
15. George receives notification
16. Views approved report for his records

**Pass Criteria**: ✅ Workflow matches real use case, easy to use

---

### Scenario 14: Real-World Workflow - District Veterinary Officer (Admin)

**User Persona**: Dr. Sarah, DVO overseeing 10 CVHs

**Context**: Monthly review and approval of subordinate reports

**Test Steps**:
1. **1st of Month**: Sarah logs in
2. Dashboard shows:
   - 8 reports submitted
   - 2 reports pending (not yet submitted)
3. Clicks "Review Reports"
4. Opens first submitted report
5. Reviews OPD numbers - seem reasonable
6. Reviews AI data - notices one anomaly:
   - HF AI: 50 done, but only 5 tested 3 months ago
   - This seems inconsistent
7. Adds comment: "Please explain low testing rate"
8. **Rejects** report
9. Opens next report
10. All data looks good
11. **Approves** report
12. Continues reviewing remaining 6 reports
13. Approves 5, rejects 1
14. Views summary: 6 approved, 2 rejected, 2 not submitted
15. Sends reminder to staff who haven't submitted

**Pass Criteria**: ✅ Admin workflow efficient, can review quickly

---

## Phase 5: Security Testing (20 minutes)

### Scenario 15: Authorization and Access Control

**Objective**: Verify users can only access their authorized data

**Test Steps**:
1. Login as staff user (non-admin)
2. Try to access admin routes (if direct URL available):
   - `/admin/dashboard`
   - `/admin/users`
3. Expected: Access denied or redirect
4. Verify staff can only see their own reports (not other staff's)
5. Logout
6. Try to access protected route while logged out: `/reports`
7. Expected: Redirect to login
8. Login as admin
9. Verify admin can see all reports from subordinates
10. Verify admin cannot access HQ-only features (if role-based)

**Pass Criteria**: ✅ Authorization rules enforced correctly

---

### Scenario 16: Input Sanitization and XSS Prevention

**Objective**: Verify app is protected against XSS attacks

**Test Steps**:
1. In any text input field, try entering:
   - `<script>alert('XSS')</script>`
   - `<img src=x onerror=alert('XSS')>`
   - `javascript:alert('XSS')`
2. Save and reload page
3. Expected: Scripts do not execute, displayed as plain text
4. Try SQL injection patterns:
   - Username: `' OR '1'='1`
   - Password: `' OR '1'='1`
5. Expected: Login fails, no SQL error exposed
6. Verify error messages don't expose sensitive info

**Pass Criteria**: ✅ XSS prevented, SQL injection protected

---

## Acceptance Criteria Checklist

### Functional Requirements
- [ ] User can register institute and create account
- [ ] User can login with username/password
- [ ] User can setup and use passkey (WebAuthn)
- [ ] User can create monthly report (all sections)
- [ ] User can save report as draft
- [ ] User can submit report
- [ ] System validates negative values
- [ ] System validates logical consistency (AI reports)
- [ ] Admin can view pending reports
- [ ] Admin can approve/reject reports
- [ ] Admin can add comments
- [ ] Staff receives notifications on approval/rejection
- [ ] User can view report history
- [ ] User can filter reports by status/month/year
- [ ] User can update profile information
- [ ] User can change password
- [ ] User can logout

### Non-Functional Requirements
- [ ] App loads in < 3 seconds on 3G network
- [ ] API responds in < 1 second for typical requests
- [ ] PWA installable on iOS and Android
- [ ] Works offline (shows offline message)
- [ ] Mobile-responsive on screens 360px - 1920px wide
- [ ] Accessible via keyboard navigation
- [ ] Works on Chrome, Firefox, Safari, Edge
- [ ] No XSS vulnerabilities
- [ ] No SQL injection vulnerabilities
- [ ] Authorization enforced on all protected routes
- [ ] Session expires after 15 minutes of inactivity
- [ ] Refresh token rotates on use

### Usability Requirements
- [ ] Forms are easy to fill on mobile
- [ ] Error messages are clear and helpful
- [ ] Success messages are shown for all actions
- [ ] Loading indicators shown during async operations
- [ ] Buttons are tap-friendly (min 44x44px)
- [ ] Color contrast meets WCAG AA standards
- [ ] Font size readable on mobile (min 16px)

---

## Bug Reporting Template

When you find a bug during manual testing, report it using this format:

```
**Bug ID**: BUG-001
**Title**: [Short description]
**Severity**: Critical / High / Medium / Low
**Priority**: P0 / P1 / P2 / P3

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots**:
[Attach if applicable]

**Environment**:
- Browser: Chrome 120
- OS: Windows 11
- Device: Desktop
- Screen Size: 1920x1080

**Additional Notes**:
[Any other relevant information]
```

---

## Test Completion Report

After completing all manual tests, fill out this summary:

```
**Test Date**: [Date]
**Tester**: [Your Name]
**Environment**: [Dev/Staging/Production]

**Summary**:
- Total Scenarios Tested: 16
- Passed: [Number]
- Failed: [Number]
- Blocked: [Number]

**Critical Bugs Found**: [Number]
**High Priority Bugs**: [Number]
**Medium/Low Bugs**: [Number]

**Recommendation**: [ ] Ready for Release  [ ] Needs Fixes

**Comments**:
[Additional notes, observations, suggestions]
```

---

## Tips for Effective Manual Testing

1. **Test with fresh eyes**: Don't test immediately after coding
2. **Use real data**: Test with realistic data, not just "test" or "123"
3. **Test edge cases**: Empty fields, very long inputs, special characters
4. **Test as end user**: Forget you know how it's supposed to work
5. **Test on real devices**: Emulators don't catch everything
6. **Take screenshots**: Document bugs with visual proof
7. **Test in sequence**: Follow real user workflows, not random clicks
8. **Note your findings**: Keep a testing journal of observations
9. **Retest after fixes**: Verify bugs are actually fixed
10. **Report positives too**: Note what works well, not just what breaks

---

## Appendix: Test Data

### Sample Test Accounts
```
Staff User 1:
- Username: testuser
- Password: password123
- Role: staff
- Institute: CVH Ludhiana

Admin User:
- Username: admin
- Password: admin123
- Role: admin
- Institute: DVH Ludhiana

HQ Staff:
- Username: hqstaff
- Password: hq123
- Role: hq_staff
- Institute: HQ Punjab
```

### Sample Report Data
```json
{
  "reportingMonth": "2025-01",
  "opd": {
    "bovine": {
      "new": 25,
      "old": 10,
      "beneficiaries": 30
    }
  },
  "aiReports": {
    "localSemen": {
      "HF": {
        "current": {
          "ai": 20,
          "covered": 18,
          "beneficiaries": 15
        }
      }
    }
  },
  "certificates": {
    "healthCertificates": {
      "largeAnimals": 10,
      "smallAnimals": 5,
      "beneficiaries": 12
    }
  }
}
```

---

**End of Manual Testing Guide**
