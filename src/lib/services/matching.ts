import { CommuteMatch, MatchQualityLabel, RideOccurrence } from '@/types';

export interface RouteCoord {
  lat: number;
  lng: number;
}

/**
 * Calculates straight line / Haversine distance in km between two coordinates.
 */
export function calculateHaversineDistanceKm(
  coord1: RouteCoord,
  coord2: RouteCoord
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Deterministic Detour Calculation
 * Approximates detour travel time based on distance detour and average city driving speed (25 km/h in Bangalore traffic).
 *
 * In production: this calls Google Routes API to get exact driving durations:
 * Delta T = T(Origin -> Pickup -> Dropoff -> Destination) - T(Origin -> Destination)
 */
export function estimateDetourMinutes(
  offererOrigin: RouteCoord,
  offererDest: RouteCoord,
  seekerPickup: RouteCoord,
  seekerDropoff: RouteCoord
): number {
  // Direct distance
  const directKm = calculateHaversineDistanceKm(offererOrigin, offererDest);

  // Waypoint distance: Origin -> Pickup -> Dropoff -> Destination
  const waypointKm =
    calculateHaversineDistanceKm(offererOrigin, seekerPickup) +
    calculateHaversineDistanceKm(seekerPickup, seekerDropoff) +
    calculateHaversineDistanceKm(seekerDropoff, offererDest);

  const deltaKm = Math.max(0, waypointKm - directKm);

  // In Bangalore urban commute, assume 25 km/h average speed (approx 2.4 minutes per km) + 2 mins pickup/dropoff buffer
  const detourMinutes = Math.round(deltaKm * 2.4 + (deltaKm > 0.3 ? 2 : 0));
  return detourMinutes;
}

export interface MatchingInput {
  journey: RideOccurrence;
  seekerUserId: string;
  seekerPickup: { name: string; lat: number; lng: number };
  seekerDropoff: { name: string; lat: number; lng: number };
  seekerPreferredTime: string; // ISO
  maxDetourMinutes: number;
}

/**
 * Deterministic Matching Engine
 * 1. Verifies Detour <= maxDetourMinutes (Default: 10 mins)
 * 2. Computes 0-100 quality score based on time overlap and detour efficiency
 * 3. Assigns human-friendly quality labels (EXCELLENT, GOOD, POSSIBLE)
 */
export function evaluateCommuteMatch(
  input: MatchingInput
): CommuteMatch | null {
  const {
    journey,
    seekerUserId,
    seekerPickup,
    seekerDropoff,
    seekerPreferredTime,
    maxDetourMinutes,
  } = input;

  // 1. Hard Filter: Seats available
  if (journey.availableSeats <= 0) return null;

  // 2. Hard Filter: Detour calculation
  const detourMinutes = estimateDetourMinutes(
    { lat: journey.originLat, lng: journey.originLng },
    { lat: journey.destinationLat, lng: journey.destinationLng },
    seekerPickup,
    seekerDropoff
  );

  if (detourMinutes > maxDetourMinutes) {
    return null; // Exceeds configured detour tolerance (e.g. 10 mins)
  }

  // 3. Time difference in minutes between offerer departure start and seeker preferred time
  const offererTimeMs = new Date(journey.departureWindowStart).getTime();
  const seekerTimeMs = new Date(seekerPreferredTime).getTime();
  const timeDiffMinutes = Math.abs(offererTimeMs - seekerTimeMs) / (1000 * 60);

  // Only consider within 45 minute window
  if (timeDiffMinutes > 45) return null;

  // 4. Calculate Score:
  // - Detour Efficiency (50%): 50 * (1 - detour / maxDetour)
  // - Time Congruence (50%): 50 * (1 - timeDiff / 45)
  const detourScore = Math.max(0, 50 * (1 - detourMinutes / maxDetourMinutes));
  const timeScore = Math.max(0, 50 * (1 - timeDiffMinutes / 45));
  const qualityScore = Math.round(detourScore + timeScore);

  let qualityLabel: MatchQualityLabel = 'POSSIBLE';
  if (qualityScore >= 75) {
    qualityLabel = 'EXCELLENT';
  } else if (qualityScore >= 50) {
    qualityLabel = 'GOOD';
  }

  return {
    id: `match-${journey.id}-${seekerUserId}`,
    societyId: journey.societyId,
    journeyId: journey.id,
    seekerUserId,
    qualityScore,
    qualityLabel,
    detourMinutes,
    timeOverlapMinutes: Math.round(Math.max(0, 45 - timeDiffMinutes)),
    status: 'NEW',
    createdAt: new Date().toISOString(),
  };
}

// Road distance is roughly 1.3x the straight line in Bangalore; average
// commute speed about 25 km/h (2.4 minutes per km)
const ROAD_FACTOR = 1.3;
const MINUTES_PER_KM = 2.4;

/**
 * Offline estimate of driving distance and time between two points, used
 * when no routing API result is available.
 */
export function estimateRoute(
  origin: RouteCoord,
  destination: RouteCoord
): { distanceKm: number; durationMinutes: number } {
  const distanceKm = Math.max(1, Math.round(calculateHaversineDistanceKm(origin, destination) * ROAD_FACTOR));
  return { distanceKm, durationMinutes: Math.round(distanceKm * MINUTES_PER_KM) };
}
