import { JourneyStatus, RequestStatus, RideOccurrence, RideRequest } from '@/types';

/**
 * Pure seat-booking rules shared by every repository implementation.
 *
 * Repositories read the journey and request inside one transaction, call a
 * plan* function, and write back exactly what it returns. Keeping the rules
 * here means Firestore and the in-memory repository can't drift apart.
 */

export type BookingFailure =
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'INVALID_STATE'
  | 'INSUFFICIENT_SEATS'
  | 'RIDE_UNAVAILABLE';

export type BookingResult =
  | { ok: true; journey: RideOccurrence; request: RideRequest; previousStatus: RequestStatus }
  | { ok: false; reason: BookingFailure };

export type RideCancellationResult =
  | { ok: true; journey: RideOccurrence; affectedRequests: RideRequest[] }
  | { ok: false; reason: BookingFailure };

/** Request statuses that hold or wait for a seat */
export const ACTIVE_REQUEST_STATUSES: RequestStatus[] = ['REQUESTED', 'ACCEPTED'];

/** Ride statuses that still take bookings */
const BOOKABLE_JOURNEY_STATUSES: JourneyStatus[] = ['OPEN', 'PARTIALLY_BOOKED', 'FULL'];

export function journeyStatusForSeats(availableSeats: number): JourneyStatus {
  return availableSeats === 0 ? 'FULL' : 'OPEN';
}

/** Offerer accepts a pending request: takes the seats if they are still free */
export function planAccept(
  journey: RideOccurrence | null,
  request: RideRequest | null,
  offererUserId: string,
  note: string | undefined,
  now: string
): BookingResult {
  if (!journey || !request || request.journeyId !== journey.id) return { ok: false, reason: 'NOT_FOUND' };
  if (journey.offererUserId !== offererUserId) return { ok: false, reason: 'FORBIDDEN' };
  if (!BOOKABLE_JOURNEY_STATUSES.includes(journey.status)) return { ok: false, reason: 'RIDE_UNAVAILABLE' };
  if (request.status !== 'REQUESTED') return { ok: false, reason: 'INVALID_STATE' };
  if (journey.availableSeats < request.requestedSeats) return { ok: false, reason: 'INSUFFICIENT_SEATS' };

  const availableSeats = journey.availableSeats - request.requestedSeats;
  return {
    ok: true,
    previousStatus: request.status,
    journey: { ...journey, availableSeats, status: journeyStatusForSeats(availableSeats), updatedAt: now },
    request: { ...request, status: 'ACCEPTED', ...(note ? { responseNote: note } : {}), updatedAt: now },
  };
}

/**
 * Ends a request: the offerer rejects it, or the seeker cancels it. Seats
 * held by an accepted request go back to the ride.
 */
export function planClose(
  journey: RideOccurrence | null,
  request: RideRequest | null,
  actor: { userId: string; as: 'OFFERER' | 'SEEKER' },
  note: string | undefined,
  now: string
): BookingResult {
  if (!journey || !request || request.journeyId !== journey.id) return { ok: false, reason: 'NOT_FOUND' };

  const allowed =
    actor.as === 'OFFERER' ? journey.offererUserId === actor.userId : request.seekerUserId === actor.userId;
  if (!allowed) return { ok: false, reason: 'FORBIDDEN' };
  if (!ACTIVE_REQUEST_STATUSES.includes(request.status)) return { ok: false, reason: 'INVALID_STATE' };

  const releasedSeats = request.status === 'ACCEPTED' ? request.requestedSeats : 0;
  const availableSeats = Math.min(journey.totalSeats, journey.availableSeats + releasedSeats);
  const rideStillBookable = BOOKABLE_JOURNEY_STATUSES.includes(journey.status);

  return {
    ok: true,
    previousStatus: request.status,
    journey: {
      ...journey,
      availableSeats,
      status: rideStillBookable ? journeyStatusForSeats(availableSeats) : journey.status,
      updatedAt: now,
    },
    request: {
      ...request,
      status: actor.as === 'OFFERER' ? 'REJECTED' : 'CANCELLED',
      ...(note ? { responseNote: note } : {}),
      updatedAt: now,
    },
  };
}

/** Offerer cancels the whole ride; every pending or accepted request is cancelled */
export function planCancelRide(
  journey: RideOccurrence | null,
  requests: RideRequest[],
  offererUserId: string,
  reason: string,
  now: string
): RideCancellationResult {
  if (!journey) return { ok: false, reason: 'NOT_FOUND' };
  if (journey.offererUserId !== offererUserId) return { ok: false, reason: 'FORBIDDEN' };
  if (!BOOKABLE_JOURNEY_STATUSES.includes(journey.status)) return { ok: false, reason: 'INVALID_STATE' };

  const affectedRequests = requests
    .filter((r) => r.journeyId === journey.id && ACTIVE_REQUEST_STATUSES.includes(r.status))
    .map((r) => ({
      ...r,
      status: 'CANCELLED' as const,
      responseNote: 'Ride cancelled by the offerer',
      updatedAt: now,
    }));

  return {
    ok: true,
    journey: {
      ...journey,
      status: 'CANCELLED',
      cancellationReason: reason,
      cancelledBy: offererUserId,
      updatedAt: now,
    },
    affectedRequests,
  };
}
