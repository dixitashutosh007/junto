<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Junto project rules

Junto is a ride-sharing app for residents of a housing society. Read `docs/PRODUCTION_ROADMAP.md` for the current hardening plan; some rules below describe the target state that the roadmap phases are moving the code towards.

**Stack:** Next.js 16 App Router, React 19, Firebase Phone Auth + Firestore (admin SDK, server-only), Zod 4, Tailwind 4, Vitest. Deployed on AWS Amplify (`amplify.yml`).

**Commands** (all must pass before committing; CI runs them on every PR):
- `npm ci --legacy-peer-deps`
- `npm run typecheck`
- `npm test`
- `npm run lint`
- `npm run build`

**Layout:**
- API routes: `src/app/api/v1/**/route.ts`
- Auth for routes: `src/lib/api-auth.ts` (`requireAuth`); sessions: `src/lib/auth/session.ts`
- Data access only through `getRepository()` (`src/lib/db`); `FirestoreRepository` in production, `MockDynamoRepository` (seeded demo data) in development and tests
- Shared types: `src/types`; request schemas: `src/lib/validation/schemas.ts`
- Route tests: `src/app/api/**/__tests__/*.test.ts`, using `makeRequest` and `resetRepository` from `src/test/route-helpers.ts`; mock Firebase with `src/test/firebase-admin-mock.ts` to test production auth

**Every API route must:**
- Start with `const auth = await requireAuth(req, { statuses?, roles? }); if (auth instanceof NextResponse) return auth;`. It returns 401 when signed out and 403 unless the membership is `ACTIVE` (pass `ONBOARDING_STATUSES` only for onboarding routes).
- Validate the body and query with a Zod schema; never destructure raw `req.json()`.
- Check ownership or role on the target entity (the offerer, the seeker, or an admin of *that* society).
- Return generic error messages; never echo `err.message` to the client.
- Have a route test covering the unauthorized and wrong-user cases.

**Security invariants:**
- The server uses the Firestore admin SDK, which bypasses `firestore.rules`. The API is the real access-control boundary.
- Dev shortcuts (`x-dev-user-id`, the persona switcher, `dev-token-*` tokens, OTP `123456`, `MockDynamoRepository`) must be unreachable when `NODE_ENV === 'production'`.
- Contact data (mobile, flat number, number plate) is shown only to accepted ride participants, via `formatPublicJourneyView` in `src/lib/services/privacy.ts`.
- Never hardcode a society ID; use `auth.societyId`.
- Never commit secrets; service-account keys stay in Amplify environment variables and never use the `NEXT_PUBLIC_` prefix.

**Data conventions:**
- Seat counts change only inside a Firestore transaction that also checks the request status.
- Times are Asia/Kolkata: store ISO strings with `+05:30`, format with `timeZone: 'Asia/Kolkata'`.
- IDs come from `crypto.randomUUID()`, not `Date.now()`.
- No placeholder data (flat numbers, distances, coordinates) in production responses; fail or mark the value as unknown.
