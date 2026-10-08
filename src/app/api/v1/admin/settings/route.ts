import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { getAuthContext, errorResponse } from '@/lib/api-auth';

// Update society profile and settings (name, address, location, rules, detour threshold)
export async function PUT(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return errorResponse('Unauthorized', 401);
  if (auth.role !== 'SOCIETY_ADMIN' && auth.role !== 'SUPER_ADMIN') {
    return errorResponse('Forbidden: Society Admin role required', 403);
  }

  const body = await req.json();
  const {
    name,
    address,
    latitude,
    longitude,
    community_rules,
    max_detour_minutes,
    require_admin_approval,
    allow_gender_preferences,
  } = body;

  const repo = getRepository();

  // Update society top-level profile attributes if provided
  let society = await repo.getSocietyById(auth.societyId);
  if (!society) return errorResponse('Society not found', 404);

  const societyUpdates: Partial<typeof society> = {};
  if (name !== undefined) societyUpdates.name = name;
  if (address !== undefined) societyUpdates.address = address;
  if (latitude !== undefined) societyUpdates.latitude = Number(latitude);
  if (longitude !== undefined) societyUpdates.longitude = Number(longitude);

  if (Object.keys(societyUpdates).length > 0) {
    society = await repo.updateSociety(auth.societyId, societyUpdates);
  }

  // Update society settings
  const settingsUpdates: Partial<typeof society.settings> = {};
  if (max_detour_minutes !== undefined) settingsUpdates.max_detour_minutes = Number(max_detour_minutes);
  if (require_admin_approval !== undefined) settingsUpdates.require_admin_approval = Boolean(require_admin_approval);
  if (allow_gender_preferences !== undefined) settingsUpdates.allow_gender_preferences = Boolean(allow_gender_preferences);
  if (community_rules !== undefined) settingsUpdates.community_rules = community_rules;

  if (Object.keys(settingsUpdates).length > 0) {
    society = await repo.updateSocietySettings(auth.societyId, settingsUpdates);
  }

  await repo.recordAuditEvent({
    id: `audit-${Date.now()}`,
    societyId: auth.societyId,
    actorUserId: auth.userId,
    action: 'SOCIETY_PROFILE_AND_SETTINGS_UPDATED',
    entityType: 'SOCIETY',
    entityId: auth.societyId,
    metadata: { societyUpdates, settingsUpdates },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, society, settings: society.settings });
}
