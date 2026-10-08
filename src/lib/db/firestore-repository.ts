import { ISocietyRepository } from './repository.interface';
import { adminDb } from '../firebase/admin';
import {
  DocumentData,
  QueryDocumentSnapshot,
  Transaction,
  Query,
} from 'firebase-admin/firestore';
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
 * Google Cloud Firestore Repository Implementation
 * Stores all entities in isolated Firestore collections and sub-collections:
 *  - /societies/{societyId}
 *  - /users/{userId}
 *  - /societies/{societyId}/members/{userId}
 *  - /societies/{societyId}/vehicles/{vehicleId}
 *  - /societies/{societyId}/schedules/{scheduleId}
 *  - /societies/{societyId}/occurrences/{journeyId}
 *  - /societies/{societyId}/requests/{requestId}
 *  - /societies/{societyId}/matches/{matchId}
 *  - /societies/{societyId}/notifications/{notifId}
 *  - /societies/{societyId}/feedback/{feedbackId}
 *  - /societies/{societyId}/moderation_reports/{reportId}
 *  - /audit_events/{eventId}
 */
export class FirestoreRepository implements ISocietyRepository {
  private db = adminDb;

  // Societies
  async getSocietyById(societyId: string): Promise<Society | null> {
    const doc = await this.db.collection('societies').doc(societyId).get();
    if (!doc.exists) return null;
    return doc.data() as Society;
  }

  async getSocietyByCode(code: string): Promise<Society | null> {
    const snap = await this.db
      .collection('societies')
      .where('code', '==', code.toUpperCase())
      .limit(1)
      .get();
    if (snap.empty) return null;
    return snap.docs[0].data() as Society;
  }

  async listSocieties(): Promise<Society[]> {
    const snap = await this.db.collection('societies').get();
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data() as Society);
  }

  async createSociety(society: Society): Promise<Society> {
    await this.db.collection('societies').doc(society.id).set(society);
    return society;
  }

  async updateSociety(societyId: string, updates: Partial<Society>): Promise<Society> {
    await this.db.collection('societies').doc(societyId).update(updates);
    const updated = await this.getSocietyById(societyId);
    if (!updated) throw new Error('Society not found');
    return updated;
  }

  async updateSocietySettings(
    societyId: string,
    settings: Partial<Society['settings']>
  ): Promise<Society> {
    const ref = this.db.collection('societies').doc(societyId);
    const existing = await ref.get();
    if (!existing.exists) throw new Error('Society not found');
    const curr = existing.data() as Society;
    const mergedSettings = { ...curr.settings, ...settings };
    await ref.update({ settings: mergedSettings });
    return { ...curr, settings: mergedSettings };
  }

  // Users & Memberships
  async getUserById(userId: string): Promise<User | null> {
    const doc = await this.db.collection('users').doc(userId).get();
    if (!doc.exists) return null;
    return doc.data() as User;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const snap = await this.db
      .collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();
    if (snap.empty) return null;
    return snap.docs[0].data() as User;
  }

  async getUserByPhone(mobile: string): Promise<User | null> {
    const snap = await this.db
      .collection('users')
      .where('mobile', '==', mobile)
      .limit(1)
      .get();
    if (snap.empty) {
      // Also try with/without leading +91
      const normalized = mobile.startsWith('+91') ? mobile.replace('+91', '') : `+91${mobile}`;
      const snap2 = await this.db
        .collection('users')
        .where('mobile', '==', normalized)
        .limit(1)
        .get();
      if (snap2.empty) return null;
      return snap2.docs[0].data() as User;
    }
    return snap.docs[0].data() as User;
  }

  async createUser(user: User): Promise<User> {
    await this.db.collection('users').doc(user.id).set(user);
    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    await this.db.collection('users').doc(userId).update(updates);
    const updated = await this.getUserById(userId);
    if (!updated) throw new Error('User not found');
    return updated;
  }

  async getMembership(societyId: string, userId: string): Promise<SocietyMembership | null> {
    const doc = await this.db
      .collection('societies')
      .doc(societyId)
      .collection('members')
      .doc(userId)
      .get();
    if (!doc.exists) return null;
    return doc.data() as SocietyMembership;
  }

  async createMembership(membership: SocietyMembership): Promise<SocietyMembership> {
    await this.db
      .collection('societies')
      .doc(membership.societyId)
      .collection('members')
      .doc(membership.userId)
      .set(membership);
    return membership;
  }

  async updateMembership(
    societyId: string,
    userId: string,
    updates: Partial<SocietyMembership>
  ): Promise<SocietyMembership> {
    const ref = this.db
      .collection('societies')
      .doc(societyId)
      .collection('members')
      .doc(userId);
    await ref.update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    const updated = await this.getMembership(societyId, userId);
    if (!updated) throw new Error('Membership not found');
    return updated;
  }

  async updateMembershipStatus(
    societyId: string,
    userId: string,
    status: SocietyMembership['status'],
    adminUserId: string,
    reason?: string
  ): Promise<SocietyMembership> {
    const ref = this.db
      .collection('societies')
      .doc(societyId)
      .collection('members')
      .doc(userId);
    const updates: any = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (status === 'ACTIVE') {
      updates.approvedBy = adminUserId;
      updates.approvedAt = new Date().toISOString();
    }
    if (reason) updates.rejectionReason = reason;

    await ref.update(updates);
    const updated = await ref.get();
    return updated.data() as SocietyMembership;
  }

  async listPendingMemberships(societyId: string): Promise<(SocietyMembership & { user: User })[]> {
    const snap = await this.db
      .collection('societies')
      .doc(societyId)
      .collection('members')
      .where('status', '==', 'PENDING_APPROVAL')
      .get();

    const results: (SocietyMembership & { user: User })[] = [];
    for (const d of snap.docs) {
      const mem = d.data() as SocietyMembership;
      const user = await this.getUserById(mem.userId);
      if (user) results.push({ ...mem, user });
    }
    return results;
  }

  async listSocietyMembers(societyId: string): Promise<(SocietyMembership & { user: User })[]> {
    const snap = await this.db
      .collection('societies')
      .doc(societyId)
      .collection('members')
      .get();

    const results: (SocietyMembership & { user: User })[] = [];
    for (const d of snap.docs) {
      const mem = d.data() as SocietyMembership;
      const user = await this.getUserById(mem.userId);
      if (user) results.push({ ...mem, user });
    }
    return results;
  }

  // Vehicles
  async createVehicle(vehicle: Vehicle): Promise<Vehicle> {
    await this.db
      .collection('societies')
      .doc(vehicle.societyId)
      .collection('vehicles')
      .doc(vehicle.id)
      .set(vehicle);
    return vehicle;
  }

  async getVehicleById(societyId: string, vehicleId: string): Promise<Vehicle | null> {
    const doc = await this.db
      .collection('societies')
      .doc(societyId)
      .collection('vehicles')
      .doc(vehicleId)
      .get();
    if (!doc.exists) return null;
    return doc.data() as Vehicle;
  }

  async listUserVehicles(societyId: string, userId: string): Promise<Vehicle[]> {
    const snap = await this.db
      .collection('societies')
      .doc(societyId)
      .collection('vehicles')
      .where('userId', '==', userId)
      .get();
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data() as Vehicle);
  }

  // Ride Schedules
  async createRideSchedule(schedule: RideSchedule): Promise<RideSchedule> {
    await this.db
      .collection('societies')
      .doc(schedule.societyId)
      .collection('schedules')
      .doc(schedule.id)
      .set(schedule);
    return schedule;
  }

  async listUserSchedules(societyId: string, userId: string): Promise<RideSchedule[]> {
    const snap = await this.db
      .collection('societies')
      .doc(societyId)
      .collection('schedules')
      .where('userId', '==', userId)
      .get();
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data() as RideSchedule);
  }

  async deactivateSchedule(societyId: string, scheduleId: string, userId: string): Promise<void> {
    const ref = this.db
      .collection('societies')
      .doc(societyId)
      .collection('schedules')
      .doc(scheduleId);
    await ref.update({ isActive: false });
  }

  // Ride Occurrences
  async createRideOccurrence(occurrence: RideOccurrence): Promise<RideOccurrence> {
    await this.db
      .collection('societies')
      .doc(occurrence.societyId)
      .collection('occurrences')
      .doc(occurrence.id)
      .set(occurrence);
    return occurrence;
  }

  async getRideOccurrence(societyId: string, journeyId: string): Promise<RideOccurrence | null> {
    const doc = await this.db
      .collection('societies')
      .doc(societyId)
      .collection('occurrences')
      .doc(journeyId)
      .get();
    if (!doc.exists) return null;
    return doc.data() as RideOccurrence;
  }

  async listOpenRides(
    societyId: string,
    date?: string,
    direction?: RideOccurrence['direction']
  ): Promise<RideOccurrence[]> {
    let query: Query = this.db
      .collection('societies')
      .doc(societyId)
      .collection('occurrences')
      .where('status', '==', 'OPEN');

    if (direction) {
      query = query.where('direction', '==', direction);
    }

    const snap = await query.get();
    let rides = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data() as RideOccurrence);

    const todayStr = new Date().toISOString().split('T')[0];
    if (date && date !== 'ALL') {
      rides = rides.filter((r: RideOccurrence) => r.journeyDate === date);
    } else {
      rides = rides.filter((r: RideOccurrence) => r.journeyDate >= todayStr);
    }

    return rides.sort((a: RideOccurrence, b: RideOccurrence) =>
      a.journeyDate.localeCompare(b.journeyDate)
    );
  }

  async listUserRides(societyId: string, userId: string): Promise<RideOccurrence[]> {
    const snap = await this.db
      .collection('societies')
      .doc(societyId)
      .collection('occurrences')
      .where('offererUserId', '==', userId)
      .get();
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data() as RideOccurrence);
  }

  async cancelRideOccurrence(
    societyId: string,
    journeyId: string,
    userId: string,
    reason: string
  ): Promise<RideOccurrence> {
    const ref = this.db
      .collection('societies')
      .doc(societyId)
      .collection('occurrences')
      .doc(journeyId);
    await ref.update({ status: 'CANCELLED', cancellationReason: reason });
    const doc = await ref.get();
    return doc.data() as RideOccurrence;
  }

  async updateRideOccurrence(
    societyId: string,
    journeyId: string,
    userId: string,
    updates: Partial<RideOccurrence>
  ): Promise<RideOccurrence> {
    const ref = this.db
      .collection('societies')
      .doc(societyId)
      .collection('occurrences')
      .doc(journeyId);
    await ref.update(updates);
    const doc = await ref.get();
    return doc.data() as RideOccurrence;
  }

  async deleteRideOccurrence(societyId: string, journeyId: string, userId: string): Promise<void> {
    await this.db
      .collection('societies')
      .doc(societyId)
      .collection('occurrences')
      .doc(journeyId)
      .delete();
  }

  async updateAvailableSeats(
    societyId: string,
    journeyId: string,
    seatDelta: number
  ): Promise<RideOccurrence> {
    const ref = this.db
      .collection('societies')
      .doc(societyId)
      .collection('occurrences')
      .doc(journeyId);

    return await this.db.runTransaction(async (transaction: Transaction) => {
      const doc = await transaction.get(ref);
      if (!doc.exists) throw new Error('Journey not found');
      const data = doc.data() as RideOccurrence;
      const newSeats = Math.max(0, data.availableSeats + seatDelta);
      transaction.update(ref, {
        availableSeats: newSeats,
        status: newSeats === 0 ? 'FULL' : 'OPEN',
      });
      return { ...data, availableSeats: newSeats, status: newSeats === 0 ? 'FULL' : 'OPEN' };
    });
  }

  // Ride Requests
  async createRideRequest(request: RideRequest): Promise<RideRequest> {
    await this.db
      .collection('societies')
      .doc(request.societyId)
      .collection('requests')
      .doc(request.id)
      .set(request);
    return request;
  }

  async getRideRequest(societyId: string, requestId: string): Promise<RideRequest | null> {
    const doc = await this.db
      .collection('societies')
      .doc(societyId)
      .collection('requests')
      .doc(requestId)
      .get();
    if (!doc.exists) return null;
    return doc.data() as RideRequest;
  }

  async listJourneyRequests(societyId: string, journeyId: string): Promise<RideRequest[]> {
    const snap = await this.db
      .collection('societies')
      .doc(societyId)
      .collection('requests')
      .where('journeyId', '==', journeyId)
      .get();
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data() as RideRequest);
  }

  async listUserRequests(societyId: string, userId: string): Promise<RideRequest[]> {
    const snap = await this.db
      .collection('societies')
      .doc(societyId)
      .collection('requests')
      .where('seekerUserId', '==', userId)
      .get();
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data() as RideRequest);
  }

  async updateRequestStatus(
    societyId: string,
    requestId: string,
    status: RideRequest['status'],
    note?: string
  ): Promise<RideRequest> {
    const ref = this.db
      .collection('societies')
      .doc(societyId)
      .collection('requests')
      .doc(requestId);
    const updates: any = { status, updatedAt: new Date().toISOString() };
    if (note) updates.responseNote = note;
    await ref.update(updates);
    const doc = await ref.get();
    return doc.data() as RideRequest;
  }

  // Matches
  async saveMatch(match: CommuteMatch): Promise<CommuteMatch> {
    await this.db
      .collection('societies')
      .doc(match.societyId)
      .collection('matches')
      .doc(match.id)
      .set(match);
    return match;
  }

  async listUserMatches(societyId: string, userId: string): Promise<CommuteMatch[]> {
    const snap = await this.db
      .collection('societies')
      .doc(societyId)
      .collection('matches')
      .where('seekerUserId', '==', userId)
      .get();
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data() as CommuteMatch);
  }

  // Feedback & Moderation
  async createFeedback(feedback: Feedback): Promise<Feedback> {
    await this.db
      .collection('societies')
      .doc(feedback.societyId)
      .collection('feedback')
      .doc(feedback.id)
      .set(feedback);
    return feedback;
  }

  async listUserFeedbackReceived(societyId: string, userId: string): Promise<Feedback[]> {
    const snap = await this.db
      .collection('societies')
      .doc(societyId)
      .collection('feedback')
      .where('toUserId', '==', userId)
      .get();
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data() as Feedback);
  }

  async createModerationReport(report: ModerationReport): Promise<ModerationReport> {
    await this.db
      .collection('societies')
      .doc(report.societyId)
      .collection('moderation_reports')
      .doc(report.id)
      .set(report);
    return report;
  }

  async listModerationReports(societyId: string): Promise<ModerationReport[]> {
    const snap = await this.db
      .collection('societies')
      .doc(societyId)
      .collection('moderation_reports')
      .get();
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data() as ModerationReport);
  }

  async updateModerationReportStatus(
    societyId: string,
    reportId: string,
    status: ModerationReport['status'],
    resolutionNotes?: string,
    adminUserId?: string
  ): Promise<ModerationReport> {
    const ref = this.db
      .collection('societies')
      .doc(societyId)
      .collection('moderation_reports')
      .doc(reportId);
    const updates: any = { status };
    if (resolutionNotes) updates.resolutionNotes = resolutionNotes;
    if (adminUserId) updates.resolvedBy = adminUserId;
    await ref.update(updates);
    const doc = await ref.get();
    return doc.data() as ModerationReport;
  }

  // Auditing
  async recordAuditEvent(event: AuditEvent): Promise<void> {
    await this.db.collection('audit_events').doc(event.id).set(event);
  }

  // In-App & Push Notifications
  async createNotification(notification: InAppNotification): Promise<InAppNotification> {
    await this.db
      .collection('societies')
      .doc(notification.societyId)
      .collection('notifications')
      .doc(notification.id)
      .set(notification);
    return notification;
  }

  async listUserNotifications(societyId: string, userId: string): Promise<InAppNotification[]> {
    const snap = await this.db
      .collection('societies')
      .doc(societyId)
      .collection('notifications')
      .where('userId', '==', userId)
      .get();
    const list = snap.docs.map(
      (d: QueryDocumentSnapshot<DocumentData>) => d.data() as InAppNotification
    );
    return list.sort(
      (a: InAppNotification, b: InAppNotification) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async markNotificationAsRead(
    societyId: string,
    notificationId: string,
    userId: string
  ): Promise<void> {
    await this.db
      .collection('societies')
      .doc(societyId)
      .collection('notifications')
      .doc(notificationId)
      .update({ read: true });
  }

  async markAllNotificationsAsRead(societyId: string, userId: string): Promise<void> {
    const snap = await this.db
      .collection('societies')
      .doc(societyId)
      .collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    const batch = this.db.batch();
    for (const d of snap.docs) {
      batch.update(d.ref, { read: true });
    }
    await batch.commit();
  }
}
