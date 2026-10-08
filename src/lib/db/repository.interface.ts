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
 * SocietyApps Multi-Tenant Repository Interface
 * Enforces strict societyId isolation across all operations.
 */
export interface ISocietyRepository {
  // Societies
  getSocietyById(societyId: string): Promise<Society | null>;
  getSocietyByCode(code: string): Promise<Society | null>;
  createSociety(society: Society): Promise<Society>;
  updateSociety(societyId: string, updates: Partial<Society>): Promise<Society>;
  updateSocietySettings(
    societyId: string,
    settings: Partial<Society['settings']>
  ): Promise<Society>;

  // Users & Memberships
  getUserById(userId: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: User): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;

  getMembership(societyId: string, userId: string): Promise<SocietyMembership | null>;
  createMembership(membership: SocietyMembership): Promise<SocietyMembership>;
  updateMembershipStatus(
    societyId: string,
    userId: string,
    status: SocietyMembership['status'],
    adminUserId: string,
    reason?: string
  ): Promise<SocietyMembership>;
  listPendingMemberships(societyId: string): Promise<(SocietyMembership & { user: User })[]>;
  listSocietyMembers(societyId: string): Promise<(SocietyMembership & { user: User })[]>;

  // Vehicles
  createVehicle(vehicle: Vehicle): Promise<Vehicle>;
  getVehicleById(societyId: string, vehicleId: string): Promise<Vehicle | null>;
  listUserVehicles(societyId: string, userId: string): Promise<Vehicle[]>;

  // Ride Schedules (Recurring)
  createRideSchedule(schedule: RideSchedule): Promise<RideSchedule>;
  listUserSchedules(societyId: string, userId: string): Promise<RideSchedule[]>;
  deactivateSchedule(societyId: string, scheduleId: string, userId: string): Promise<void>;

  // Ride Occurrences (Individual Journeys)
  createRideOccurrence(occurrence: RideOccurrence): Promise<RideOccurrence>;
  getRideOccurrence(societyId: string, journeyId: string): Promise<RideOccurrence | null>;
  listOpenRides(
    societyId: string,
    date?: string,
    direction?: RideOccurrence['direction']
  ): Promise<RideOccurrence[]>;
  listUserRides(societyId: string, userId: string): Promise<RideOccurrence[]>;
  cancelRideOccurrence(
    societyId: string,
    journeyId: string,
    userId: string,
    reason: string
  ): Promise<RideOccurrence>;
  updateRideOccurrence(
    societyId: string,
    journeyId: string,
    userId: string,
    updates: Partial<RideOccurrence>
  ): Promise<RideOccurrence>;
  deleteRideOccurrence(
    societyId: string,
    journeyId: string,
    userId: string
  ): Promise<void>;
  updateAvailableSeats(
    societyId: string,
    journeyId: string,
    seatDelta: number
  ): Promise<RideOccurrence>;

  // Ride Requests
  createRideRequest(request: RideRequest): Promise<RideRequest>;
  getRideRequest(societyId: string, requestId: string): Promise<RideRequest | null>;
  listJourneyRequests(societyId: string, journeyId: string): Promise<RideRequest[]>;
  listUserRequests(societyId: string, userId: string): Promise<RideRequest[]>;
  updateRequestStatus(
    societyId: string,
    requestId: string,
    status: RideRequest['status'],
    note?: string
  ): Promise<RideRequest>;

  // Matches
  saveMatch(match: CommuteMatch): Promise<CommuteMatch>;
  listUserMatches(societyId: string, userId: string): Promise<CommuteMatch[]>;

  // Feedback & Moderation
  createFeedback(feedback: Feedback): Promise<Feedback>;
  listUserFeedbackReceived(societyId: string, userId: string): Promise<Feedback[]>;
  createModerationReport(report: ModerationReport): Promise<ModerationReport>;
  listModerationReports(societyId: string): Promise<ModerationReport[]>;
  updateModerationReportStatus(
    societyId: string,
    reportId: string,
    status: ModerationReport['status'],
    resolutionNotes?: string,
    adminUserId?: string
  ): Promise<ModerationReport>;

  // Auditing
  recordAuditEvent(event: AuditEvent): Promise<void>;

  // In-App & Push Notifications
  createNotification(notification: InAppNotification): Promise<InAppNotification>;
  listUserNotifications(societyId: string, userId: string): Promise<InAppNotification[]>;
  markNotificationAsRead(societyId: string, notificationId: string, userId: string): Promise<void>;
  markAllNotificationsAsRead(societyId: string, userId: string): Promise<void>;
}
