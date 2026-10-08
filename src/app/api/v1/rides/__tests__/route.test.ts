import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '../route';
import { makeRequest, resetRepository } from '@/test/route-helpers';

describe('/api/v1/rides route', () => {
  beforeEach(() => {
    resetRepository();
  });

  describe('development mode', () => {
    it('lists open rides for an active resident identified by x-dev-user-id', async () => {
      const res = await GET(
        makeRequest('/api/v1/rides?date=ALL', {
          headers: { 'x-dev-user-id': 'usr-seeker-001', 'x-society-id': 'soc-ggh-001' },
        })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.rides.length).toBeGreaterThan(0);
    });

    it('hides offerer contact details from a seeker without an accepted request', async () => {
      const res = await GET(
        makeRequest('/api/v1/rides?date=ALL', {
          headers: { 'x-dev-user-id': 'usr-seeker-001', 'x-society-id': 'soc-ggh-001' },
        })
      );
      const data = await res.json();

      const othersRides = data.rides.filter(
        (r: { offerer: { id: string }; userRequestStatus?: string }) =>
          r.offerer.id !== 'usr-seeker-001' && r.userRequestStatus !== 'ACCEPTED'
      );
      expect(othersRides.length).toBeGreaterThan(0);
      for (const ride of othersRides) {
        expect(ride.offerer.mobile).toBeUndefined();
        expect(ride.offerer.flatNumber).toBeUndefined();
        expect(ride.vehicle.registrationNumber).toBeUndefined();
      }
    });

    it('rejects ride creation by a member pending approval', async () => {
      const res = await POST(
        makeRequest('/api/v1/rides', {
          method: 'POST',
          headers: { 'x-dev-user-id': 'usr-pending-001', 'x-society-id': 'soc-ggh-001' },
          body: {
            vehicleId: 'veh-any',
            journeyDate: '2030-01-01',
            departureWindowStart: '2030-01-01T08:30:00+05:30',
            destinationName: 'Manyata Tech Park',
          },
        })
      );

      expect(res.status).toBe(403);
    });
  });

  describe('production mode', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    it('returns 401 without a session cookie', async () => {
      const res = await GET(makeRequest('/api/v1/rides'));
      expect(res.status).toBe(401);
    });

    it('ignores the x-dev-user-id header', async () => {
      const res = await GET(
        makeRequest('/api/v1/rides', { headers: { 'x-dev-user-id': 'usr-admin-001' } })
      );
      expect(res.status).toBe(401);
    });

    // Phase 1.1: session cookies must be signed; today a raw user ID is accepted.
    it.todo('rejects a forged session cookie containing a raw user ID');
  });
});
