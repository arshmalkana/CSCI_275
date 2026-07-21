# File: PWA/src/utils/apiClient.ts

Fetch wrapper — auto-attaches JWT, saves rolling token, retries on 401.

```mermaid
sequenceDiagram
    participant C as Component
    participant AC as apiClient.fetch()
    participant LS as localStorage
    participant API as Backend

    C->>AC: fetch(url, options)
    AC->>LS: getItem authToken
    AC->>API: fetch with Authorization: Bearer <token>
    API-->>AC: response (any status)

    note over AC: rolling token update
    AC->>AC: check X-New-Token header
    alt header present
        AC->>LS: setItem authToken (new value), tokenExpiry
    end

    alt response.status == 401 AND not /auth/refresh
        note over AC: deduped refresh — only one in-flight at a time
        AC->>AC: this._refreshPromise ?? authService.refreshToken()
        alt refresh succeeded
            AC->>LS: getItem new authToken
            AC->>API: retry original request with new token
            API-->>AC: response
        else refresh failed
            AC->>AC: redirect to /login
        end
    end

    AC-->>C: final Response object
```

**Dedup logic:** `_refreshPromise` is set on the first 401 and cleared when resolved. Concurrent requests all await the same promise — no race condition.

**File:** `PWA/src/utils/apiClient.ts`
