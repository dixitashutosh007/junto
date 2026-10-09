import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/api-auth';
import { RideRequest } from '@/types';
import {
  CreateRideRequestSchema,
  ListRequestsQuerySchema,
  RequestIdQuerySchema,
  RespondToRequestSchema,
} from '@/lib/validation/schemas';
import { parseBody, parseQuery } from '@/lib/validation/parse';

// Request a seat on a journey
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await parseBody(req, CreateRideRequestSchema);
  if (body instanceof NextResponse) return body;

  const {
    journeyId,
    requestedSeats,
    pickupName,
    pickupLat,
    pickupLng,
    dropoffName,
    dropoffLat,
    dropoffLng,
  } = body;

  const repo = getRepository();
  const journey = await repo.getRideOccurrence(auth.societyId, journeyId);
  if (!journey) return errorResponse('Journey not found', 404);

  if (journey.offererUserId === auth.userId) {
    return errorResponse('You cannot request a seat on your own offered ride');
  }

  const seatsNeeded = requestedSeats ? Number(requestedSeats) : 1;
  if (journey.availableSeats < seatsNeeded) {
    return errorResponse('Not enough available seats');
  }

  const newRequest: RideRequest = {
    id: `req-${Date.now()}`,
    societyId: auth.societyId,
    journeyId,
    seekerUserId: auth.userId,
    requestedSeats: seatsNeeded,
    pickupName: pickupName || journey.originName,
    pickupLat: pickupLat || journey.originLat,
    pickupLng: pickupLng || journey.originLng,
    dropoffName: dropoffName || journey.destinationName,
    dropoffLat: dropoffLat || journey.destinationLat,
    dropoffLng: dropoffLng || journey.destinationLng,
    calculatedDetourMinutes: 6, // sample calculated detour
    status: 'REQUESTED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = await repo.createRideRequest(newRequest);

  // Notify the ride offerer of a new seat request
  const seekerUser = await repo.getUserById(auth.userId);
  const seekerName = seekerUser ? seekerUser.fullName.split(' ')[0] : 'A co-resident';
  await repo.createNotification({
    id: `notif-${Date.now()}-req`,
    societyId: auth.societyId,
    userId: journey.offererUserId,
    title: 'New Ride Request!',
    body: `${seekerName} requested ${seatsNeeded} seat(s) for your trip to ${journey.destinationName}.`,
    type: 'RIDE_REQUESTED',
    link: '/rides/requests',
    read: false,
    createdAt: new Date().toISOString(),
  });

  await repo.recordAuditEvent({
    id: `audit-${Date.now()}`,
    societyId: auth.societyId,
    actorUserId: auth.userId,
    action: 'SEAT_REQUESTED',
    entityType: 'RIDE_REQUEST',
    entityId: saved.id,
    metadata: { journeyId, requestedSeats: seatsNeeded },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, request: saved });
}

// Accept or Reject a seat request (Offerer only)
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await parseBody(req, RespondToRequestSchema);
  if (body instanceof NextResponse) return body;
  const { requestId, action, note } = body;

  const repo = getRepository();
  const request = await repo.getRideRequest(auth.societyId, requestId);
  if (!request) return errorResponse('Request not found', 404);

  const journey = await repo.getRideOccurrence(auth.societyId, request.journeyId);
  if (!journey) return errorResponse('Journey not found', 404);

  if (journey.offererUserId !== auth.userId) {
    return errorResponse('Forbidden: Only the offerer can accept/reject requests', 403);
  }

  if (action === 'ACCEPT') {
    if (journey.availableSeats < request.requestedSeats) {
      return errorResponse('Insufficient seats remaining to accept this request');
    }

    // Decrement available seats atomically
    await repo.updateAvailableSeats(auth.societyId, journey.id, -request.requestedSeats);

    const updated = await repo.updateRequestStatus(
      auth.societyId,
      requestId,
      'ACCEPTED',
      note
    );

    // Notify seeker that their request was accepted
    await repo.createNotification({
      id: `notif-${Date.now()}-acc`,
      societyId: auth.societyId,
      userId: request.seekerUserId,
      title: 'Ride Request Accepted! 🎉',
      body: `Your ride to ${journey.destinationName} has been confirmed. Contact details are now unlocked.`,
      type: 'REQUEST_ACCEPTED',
      link: '/rides/my-requests',
      read: false,
      createdAt: new Date().toISOString(),
    });

    // Audit contact disclosure
    await repo.recordAuditEvent({
      id: `audit-${Date.now()}`,
      societyId: auth.societyId,
      actorUserId: auth.userId,
      action: 'REQUEST_ACCEPTED_CONTACT_REVEALED',
      entityType: 'RIDE_REQUEST',
      entityId: requestId,
      metadata: { seekerUserId: request.seekerUserId },
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, request: updated });
  } else {
    const updated = await repo.updateRequestStatus(
      auth.societyId,
      requestId,
      'REJECTED',
      note
    );

    // Notify seeker of rejection
    await repo.createNotification({
      id: `notif-${Date.now()}-rej`,
      societyId: auth.societyId,
      userId: request.seekerUserId,
      title: 'Ride Request Declined',
      body: `Unfortunately, the offerer was unable to accommodate your request for the trip to ${journey.destinationName}.`,
      type: 'REQUEST_REJECTED',
      link: '/rides/find',
      read: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, request: updated });
  }
}

// Get user requests (Seeker view) or journey requests (Offerer view)
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const query = parseQuery(req, ListRequestsQuerySchema);
  if (query instanceof NextResponse) return query;
  const { journeyId } = query;

  const repo = getRepository();

  if (journeyId) {
    // Requests on a journey (who asked, pickup points) are visible only to its offerer
    const journey = await repo.getRideOccurrence(auth.societyId, journeyId);
    if (!journey) return errorResponse('Journey not found', 404);
    if (journey.offererUserId !== auth.userId) {
      return errorResponse('Forbidden: Only the offerer can view requests for this ride', 403);
    }
    const journeyRequests = await repo.listJourneyRequests(auth.societyId, journeyId);
    return NextResponse.json({ requests: journeyRequests });
  }

  // List all requests submitted by this seeker
  const userRequests = await repo.listUserRequests(auth.societyId, auth.userId);
  const enriched = await Promise.all(
    userRequests.map(async (r) => {
      const journey = await repo.getRideOccurrence(auth.societyId, r.journeyId);
      const offerer = journey ? await repo.getUserById(journey.offererUserId) : null;
      const vehicle = journey ? await repo.getVehicleById(auth.societyId, journey.vehicleId) : null;
      let offererFlat: string | undefined;
      if (r.status === 'ACCEPTED' && journey) {
        const mem = await repo.getMembership(auth.societyId, journey.offererUserId);
        offererFlat = mem?.flatNumber || 'Tower B-804';
      }
      return {
        ...r,
        journey,
        offererName: offerer ? offerer.fullName : 'Resident',
        offererMobile: r.status === 'ACCEPTED' ? offerer?.mobile : undefined,
        offererFlat,
        vehicleName: vehicle ? `${vehicle.color} ${vehicle.make} ${vehicle.model}` : 'Vehicle',
        vehiclePlate: r.status === 'ACCEPTED' ? vehicle?.registrationNumber : undefined,
      };
    })
  );

  return NextResponse.json({ requests: enriched });
}

// Cancel a request (Seeker only)
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const query = parseQuery(req, RequestIdQuerySchema);
  if (query instanceof NextResponse) return query;
  const { requestId } = query;

  const repo = getRepository();
  const request = await repo.getRideRequest(auth.societyId, requestId);
  if (!request) return errorResponse('Request not found', 404);
  if (request.seekerUserId !== auth.userId) return errorResponse('Unauthorized to cancel this request', 403);

  // If request was ACCEPTED, release seats back to journey and notify offerer
  if (request.status === 'ACCEPTED') {
    await repo.updateAvailableSeats(auth.societyId, request.journeyId, request.requestedSeats);
    const journey = await repo.getRideOccurrence(auth.societyId, request.journeyId);
    if (journey) {
      await repo.createNotification({
        id: `notif-${Date.now()}-can`,
        societyId: auth.societyId,
        userId: journey.offererUserId,
        title: 'Passenger Cancelled Booking',
        body: `A passenger cancelled their seat for your ride to ${journey.destinationName}. ${request.requestedSeats} seat(s) restored.`,
        type: 'RIDE_CANCELLED',
        link: '/rides/my-rides',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  const updated = await repo.updateRequestStatus(auth.societyId, requestId, 'CANCELLED');

  return NextResponse.json({ success: true, request: updated });
}
