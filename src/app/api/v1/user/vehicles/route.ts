import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { getAuthContext, errorResponse } from '@/lib/api-auth';
import { Vehicle } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return errorResponse('Unauthorized', 401);

  const repo = getRepository();
  const vehicles = await repo.listUserVehicles(auth.societyId, auth.userId);
  return NextResponse.json({ vehicles });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return errorResponse('Unauthorized', 401);
  if (auth.status !== 'ACTIVE') return errorResponse('Active membership required', 403);

  const body = await req.json();
  const { type, make, model, color, registrationNumber, capacity } = body;

  if (!make || !model || !registrationNumber) {
    return errorResponse('Missing vehicle details');
  }

  const repo = getRepository();
  const vehicle: Vehicle = {
    id: `veh-${Date.now()}`,
    societyId: auth.societyId,
    userId: auth.userId,
    type: type || 'CAR',
    make,
    model,
    color: color || 'White',
    registrationNumber,
    capacity: capacity ? Number(capacity) : 4,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const saved = await repo.createVehicle(vehicle);

  await repo.recordAuditEvent({
    id: `audit-${Date.now()}`,
    societyId: auth.societyId,
    actorUserId: auth.userId,
    action: 'VEHICLE_REGISTERED',
    entityType: 'VEHICLE',
    entityId: saved.id,
    metadata: { make, model },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, vehicle: saved });
}
