import { describe, it, expect, beforeEach } from 'vitest';
import { MockDynamoRepository } from '../mock-repository';
import { evaluateCommuteMatch } from '../../services/matching';
import { formatPublicJourneyView } from '../../services/privacy';
import { RideOccurrence, User, Vehicle } from '@/types';

describe('SocietyApps V1 Core Test Suite', () => {
  let repo: MockDynamoRepository;

  beforeEach(() => {
    repo = new MockDynamoRepository();
  });

  describe('1. Multi-Tenant Isolation', () => {
    it('prevents user in Society A from viewing rides in Society B', async () => {
      // Create a second society
      await repo.createSociety({
        id: 'soc-other-002',
        slug: 'other-society',
        name: 'Palm Meadows',
        code: 'PALM2024',
        address: 'Whitefield',
        latitude: 12.9698,
        longitude: 77.7499,
        settings: { max_detour_minutes: 10, require_admin_approval: true, allow_gender_preferences: true },
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      // Green Glen Heights has 1 seeded ride
      const greenGlenRides = await repo.listOpenRides('soc-ggh-001', dateStr);
      expect(greenGlenRides.length).toBeGreaterThan(0);

      // Palm Meadows must have 0 rides (isolated)
      const palmMeadowRides = await repo.listOpenRides('soc-other-002', dateStr);
      expect(palmMeadowRides.length).toBe(0);
    });

    it('enforces pending approval lifecycle: user is not active until approved', async () => {
      const pendingMembers = await repo.listPendingMemberships('soc-ggh-001');
      expect(pendingMembers.length).toBeGreaterThanOrEqual(1);
      expect(pendingMembers[0].user.fullName).toBe('Rahul Verma');
      expect(pendingMembers[0].status).toBe('PENDING_APPROVAL');

      // Admin approves
      await repo.updateMembershipStatus('soc-ggh-001', pendingMembers[0].userId, 'ACTIVE', 'usr-admin-001');

      const updatedMem = await repo.getMembership('soc-ggh-001', pendingMembers[0].userId);
      expect(updatedMem?.status).toBe('ACTIVE');
      expect(updatedMem?.approvedBy).toBe('usr-admin-001');
    });
  });

  describe('2. Deterministic Route Matching & Detour Constraints', () => {
    it('matches when detour is <= configurable maximum (10 minutes)', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const sampleJourney: RideOccurrence = {
        id: 'jrn-test-1',
        societyId: 'soc-ggh-001',
        offererUserId: 'usr-offerer-001',
        vehicleId: 'veh-001',
        journeyDate: dateStr,
        direction: 'OUTBOUND_SOCIETY',
        departureWindowStart: `${dateStr}T08:00:00.000Z`,
        departureWindowEnd: `${dateStr}T08:20:00.000Z`,
        originName: 'Green Glen Heights',
        originLat: 12.9279,
        originLng: 77.6751,
        destinationName: 'Manyata Tech Park',
        destinationPlaceId: 'place-manyata',
        destinationLat: 13.0500,
        destinationLng: 77.6200,
        baselineDurationMinutes: 45,
        baselineDistanceKm: 24,
        totalSeats: 2,
        availableSeats: 2,
        genderPreference: 'ANY',
        visibility: 'SOCIETY_WIDE',
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Passenger along route (e.g. Marathahalli / Ring Road pickup)
      const match = evaluateCommuteMatch({
        journey: sampleJourney,
        seekerUserId: 'usr-seeker-001',
        seekerPickup: { name: 'Bellandur Gate', lat: 12.9300, lng: 77.6780 },
        seekerDropoff: { name: 'Nagavara / Manyata', lat: 13.0450, lng: 77.6210 },
        seekerPreferredTime: `${dateStr}T08:10:00.000Z`,
        maxDetourMinutes: 10,
      });

      expect(match).not.toBeNull();
      expect(match?.detourMinutes).toBeLessThanOrEqual(10);
      expect(['EXCELLENT', 'GOOD']).toContain(match?.qualityLabel);
    });

    it('rejects match when detour exceeds maximum tolerance', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const sampleJourney: RideOccurrence = {
        id: 'jrn-test-2',
        societyId: 'soc-ggh-001',
        offererUserId: 'usr-offerer-001',
        vehicleId: 'veh-001',
        journeyDate: dateStr,
        direction: 'OUTBOUND_SOCIETY',
        departureWindowStart: `${dateStr}T08:00:00.000Z`,
        departureWindowEnd: `${dateStr}T08:20:00.000Z`,
        originName: 'Green Glen Heights',
        originLat: 12.9279,
        originLng: 77.6751,
        destinationName: 'Manyata Tech Park',
        destinationPlaceId: 'place-manyata',
        destinationLat: 13.0500,
        destinationLng: 77.6200,
        baselineDurationMinutes: 45,
        baselineDistanceKm: 24,
        totalSeats: 2,
        availableSeats: 2,
        genderPreference: 'ANY',
        visibility: 'SOCIETY_WIDE',
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Far detour (Electronic City to the South while offerer is going North to Manyata)
      const match = evaluateCommuteMatch({
        journey: sampleJourney,
        seekerUserId: 'usr-seeker-001',
        seekerPickup: { name: 'Electronic City Phase 1', lat: 12.8399, lng: 77.6770 },
        seekerDropoff: { name: 'Bannerghatta Road', lat: 12.8900, lng: 77.5900 },
        seekerPreferredTime: `${dateStr}T08:10:00.000Z`,
        maxDetourMinutes: 10,
      });

      expect(match).toBeNull();
    });
  });

  describe('3. Privacy & Contact Disclosure Rules', () => {
    it('masks phone number, flat number, and vehicle registration before acceptance', () => {
      const sampleUser: User = {
        id: 'usr-offerer-001',
        cognitoSub: 'sub-1',
        email: 'ashutosh@example.com',
        mobile: '+919811122233',
        fullName: 'Ashutosh Dixit',
        gender: 'MALE',
        workLocationName: 'Manyata',
        createdAt: new Date().toISOString(),
      };

      const sampleVehicle: Vehicle = {
        id: 'veh-1',
        societyId: 'soc-ggh-001',
        userId: 'usr-offerer-001',
        type: 'SUV',
        make: 'Hyundai',
        model: 'Creta',
        color: 'White',
        registrationNumber: 'KA-04-MM-8921',
        capacity: 4,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const sampleJourney: RideOccurrence = {
        id: 'jrn-test-1',
        societyId: 'soc-ggh-001',
        offererUserId: 'usr-offerer-001',
        vehicleId: 'veh-1',
        journeyDate: '2026-10-09',
        direction: 'OUTBOUND_SOCIETY',
        departureWindowStart: '2026-10-09T08:00:00.000Z',
        departureWindowEnd: '2026-10-09T08:20:00.000Z',
        originName: 'Society',
        originLat: 12.9,
        originLng: 77.6,
        destinationName: 'Manyata',
        destinationPlaceId: 'place-id',
        destinationLat: 13.0,
        destinationLng: 77.6,
        baselineDurationMinutes: 40,
        baselineDistanceKm: 20,
        totalSeats: 2,
        availableSeats: 2,
        genderPreference: 'ANY',
        visibility: 'SOCIETY_WIDE',
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Unaccepted / Browsing view
      const publicView = formatPublicJourneyView(sampleJourney, sampleUser, sampleVehicle, {
        isOfferer: false,
        seekerRequestStatus: undefined,
      });

      expect(publicView.offerer.displayName).toBe('Ashutosh D.');
      expect(publicView.offerer.mobile).toBeUndefined();
      expect(publicView.offerer.flatNumber).toBeUndefined();
      expect(publicView.vehicle.registrationNumber).toBeUndefined();

      // Accepted view
      const acceptedView = formatPublicJourneyView(sampleJourney, sampleUser, sampleVehicle, {
        isOfferer: false,
        seekerRequestStatus: 'ACCEPTED',
      });

      expect(acceptedView.offerer.displayName).toBe('Ashutosh Dixit');
      expect(acceptedView.offerer.mobile).toBe('+919811122233');
      expect(acceptedView.offerer.flatNumber).toBe('Tower B-804');
      expect(acceptedView.vehicle.registrationNumber).toBe('KA-04-MM-8921');
    });
  });

  describe('4. In-App Notifications & Audit Pipeline', () => {
    it('creates and lists notifications with tenant isolation', async () => {
      const repo = new MockDynamoRepository();

      await repo.createNotification({
        id: 'notif-t-1',
        societyId: 'soc-ggh-001',
        userId: 'usr-offerer-001',
        title: 'New Ride Request',
        body: 'Priya requested 1 seat to Manyata Tech Park',
        type: 'RIDE_REQUESTED',
        read: false,
        createdAt: new Date().toISOString(),
      });

      // Offerer receives notification
      const offererNotifs = await repo.listUserNotifications('soc-ggh-001', 'usr-offerer-001');
      expect(offererNotifs.length).toBe(1);
      expect(offererNotifs[0].title).toBe('New Ride Request');
      expect(offererNotifs[0].read).toBe(false);

      // Seeker should not see offerer's notifications
      const seekerNotifs = await repo.listUserNotifications('soc-ggh-001', 'usr-seeker-001');
      expect(seekerNotifs.length).toBe(0);

      // Mark as read
      await repo.markNotificationAsRead('soc-ggh-001', 'notif-t-1', 'usr-offerer-001');
      const updatedNotifs = await repo.listUserNotifications('soc-ggh-001', 'usr-offerer-001');
      expect(updatedNotifs[0].read).toBe(true);
    });
  });

  describe('5. Qualitative Feedback & Moderation Workflow', () => {
    it('records qualitative tags without 1-5 star ratings and allows admin resolution', async () => {
      const repo = new MockDynamoRepository();

      // Submit feedback with qualitative badges only
      const fb = await repo.createFeedback({
        id: 'fb-t-1',
        societyId: 'soc-ggh-001',
        journeyId: 'jrn-001',
        fromUserId: 'usr-seeker-001',
        toUserId: 'usr-offerer-001',
        role: 'SEEKER',
        outcome: 'COMPLETED',
        qualitativeTags: ['Reliable & Punctual', 'Comfortable Ride'],
        privateNote: 'Great smooth ride to Manyata',
        createdAt: new Date().toISOString(),
      });

      expect(fb.qualitativeTags).toContain('Reliable & Punctual');
      const received = await repo.listUserFeedbackReceived('soc-ggh-001', 'usr-offerer-001');
      expect(received.length).toBe(1);

      // Submit moderation report
      const report = await repo.createModerationReport({
        id: 'rep-t-1',
        societyId: 'soc-ggh-001',
        reporterId: 'usr-seeker-001',
        reportedUserId: 'usr-offerer-001',
        category: 'NO_SHOW',
        description: 'Driver did not arrive at gate',
        status: 'OPEN',
        createdAt: new Date().toISOString(),
      });

      expect(report.status).toBe('OPEN');

      // Admin resolves report
      const resolved = await repo.updateModerationReportStatus(
        'soc-ggh-001',
        'rep-t-1',
        'RESOLVED',
        'Discussed with resident; settled mutually',
        'usr-admin-001'
      );

      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolutionNotes).toBe('Discussed with resident; settled mutually');
    });
  });
});
