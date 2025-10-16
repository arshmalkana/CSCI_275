# Security Fixes - Implementation Summary

## What I've Done So Far

### ✅ 1. WebAuthn Challenge Storage - Database Migration Created
**File**: `Database/init/08-webauthn-challenges.sql`

**What it does**:
- Creates `webauthn_challenges` table to replace in-memory Map
- Adds indexes for fast lookup and cleanup
- Includes auto-cleanup function for expired challenges
- Stores IP address and user agent for audit trail

**Next step**: Run this migration on your database:
```bash
cd Database
docker exec -i ahpunjab-postgres psql -U ahpunjab -d ahpunjab_db < init/08-webauthn-challenges.sql
```

---

## What Needs To Be Done

### 🔄 2. Update WebAuthn Service to Use Database
**File**: `Backend/src/services/webauthnService.js`

**Current issue**: Uses `challengeStore = new Map()` on line 18

**Required changes**:
1. Replace `challengeStore.set()` with database INSERT
2. Replace `challengeStore.get()` with database SELECT
3. Replace `challengeStore.delete()` with database DELETE
4. Add helper methods: `storeChallenge()`, `getChallenge()`, `deleteChallenge()`

**Estimated time**: 30 minutes

---

### 🔄 3. Remove Console.log Statements
**Files with console.log**:
- `Backend/src/services/webauthnService.js` (lines 110, 114, 135, 191)
- `Backend/src/controllers/webauthnController.js` (lines 37, 72, 101, 169, 198, 230)
- `Backend/src/controllers/authController.js` (check for any)
- `Backend/src/services/homeService.js` (line 329)

**Solution**: Replace with proper logging:
```javascript
// Instead of
console.log('Debug info:', data)
console.error('Error:', error)

// Use
fastify.log.info({ data }, 'Debug info')
fastify.log.error({ error }, 'Error occurred')
```

**Estimated time**: 15 minutes

---

### 🔄 4. Add Input Sanitization Middleware
**New file**: `Backend/src/middleware/sanitize.js`

**Install dependencies**:
```bash
cd Backend
npm install isomorphic-dompurify validator
```

**Create middleware** (see SECURITY_IMPROVEMENTS.md for complete code)

**Register in server.js**:
```javascript
import { sanitizeInput } from './middleware/sanitize.js'
fastify.addHook('preHandler', sanitizeInput)
```

**Estimated time**: 30 minutes

---

### 🔄 5. Add Rate Limiting
**New file**: `Backend/src/plugins/rateLimiter.js`

**Install dependency**:
```bash
cd Backend
npm install @fastify/rate-limit
```

**Configuration**:
- `/auth/login`: 5 attempts per 15 min
- `/auth/register`: 3 attempts per hour
- `/auth/refresh`: 10 attempts per 15 min
- All others: 100 requests per 15 min

**Register in server.js**:
```javascript
await fastify.register(import('./plugins/rateLimiter.js'))
```

**Estimated time**: 20 minutes

---

### 🔄 6. Fix Duplicate Code
**File**: `ahpunjabfrontend/src/screens/HomeScreen.tsx`

**Issue**: Lines 181-620 are duplicated at lines 781-1222

**Solution**: Delete lines 771-1222 (the duplicate section including getCategoryColor function at the end)

**Estimated time**: 2 minutes

---

### 🔄 7. Add Proper Error Handling
**New file**: `Backend/src/utils/errors.js`

**Custom error classes**:
- `ValidationError` (400)
- `AuthenticationError` (401)
- `AuthorizationError` (403)
- `NotFoundError` (404)
- `DatabaseError` (500)

**Replace generic catches**:
```javascript
// Instead of
try {
  //...
} catch (error) {
  console.error('Error:', error)
  return reply.code(500).send({ message: 'Error' })
}

// Use
try {
  //...
} catch (error) {
  if (error instanceof ValidationError) {
    return reply.code(400).send({ error: error.message, field: error.field })
  }
  if (error instanceof AuthenticationError) {
    return reply.code(401).send({ error: error.message })
  }
  // ... handle other specific errors
  throw error // Let error handler deal with unexpected errors
}
```

**Estimated time**: 1 hour (across all controllers)

---

### 🔄 8. Add Comprehensive Validation
**New file**: `Backend/src/utils/validation.js`

**Add validation schemas** for:
- Email format
- Phone numbers (Indian format)
- Password strength (min 8 chars, uppercase, lowercase, number)
- User ID format
- Enum values (role, status, etc.)

**Use in controllers**:
```javascript
import { validateEmail, validatePassword } from '../utils/validation.js'

if (!validateEmail(email)) {
  throw new ValidationError('Invalid email format', 'email')
}
```

**Estimated time**: 45 minutes

---

## Implementation Priority

### Critical (Do First) - 2 hours
1. ✅ Database migration for challenges
2. 🔄 Update WebAuthn service to use database
3. 🔄 Add input sanitization middleware
4. 🔄 Add rate limiting on auth endpoints

### High Priority - 1.5 hours
5. 🔄 Remove all console.log statements
6. 🔄 Add proper error handling classes
7. 🔄 Add validation utilities

### Medium Priority - 15 minutes
8. 🔄 Fix duplicate code in HomeScreen

---

## Quick Start Guide

### Step 1: Install Dependencies (2 minutes)
```bash
cd Backend
npm install @fastify/rate-limit isomorphic-dompurify validator pino pino-pretty
```

### Step 2: Run Database Migration (1 minute)
```bash
cd Database
docker exec -i ahpunjab-postgres psql -U ahpunjab -d ahpunjab_db < init/08-webauthn-challenges.sql
```

### Step 3: Create Utility Files (10 minutes)
Copy the implementations from `SECURITY_IMPROVEMENTS.md`:
- `Backend/src/middleware/sanitize.js`
- `Backend/src/plugins/rateLimiter.js`
- `Backend/src/utils/errors.js`
- `Backend/src/utils/logger.js`
- `Backend/src/utils/validation.js`

### Step 4: Update WebAuthn Service (30 minutes)
Refactor `webauthnService.js` to use database instead of Map.

### Step 5: Update Server.js (5 minutes)
Register new middleware and plugins.

### Step 6: Clean Up (20 minutes)
- Remove console.log statements
- Fix duplicate code
- Update error handling

### Step 7: Test (30 minutes)
- Test login flow
- Test registration flow
- Test WebAuthn flow
- Test rate limiting
- Test input sanitization

---

## Testing Commands

### Test Rate Limiting
```bash
# Should succeed 5 times, then block
for i in {1..10}; do
  curl -X POST http://localhost:8080/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"userId":"test","password":"wrong"}'
  echo ""
done
```

### Test Input Sanitization
```bash
# Should sanitize <script> tags
curl -X POST http://localhost:8080/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"userId":"<script>alert(1)</script>","password":"Test1234"}'
```

### Test Challenge Storage
```bash
# Check challenges table
docker exec -it ahpunjab-postgres psql -U ahpunjab -d ahpunjab_db -c "SELECT * FROM webauthn_challenges;"
```

---

## Files Reference

### Created
- ✅ `Database/init/08-webauthn-challenges.sql`
- ✅ `SECURITY_IMPROVEMENTS.md` (detailed implementation guide)
- ✅ `SECURITY_FIXES_SUMMARY.md` (this file)

### Need to Create
- 🔄 `Backend/src/middleware/sanitize.js`
- 🔄 `Backend/src/plugins/rateLimiter.js`
- 🔄 `Backend/src/utils/errors.js`
- 🔄 `Backend/src/utils/logger.js`
- 🔄 `Backend/src/utils/validation.js`

### Need to Modify
- 🔄 `Backend/src/services/webauthnService.js`
- 🔄 `Backend/src/controllers/*.js` (all controllers)
- 🔄 `Backend/src/server.js`
- 🔄 `ahpunjabfrontend/src/screens/HomeScreen.tsx`

---

## Estimated Total Time

| Task | Time |
|------|------|
| Install dependencies | 2 min |
| Run DB migration | 1 min |
| Create utility files | 10 min |
| Update WebAuthn service | 30 min |
| Add middleware/plugins | 20 min |
| Update controllers | 60 min |
| Remove console.logs | 15 min |
| Fix duplicate code | 2 min |
| Testing | 30 min |
| **TOTAL** | **~3 hours** |

---

## Important Notes

1. **Backward Compatibility**: All changes are backward compatible
2. **No Breaking Changes**: Existing API contracts remain the same
3. **Database Migration**: Must be run before deploying new code
4. **Dependencies**: New npm packages required
5. **Environment Variables**: May need to add LOG_LEVEL, RATE_LIMIT_* vars
6. **Testing**: Test thoroughly in development before production

---

## Next Steps

Choose one of these approaches:

### Option A: Do It All Now (3 hours)
Follow the Quick Start Guide above and implement everything in one go.

### Option B: Phased Approach (Recommended)
1. **Today**: Critical fixes (database migration, rate limiting, sanitization)
2. **Tomorrow**: Error handling and validation
3. **Later**: Code cleanup and optimization

### Option C: I'll Do It For You
Let me know and I'll implement the critical fixes right now. Just approve and I'll start with:
1. Creating the middleware files
2. Updating webauthnService.js
3. Updating server.js
4. Removing console.logs

---

## Questions?

If anything is unclear, ask me and I'll provide:
- Complete code for any file
- Detailed explanation of any change
- Help with testing specific features
- Troubleshooting assistance

**Ready to proceed? Let me know which option you prefer!**
