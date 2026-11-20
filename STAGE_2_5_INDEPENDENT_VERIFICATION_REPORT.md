# EMPEROR NEXUS — STAGE 2.5 INDEPENDENT SECURITY VERIFICATION REPORT
**Audit Date**: November 20, 2026  
**Auditor**: Senior Application Security Auditor & Penetration Testing Specialist  
**Target Commit**: `a2beb52dfa614c9dcc33d7fbae31a650c8e2796a`  
**Previous Baseline**: `bdd695ba4d70914a9fa637862d70e4f555785c8a`  
**Application Stack**: Next.js (App Router), Node.js, PostgreSQL, Redis, Nginx  

---

## 1. EXECUTIVE SUMMARY & VERDICT

An independent, rigorous security verification was conducted against commit `a2beb52` of the Emperor Nexus SaaS platform. The audit evaluated all four areas remediated in Stage 2.5 (SSE visitor credential leakage, account enumeration oracles, Redis fail-closed behavior, and multi-tenant isolation), alongside rate limiting, concurrency controls, and full regression suites.

### Production Readiness Verdict
> **VERDICT: NOT PRODUCTION READY (FAILED)**  
> While the code successfully addressed several high-profile vulnerabilities (such as eliminating persistent visitor tokens from widget URLs and rejecting callers with missing tenant contexts), **two security defects (one P0 and one P1) were discovered and reproduced**. Deployment to production must be withheld until these findings are resolved.

### Findings Matrix
| Finding ID | Classification | Severity | Affected Component | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-03-B** | Account Enumeration Oracle via `otp/send` Response Body & Timing | **P0 (Critical)** | `frontend/app/api/auth/otp/send/route.js` | **FAILED / REPRODUCED** |
| **SEC-02-B** | Multi-Instance Single-Use SSE Ticket Replay via Redis Fall-Through | **P1 (High)** | `frontend/lib/security/sseTicketStore.js` | **FAILED / REPRODUCED** |
| **SEC-03-C** | Timing Oracle in `loginWithPhoneAndPassword` (Missing Dummy Hash) | **P2 (Medium)** | `frontend/lib/auth/authStore.js` | **PARTIALLY VERIFIED** |
| **SEC-04-B** | Latent Default Tenant Fallback in `getConversations` Filtering | **P3 (Low)** | `frontend/lib/db/conversationsStore.js` | **PARTIALLY VERIFIED** |
| **SEC-01** | Password Reset Token Claim Fail-Closed During Redis Outages | **P1** | `frontend/lib/auth/otpStore.js` | **VERIFIED** |
| **SEC-02-A** | Persistent Visitor Token Exposure in Widget EventSource URL | **P0** | `frontend/public/widget.js`, `nginx/*.conf` | **VERIFIED** |
| **SEC-02-C** | Anti-Probing Execution Order in Public Chat Events | **P0** | `frontend/app/api/public/chat/[botId]/events/route.js` | **VERIFIED** |
| **SEC-03-A** | Phone Number Syntax & Availability Check Privacy (`/check-phone`) | **P0** | `frontend/app/api/auth/check-phone/route.js` | **VERIFIED** |
| **SEC-04-A** | Rejection of Missing Org ID & Corrupt Tenant State on Assignment | **P1** | `frontend/app/api/conversations/[id]/assign/route.js` | **VERIFIED** |

---

## 2. AUDIT AREA 1: SSE SECURITY & TICKET LIFECYCLE

### Inspected Files
- `frontend/lib/security/sseTicketStore.js`
- `frontend/app/api/public/chat/[botId]/ticket/route.js`
- `frontend/app/api/public/chat/[botId]/events/route.js`
- `frontend/public/widget.js`
- `nginx/emperornexus.com.conf`
- `nginx/default.conf`

### Findings & Verification Results

#### 1. Cryptographic Ticket Entropy & Expiration: **VERIFIED**
- Exchange tickets are generated via `crypto.randomBytes(24).toString("hex")`, producing 48 hexadecimal characters (192 bits of cryptographic entropy) with a `tkt_` prefix.
- Ticket TTL is 60 seconds (`DEFAULT_TICKET_TTL_SECONDS = 60`).
- Expired tickets are evicted from memory by a 30s background sweeper and in Redis via `EX 60`.

#### 2. Persistent Visitor Token Privacy in Widget: **VERIFIED**
- Inspection of `frontend/public/widget.js` lines 182–205 confirmed that `connectVisitorEvents` now calls `fetch('/api/public/chat/[botId]/ticket')` via `POST`, delivering `visitorToken` inside the request body and `x-visitor-token` header.
- The EventSource URL only receives `?conversationId=...&ticket=tkt_...`. Persistent tokens never appear in the query string.
- Nginx streaming blocks (`/api/(public/chat/|realtime)`) in both `nginx/emperornexus.com.conf` and `nginx/default.conf` enforce `access_log off;` as defense-in-depth.

#### 3. Execution Order & Anti-Probing Hardening: **VERIFIED**
- In `frontend/app/api/public/chat/[botId]/events/route.js`, visitor authentication (via ticket or cookie) is validated **before** conversation lookup (`conversationsStore.getConversation`).
- Both existing and nonexistent conversations return HTTP 403 Forbidden to unauthenticated callers, completely closing the conversation enumeration oracle.

#### 4. Multi-Instance Ticket Replay Vulnerability: **FAILED (SEC-02-B — P1)**
- **Defect Description**:
  In `frontend/lib/security/sseTicketStore.js`:
  ```javascript
  // 1. Try distributed Redis atomic consumption via Lua
  const redis = getRedisClient();
  if (redis && isRedisConnected()) {
    try {
      const raw = await redis.eval(LUA_CONSUME_TICKET, 1, `sse:tkt:${ticket}`);
      if (raw) {
        memorySseTickets.delete(ticket);
        const parsed = JSON.parse(raw);
        if (parsed.botId === botId || ...) return { visitorId: parsed.visitorId };
        return null;
      }
    } catch (err) { ... }
  }

  // 2. Fall back to local in-memory store
  if (memorySseTickets.has(ticket)) {
    const entry = memorySseTickets.get(ticket);
    memorySseTickets.delete(ticket);
    ...
  }
  ```
  When ticket `T` is created on Instance 1, it is stored in Redis AND in Instance 1's local `memorySseTickets`.
  When a legitimate client connects to Instance 2, Instance 2 atomically executes Redis Lua (`GET` + `DEL`), consumes the ticket, and establishes the stream.
  If an attacker replays ticket `T` against Instance 1:
  - Instance 1 queries Redis via Lua. Redis returns `nil` (`raw === null`).
  - Because `raw` is null, the `if (raw)` block does not return.
  - The function falls out of the Redis block and falls straight into line 104 (`if (memorySseTickets.has(ticket))`).
  - Instance 1 still has ticket `T` in its local memory! Instance 1 consumes it and returns the visitor identity a second time!
- **Reproduction**:
  Executed script `verify_ticket_replay.mjs`. Instance 2 consumed ticket via Redis, then Instance 1 processed replay:
  `Claim 2 result (Instance 1 replay): { visitorId: 'vis_123' }` — **Replay Succeeded**.
- **Remediation Required**:
  When Redis is connected and functioning, Redis is the distributed single source of truth. If Redis returns `nil`, `consumeTicket` must immediately return `null`. Local memory fallback must strictly be gated by `if (!redis || !isRedisConnected())` or inside the Redis `catch` block.

---

## 3. AUDIT AREA 2: ACCOUNT ENUMERATION ORACLES

### Inspected Files
- `frontend/app/api/auth/check-phone/route.js`
- `frontend/app/api/auth/otp/send/route.js`
- `frontend/app/api/auth/login/route.js`
- `frontend/app/(auth)/login/page.js`
- `frontend/lib/auth/authStore.js`
- `frontend/lib/auth/otpStore.js`

### Findings & Verification Results

#### 1. Pre-Registration Phone Check (`/api/auth/check-phone`): **VERIFIED (SEC-03-A)**
- The route checks syntax (minimum 10 digits) and returns `{ success: true, valid: true }`.
- It does not query `authStore` or database records. The `exists` boolean is completely removed.
- Rate limiting enforces 20 requests/min per IP.

#### 2. Account Enumeration Oracle in `POST /api/auth/otp/send`: **FAILED (SEC-03-B — P0)**
- **Defect Description**:
  In `frontend/app/api/auth/otp/send/route.js`:
  ```javascript
  if (purpose === "password_reset" || purpose === "forgot_password") {
    const exists = await authStore.checkPhoneExists(phone);
    if (!exists) {
      return applyRateLimitHeaders(
        NextResponse.json({
          success: true,
          message: `If an account is associated with this number, a verification code has been dispatched.`,
          phone,
          cooldownSeconds: 60,
        }),
        ipCheck.result
      );
    }
  }

  const result = await otpStore.sendOtp({ phone, purpose, name });
  ```
  If `exists` is true, the request proceeds to `otpStore.sendOtp(phone)`, which performs a live network call to the TRAI DLT SMS gateway (`allsmssolution.in`).
  This introduces three distinct, easily exploitable enumeration oracles:
  1. **Response Body Differences**:
     - Unregistered number: `{ success: true, message: "If an account is associated with this number...", phone: "...", cooldownSeconds: 60 }`
     - Registered number: `{ success: true, message: "Verification code sent successfully to...", phone: "...", messageId: "msg_...", provider: "dlt_allsmssolution", latencyMs: 85, cooldownSeconds: 60 }`
     The presence of `messageId` and `provider` directly identifies registered numbers.
  2. **HTTP Status Divergence**:
     - Unregistered number: Always HTTP 200.
     - Registered number: If the SMS gateway fails, times out, or has insufficient balance, it returns **HTTP 502 Bad Gateway**.
  3. **Timing Analysis**:
     - Unregistered number: Immediate local response (~2 ms).
     - Registered number: External network round-trip (~100–800 ms).
- **Reproduction**:
  Executed script `verify_otp_enumeration_oracle.mjs`. Results:
  ```json
  === Response for REGISTERED number ===
  Status: 502 (Gateway failure)
  Duration: 15 ms
  Body: { "success": false, "gatewayFailed": true, "error": "getaddrinfo ENOTFOUND allsmssolution.in" }

  === Response for UNREGISTERED number ===
  Status: 200
  Duration: 2 ms
  Body: { "success": true, "message": "If an account is associated with this number, a verification code has been dispatched.", ... }
  ```
- **Remediation Required**:
  The response structure for registered and unregistered numbers must be identical:
  - Do not leak `messageId`, `provider`, or `latencyMs` in public responses.
  - Standardize outward message text.
  - Normalize timing or handle errors without changing outward status codes when enumeration resistance is required.

#### 3. Timing Oracle in `loginWithPhoneAndPassword`: **PARTIALLY VERIFIED (SEC-03-C — P2)**
- In `frontend/lib/auth/authStore.js` line 321, `loginWithPhoneAndPassword` checks `if (!user) throw new Error("Invalid mobile number or password")`.
- When user is not found, it throws immediately (~6 ms).
- When user exists, it executes `verifyPassword` via `scrypt` (~28 ms).
- Measured timing delta: **21.71 ms**.
- Note: `login({ email, password })` correctly performs a dummy `verifyPassword` call to equalize timing, but `loginWithPhoneAndPassword` omitted this step.

---

## 4. AUDIT AREA 3: REDIS FAIL-CLOSED BEHAVIOR

### Inspected Files
- `frontend/lib/auth/otpStore.js`
- `frontend/lib/redis/redisClient.js`
- `frontend/lib/security/rateLimitPolicy.js`

### Findings & Verification Results

#### 1. Password Reset Token Claim (`claimVerificationToken`): **VERIFIED (SEC-01)**
- `isRedisConfigured()` checks `REDIS_URL` or `REDIS_HOST`.
- When Redis is configured in production but disconnected (`!isRedisConnected()`), `claimVerificationToken` immediately returns `{ ok: false, error: "Authentication service temporarily unavailable..." }` (fail-closed).
- When Redis is connected, claims are recorded atomically via `redis.set(redisKey, now, "EX", 1800, "NX")`. If key exists, it returns `{ ok: false, error: "This verification token has already been used..." }`.
- If Redis throws an exception or command timeout occurs, the `catch` block returns fail-closed.
- Local memory claims are permitted only when Redis is explicitly unconfigured (single-instance local dev).
- Concurrent claims on the same token resolve with exactly 1 winner and 1 loser.

#### 2. Selective Fail-Closed on AI Chat Rate Limits: **VERIFIED**
- In `rateLimitPolicy.js`, `chat_ip`, `chat_visitor`, and `chat_org` define `failClosed: true`.
- When Redis is configured but disconnected, AI chat requests return HTTP 429 ("Our automated assistant is temporarily operating in degraded safe mode").
- Dashboard operations (`user_api`, `search_query`) do not have `failClosed: true` and gracefully fall back to local in-memory sliding logs to maintain dashboard availability.

---

## 5. AUDIT AREA 4: MULTI-TENANT ISOLATION

### Inspected Files
- `frontend/app/api/conversations/[id]/assign/route.js`
- `frontend/app/api/conversations/[id]/route.js`
- `frontend/app/api/conversations/[id]/messages/route.js`
- `frontend/lib/db/conversationsStore.js`

### Findings & Verification Results

#### 1. Conversation Assignment Endpoint Hardening: **VERIFIED (SEC-04-A)**
- Callers without `organizationId` (and non-superadmins) are rejected with HTTP 403 Forbidden.
- Conversations with corrupted/missing `organizationId` are rejected with HTTP 422 Unprocessable Entity.
- Target user membership is verified via `authStore.verifyOrgMembership(targetUserId, conv.organizationId)` and must have `status === "ACTIVE"`.
- Assigning conversations across tenants is rejected with HTTP 400.

#### 2. Strict Scoping in `getConversation`: **VERIFIED**
- `conversationsStore.getConversation(id, organizationId)` strictly checks `c.organizationId === organizationId`.

#### 3. Latent Fallback in Conversation Filtering: **PARTIALLY VERIFIED (SEC-04-B — P3)**
- In `frontend/lib/db/conversationsStore.js` line 113:
  ```javascript
  if (filters.organizationId) {
    list = list.filter((c) => (c.organizationId || "org_ess_default") === filters.organizationId);
  }
  ```
  If querying for `"org_ess_default"`, any conversation with `organizationId === null` or `undefined` will be matched. This fallback is benign for custom tenants but represents a latent default tenant fallback.

---

## 6. AUDIT AREA 5: RATE LIMITING & ABUSE PREVENTION

### Inspected Files
- `frontend/lib/security/rateLimitPolicy.js`
- `frontend/lib/security/distributedRateLimit.js`
- `frontend/lib/security/concurrencyLock.js`
- `frontend/lib/security/aiTokenGuard.js`

### Verification Results
1. **Multi-Layer Quotas**: Enforced across IP, visitor, user, organization, and action scopes.
2. **Anti-Spoofing IP Extraction**: Evaluates rightmost trusted proxy hop (`hops[hops.length - trustedHops]`) from `X-Forwarded-For`, neutralizing client-injected spoofed headers.
3. **Concurrency Locks**: Concurrency locks in `concurrencyLock.js` enforce maximum parallel AI generations per conversation, visitor, and organization using Redis ZSETs with auto-expiring TTLs.
4. **Token Budgeting**: `aiTokenGuard.js` enforces pre-generation reservations against monthly token budgets and reconciles with actual provider usage post-generation.

---

## 7. AUDIT AREA 6: REGRESSION TEST EXECUTION

All automated test suites were executed against commit `a2beb52`:

### Test Execution Commands & Captured Results
```bash
# 1. Stage 2.5 Security Remediation & Failure-Path Suites
node --import ./tests/helpers/registerLoader.js --test tests/security/stage2Remediation.test.js tests/security/stage2FailurePathAudit.test.js
Result: 33/33 tests passed (0 failures, duration 1.82s)

# 2. Authentication, Admin Bootstrap, Enterprise Rate Limiting, FastAPI Boundary
node --import ./tests/helpers/registerLoader.js --test tests/security/auth.test.js tests/security/bootstrapAdminSecurity.test.js tests/security/enterpriseRateLimit.test.js tests/security/fastapiIsolationBoundary.test.js
Result: 42/42 tests passed (0 failures, duration 3.34s)

# 3. Handler Level, P0.2 Gaps, P0 Remediation, Phase 4 Full-Stack Audit
node --import ./tests/helpers/registerLoader.js --test tests/security/handlerLevel.test.js tests/security/p02RemainingGaps.test.js tests/security/p0Remediation.test.js tests/security/phase4AuditRemediation.test.js
Result: 75/75 tests passed (0 failures, duration 3.15s)

# 4. Stage 2 Verification, Tenant Isolation, Bot Resolution
node --import ./tests/helpers/registerLoader.js --test tests/security/stage2Verification.test.js tests/security/tenantIsolation.test.js
Result: 32/32 tests passed (0 failures, duration 1.55s)

Total Automated Tests Passed: 182 / 182 (100%)
```

---

## 8. REMEDIATION RECOMMENDATIONS PRIOR TO PRODUCTION RELEASE

1. **Fix SEC-03-B (P0 — Critical)**:
   In `frontend/app/api/auth/otp/send/route.js`:
   - Never return `messageId`, `provider`, or `latencyMs` in outward API responses.
   - For `purpose: "password_reset"`, return a uniform response regardless of whether the account exists:
     `{ "success": true, "message": "If an account is associated with this number, a verification code has been dispatched.", "phone": phone, "cooldownSeconds": 60 }`
   - Wrap gateway dispatch so that gateway connectivity failures do not return HTTP 502 for registered numbers while unregistered numbers return HTTP 200.

2. **Fix SEC-02-B (P1 — High)**:
   In `frontend/lib/security/sseTicketStore.js`:
   - In `consumeTicket`: When `isRedisConnected()` is true and `raw` is null (ticket not found in Redis), **immediately return null**. Do NOT fall through to `memorySseTickets`.
   - Gate local `memorySseTickets` lookup exclusively to when Redis is unconfigured, disconnected, or threw an exception.

3. **Fix SEC-03-C (P2 — Medium)**:
   In `frontend/lib/auth/authStore.js`:
   - In `loginWithPhoneAndPassword`: Add a dummy `verifyPassword` call when `!user` to eliminate the 22 ms timing delta between existing and nonexistent accounts.

---

## 9. CONCLUSION

Commit `a2beb52` successfully resolves persistent visitor token leakage in widget URLs and hardens tenant isolation boundaries during conversation assignment. However, because **SEC-03-B (P0 Account Enumeration)** and **SEC-02-B (P1 Multi-Instance Ticket Replay)** remain active, **the system is NOT ready for production release until these two defects are remediated**.
