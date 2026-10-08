<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Junto / SocietyApps Platform — AI Agent Guide & Architecture Blueprint

This document serves as the single source of truth for AI coding agents, autonomous contributors, and sibling applications (Community, Marketplace, Lessons/Classes, Review) interacting with the **Junto (SocietyApps)** ecosystem.

---

## 1. Product Ecosystem & Vision

**Junto** (formerly Saath) is a multi-tenant platform for gated residential apartment societies and communities. It eliminates commercial friction, high commission aggregator charges, and stranger safety risks by providing verified, closed-loop co-resident products.

### Suite of Community Apps:
1. **Junto RideShare (Active / V1 Pilot)**: Peer-to-peer co-resident carpooling to tech parks, offices, and metro hubs. Strict zero commercial fares, zero in-app payment rails. Optional fuel sharing calculations (mileage & distance points) handled in-person.
2. **Community (Next Phase)**: Resident directory, interest clubs, building discussions, and neighborhood circles (excluding society circulars).
3. **Marketplace (Next Phase)**: Secure peer-to-peer household buy, sell, and rent platform for verified neighbors.
4. **Lessons / Classes (Next Phase)**: In-society classes (yoga, music, tuition, fitness, hobbies) organized and taught by resident teachers.
5. **Review (Next Phase)**: Verified crowd-sourced resident reviews and contacts for domestic staff (maids, cooks, drivers, cleaners), nannies, and local home service vendors.

---

## 2. Security, Authentication & Isolation Rules

### 2.1 Multi-Tenant Isolation
- **Rule**: Every query, mutation, indexing key, or session context MUST be partitioned by `societyId`.
- A user registered or approved in Society A (e.g., `soc-ggh-001`) must never see rides, requests, marketplace items, or directories from Society B (e.g., `soc-pfr-002`).
- Storage keys follow the single-table isolation pattern: `${societyId}#${entityId}`.

### 2.2 Phone Authentication & Gated Onboarding
- **Identity Provider**: Firebase Phone Authentication with SMS OTP verification.
- **Strict Verification Gate**:
  - Entering mobile number checks if user exists and has an approved membership (`ACTIVE`).
  - If new user or profile incomplete: prompts for mandatory onboarding (Full Name, Tower & Flat Number, Email, Gender, Commute Intent).
  - Once submitted, status moves to `PENDING_APPROVAL`.
  - A screen stating **"Verification Pending — Your society admin needs to approve your resident profile before you can access apps"** blocks access to community apps until approved.
- **ZERO Developer Bypass in Production**: No hardcoded mock OTPs (`123456`), no demo bypass buttons, and no unvalidated session tokens.

### 2.3 Strict PII & Contact Disclosure
- Commuter phone numbers, precise flat numbers, and vehicle registration numbers are **strictly masked** (`+91 98*** **233`, `Flat Hidden`, `KA-04-**-****`).
- Full contact details are disclosed **only** after a ride match is explicitly accepted by both parties.
- Token exchange in URL parameters or unauthenticated query strings is strictly prohibited to prevent URL-sharing credential leakage.

---

## 3. Tech Stack & Infrastructure

- **Framework**: Next.js 16 (App Router, Turbopack, React 19).
- **Styling**: Tailwind CSS v4, Lucide React icons.
- **Database Engine**:
  - Cloud Production: Google Cloud Firestore (Standard/Enterprise, credentials in `firebase-service-account.json` or GCP default credentials).
  - Local/Testing: `MockDynamoRepository` (`src/lib/db/mock-repository.ts`) with deterministic in-memory indexing and tenant isolation.
  - Abstraction: `ISocietyRepository` interface (`src/lib/db/repository.interface.ts`).
- **Maps & Geocoding**:
  - OpenStreetMap (OSM) / Photon geocoding for cost-free address autocomplete with Bangalore tech park fallback dataset.
  - Google Places API with bounded bounds if configured.
- **Hosting & CI/CD**:
  - GitHub Repo: `https://github.com/dixitashutosh007/junto.git` (main branch).
  - AWS Amplify Hosting: App ID `d2dolgqm6zsfo9` (Region: `ap-south-1`, auto-building on push to `main`).
- **Testing**: Vitest (`npx vitest run`) with automated multi-tenant isolation, route detour, and security tests.

---

## 4. Role-Based Access Control (RBAC) & Audit Trails

### Roles:
- **`RESIDENT`**: Regular verified community member (Ride Offerer, Ride Seeker, Marketplace Buyer/Seller, etc.).
- **`SOCIETY_ADMIN`**: Society committee member managing a specific society. Has granular permissions configured:
  - `canApproveResidents`: Approve or reject new onboarding submissions.
  - `canManageSettings`: Update detour tolerances, society coordinates, and community rules.
  - `canModerateReports`: Review safety flags and user complaints.
  - `canViewAuditLogs`: View society activity trail.
- **`SUPER_ADMIN` / Platform App Admin**: Controls platform-wide RBAC, promotes/demotes society admins, manages granular permission flags across societies.

### Dynamic Navigation Menu:
- The UI navigation adapts dynamically according to active role:
  - **Admins**: See `Admin Portal`, `Residents`, `Moderation`, `Profile`. Commuter actions (`Find Ride`, `Offer Ride`) are hidden.
  - **Ride Offerers**: See `Home`, `Offer Ride`, `My Rides`, `Profile`.
  - **Ride Seekers**: See `Home`, `Find Ride`, `My Requests`, `Profile`.

### Audit Logging:
- All administrative lifecycle actions (approvals, rejections, suspensions, settings updates, RBAC role modifications) are logged via `recordAuditEvent()` and queryable via `/api/v1/admin/audit-logs`.

---

## 5. Peer-to-Peer Zero Payment Policy

- **Legal Compliance**: Junto is strictly a non-commercial community facilitation tool.
- **No In-App Payments**: The app does **not** process, hold, or escrow money. No payment gateway integration.
- **Fuel Points Estimation**: Fuel sharing or mileage estimates based on commute distance and car mileage are purely informational. Any shared expenses must be settled directly between neighbors in person.

---

## 6. Directory Structure & Key Files

```
├── AGENTS.md                               # This file — AI Agent Architecture & Guidelines
├── V1_TECHNICAL_BLUEPRINT.md               # Detailed database schemas, API specs, and algorithms
├── src/
│   ├── app/
│   │   ├── page.tsx                        # App Hub screen & main ride dashboard
│   │   ├── admin/page.tsx                  # Society Admin Portal (Members, Reports, Logs, RBAC)
│   │   ├── profile/page.tsx                # Resident profile & vehicle management
│   │   ├── rides/offer/page.tsx            # Offer a ride flow
│   │   ├── rides/find/page.tsx             # Find & match rides flow
│   │   └── api/v1/
│   │       ├── auth/session/route.ts       # Secure Firebase/Cognito token exchange
│   │       ├── auth/me/route.ts            # Profile & onboarding persistence
│   │       ├── admin/residents/route.ts    # Approve/Reject/Block resident endpoint
│   │       ├── admin/rbac/route.ts         # Granular RBAC permissions endpoint
│   │       ├── admin/audit-logs/route.ts   # Society audit trail endpoint
│   │       ├── rides/                      # Ride occurrence, match, and request APIs
│   │       └── moderation/reports/route.ts # Safety reporting and resolution
│   ├── components/
│   │   ├── AppHubScreen.tsx                # Multi-app selector (RideShare, Community, etc.)
│   │   ├── PhoneOtpModal.tsx               # Firebase Phone Auth & OTP modal
│   │   ├── ResidentOnboardingModal.tsx     # Mandatory resident profile details collection
│   │   ├── PlacesAutocompleteInput.tsx     # High-contrast OSM/Google places input
│   │   └── BottomNav.tsx                   # Persona-aware dynamic navigation
│   ├── context/
│   │   └── AuthContext.tsx                 # Client auth session & state management
│   ├── lib/
│   │   ├── db/
│   │   │   ├── firestore-repository.ts     # Google Cloud Firestore implementation
│   │   │   ├── mock-repository.ts          # In-memory test & dev repository
│   │   │   └── repository.interface.ts     # ISocietyRepository contract
│   │   └── api-auth.ts                     # API route session & token validator
│   └── types/
│       └── index.ts                        # Shared TypeScript models and interfaces
```

---

## 7. Instructions for Sibling App Agents

When creating or extending sibling apps (e.g., **Community**, **Marketplace**, **Lessons**, **Review**):
1. **Consume `useAuth()`**: Always rely on `AuthContext` for `society`, `user`, and `membership` status.
2. **Gate on `membership.status === 'ACTIVE'`**: Never render interactive features to users whose status is `PENDING_APPROVAL` or unverified.
3. **Persist within `ISocietyRepository`**: Add new domain methods to the repository interface and implement both mock and Firestore stores with `${societyId}` partitioning.
4. **Run Verification**:
   - Run tests: `npx vitest run`
   - Run Next.js build: `npm run build`
   - Commit & push to `main` for automated AWS Amplify deployment.
