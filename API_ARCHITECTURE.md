# API Architecture - Frontend

## Overview

The frontend uses a two-layer API architecture for clean separation of concerns:

```
React Components
      ↓
   api.ts (Application Layer - Business Logic)
      ↓
apiClient.ts (Infrastructure Layer - HTTP Client)
      ↓
   Backend API
```

---

## File Breakdown

### **1. `apiClient.ts` - HTTP Infrastructure Layer**

**Location**: `ahpunjabfrontend/src/utils/apiClient.ts`

**Purpose**: Low-level HTTP client that handles authentication mechanics

**Responsibilities**:
- ✅ Automatically attaches JWT tokens to all requests
- ✅ Detects expired tokens (401 responses)
- ✅ Refreshes tokens using refresh token cookie
- ✅ Saves rolling tokens from `X-New-Token` header
- ✅ Retries failed requests after token refresh
- ✅ Manages localStorage (authToken, tokenExpiry, user)
- ✅ Redirects to login on auth failure
- ✅ Includes cookies with `credentials: 'include'`

**Key Methods**:
```typescript
apiClient.fetch(url, options)      // Make authenticated request
apiClient.refreshToken()            // Refresh JWT token
apiClient.clearAuth()               // Clear auth data
apiClient.getBaseUrl()              // Get API base URL
```

**Configuration**:
- **Development**: `/v1` (proxied to `http://localhost:8080` by Vite)
- **Production**: `https://api-ahpunjab.itsarsh.dev/v1`

---

### **2. `api.ts` - Application Layer**

**Location**: `ahpunjabfrontend/src/utils/api.ts`

**Purpose**: High-level API interface with typed methods for specific endpoints

**Responsibilities**:
- ✅ Provides clean, typed API methods
- ✅ Handles JSON parsing and response validation
- ✅ Wraps errors with user-friendly messages
- ✅ Centralizes all endpoint definitions
- ✅ Uses `apiClient.ts` under the hood

**Available Endpoints**:
```typescript
// Home
api.getHomeData()                          // GET /v1/home

// Authentication
api.login({ userId, password })            // POST /v1/auth/login
api.register(userData)                     // POST /v1/auth/register
api.logout()                               // POST /v1/auth/logout

// More endpoints can be added here...
```

**Helper Functions**:
```typescript
apiGet(endpoint)                   // GET request
apiPost(endpoint, data)            // POST request
apiPut(endpoint, data)             // PUT request
apiDelete(endpoint)                // DELETE request
```

---

## Why Two Files?

### **Separation of Concerns**

**Without separation** (everything in one file):
```typescript
// ❌ Bad: Mixed concerns
async function getHomeData() {
  const token = localStorage.getItem('authToken')
  const response = await fetch('/v1/home', {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (response.status === 401) {
    // Handle token refresh
    const refreshRes = await fetch('/v1/auth/refresh', ...)
    // Save new token
    // Retry original request
    // Handle errors
    // Parse JSON
  }

  return response.json()
}
```

**With separation** (current architecture):
```typescript
// ✅ Good: Clean interface
async function getHomeData() {
  return apiGet('/home') // Token refresh, retry, parsing all handled!
}
```

### **Benefits**

1. **Reusability**: `apiClient.ts` can be used by any request, not just API methods
2. **Maintainability**: Token refresh logic in one place, not duplicated
3. **Testability**: Can mock `apiClient` to test `api.ts` methods
4. **Type Safety**: `api.ts` provides TypeScript types for each endpoint
5. **Clean Code**: Components use `api.getHomeData()` instead of raw fetch

---

## Usage Examples

### **In React Components**

```typescript
import api from '../utils/api'

function HomeScreen() {
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getHomeData() // ✨ Clean, typed, error-handled
        setHomeData(data)
      } catch (error) {
        console.error('Failed to fetch:', error)
        setError(error.message)
      }
    }

    fetchData()
  }, [])
}
```

### **Adding New Endpoints**

To add a new endpoint, just add it to `api.ts`:

```typescript
// In api.ts
export const api = {
  // Existing endpoints...
  getHomeData: () => apiGet('/home'),

  // Add new endpoint
  getReports: (year: string) => apiGet(`/reports?year=${year}`),
  submitReport: (reportData: ReportData) => apiPost('/reports', reportData),
}
```

Now you can use it:
```typescript
const reports = await api.getReports('2024')
await api.submitReport(myReport)
```

---

## Token Flow

### **1. Login**
```
User enters credentials
    ↓
api.login() in api.ts
    ↓
apiClient.fetch() adds headers
    ↓
Backend returns { token, refreshToken (cookie) }
    ↓
apiClient saves token to localStorage
    ↓
User redirected to home
```

### **2. Authenticated Request**
```
Component calls api.getHomeData()
    ↓
apiGet('/home') in api.ts
    ↓
apiClient.fetch() automatically adds Authorization header
    ↓
Backend verifies token and returns data
    ↓
apiClient checks for X-New-Token header (rolling tokens)
    ↓
Saves new token if present
    ↓
Data returned to component
```

### **3. Token Expired (401 Response)**
```
api.getHomeData() call
    ↓
apiClient.fetch() gets 401 response
    ↓
apiClient.refreshToken() called automatically
    ↓
POST /auth/refresh with refresh token cookie
    ↓
Backend returns new JWT token
    ↓
apiClient saves new token to localStorage
    ↓
Original request retried with new token
    ↓
Success! Data returned to component
```

### **4. Refresh Failed**
```
Token refresh returns 401 (refresh token also expired)
    ↓
apiClient.clearAuth() removes all auth data
    ↓
apiClient redirects to /login
    ↓
User must login again
```

---

## Configuration

### **Environment Variables**

The API base URL is determined by environment:

```typescript
// apiClient.ts
const API_BASE_URL = import.meta.env.PROD
  ? 'https://api-ahpunjab.itsarsh.dev/v1'  // Production
  : '/v1'                                    // Development (proxied by Vite)
```

### **Vite Proxy Configuration**

In development, `/v1/*` requests are proxied to the backend:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
```

This means:
- Frontend: `http://localhost:3000`
- Request to: `/v1/home`
- Proxied to: `http://localhost:8080/v1/home`

---

## Database Configuration

### **Backend Database Connection**

**File**: `Backend/src/database/db.js`

**Default Configuration**:
```javascript
{
  host: 'localhost',
  port: 5432,
  database: 'ahpunjab_db',
  user: 'ahpunjab',
  password: 'ahpunjab_dev_2024'
}
```

**Environment Variables** (override defaults):
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password

### **Database Files**

```
Backend/
  database/
    schema.sql                      # Database schema (tables, indexes, constraints)
    seed_data.sql                   # Original seed data
    comprehensive_seed_data.sql     # Complete test data for all tables
```

---

## Common Patterns

### **GET Request**
```typescript
const data = await api.getHomeData()
```

### **POST Request**
```typescript
const result = await api.login({
  userId: 'CVD_KOTRA_001',
  password: 'mypassword'
})
```

### **Error Handling**
```typescript
try {
  const data = await api.getHomeData()
  // Handle success
} catch (error) {
  // Error is already formatted from api.ts
  console.error(error.message)
  showErrorToast(error.message)
}
```

### **Loading States**
```typescript
const [loading, setLoading] = useState(true)

useEffect(() => {
  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await api.getHomeData()
      setData(data)
    } catch (error) {
      setError(error)
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [])
```

---

## Summary

| File | Layer | Purpose | Used By |
|------|-------|---------|---------|
| `apiClient.ts` | Infrastructure | HTTP client with auth handling | `api.ts` |
| `api.ts` | Application | Typed endpoint methods | React components |

**Key Takeaway**:
- ✅ Use `api.ts` methods in your components
- ✅ Never use `apiClient.ts` directly in components (except for special cases)
- ✅ `apiClient.ts` handles all the authentication magic automatically
- ✅ Add new endpoints to `api.ts` as your app grows

This architecture ensures clean, maintainable code with proper separation of concerns!
