import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/api-auth';
import { ModerationReport } from '@/types';
import { ModerationReportSchema } from '@/lib/validation/schemas';

// Submit a resident or ride violation report
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  const parseResult = ModerationReportSchema.safeParse(body);
  if (!parseResult.success) {
    return errorResponse(parseResult.error.issues[0]?.message || 'Invalid moderation report parameters');
  }

  const { reportedUserId, journeyId, category, description } = parseResult.data;

  const repo = getRepository();
  const report: ModerationReport = {
    id: `rep-${Date.now()}`,
    societyId: auth.societyId,
    journeyId,
    reporterId: auth.userId,
    reportedUserId,
    category,
    description,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  };

  const saved = await repo.createModerationReport(report);

  await repo.recordAuditEvent({
    id: `audit-${Date.now()}`,
    societyId: auth.societyId,
    actorUserId: auth.userId,
    action: 'INCIDENT_REPORTED',
    entityType: 'MODERATION_REPORT',
    entityId: saved.id,
    metadata: { reportedUserId, category },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, report: saved });
}

// List society moderation reports (Society Admin only)
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, { roles: ['SOCIETY_ADMIN', 'SUPER_ADMIN'] });
  if (auth instanceof NextResponse) return auth;

  const repo = getRepository();
  const reports = await repo.listModerationReports(auth.societyId);
  return NextResponse.json({ reports });
}

// Update moderation report status (Society Admin only)
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req, { roles: ['SOCIETY_ADMIN', 'SUPER_ADMIN'] });
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { reportId, status, resolutionNotes } = body;
  if (!reportId || !status) return errorResponse('Missing reportId or status');

  const repo = getRepository();
  const updated = await repo.updateModerationReportStatus(
    auth.societyId,
    reportId,
    status,
    resolutionNotes,
    auth.userId
  );

  await repo.recordAuditEvent({
    id: `audit-${Date.now()}`,
    societyId: auth.societyId,
    actorUserId: auth.userId,
    action: 'MODERATION_REPORT_RESOLVED',
    entityType: 'MODERATION_REPORT',
    entityId: reportId,
    metadata: { status, resolutionNotes },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, report: updated });
}
