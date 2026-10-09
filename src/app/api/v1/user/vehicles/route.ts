import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { ONBOARDING_STATUSES, requireAuth, errorResponse } from '@/lib/api-auth';
import { Vehicle } from '@/types';
import { validateIndianRegistration, formatIndianRegistration } from '@/lib/utils/indian-vehicle';
import { CreateVehicleSchema } from '@/lib/validation/schemas';
import { parseBody } from '@/lib/validation/parse';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, { statuses: ONBOARDING_STATUSES });
  if (auth instanceof NextResponse) return auth;

  const repo = getRepository();
  const vehicles = await repo.listUserVehicles(auth.societyId, auth.userId);
  return NextResponse.json({ vehicles });
}

export async function POST(req: NextRequest) {
  // Allow ACTIVE residents and onboarding residents awaiting approval
  const auth = await requireAuth(req, { statuses: ONBOARDING_STATUSES });
  if (auth instanceof NextResponse) return auth;

  const body = await parseBody(req, CreateVehicleSchema);
  if (body instanceof NextResponse) return body;
  const { type, make, model, color, registrationNumber, capacity, mileageKmPerLitre } = body;

  // Indian standard vehicle number validation
  const regCheck = validateIndianRegistration(registrationNumber);
  if (!regCheck.isValid) {
    return errorResponse(regCheck.error || 'Invalid Indian vehicle registration number', 400);
  }

  const formattedReg = formatIndianRegistration(registrationNumber);

  // Mileage (km/L) is range-checked by the schema; default for typical Indian cars
  const parsedMileage = mileageKmPerLitre !== undefined ? Math.round(mileageKmPerLitre * 10) / 10 : 15;

  const repo = getRepository();
  const vehicle: Vehicle = {
    id: `veh-${crypto.randomUUID()}`,
    societyId: auth.societyId,
    userId: auth.userId,
    type,
    make,
    model,
    color: color || 'White',
    registrationNumber: formattedReg,
    capacity: capacity ?? (type === 'TWO_WHEELER' ? 1 : 4),
    mileageKmPerLitre: parsedMileage,
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
