# Junto — Production Readiness Roadmap

Derived from the technical / security / UX review of October 2026. Phases are ordered by risk: each one should be merged and deployed before the next starts. Every phase ends with the same gate:

> `npx tsc --noEmit` · `npx eslint` · `npx vitest run` · `npm run build` all pass, and the phase's acceptance checks are covered by tests.

Severity: 🔴 blocker for real users · 🟠 user-visible bug · 🟡 quality · 🟢 operational.

---

## Phase 0 — Foundations (½ day) ✅ Done

Set up guard-rails so later phases can be verified.

| # | Task | Files |
|---|------|-------|
| 0.1 | Add Junto project rules to `AGENTS.md` (below the Next.js block) and a `CLAUDE.md` containing `@AGENTS.md` | `AGENTS.md`, `CLAUDE.md` |
| 0.2 | CI workflow running tsc, eslint, vitest, build on every PR | `.github/workflows/ci.yml` |
| 0.3 | Route-level test harness (call route handlers with a mock `NextRequest` against `MockDynamoRepository`) | `src/app/api/**/__tests__/` |
| 0.4 | Rename leftovers: `saath-app`, `SocietyApps` in `sw.js`, `capacitor.config.json` | `package.json`, `public/sw.js`, `capacitor.config.json` |

**Done when:** CI is green on `main`; one example route test exists.

---

## Phase 1 — Authentication & session (🔴, 1–2 days) ✅ Done

Right now anyone can impersonate any user, including admins, by setting a cookie.

| # | Task | Files |
|---|------|-------|
| 1.1 | Replace raw-UID cookie with Firebase session cookies: `adminAuth.createSessionCookie(idToken)` on login, `verifySessionCookie(cookie, true)` in `getAuthContext`; revoke on logout | `src/app/api/v1/auth/session/route.ts`, `src/lib/api-auth.ts` |
| 1.2 | Fix user lookup: when found by phone, link/migrate to the Firebase UID so cookie and user ID always match | `auth/session/route.ts`, repositories |
| 1.3 | Fail fast in production if Firestore credentials are missing — never fall back to `MockDynamoRepository` | `src/lib/db/index.ts`, `src/lib/firebase/admin.ts` |
| 1.4 | Strip every dev shortcut from production: `x-dev-user-id`, default persona, `dev-token-*`, OTP `123456`, `9876543210` bypass, `junto_demo_mode`, `PersonaSwitcher` | `api-auth.ts`, `auth/session`, `PhoneOtpModal.tsx`, `AuthContext.tsx`, `PersonaSwitcher.tsx` |
| 1.5 | Enforce `membership.status === 'ACTIVE'` centrally (`requireActiveMember` helper), with explicit opt-out only for onboarding routes | `src/lib/api-auth.ts`, all routes |
| 1.6 | Remove or OTP-gate unauthenticated `/auth/register` | `src/app/api/v1/auth/register/route.ts` |
| 1.7 | Real OTP for phone change (Firebase `linkWithPhoneNumber` / `updatePhoneNumber`); server sets `mobile` only from a verified token. Email change via verification link | `profile/page.tsx`, `auth/me/route.ts` |
| 1.8 | Rate-limit OTP send; enable Firebase App Check | `PhoneOtpModal.tsx`, Firebase console |

**Done when:** tests prove a forged cookie, a `x-dev-user-id` header, and a PENDING member all get 401/403 in production mode.

**Implementation notes:**
- Sessions: `src/lib/auth/session.ts` (cookie `junto_session`, 14-day Firebase session cookie, revocation checked on every request). Routes use `requireAuth(req, { statuses, roles })` from `src/lib/api-auth.ts`.
- Users signing in for the first time are linked to existing residents by verified phone number (`User.firebaseUid`).
- `/auth/register` now completes registration for a signed-in user; the join page asks for phone OTP first and uses the code from the link.
- Mobile changes go through `POST /api/v1/auth/phone` (Firebase `updatePhoneNumber`). Email is stored as unverified contact info; a real verification link is deferred to Phase 5.
- OTP: 30-second resend cooldown in the UI, per-IP limit on session creation, per-user limit on phone changes (in-memory; shared store in task 2.5).

**Console steps for the owner (not code):**
1. Firebase → App Check: register the web app with reCAPTCHA Enterprise, set `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` in Amplify, then enforce App Check for Authentication.
2. Firebase → Authentication → Settings: confirm SMS region policy allows only India (+91).
3. Amplify: confirm `FIREBASE_SERVICE_ACCOUNT_KEY` (or `_B64`) is set — production now refuses to start without it.

---

## Phase 2 — Authorization & data exposure (🔴, 1–2 days)

| # | Task | Files |
|---|------|-------|
| 2.1 | Zod schema for **every** route body/query (rides PUT, requests PUT, matches, admin settings/rbac/residents, moderation PATCH, notifications, vehicles, auth/me PUT) | `src/lib/validation/schemas.ts`, routes |
| 2.2 | `GET /rides/feedback`: only own received feedback; never return `privateNote` except to admins | `rides/feedback/route.ts` |
| 2.3 | `GET /rides/requests?journeyId`: offerer of that journey only; feedback POST requires participation in the journey | `rides/requests/route.ts`, `rides/feedback/route.ts` |
| 2.4 | `/api/v1/societies`: require auth, return only the user's societies, never `code`; mark dynamic | `societies/route.ts` |
| 2.5 | Auth + per-user rate limit on `/places/autocomplete` and `/routes/matrix` | those routes, new `src/lib/rate-limit.ts` |
| 2.6 | Admin guards: role allow-list, target must be in admin's society, cannot change own role/status or a higher role; validate `flat_format_pattern` (length cap, safe-regex) | `admin/*/route.ts` |
| 2.7 | Notification mark-as-read checks ownership | `firestore-repository.ts`, `mock-repository.ts` |
| 2.8 | Generic 500 responses (log details server-side, never return `err.message`) | all routes |
| 2.9 | Tighten `firestore.rules` (`users/*` readable only by self); add CSP header | `firestore.rules`, `next.config.ts` |

**Done when:** each item has a negative test (wrong user / wrong society / wrong role → 403).

---

## Phase 3 — Ride correctness (🟠, 2 days)

| # | Task | Files |
|---|------|-------|
| 3.1 | Timezone: store times as `YYYY-MM-DDTHH:mm:00+05:30`; format with `timeZone: 'Asia/Kolkata'`; compute "today" in IST | `rides/offer`, `rides/my-rides`, `rides/find`, `page.tsx`, `listOpenRides`, `matches` |
| 3.2 | Accept/reject in a single transaction: request must be `REQUESTED`; seats checked and decremented atomically; reject/cancel of ACCEPTED releases seats | `rides/requests/route.ts`, repositories (`acceptRequest`, `releaseRequest`) |
| 3.3 | Request validation: ride must be OPEN and in the future; no duplicate active request per seeker; enforce `genderPreference` | `rides/requests/route.ts` |
| 3.4 | Offerer delete → cancel with reason, notify accepted/pending seekers | `rides/route.ts` |
| 3.5 | Remove placeholder data: `'Tower B-804'`, fixed 22 km / 45 min, `calculatedDetourMinutes: 6`, default coordinates. Compute distance/duration from real coordinates (routes matrix or haversine fallback) | `privacy.ts`, `rides/route.ts`, `rides/requests/route.ts`, `schemas.ts` |
| 3.6 | Use `crypto.randomUUID()` for all IDs | all `id: \`xxx-${Date.now()}\`` sites |
| 3.7 | Audit log: `orderBy('createdAt','desc').limit(100)` (add composite index) | `firestore-repository.ts` |

**Done when:** concurrency test (two accepts on last seat) leaves seats ≥ 0 and exactly one ACCEPTED; time entered as 08:30 displays as 08:30.

---

## Phase 4 — Multi-society & UI/UX (🟡, 2–3 days)

| # | Task | Files |
|---|------|-------|
| 4.1 | Remove hardcoded `'soc-ggh-001'` (~30 sites); society comes from session/membership; login carries society from join link | all pages, `AuthContext.tsx`, `join/[societyCode]` |
| 4.2 | Shared `apiFetch` client helper (credentials, errors, 401 → login) replacing duplicated fetch/header code | new `src/lib/api-client.ts`, pages |
| 4.3 | Split `admin/page.tsx` (1131 lines) and `profile/page.tsx` (896) into components | `src/app/admin`, `src/app/profile` |
| 4.4 | Accessibility: remove `userScalable:false` / `maximumScale`, add `aria-label`s, replace `confirm()` with an accessible dialog, check contrast and touch targets | `layout.tsx`, components |
| 4.5 | Loading skeletons, empty states, error/retry states; offline fallback page in service worker | pages, `public/sw.js` |
| 4.6 | Fix the 49 ESLint errors (setState-in-effect, `any`) | across `src` |

**Done when:** a second society can onboard and use the app end-to-end with no data crossing; Lighthouse accessibility ≥ 90.

---

## Phase 5 — Operations, privacy & safety (🟢, 2 days + legal review)

| # | Task |
|---|------|
| 5.1 | Error monitoring (Sentry), structured logging, uptime check |
| 5.2 | Verify Amplify env: no secrets under `NEXT_PUBLIC_*`; service-account key in Secrets Manager; restrict Google Maps key by API + referrer |
| 5.3 | Firestore backups (scheduled export) and composite indexes committed (`firestore.indexes.json`) |
| 5.4 | DPDP Act compliance: privacy policy, explicit consent at onboarding, delete-account & data export, retention policy for audit/notifications |
| 5.5 | Safety: share-trip link / SOS, auto-restrict users after N upheld reports, admin view of repeat cancellers |
| 5.6 | Real push notifications (FCM) wired to `sw.js` |
| 5.7 | Staging environment + pilot with a small resident group before full society launch |

**Done when:** pilot runs for 2 weeks with no P0/P1 incidents.

---

## Summary timeline

| Phase | Theme | Est. | Blocks launch? |
|-------|-------|------|----------------|
| 0 | Foundations & CI | ½ day | — |
| 1 | Authentication & session | 1–2 days | Yes |
| 2 | Authorization & data exposure | 1–2 days | Yes |
| 3 | Ride correctness | 2 days | Yes |
| 4 | Multi-society & UI/UX | 2–3 days | For 2nd society |
| 5 | Ops, privacy, safety | 2 days + legal | For public launch |
