import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/api-auth';
import { evaluateCommuteMatch } from '@/lib/services/matching';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { pickupName, pickupLat, pickupLng, dropoffName, dropoffLat, dropoffLng, preferredTime, date } = body;

  const repo = getRepository();
  const society = await repo.getSocietyById(auth.societyId);
  const maxDetour = society?.settings.max_detour_minutes ?? 10;

  const queryDate = date || new Date().toISOString().split('T')[0];
  const openRides = await repo.listOpenRides(auth.societyId, queryDate);

  const matches = [];

  for (const ride of openRides) {
    if (ride.offererUserId === auth.userId) continue;

    const match = evaluateCommuteMatch({
      journey: ride,
      seekerUserId: auth.userId,
      seekerPickup: {
        name: pickupName || 'Society Gate',
        lat: pickupLat || ride.originLat,
        lng: pickupLng || ride.originLng,
      },
      seekerDropoff: {
        name: dropoffName || 'Tech Park',
        lat: dropoffLat || ride.destinationLat,
        lng: dropoffLng || ride.destinationLng,
      },
      seekerPreferredTime: preferredTime || ride.departureWindowStart,
      maxDetourMinutes: maxDetour,
    });

    if (match) {
      const offerer = await repo.getUserById(ride.offererUserId);
      const vehicle = await repo.getVehicleById(auth.societyId, ride.vehicleId);
      matches.push({
        match,
        journey: ride,
        offererName: offerer ? `${offerer.fullName.split(' ')[0]} ${offerer.fullName.split(' ')[1]?.charAt(0) || ''}.` : 'Resident',
        vehicleModel: vehicle ? `${vehicle.color} ${vehicle.make} ${vehicle.model}` : 'Car',
      });
    }
  }

  return NextResponse.json({
    matches,
    maxDetourApplied: maxDetour,
  });
}
