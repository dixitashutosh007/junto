import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// List activity logs for the society (Society Admin & App Admin only)
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, { permission: 'canViewAuditLogs' });
  if (auth instanceof NextResponse) return auth;

  const repo = getRepository();
  const events = await repo.listAuditEvents(auth.societyId);

  // Enrich actor user details
  const enriched = await Promise.all(
    events.map(async (ev) => {
      let actorName = 'System / Automated';
      if (ev.actorUserId) {
        const u = await repo.getUserById(ev.actorUserId);
        if (u) actorName = u.fullName;
      }
      return {
        ...ev,
        actorName,
      };
    })
  );

  return NextResponse.json({ events: enriched });
}
