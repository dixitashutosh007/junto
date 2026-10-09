import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/api-auth';
import { formatPublicJourneyView } from '@/lib/services/privacy';
import { RideOccurrence } from '@/types';
import {
  CreateRideSchema,
  JourneyIdQuerySchema,
  ListRidesQuerySchema,
  UpdateRideSchema,
} from '@/lib/validation/schemas';
import { parseBody, parseQuery } from '@/lib/validation/parse';

// List available rides or user's rides
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const query = parseQuery(req, ListRidesQuerySchema);
  if (query instanceof NextResponse) return query;
  const date = query.date;
  const myRidesOnly = query.mine === 'true';

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
      const isAccepted = ride.offererUserId === auth.userId || seekerRequestStatus === 'ACCEPTED';
      let offererFlatNumber: string | undefined;
      if (isAccepted) {
        const mem = await repo.getMembership(auth.societyId, ride.offererUserId);
        if (mem?.flatNumber) offererFlatNumber = mem.flatNumber;
      }

      return formatPublicJourneyView(ride, offerer, vehicle, {
        isOfferer: ride.offererUserId === auth.userId,
        seekerRequestStatus,
        offererFlatNumber,
      });
    })
  );

  return NextResponse.json({
    rides: publicViews.filter(Boolean),
  });
}

// Offer a ride / create a ride occurrence
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await parseBody(req, CreateRideSchema);
  if (body instanceof NextResponse) return body;

  const {
    vehicleId,
    journeyDate,
    departureWindowStart,
    departureWindowEnd,
    direction,
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
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await parseBody(req, UpdateRideSchema);
  if (body instanceof NextResponse) return body;
  const { journeyId, destinationName, departureWindowStart, departureWindowEnd, totalSeats, genderPreference } = body;

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
    const bookedSeats = existing.totalSeats - existing.availableSeats;
    if (totalSeats < bookedSeats) {
      return errorResponse(`${bookedSeats} seat(s) are already booked on this ride`);
    }
    updates.totalSeats = totalSeats;
    updates.availableSeats = totalSeats - bookedSeats;
  }

  const updated = await repo.updateRideOccurrence(auth.societyId, journeyId, auth.userId, updates);

  return NextResponse.json({ success: true, ride: updated });
}

// Delete or Cancel a ride occurrence (Offerer only)
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const query = parseQuery(req, JourneyIdQuerySchema);
  if (query instanceof NextResponse) return query;
  const { journeyId } = query;

  const repo = getRepository();
  const existing = await repo.getRideOccurrence(auth.societyId, journeyId);
  if (!existing) return errorResponse('Ride not found', 404);
  if (existing.offererUserId !== auth.userId) return errorResponse('Unauthorized to delete this ride', 403);

  await repo.deleteRideOccurrence(auth.societyId, journeyId, auth.userId);

  return NextResponse.json({ success: true, message: 'Ride deleted successfully' });
}
