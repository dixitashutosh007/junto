import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { ONBOARDING_STATUSES, requireAuth, errorResponse } from '@/lib/api-auth';
import { Vehicle } from '@/types';
import { validateIndianRegistration, formatIndianRegistration } from '@/lib/utils/indian-vehicle';

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

  const body = await req.json();
  const { type, make, model, color, registrationNumber, capacity, mileageKmPerLitre } = body;

  if (!make || !model || !registrationNumber) {
    return errorResponse('Missing vehicle details');
  }

  // Indian standard vehicle number validation
  const regCheck = validateIndianRegistration(registrationNumber);
  if (!regCheck.isValid) {
    return errorResponse(regCheck.error || 'Invalid Indian vehicle registration number', 400);
  }

  const formattedReg = formatIndianRegistration(registrationNumber);

  // Validate or default mileage (km/L)
  let parsedMileage = 15;
  if (mileageKmPerLitre !== undefined && mileageKmPerLitre !== null && mileageKmPerLitre !== '') {
    const num = Number(mileageKmPerLitre);
    if (!isNaN(num) && num >= 5 && num <= 60) {
      parsedMileage = Math.round(num * 10) / 10;
    }
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
    registrationNumber: formattedReg,
    capacity: capacity ? Number(capacity) : 4,
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
