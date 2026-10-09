# Release checklist — production hardening (PR #1)

Handoff for whoever (person or AI session) continues this release. Read this first, then
`docs/PRODUCTION_ROADMAP.md` (what was built, per phase) and `AGENTS.md` (project rules).

- **Pull request:** https://github.com/dixitashutosh007/junto/pull/1 — branch `claude/epic-franklin-lmezo1` → `main`
- **Merging deploys to production:** AWS Amplify (app `d2dolgqm6zsfo9`, `ap-south-1`) builds `main` automatically.
- **Firebase project:** `saath-societyapps`
- **Previous working session (full history):** `session_01BSRaeMn8R9thdxYF9q23Lu`

## Status (as of 2026-10-09)

| Item | State |
|------|-------|
| Roadmap phases 0–4 | Done, all on the PR branch |
| CI on the PR (typecheck, tests, lint, build) | Green; no merge conflicts with `main` |
| Firestore rules (`firestore.rules`, deny all client access) | Published by the owner in the console — **not yet verified** |
| Index: `audit_events` (`societyId` ↑, `createdAt` ↓) | Created by the owner — **not yet verified** |
| Field override: `members.userId`, collection-group ascending | Created by the owner — **not yet verified** |
| Amplify `FIREBASE_SERVICE_ACCOUNT_KEY` / `_B64` set | Not yet confirmed |
| Real SMS login on an Amplify preview of this branch | Not yet done |
| Merge | Not yet |
| Ride-time migration (`npm run migrate:ride-times`) | Run after merge |

## Next steps, in order

1. **Verify Firebase config** against the repo files.
   A service-account key with *Firebase Rules Admin*, *Cloud Datastore Index Admin* and
   *Service Usage Consumer* is provided to cloud sessions as `GCP_DEPLOY_KEY_B64` (base64 JSON).
   It cannot read resident data. Use it only to:
   - read the deployed rules and indexes and compare them with `firestore.rules` /
     `firestore.indexes.json`;
   - deploy those files (`firebase deploy --only firestore:rules` / `firestore:indexes`)
     **only after showing the owner the difference and getting a yes**; never delete indexes.
   Both indexes must show **READY / Enabled** before merging, or sign-in and the audit log fail.
2. **Amplify:** confirm `FIREBASE_SERVICE_ACCOUNT_KEY` (or `_B64`) exists; production refuses
   to start without it.
3. **Preview test:** deploy the branch as an Amplify branch preview, add its domain to
   Firebase Auth → Authorized domains, then test SMS login, offering a ride at 08:30 (must
   show 08:30), and the browser console for Content-Security-Policy errors.
4. **Merge** PR #1. Everyone is signed out once (cookie changed).
5. **Migrate old ride times:** `npm run migrate:ride-times` (dry run), then `-- --apply`.
6. Optional: SMS region policy (India only), Google Maps API quotas and key restrictions,
   App Check (`NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`, enforce only after testing login).

## Decisions already made

- Sessions are Firebase session cookies (`junto_session`, 14 days); dev shortcuts are
  development-only.
- Firestore is server-only (Admin SDK); client rules deny everything.
- CSP is static (no nonces) because nonces disable partial prerendering.
- Rate limits are in-memory per instance; the real cost cap is Google Cloud quotas.
- Email is stored as unverified contact info; email verification links are Phase 5.
- Never push straight to `main`; ship through PRs with CI green.

## After release: Phase 5

Monitoring (e.g. Sentry), secrets review, Firestore backups, DPDP compliance (privacy policy,
consent, account deletion), safety features (share trip / SOS), real push notifications, pilot.
Several items need owner decisions (monitoring vendor, privacy policy wording).
