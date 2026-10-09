/**
 * One-time migration: fix ride times saved before the India-time fix.
 *
 * Older app versions saved a ride offered for 08:30 as `2026-10-10T08:30:00.000Z`
 * (08:30 UTC), which is 2:00 PM in India. This rewrites those values to what
 * the resident meant: `2026-10-10T08:30:00+05:30`.
 *
 * A time is only changed when it has exactly the shape the old app wrote
 * (whole minutes, `.000Z` or `Z`) and its date matches the ride's journeyDate.
 * Anything else is reported and left alone.
 *
 * Usage (from the repo root, with the production service account):
 *
 *   FIREBASE_SERVICE_ACCOUNT_KEY_B64=... npm run migrate:ride-times              # dry run
 *   FIREBASE_SERVICE_ACCOUNT_KEY_B64=... npm run migrate:ride-times -- --apply   # write
 *
 * Also accepts FIREBASE_SERVICE_ACCOUNT_KEY (raw JSON) or
 * GOOGLE_APPLICATION_CREDENTIALS, and FIRESTORE_EMULATOR_HOST for testing.
 * Safe to re-run: already-fixed rides are skipped.
 */

import { pathToFileURL } from 'node:url';
import type { Firestore } from 'firebase-admin/firestore';

// The exact format the old offer and edit forms produced
const LEGACY_UTC_TIME = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}):00(?:\.000)?Z$/;

export interface RideTimes {
  journeyDate: string;
  departureWindowStart: string;
  departureWindowEnd: string;
}

export type FixPlan =
  | { action: 'fix'; updates: Pick<RideTimes, 'departureWindowStart' | 'departureWindowEnd'> }
  | { action: 'skip'; reason: 'already-ist' | 'unrecognised-format' | 'date-mismatch' };

function fixOne(value: string, journeyDate: string): string | 'unrecognised-format' | 'date-mismatch' | null {
  if (value.endsWith('+05:30')) return null; // already correct
  const match = LEGACY_UTC_TIME.exec(value);
  if (!match) return 'unrecognised-format';
  const [, date, hhmm] = match;
  if (date !== journeyDate) return 'date-mismatch';
  return `${date}T${hhmm}:00+05:30`;
}

/** Decides what to do with one ride; pure, so it can be tested without Firestore */
export function planRideTimeFix(ride: RideTimes): FixPlan {
  const start = fixOne(ride.departureWindowStart, ride.journeyDate);
  const end = fixOne(ride.departureWindowEnd, ride.journeyDate);

  if (start === null && end === null) return { action: 'skip', reason: 'already-ist' };
  for (const result of [start, end]) {
    if (result === 'unrecognised-format' || result === 'date-mismatch') {
      return { action: 'skip', reason: result };
    }
  }

  return {
    action: 'fix',
    updates: {
      departureWindowStart: start ?? ride.departureWindowStart,
      departureWindowEnd: end ?? ride.departureWindowEnd,
    },
  };
}

export interface MigrationReport {
  scanned: number;
  fixed: number;
  alreadyCorrect: number;
  skipped: { path: string; reason: string; start: string; end: string }[];
  changes: { path: string; from: string; to: string }[];
}

/** Scans every society's rides and fixes legacy times (writes only when apply is true) */
export async function migrateRideTimes(db: Firestore, apply: boolean): Promise<MigrationReport> {
  const report: MigrationReport = { scanned: 0, fixed: 0, alreadyCorrect: 0, skipped: [], changes: [] };
  const snap = await db.collectionGroup('occurrences').get();

  let batch = db.batch();
  let pending = 0;

  for (const doc of snap.docs) {
    report.scanned++;
    const ride = doc.data() as RideTimes;
    const plan = planRideTimeFix(ride);

    if (plan.action === 'skip') {
      if (plan.reason === 'already-ist') report.alreadyCorrect++;
      else {
        report.skipped.push({
          path: doc.ref.path,
          reason: plan.reason,
          start: ride.departureWindowStart,
          end: ride.departureWindowEnd,
        });
      }
      continue;
    }

    report.fixed++;
    report.changes.push({
      path: doc.ref.path,
      from: `${ride.departureWindowStart} – ${ride.departureWindowEnd}`,
      to: `${plan.updates.departureWindowStart} – ${plan.updates.departureWindowEnd}`,
    });

    if (apply) {
      batch.update(doc.ref, { ...plan.updates, updatedAt: new Date().toISOString() });
      pending++;
      // Firestore batches hold at most 500 writes
      if (pending === 400) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
      }
    }
  }

  if (apply && pending > 0) await batch.commit();
  return report;
}

async function main() {
  const apply = process.argv.includes('--apply');

  const { initializeApp, cert, applicationDefault } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  const json =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64
      ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64, 'base64').toString('utf8')
      : undefined);

  const app = json
    ? initializeApp({ credential: cert(JSON.parse(json)) })
    : process.env.FIRESTORE_EMULATOR_HOST
      ? initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-junto' })
      : initializeApp({ credential: applicationDefault() });

  const report = await migrateRideTimes(getFirestore(app), apply);

  console.log(`${apply ? 'APPLIED' : 'DRY RUN (no changes written; add --apply to write)'}`);
  console.log(`Rides scanned:          ${report.scanned}`);
  console.log(`Already in India time:  ${report.alreadyCorrect}`);
  console.log(`${apply ? 'Fixed' : 'Would fix'}:${' '.repeat(apply ? 18 : 14)}${report.fixed}`);
  console.log(`Left alone (check):     ${report.skipped.length}`);
  for (const c of report.changes) console.log(`  ${c.path}\n    ${c.from}\n ->   ${c.to}`);
  for (const s of report.skipped) console.log(`  SKIPPED ${s.path} (${s.reason}): ${s.start} – ${s.end}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
