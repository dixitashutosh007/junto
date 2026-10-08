import { ISocietyRepository } from './repository.interface';
import {
  Society,
  User,
  SocietyMembership,
  Vehicle,
  RideSchedule,
  RideOccurrence,
  RideRequest,
  CommuteMatch,
  Feedback,
  ModerationReport,
  AuditEvent,
  InAppNotification,
} from '@/types';

/**
 * In-Memory Mock Repository for Localhost Development and Testing.
 * Mirrors the exact tenant isolation and indexing rules of DynamoDB Single-Table Design.
 * Seeds a default Bangalore society (~1,100 families) with realistic demo residents, vehicles, and journeys.
 */
export class MockDynamoRepository implements ISocietyRepository {
  private societies = new Map<string, Society>();
  private users = new Map<string, User>();
  private memberships = new Map<string, SocietyMembership>(); // key: `${societyId}#${userId}`
  private vehicles = new Map<string, Vehicle>(); // key: `${societyId}#${vehicleId}`
  private schedules = new Map<string, RideSchedule>(); // key: `${societyId}#${scheduleId}`
  private occurrences = new Map<string, RideOccurrence>(); // key: `${societyId}#${journeyId}`
  private requests = new Map<string, RideRequest>(); // key: `${societyId}#${requestId}`
  private matches = new Map<string, CommuteMatch>(); // key: `${societyId}#${matchId}`
  private feedbacks: Feedback[] = [];
  private reports: ModerationReport[] = [];
  private auditEvents: AuditEvent[] = [];
  private notifications = new Map<string, InAppNotification>(); // key: `${societyId}#${notificationId}`

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const societyId = 'soc-ggh-001';
    const society: Society = {
      id: societyId,
      slug: 'mahaveer-ranches',
      name: 'Mahaveer Ranches',
      code: 'MR2024',
      address: 'Hosa Road, Off Hosur Road, Electronic City Post, Bangalore, Karnataka 560100',
      latitude: 12.8715,
      longitude: 77.6534,
      settings: {
        max_detour_minutes: 10,
        require_admin_approval: true,
        allow_gender_preferences: true,
        community_rules: '1. Be punctual and arrive at the clubhouse gate 5 minutes early.\n2. Respect co-residents and maintain a quiet, clean carpool atmosphere.\n3. Cancel at least 1 hour in advance if your commute plan changes.\n4. No commercial fares or unauthorized non-residents.',
      },
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    this.societies.set(societyId, society);

    // Second demo society: Prestige Ferns Residency (Harlur / Sarjapur Road)
    const society2Id = 'soc-pfr-002';
    const society2: Society = {
      id: society2Id,
      slug: 'prestige-ferns-residency',
      name: 'Prestige Ferns Residency',
      code: 'PFR2024',
      address: 'Harlur Main Road, Off Sarjapur Road, Bellandur, Bangalore 560102',
      latitude: 12.9056,
      longitude: 77.6698,
      settings: {
        max_detour_minutes: 12,
        require_admin_approval: true,
        allow_gender_preferences: true,
        community_rules: '1. Verified residents only.\n2. Be at the Tower gate on time.',
      },
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    this.societies.set(society2Id, society2);

    // Platform Super Admin: Rajesh N.
    const platformAdminUser: User = {
      id: 'usr-app-admin-001',
      cognitoSub: 'cognito-sub-appadmin-001',
      email: 'rajesh@societyapps.org',
      mobile: '+919800011122',
      fullName: 'Rajesh Nair',
      gender: 'MALE',
      defaultPersona: 'APP_ADMIN',
      createdAt: new Date().toISOString(),
    };
    this.users.set(platformAdminUser.id, platformAdminUser);
    this.memberships.set(`${societyId}#${platformAdminUser.id}`, {
      id: 'mem-superadmin-001',
      societyId,
      userId: platformAdminUser.id,
      flatNumber: 'HQ-Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Admin User: Vikram Mehta
    const adminUser: User = {
      id: 'usr-admin-001',
      cognitoSub: 'cognito-sub-admin-001',
      email: 'admin@mahaveerranches.org',
      mobile: '+919876543210',
      fullName: 'Vikram Mehta',
      gender: 'MALE',
      workLocationName: 'Electronic City Phase 1',
      createdAt: new Date().toISOString(),
    };
    this.users.set(adminUser.id, adminUser);
    this.memberships.set(`${societyId}#${adminUser.id}`, {
      id: 'mem-admin-001',
      societyId,
      userId: adminUser.id,
      flatNumber: 'Tower A-1402',
      role: 'SOCIETY_ADMIN',
      status: 'ACTIVE',
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Resident 1: Ashutosh Dixit (Ride Offerer)
    const offererUser: User = {
      id: 'usr-offerer-001',
      cognitoSub: 'cognito-sub-offerer-001',
      email: 'ashutosh@example.com',
      mobile: '+919811122233',
      fullName: 'Ashutosh Dixit',
      gender: 'MALE',
      workLocationName: 'Manyata Tech Park, Hebbal',
      workLatitude: 13.0500,
      workLongitude: 77.6200,
      createdAt: new Date().toISOString(),
    };
    this.users.set(offererUser.id, offererUser);
    this.memberships.set(`${societyId}#${offererUser.id}`, {
      id: 'mem-offerer-001',
      societyId,
      userId: offererUser.id,
      flatNumber: 'Tower B-804',
      role: 'RESIDENT',
      status: 'ACTIVE',
      approvedBy: adminUser.id,
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Vehicle 1 for Ashutosh
    const vehicle1: Vehicle = {
      id: 'veh-001',
      societyId,
      userId: offererUser.id,
      type: 'SUV',
      make: 'Hyundai',
      model: 'Creta',
      color: 'Polar White',
      registrationNumber: 'KA-04-MM-8921',
      capacity: 4,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.vehicles.set(`${societyId}#${vehicle1.id}`, vehicle1);

    // Resident 2: Priya Sharma (Ride Seeker / Active)
    const seekerUser: User = {
      id: 'usr-seeker-001',
      cognitoSub: 'cognito-sub-seeker-001',
      email: 'priya.sharma@example.com',
      mobile: '+919822233344',
      fullName: 'Priya Sharma',
      gender: 'FEMALE',
      workLocationName: 'Bagmane Tech Park, CV Raman Nagar',
      workLatitude: 12.9800,
      workLongitude: 77.6600,
      createdAt: new Date().toISOString(),
    };
    this.users.set(seekerUser.id, seekerUser);
    this.memberships.set(`${societyId}#${seekerUser.id}`, {
      id: 'mem-seeker-001',
      societyId,
      userId: seekerUser.id,
      flatNumber: 'Tower C-302',
      role: 'RESIDENT',
      status: 'ACTIVE',
      approvedBy: adminUser.id,
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Resident 3: Rohan Gupta (Second Ride Offerer to Bellandur/EcoSpace)
    const offererUser2: User = {
      id: 'usr-offerer-002',
      cognitoSub: 'cognito-sub-offerer-002',
      email: 'rohan.gupta@example.com',
      mobile: '+919844455566',
      fullName: 'Rohan Gupta',
      gender: 'MALE',
      workLocationName: 'EcoSpace, Bellandur Outer Ring Road',
      workLatitude: 12.9260,
      workLongitude: 77.6762,
      createdAt: new Date().toISOString(),
    };
    this.users.set(offererUser2.id, offererUser2);
    this.memberships.set(`${societyId}#${offererUser2.id}`, {
      id: 'mem-offerer-002',
      societyId,
      userId: offererUser2.id,
      flatNumber: 'Tower E-501',
      role: 'RESIDENT',
      status: 'ACTIVE',
      approvedBy: adminUser.id,
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const vehicle2: Vehicle = {
      id: 'veh-002',
      societyId,
      userId: offererUser2.id,
      type: 'SEDAN',
      make: 'Honda',
      model: 'City',
      color: 'Lunar Silver',
      registrationNumber: 'KA-51-AB-4321',
      capacity: 4,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.vehicles.set(`${societyId}#${vehicle2.id}`, vehicle2);

    // Resident 4: Ananya Sen (Offerer to Whitefield / ITPL)
    const offererUser3: User = {
      id: 'usr-offerer-003',
      cognitoSub: 'cognito-sub-offerer-003',
      email: 'ananya.sen@example.com',
      mobile: '+919855566677',
      fullName: 'Ananya Sen',
      gender: 'FEMALE',
      workLocationName: 'ITPL, Whitefield',
      workLatitude: 12.9856,
      workLongitude: 77.7314,
      createdAt: new Date().toISOString(),
    };
    this.users.set(offererUser3.id, offererUser3);
    this.memberships.set(`${societyId}#${offererUser3.id}`, {
      id: 'mem-offerer-003',
      societyId,
      userId: offererUser3.id,
      flatNumber: 'Tower F-1204',
      role: 'RESIDENT',
      status: 'ACTIVE',
      approvedBy: adminUser.id,
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const vehicle3: Vehicle = {
      id: 'veh-003',
      societyId,
      userId: offererUser3.id,
      type: 'HATCHBACK',
      make: 'Tata',
      model: 'Nexon EV',
      color: 'Teal Blue',
      registrationNumber: 'KA-05-EV-9912',
      capacity: 4,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.vehicles.set(`${societyId}#${vehicle3.id}`, vehicle3);

    // Resident 5: Rahul Verma (Pending Verification)
    const pendingUser: User = {
      id: 'usr-pending-001',
      cognitoSub: 'cognito-sub-pending-001',
      email: 'rahul.verma@example.com',
      mobile: '+919833344455',
      fullName: 'Rahul Verma',
      gender: 'MALE',
      workLocationName: 'Ecospace, Bellandur',
      createdAt: new Date().toISOString(),
    };
    this.users.set(pendingUser.id, pendingUser);
    this.memberships.set(`${societyId}#${pendingUser.id}`, {
      id: 'mem-pending-001',
      societyId,
      userId: pendingUser.id,
      flatNumber: 'Tower D-1101',
      role: 'RESIDENT',
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Resident 6: Sneha Patil (Pending Verification)
    const pendingUser2: User = {
      id: 'usr-pending-002',
      cognitoSub: 'cognito-sub-pending-002',
      email: 'sneha.patil@example.com',
      mobile: '+919877788899',
      fullName: 'Sneha Patil',
      gender: 'FEMALE',
      workLocationName: 'Prestige Tech Cloud, Hebbal',
      createdAt: new Date().toISOString(),
    };
    this.users.set(pendingUser2.id, pendingUser2);
    this.memberships.set(`${societyId}#${pendingUser2.id}`, {
      id: 'mem-pending-002',
      societyId,
      userId: pendingUser2.id,
      flatNumber: 'Tower B-202',
      role: 'RESIDENT',
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Seed Journeys for Today, Tomorrow, and Day After Tomorrow
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterStr = dayAfter.toISOString().split('T')[0];

    // Journey 1: Ashutosh -> Manyata Tech Park (Today & Tomorrow)
    const journey1Today: RideOccurrence = {
      id: 'jrn-today-001',
      societyId,
      offererUserId: offererUser.id,
      vehicleId: vehicle1.id,
      journeyDate: todayStr,
      direction: 'OUTBOUND_SOCIETY',
      departureWindowStart: `${todayStr}T08:00:00.000Z`,
      departureWindowEnd: `${todayStr}T08:20:00.000Z`,
      originName: 'Mahaveer Ranches Main Clubhouse Gate',
      originLat: 12.8715,
      originLng: 77.6534,
      destinationName: 'Manyata Tech Park, Hebbal',
      destinationPlaceId: 'ChIJ...Manyata',
      destinationLat: 13.0500,
      destinationLng: 77.6200,
      baselineDurationMinutes: 55,
      baselineDistanceKm: 28,
      totalSeats: 2,
      availableSeats: 2,
      genderPreference: 'ANY',
      visibility: 'SOCIETY_WIDE',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.occurrences.set(`${societyId}#${journey1Today.id}`, journey1Today);

    const journey1Tomorrow: RideOccurrence = {
      id: 'jrn-001',
      societyId,
      offererUserId: offererUser.id,
      vehicleId: vehicle1.id,
      journeyDate: tomorrowStr,
      direction: 'OUTBOUND_SOCIETY',
      departureWindowStart: `${tomorrowStr}T08:00:00.000Z`,
      departureWindowEnd: `${tomorrowStr}T08:20:00.000Z`,
      originName: 'Mahaveer Ranches Main Clubhouse Gate',
      originLat: 12.8715,
      originLng: 77.6534,
      destinationName: 'Manyata Tech Park, Hebbal',
      destinationPlaceId: 'ChIJ...Manyata',
      destinationLat: 13.0500,
      destinationLng: 77.6200,
      baselineDurationMinutes: 55,
      baselineDistanceKm: 28,
      totalSeats: 2,
      availableSeats: 2,
      genderPreference: 'ANY',
      visibility: 'SOCIETY_WIDE',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.occurrences.set(`${societyId}#${journey1Tomorrow.id}`, journey1Tomorrow);

    // Journey 2: Rohan -> EcoSpace / Bellandur (Today & Tomorrow)
    const journey2Today: RideOccurrence = {
      id: 'jrn-today-002',
      societyId,
      offererUserId: offererUser2.id,
      vehicleId: vehicle2.id,
      journeyDate: todayStr,
      direction: 'OUTBOUND_SOCIETY',
      departureWindowStart: `${todayStr}T08:30:00.000Z`,
      departureWindowEnd: `${todayStr}T08:45:00.000Z`,
      originName: 'Mahaveer Ranches Main Clubhouse Gate',
      originLat: 12.8715,
      originLng: 77.6534,
      destinationName: 'EcoSpace / Bellandur Tech Corridor',
      destinationPlaceId: 'ChIJ...EcoSpace',
      destinationLat: 12.9260,
      destinationLng: 77.6762,
      baselineDurationMinutes: 35,
      baselineDistanceKm: 14,
      totalSeats: 3,
      availableSeats: 3,
      genderPreference: 'ANY',
      visibility: 'SOCIETY_WIDE',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.occurrences.set(`${societyId}#${journey2Today.id}`, journey2Today);

    const journey2Tomorrow: RideOccurrence = {
      id: 'jrn-002',
      societyId,
      offererUserId: offererUser2.id,
      vehicleId: vehicle2.id,
      journeyDate: tomorrowStr,
      direction: 'OUTBOUND_SOCIETY',
      departureWindowStart: `${tomorrowStr}T08:30:00.000Z`,
      departureWindowEnd: `${tomorrowStr}T08:45:00.000Z`,
      originName: 'Mahaveer Ranches Main Clubhouse Gate',
      originLat: 12.8715,
      originLng: 77.6534,
      destinationName: 'EcoSpace / Bellandur Tech Corridor',
      destinationPlaceId: 'ChIJ...EcoSpace',
      destinationLat: 12.9260,
      destinationLng: 77.6762,
      baselineDurationMinutes: 35,
      baselineDistanceKm: 14,
      totalSeats: 3,
      availableSeats: 3,
      genderPreference: 'ANY',
      visibility: 'SOCIETY_WIDE',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.occurrences.set(`${societyId}#${journey2Tomorrow.id}`, journey2Tomorrow);

    // Journey 3: Ananya -> ITPL Whitefield (Tomorrow & Day After)
    const journey3Tomorrow: RideOccurrence = {
      id: 'jrn-003',
      societyId,
      offererUserId: offererUser3.id,
      vehicleId: vehicle3.id,
      journeyDate: tomorrowStr,
      direction: 'OUTBOUND_SOCIETY',
      departureWindowStart: `${tomorrowStr}T08:15:00.000Z`,
      departureWindowEnd: `${tomorrowStr}T08:35:00.000Z`,
      originName: 'Mahaveer Ranches Main Clubhouse Gate',
      originLat: 12.8715,
      originLng: 77.6534,
      destinationName: 'ITPL / Prestige Shantiniketan, Whitefield',
      destinationPlaceId: 'ChIJ...ITPL',
      destinationLat: 12.9856,
      destinationLng: 77.7314,
      baselineDurationMinutes: 45,
      baselineDistanceKm: 22,
      totalSeats: 2,
      availableSeats: 2,
      genderPreference: 'ANY',
      visibility: 'SOCIETY_WIDE',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.occurrences.set(`${societyId}#${journey3Tomorrow.id}`, journey3Tomorrow);

    const journey3DayAfter: RideOccurrence = {
      id: 'jrn-004',
      societyId,
      offererUserId: offererUser3.id,
      vehicleId: vehicle3.id,
      journeyDate: dayAfterStr,
      direction: 'OUTBOUND_SOCIETY',
      departureWindowStart: `${dayAfterStr}T08:15:00.000Z`,
      departureWindowEnd: `${dayAfterStr}T08:35:00.000Z`,
      originName: 'Mahaveer Ranches Main Clubhouse Gate',
      originLat: 12.8715,
      originLng: 77.6534,
      destinationName: 'ITPL / Prestige Shantiniketan, Whitefield',
      destinationPlaceId: 'ChIJ...ITPL',
      destinationLat: 12.9856,
      destinationLng: 77.7314,
      baselineDurationMinutes: 45,
      baselineDistanceKm: 22,
      totalSeats: 2,
      availableSeats: 2,
      genderPreference: 'ANY',
      visibility: 'SOCIETY_WIDE',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.occurrences.set(`${societyId}#${journey3DayAfter.id}`, journey3DayAfter);

    // Initial Audit Events for Mahaveer Ranches
    this.auditEvents.push(
      {
        id: 'audit-001',
        societyId,
        actorUserId: adminUser.id,
        action: 'RESIDENT_APPROVED',
        entityType: 'MEMBERSHIP',
        entityId: 'mem-offerer-001',
        metadata: { residentName: 'Ashutosh Dixit', flat: 'Tower B-804' },
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'audit-002',
        societyId,
        actorUserId: adminUser.id,
        action: 'SOCIETY_SETTINGS_UPDATED',
        entityType: 'SOCIETY',
        entityId: societyId,
        metadata: { maxDetourMinutes: 10, requireAdminApproval: true },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'audit-003',
        societyId,
        actorUserId: platformAdminUser.id,
        action: 'RBAC_ROLE_ASSIGNED',
        entityType: 'MEMBERSHIP',
        entityId: 'mem-admin-001',
        metadata: { targetUserId: adminUser.id, role: 'SOCIETY_ADMIN' },
        createdAt: new Date(Date.now() - 43200000).toISOString(),
      }
    );
  }

  // Societies
  async getSocietyById(societyId: string): Promise<Society | null> {
    return this.societies.get(societyId) || null;
  }

  async getSocietyByCode(code: string): Promise<Society | null> {
    for (const s of this.societies.values()) {
      if (s.code.toUpperCase() === code.toUpperCase()) return s;
    }
    return null;
  }

  async listSocieties(): Promise<Society[]> {
    return Array.from(this.societies.values());
  }

  async createSociety(society: Society): Promise<Society> {
    this.societies.set(society.id, society);
    return society;
  }

  async updateSociety(societyId: string, updates: Partial<Society>): Promise<Society> {
    const s = this.societies.get(societyId);
    if (!s) throw new Error(`Society not found: ${societyId}`);
    const updated = { ...s, ...updates };
    this.societies.set(societyId, updated);
    return updated;
  }

  async updateSocietySettings(
    societyId: string,
    settings: Partial<Society['settings']>
  ): Promise<Society> {
    const s = this.societies.get(societyId);
    if (!s) throw new Error(`Society not found: ${societyId}`);
    s.settings = { ...s.settings, ...settings };
    this.societies.set(societyId, s);
    return s;
  }

  // Users & Memberships
  async getUserById(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  }

  async getUserByPhone(mobile: string): Promise<User | null> {
    const cleanTarget = mobile.replace(/\D/g, '');
    for (const u of this.users.values()) {
      const cleanU = (u.mobile || '').replace(/\D/g, '');
      if (cleanU === cleanTarget || (cleanU.length >= 10 && cleanTarget.endsWith(cleanU.slice(-10)))) {
        return u;
      }
    }
    return null;
  }

  async createUser(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const u = this.users.get(userId);
    if (!u) throw new Error('User not found');
    const updated = { ...u, ...updates };
    this.users.set(userId, updated);
    return updated;
  }

  async getMembership(societyId: string, userId: string): Promise<SocietyMembership | null> {
    return this.memberships.get(`${societyId}#${userId}`) || null;
  }

  async createMembership(membership: SocietyMembership): Promise<SocietyMembership> {
    this.memberships.set(`${membership.societyId}#${membership.userId}`, membership);
    return membership;
  }

  async updateMembership(
    societyId: string,
    userId: string,
    updates: Partial<SocietyMembership>
  ): Promise<SocietyMembership> {
    const key = `${societyId}#${userId}`;
    const m = this.memberships.get(key);
    if (!m) throw new Error('Membership not found');
    const updated = { ...m, ...updates, updatedAt: new Date().toISOString() };
    this.memberships.set(key, updated);
    return updated;
  }

  async updateMembershipStatus(
    societyId: string,
    userId: string,
    status: SocietyMembership['status'],
    adminUserId: string,
    reason?: string
  ): Promise<SocietyMembership> {
    const mem = this.memberships.get(`${societyId}#${userId}`);
    if (!mem) throw new Error(`Membership not found for user ${userId} in ${societyId}`);
    mem.status = status;
    mem.updatedAt = new Date().toISOString();
    if (status === 'ACTIVE') {
      mem.approvedBy = adminUserId;
      mem.approvedAt = new Date().toISOString();
    } else if (status === 'REJECTED') {
      mem.rejectionReason = reason;
    }
    this.memberships.set(`${societyId}#${userId}`, mem);
    return mem;
  }

  async listPendingMemberships(societyId: string): Promise<(SocietyMembership & { user: User })[]> {
    const result: (SocietyMembership & { user: User })[] = [];
    for (const [key, mem] of this.memberships.entries()) {
      if (key.startsWith(`${societyId}#`) && mem.status === 'PENDING_APPROVAL') {
        const u = this.users.get(mem.userId);
        if (u) result.push({ ...mem, user: u });
      }
    }
    return result;
  }

  async listSocietyMembers(societyId: string): Promise<(SocietyMembership & { user: User })[]> {
    const result: (SocietyMembership & { user: User })[] = [];
    for (const [key, mem] of this.memberships.entries()) {
      if (key.startsWith(`${societyId}#`)) {
        const u = this.users.get(mem.userId);
        if (u) result.push({ ...mem, user: u });
      }
    }
    return result;
  }

  // Vehicles
  async createVehicle(vehicle: Vehicle): Promise<Vehicle> {
    this.vehicles.set(`${vehicle.societyId}#${vehicle.id}`, vehicle);
    return vehicle;
  }

  async getVehicleById(societyId: string, vehicleId: string): Promise<Vehicle | null> {
    return this.vehicles.get(`${societyId}#${vehicleId}`) || null;
  }

  async listUserVehicles(societyId: string, userId: string): Promise<Vehicle[]> {
    const result: Vehicle[] = [];
    for (const [key, v] of this.vehicles.entries()) {
      if (key.startsWith(`${societyId}#`) && v.userId === userId && v.isActive) {
        result.push(v);
      }
    }
    return result;
  }

  // Ride Schedules
  async createRideSchedule(schedule: RideSchedule): Promise<RideSchedule> {
    this.schedules.set(`${schedule.societyId}#${schedule.id}`, schedule);
    return schedule;
  }

  async listUserSchedules(societyId: string, userId: string): Promise<RideSchedule[]> {
    const result: RideSchedule[] = [];
    for (const [key, s] of this.schedules.entries()) {
      if (key.startsWith(`${societyId}#`) && s.userId === userId && s.isActive) {
        result.push(s);
      }
    }
    return result;
  }

  async deactivateSchedule(societyId: string, scheduleId: string, userId: string): Promise<void> {
    const s = this.schedules.get(`${societyId}#${scheduleId}`);
    if (s && s.userId === userId) {
      s.isActive = false;
      this.schedules.set(`${societyId}#${scheduleId}`, s);
    }
  }

  // Ride Occurrences
  async createRideOccurrence(occurrence: RideOccurrence): Promise<RideOccurrence> {
    this.occurrences.set(`${occurrence.societyId}#${occurrence.id}`, occurrence);
    return occurrence;
  }

  async getRideOccurrence(societyId: string, journeyId: string): Promise<RideOccurrence | null> {
    return this.occurrences.get(`${societyId}#${journeyId}`) || null;
  }

  async listOpenRides(
    societyId: string,
    date?: string,
    direction?: RideOccurrence['direction']
  ): Promise<RideOccurrence[]> {
    const todayStr = new Date().toISOString().split('T')[0];
    const result: RideOccurrence[] = [];
    for (const [key, occ] of this.occurrences.entries()) {
      if (
        key.startsWith(`${societyId}#`) &&
        (occ.status === 'OPEN' || occ.status === 'PARTIALLY_BOOKED') &&
        occ.availableSeats > 0
      ) {
        // If specific date requested, match it; otherwise show all today and upcoming rides
        const dateMatches = date && date !== 'ALL' ? occ.journeyDate === date : occ.journeyDate >= todayStr;
        if (dateMatches) {
          if (!direction || occ.direction === direction) {
            result.push(occ);
          }
        }
      }
    }
    return result.sort((a, b) => a.journeyDate.localeCompare(b.journeyDate));
  }

  async listUserRides(societyId: string, userId: string): Promise<RideOccurrence[]> {
    const result: RideOccurrence[] = [];
    for (const [key, occ] of this.occurrences.entries()) {
      if (key.startsWith(`${societyId}#`) && occ.offererUserId === userId) {
        result.push(occ);
      }
    }
    return result.sort((a, b) => b.journeyDate.localeCompare(a.journeyDate));
  }

  async cancelRideOccurrence(
    societyId: string,
    journeyId: string,
    userId: string,
    reason: string
  ): Promise<RideOccurrence> {
    const occ = this.occurrences.get(`${societyId}#${journeyId}`);
    if (!occ) throw new Error('Journey not found');
    if (occ.offererUserId !== userId) throw new Error('Unauthorized to cancel this journey');

    occ.status = 'CANCELLED';
    occ.cancellationReason = reason;
    occ.cancelledBy = userId;
    occ.updatedAt = new Date().toISOString();
    this.occurrences.set(`${societyId}#${journeyId}`, occ);
    return occ;
  }

  async updateRideOccurrence(
    societyId: string,
    journeyId: string,
    userId: string,
    updates: Partial<RideOccurrence>
  ): Promise<RideOccurrence> {
    const occ = this.occurrences.get(`${societyId}#${journeyId}`);
    if (!occ) throw new Error('Journey not found');
    if (occ.offererUserId !== userId) throw new Error('Unauthorized to edit this journey');

    const updated: RideOccurrence = {
      ...occ,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.occurrences.set(`${societyId}#${journeyId}`, updated);
    return updated;
  }

  async deleteRideOccurrence(
    societyId: string,
    journeyId: string,
    userId: string
  ): Promise<void> {
    const occ = this.occurrences.get(`${societyId}#${journeyId}`);
    if (!occ) throw new Error('Journey not found');
    if (occ.offererUserId !== userId) throw new Error('Unauthorized to delete this journey');

    this.occurrences.delete(`${societyId}#${journeyId}`);
  }

  async updateAvailableSeats(
    societyId: string,
    journeyId: string,
    seatDelta: number
  ): Promise<RideOccurrence> {
    const occ = this.occurrences.get(`${societyId}#${journeyId}`);
    if (!occ) throw new Error('Journey not found');

    const newSeats = occ.availableSeats + seatDelta;
    if (newSeats < 0) throw new Error('No remaining seats available');
    if (newSeats > occ.totalSeats) throw new Error('Invalid seat count exceeds capacity');

    occ.availableSeats = newSeats;
    occ.status = newSeats === 0 ? 'FULL' : newSeats < occ.totalSeats ? 'PARTIALLY_BOOKED' : 'OPEN';
    occ.updatedAt = new Date().toISOString();
    this.occurrences.set(`${societyId}#${journeyId}`, occ);
    return occ;
  }

  // Ride Requests
  async createRideRequest(request: RideRequest): Promise<RideRequest> {
    this.requests.set(`${request.societyId}#${request.id}`, request);
    return request;
  }

  async getRideRequest(societyId: string, requestId: string): Promise<RideRequest | null> {
    return this.requests.get(`${societyId}#${requestId}`) || null;
  }

  async listJourneyRequests(societyId: string, journeyId: string): Promise<RideRequest[]> {
    const result: RideRequest[] = [];
    for (const [key, req] of this.requests.entries()) {
      if (key.startsWith(`${societyId}#`) && req.journeyId === journeyId) {
        result.push(req);
      }
    }
    return result;
  }

  async listUserRequests(societyId: string, userId: string): Promise<RideRequest[]> {
    const result: RideRequest[] = [];
    for (const [key, req] of this.requests.entries()) {
      if (key.startsWith(`${societyId}#`) && req.seekerUserId === userId) {
        result.push(req);
      }
    }
    return result;
  }

  async updateRequestStatus(
    societyId: string,
    requestId: string,
    status: RideRequest['status'],
    note?: string
  ): Promise<RideRequest> {
    const req = this.requests.get(`${societyId}#${requestId}`);
    if (!req) throw new Error('Request not found');
    req.status = status;
    if (note) req.responseNote = note;
    req.updatedAt = new Date().toISOString();
    this.requests.set(`${societyId}#${requestId}`, req);
    return req;
  }

  // Matches
  async saveMatch(match: CommuteMatch): Promise<CommuteMatch> {
    this.matches.set(`${match.societyId}#${match.id}`, match);
    return match;
  }

  async listUserMatches(societyId: string, userId: string): Promise<CommuteMatch[]> {
    const result: CommuteMatch[] = [];
    for (const [key, m] of this.matches.entries()) {
      if (key.startsWith(`${societyId}#`) && m.seekerUserId === userId) {
        result.push(m);
      }
    }
    return result.sort((a, b) => b.qualityScore - a.qualityScore);
  }

  // Feedback & Moderation
  async createFeedback(feedback: Feedback): Promise<Feedback> {
    this.feedbacks.push(feedback);
    return feedback;
  }

  async listUserFeedbackReceived(societyId: string, userId: string): Promise<Feedback[]> {
    return this.feedbacks.filter((f) => f.societyId === societyId && f.toUserId === userId);
  }

  async createModerationReport(report: ModerationReport): Promise<ModerationReport> {
    this.reports.push(report);
    return report;
  }

  async listModerationReports(societyId: string): Promise<ModerationReport[]> {
    return this.reports.filter((r) => r.societyId === societyId);
  }

  async updateModerationReportStatus(
    societyId: string,
    reportId: string,
    status: ModerationReport['status'],
    resolutionNotes?: string,
    adminUserId?: string
  ): Promise<ModerationReport> {
    const report = this.reports.find((r) => r.societyId === societyId && r.id === reportId);
    if (!report) throw new Error('Report not found');
    report.status = status;
    if (resolutionNotes) report.resolutionNotes = resolutionNotes;
    if (adminUserId) report.resolvedBy = adminUserId;
    return report;
  }

  // Auditing
  async recordAuditEvent(event: AuditEvent): Promise<void> {
    this.auditEvents.push(event);
  }

  async listAuditEvents(societyId: string): Promise<AuditEvent[]> {
    return this.auditEvents
      .filter((e) => e.societyId === societyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // In-App & Push Notifications
  async createNotification(notification: InAppNotification): Promise<InAppNotification> {
    const key = `${notification.societyId}#${notification.id}`;
    this.notifications.set(key, notification);
    return notification;
  }

  async listUserNotifications(societyId: string, userId: string): Promise<InAppNotification[]> {
    const result: InAppNotification[] = [];
    for (const [key, n] of this.notifications.entries()) {
      if (key.startsWith(`${societyId}#`) && n.userId === userId) {
        result.push(n);
      }
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markNotificationAsRead(societyId: string, notificationId: string, userId: string): Promise<void> {
    const key = `${societyId}#${notificationId}`;
    const notif = this.notifications.get(key);
    if (notif && notif.userId === userId) {
      notif.read = true;
      this.notifications.set(key, notif);
    }
  }

  async markAllNotificationsAsRead(societyId: string, userId: string): Promise<void> {
    for (const [key, notif] of this.notifications.entries()) {
      if (key.startsWith(`${societyId}#`) && notif.userId === userId) {
        notif.read = true;
        this.notifications.set(key, notif);
      }
    }
  }
}
