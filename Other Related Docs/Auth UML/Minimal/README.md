# Authentication System Documentation

Complete authentication flow diagrams for AH Punjab Reporting System.

## 📊 Diagrams (3-5 minutes each)

### 1. JWT Token Flow (`01-jwt-flow.puml`)
**Time: ~4 minutes**

Explains the complete JWT authentication lifecycle:
- Initial login with credentials
- Token generation (access + refresh)
- Rolling JWT (new token with every request)
- Token refresh with rotation
- Logout flow

**Key Concepts:**
- Access Token: 15 minutes, stored in memory
- Refresh Token: 7/90 days, HttpOnly cookie
- Token rotation: Old token becomes single-use
- Rolling tokens: New access token with each authenticated request

---

### 2. Password Login (`02-password-login.puml`)
**Time: ~3 minutes**

Shows the 2-step password login process:
- **Step 1**: Username entry → Check for passkeys
- **Step 2**: Password authentication OR passkey option
- Remember Me toggle (7 days vs 90 days)
- Case-insensitive username lookup

**Key Concepts:**
- Dynamic Step 2 based on passkey availability
- Remember Me extends session to 90 days
- Back button returns to Step 1

---

### 3. Passkey Registration (`03-passkey-registration.puml`)
**Time: ~4 minutes**

WebAuthn passkey registration (FIDO2):
- Generate registration options on backend
- Browser shows biometric prompt (Face ID, Touch ID, Windows Hello)
- Device creates keypair
- Backend verifies and stores public key
- Challenge-response mechanism

**Key Concepts:**
- RP_ID: localhost (development)
- RP_ORIGIN: http://localhost:3001
- Challenge stored in memory (5-minute expiry)
- Platform authenticator (built-in biometrics)
- Excludes already-registered credentials

---

### 4. Passkey Login (`04-passkey-login.puml`)
**Time: ~4 minutes**

WebAuthn passkey authentication:
- **Step 1**: Get authentication options
- **Step 2**: User authenticates with biometrics
- Backend verifies signature with stored public key
- Counter validation prevents replay attacks
- Issues JWT tokens on success

**Key Concepts:**
- Challenge-response authentication
- Public key cryptography
- Counter increment (replay prevention)
- Same JWT flow as password login

---

### 5. Session Management (`05-session-management.puml`)
**Time: ~4 minutes**

Multi-device session tracking:
- User logs in on multiple devices
- Each device gets unique refresh token
- View all active sessions
- Revoke specific sessions
- Logout from all other devices
- Automatic cleanup (daily)

**Key Concepts:**
- Device tracking (user agent, IP address)
- Session isolation (revoke one doesn't affect others)
- Current session identification
- Expired token cleanup (pg_cron)

---

### 6. System Architecture (`06-system-architecture.puml`)
**Time: ~5 minutes**

Complete system architecture:
- Frontend: React PWA screens + services + storage
- Backend: Fastify routes + middleware + controllers + services
- Database: PostgreSQL tables + jobs
- External: WebAuthn API + device authenticators

**Key Concepts:**
- Separation of concerns (MVC pattern)
- Token storage strategy (memory vs localStorage vs cookie)
- Middleware authentication pipeline
- Database cleanup automation

---

### 7. Token Lifecycle (`07-token-lifecycle.puml`)
**Time: ~4 minutes**

State machine showing token lifecycle:
- Unauthenticated → Authenticated states
- Token active → Token expired → Refresh
- Rolling token updates
- Logout flows
- Security events

**Key Concepts:**
- Token expiration handling
- Automatic refresh on expiry
- Rolling JWT security
- Token rotation on refresh
- Multiple logout scenarios

---

## 🎯 Presentation Order

**Recommended order for 25-minute presentation:**

1. **System Architecture** (5 min) - Overview of entire system
2. **Password Login** (3 min) - Main login flow
3. **JWT Token Flow** (4 min) - Token management
4. **Token Lifecycle** (4 min) - Token states
5. **Passkey Registration** (4 min) - WebAuthn setup
6. **Passkey Login** (4 min) - Biometric authentication
7. **Session Management** (4 min) - Multi-device tracking

**Total: ~28 minutes + Q&A**

---

## 🔧 How to View Diagrams

### VS Code
1. Install "PlantUML" extension
2. Open any `.puml` file
3. Press `Alt+D` to preview

### Online
1. Go to https://www.plantuml.com/plantuml/uml/
2. Copy-paste diagram code
3. View rendered diagram

### Command Line
```bash
# Install PlantUML
npm install -g node-plantuml

# Generate all diagrams as PNG
plantuml docs/*.puml

# Generate as SVG
plantuml -tsvg docs/*.puml
```

### Export Options
- PNG: `plantuml -tpng file.puml`
- SVG: `plantuml -tsvg file.puml`
- PDF: `plantuml -tpdf file.puml`

---

## 📝 Key Security Features

### JWT Security
- ✅ Access tokens expire in 15 minutes
- ✅ Refresh tokens stored as SHA-256 hashes
- ✅ HttpOnly cookies prevent XSS
- ✅ Token rotation prevents replay attacks
- ✅ Rolling tokens reduce attack window

### WebAuthn Security
- ✅ Public key cryptography (FIDO2)
- ✅ Challenge-response prevents MITM
- ✅ Counter validation prevents replay
- ✅ Device-bound credentials
- ✅ Phishing-resistant authentication

### Session Security
- ✅ Multi-device tracking
- ✅ IP address logging
- ✅ User agent detection
- ✅ Granular session control
- ✅ Automatic cleanup of expired sessions

### Password Security
- ⚠️ **TODO**: Implement Argon2id hashing (currently plain text)
- ✅ Case-insensitive username lookup
- ✅ Generic error messages (security through obscurity)
- ✅ Remember Me with extended sessions

---

## 🔍 Technical Stack

- **Frontend**: React 19.1.1, TypeScript, Vite 7.1.7
- **Backend**: Fastify 5.6.0, Node.js (ES modules)
- **Database**: PostgreSQL with pg_cron
- **Authentication**: JWT + WebAuthn (FIDO2)
- **Libraries**:
  - `@simplewebauthn/server` v10+ (backend)
  - `@simplewebauthn/browser` (frontend)
  - `jsonwebtoken` (JWT)

---

## 📂 File Structure

```
docs/
├── README.md                        # This file
├── 01-jwt-flow.puml                # JWT authentication flow
├── 02-password-login.puml          # Password login (2-step)
├── 03-passkey-registration.puml    # WebAuthn registration
├── 04-passkey-login.puml           # WebAuthn authentication
├── 05-session-management.puml      # Multi-device sessions
├── 06-system-architecture.puml     # Complete architecture
└── 07-token-lifecycle.puml         # Token state machine
```

---

## 🚀 Quick Start

```bash
# View all diagrams in VS Code
code docs/

# Generate all as PNG
plantuml docs/*.puml

# Generate single diagram
plantuml docs/01-jwt-flow.puml
```

---

## 💡 Tips for Presentation

1. **Start with Architecture** - Give audience the big picture
2. **Use real examples** - "When you login on your phone..."
3. **Highlight security** - Explain why each mechanism exists
4. **Show token flow** - Walk through actual HTTP requests
5. **Demonstrate WebAuthn** - Show Face ID/Touch ID in action
6. **Q&A preparation** - Be ready to explain OAuth 2.0 comparison

---

## 📚 Additional Resources

- [WebAuthn Guide](https://webauthn.guide/)
- [FIDO2 Specification](https://fidoalliance.org/fido2/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OAuth 2.0 Token Rotation](https://datatracker.ietf.org/doc/html/rfc6819#section-5.2.2.3)

---

**Last Updated**: January 2025
**Version**: 1.0
**Status**: Production-ready (except Argon2id TODO)
