import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { getAuthContext, errorResponse } from '@/lib/api-auth';
import { formatPublicJourneyView } from '@/lib/services/privacy';
import { RideOccurrence } from '@/types';

// List available rides or user's rides
export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return errorResponse('Unauthorized', 401);
  if (auth.status !== 'ACTIVE') return errorResponse('Membership not active', 403);

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || undefined;
  const myRidesOnly = searchParams.get('mine') === 'true';

  const repo = getRepository();

  if (myRidesOnly) {
    const userRides = await repo.listUserRides(auth.societyId, auth.userId);
    return NextResponse.json({ rides: userRides });
  }

  // Open society rides (today + upcoming)
  const openRides = await repo.listOpenRides(auth.societyId, date);

  // Anonymize and format privacy views
  const userRequests = await repo.listUserRequests(auth.societyId, auth.userId);
  const requestMap = new Map(userRequests.map((r) => [r.journeyId, r.status]));

  const publicViews = await Promise.all(
    openRides.map(async (ride) => {
      const offerer = await repo.getUserById(ride.offererUserId);
      const vehicle = await repo.getVehicleById(auth.societyId, ride.vehicleId);
      if (!offerer || !vehicle) return null;

      const seekerRequestStatus = requestMap.get(ride.id);
      return formatPublicJourneyView(ride, offerer, vehicle, {
        isOfferer: ride.offererUserId === auth.userId,
        seekerRequestStatus,
      });
    })
  );

  return NextResponse.json({
    rides: publicViews.filter(Boolean),
  });
}

// Offer a ride / create a ride occurrence
export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return errorResponse('Unauthorized', 401);
  if (auth.status !== 'ACTIVE') return errorResponse('Membership not active', 403);

  const body = await req.json();
  const {
    vehicleId,
    journeyDate,
    direction,
    departureWindowStart,
    departureWindowEnd,
    originName,
    originLat,
    originLng,
    destinationName,
    destinationPlaceId,
    destinationLat,
    destinationLng,
    totalSeats,
    genderPreference,
    visibility,
  } = body;

  if (!vehicleId || !journeyDate || !destinationName || !departureWindowStart) {
    return errorResponse('Missing required ride fields');
  }

  const repo = getRepository();

  // Verify vehicle belongs to user in this society
  const vehicle = await repo.getVehicleById(auth.societyId, vehicleId);
  if (!vehicle || vehicle.userId !== auth.userId) {
    return errorResponse('Invalid vehicle selected');
  }

  const seats = totalSeats ? Number(totalSeats) : 2;

  const occurrence: RideOccurrence = {
    id: `jrn-${Date.now()}`,
    societyId: auth.societyId,
    offererUserId: auth.userId,
    vehicleId,
    journeyDate,
    direction: direction || 'OUTBOUND_SOCIETY',
    departureWindowStart,
    departureWindowEnd: departureWindowEnd || departureWindowStart,
    originName: originName || 'Society Main Gate',
    originLat: originLat || 12.9279,
    originLng: originLng || 77.6751,
    destinationName,
    destinationPlaceId: destinationPlaceId || 'custom-place-id',
    destinationLat: destinationLat || 13.0500,
    destinationLng: destinationLng || 77.6200,
    baselineDurationMinutes: 45,
    baselineDistanceKm: 22,
    totalSeats: seats,
    availableSeats: seats,
    genderPreference: genderPreference || 'ANY',
    visibility: visibility || 'SOCIETY_WIDE',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = await repo.createRideOccurrence(occurrence);

  // Record audit
  await repo.recordAuditEvent({
    id: `audit-${Date.now()}`,
    societyId: auth.societyId,
    actorUserId: auth.userId,
    action: 'RIDE_OFFERED',
    entityType: 'RIDE_OCCURRENCE',
    entityId: saved.id,
    metadata: { journeyDate, destinationName, seats },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, ride: saved });
}

// Edit a ride occurrence (Offerer only)
export async function PUT(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return errorResponse('Unauthorized', 401);

  const body = await req.json();
  const { journeyId, destinationName, departureWindowStart, departureWindowEnd, totalSeats, genderPreference } = body;

  if (!journeyId) return errorResponse('Missing journeyId');

  const repo = getRepository();
  const existing = await repo.getRideOccurrence(auth.societyId, journeyId);
  if (!existing) return errorResponse('Ride not found', 404);
  if (existing.offererUserId !== auth.userId) return errorResponse('Unauthorized to edit this ride', 403);

  const updates: Partial<RideOccurrence> = {};
  if (destinationName) updates.destinationName = destinationName;
  if (departureWindowStart) updates.departureWindowStart = departureWindowStart;
  if (departureWindowEnd) updates.departureWindowEnd = departureWindowEnd;
  if (genderPreference) updates.genderPreference = genderPreference;
  if (totalSeats) {
    const newTotal = Number(totalSeats);
    const bookedSeats = existing.totalSeats - existing.availableSeats;
    updates.totalSeats = newTotal;
    updates.availableSeats = Math.max(0, newTotal - bookedSeats);
  }

  const updated = await repo.updateRideOccurrence(auth.societyId, journeyId, auth.userId, updates);

  return NextResponse.json({ success: true, ride: updated });
}

// Delete or Cancel a ride occurrence (Offerer only)
export async function DELETE(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return errorResponse('Unauthorized', 401);

  const { searchParams } = new URL(req.url);
  const journeyId = searchParams.get('journeyId');

  if (!journeyId) return errorResponse('Missing journeyId');

  const repo = getRepository();
  const existing = await repo.getRideOccurrence(auth.societyId, journeyId);
  if (!existing) return errorResponse('Ride not found', 404);
  if (existing.offererUserId !== auth.userId) return errorResponse('Unauthorized to delete this ride', 403);

  await repo.deleteRideOccurrence(auth.societyId, journeyId, auth.userId);

  return NextResponse.json({ success: true, message: 'Ride deleted successfully' });
}
