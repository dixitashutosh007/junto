/**
 * Makes a resident the App Admin (SUPER_ADMIN, ACTIVE) of their society.
 *
 * The app never grants SUPER_ADMIN through its own API, so the first App Admin
 * has to be set up here. After that, App Admins manage other admins in the
 * Admin Portal.
 *
 * The person must have signed in once with their phone (so their user and
 * membership exist). The change is written to the audit log.
 *
 * Usage (from the repo root; in Google Cloud Shell the owner's login is used):
 *
 *   npm run grant-app-admin -- --phone 9876543210                     # dry run
 *   npm run grant-app-admin -- --phone 9876543210 --apply             # write
 *   npm run grant-app-admin -- --phone 9876543210 --society soc-x-001 --apply
 *
 * --society is only needed when the person has memberships in several societies.
 * Also accepts FIREBASE_SERVICE_ACCOUNT_KEY(_B64) or GOOGLE_APPLICATION_CREDENTIALS,
 * and FIRESTORE_EMULATOR_HOST for testing.
 */

import { pathToFileURL } from 'node:url';
import type { DocumentReference } from 'firebase-admin/firestore';
import type { SocietyMembership, User } from '../src/types';

/** The ways a mobile number may have been stored: +91XXXXXXXXXX or the bare 10 digits */
export function phoneVariants(input: string): string[] {
  const digits = input.replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  if (!/^\d{10}$/.test(local)) throw new Error(`Not a 10-digit Indian mobile number: ${input}`);
  return [`+91${local}`, local];
}

export type GrantPlan =
  | { action: 'grant'; user: User; membership: SocietyMembership }
  | { action: 'already-admin'; user: User; membership: SocietyMembership }
  | { action: 'error'; message: string };

/** Picks the membership to promote; pure, so it can be tested without Firestore */
export function planGrant(
  users: User[],
  membershipsByUser: Record<string, SocietyMembership[]>,
  societyId?: string
): GrantPlan {
  if (users.length === 0) {
    return { action: 'error', message: 'No user with this mobile number. Sign in once on the app first.' };
  }
  if (users.length > 1) {
    return {
      action: 'error',
      message: `Several users have this mobile number (${users.map((u) => u.id).join(', ')}). Fix the duplicates first.`,
    };
  }

  const user = users[0];
  const all = membershipsByUser[user.id] ?? [];
  const candidates = societyId ? all.filter((m) => m.societyId === societyId) : all;

  if (candidates.length === 0) {
    return {
      action: 'error',
      message: societyId
        ? `${user.id} has no membership in ${societyId} (has: ${all.map((m) => m.societyId).join(', ') || 'none'}).`
        : `${user.id} has no society membership. Sign in once with the society's invite link first.`,
    };
  }
  if (candidates.length > 1) {
    return {
      action: 'error',
      message: `${user.id} belongs to several societies (${candidates.map((m) => m.societyId).join(', ')}). Pass --society <id>.`,
    };
  }

  const membership = candidates[0];
  if (membership.role === 'SUPER_ADMIN' && membership.status === 'ACTIVE') {
    return { action: 'already-admin', user, membership };
  }
  return { action: 'grant', user, membership };
}

function argValue(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const phone = argValue('--phone');
  const societyId = argValue('--society');
  if (!phone) throw new Error('Usage: npm run grant-app-admin -- --phone <mobile> [--society <id>] [--apply]');

  const { initializeApp, cert, applicationDefault } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  const json =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64
      ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64, 'base64').toString('utf8')
      : undefined);
  const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'saath-societyapps';

  const app = json
    ? initializeApp({ credential: cert(JSON.parse(json)) })
    : process.env.FIRESTORE_EMULATOR_HOST
      ? initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-junto' })
      : initializeApp({ credential: applicationDefault(), projectId });
  const db = getFirestore(app);

  const userSnap = await db.collection('users').where('mobile', 'in', phoneVariants(phone)).get();
  const users = userSnap.docs.map((d) => d.data() as User);

  const membershipsByUser: Record<string, SocietyMembership[]> = {};
  const memberRefs = new Map<SocietyMembership, DocumentReference>();
  for (const user of users) {
    const snap = await db.collectionGroup('members').where('userId', '==', user.id).get();
    membershipsByUser[user.id] = snap.docs.map((d) => {
      const m = d.data() as SocietyMembership;
      memberRefs.set(m, d.ref);
      return m;
    });
  }

  const plan = planGrant(users, membershipsByUser, societyId);
  if (plan.action === 'error') throw new Error(plan.message);

  const { user, membership } = plan;
  console.log(`User:        ${user.id} (${user.fullName}, ${user.mobile})`);
  console.log(`Society:     ${membership.societyId}`);
  console.log(`Membership:  role ${membership.role}, status ${membership.status}, flat ${membership.flatNumber}`);

  if (plan.action === 'already-admin') {
    console.log('Already an active App Admin. Nothing to do.');
    return;
  }
  if (!apply) {
    console.log('DRY RUN: would set role SUPER_ADMIN, status ACTIVE. Add --apply to write.');
    return;
  }

  const now = new Date().toISOString();
  const memberRef = memberRefs.get(membership)!;
  const auditRef = db.collection('audit_events').doc(`audit-${crypto.randomUUID()}`);
  const batch = db.batch();
  batch.update(memberRef, {
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    approvedBy: 'grant-app-admin-script',
    approvedAt: now,
    updatedAt: now,
  });
  batch.set(auditRef, {
    id: auditRef.id,
    societyId: membership.societyId,
    action: 'APP_ADMIN_GRANTED',
    entityType: 'MEMBERSHIP',
    entityId: membership.id,
    metadata: {
      targetUserId: user.id,
      previousRole: membership.role,
      previousStatus: membership.status,
      via: 'scripts/grant-app-admin.ts',
    },
    createdAt: now,
  });
  await batch.commit();
  console.log('APPLIED: now SUPER_ADMIN / ACTIVE. Refresh the app (or sign out and in) to see the Admin Portal.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('grant-app-admin failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
