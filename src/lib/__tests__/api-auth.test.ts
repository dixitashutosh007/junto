import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeRequest, resetRepository } from '@/test/route-helpers';
import { registerSessionCookie, resetFirebaseMock } from '@/test/firebase-admin-mock';
import { GET as listRides } from '@/app/api/v1/rides/route';
import { GET as getMe } from '@/app/api/v1/auth/me/route';
import { GET as listResidents } from '@/app/api/v1/admin/residents/route';
import { MockDynamoRepository } from '@/lib/db/mock-repository';

vi.mock('@/lib/firebase/admin', async () => (await import('@/test/firebase-admin-mock')).firebaseAdminMock);

const SOCIETY = 'soc-ggh-001';

describe('API authentication in production', () => {
  let repo: MockDynamoRepository;

  beforeEach(() => {
    repo = resetRepository();
    resetFirebaseMock();
    vi.stubEnv('NODE_ENV', 'production');
  });

  const ridesWithSession = (cookie: string) =>
    listRides(makeRequest('/api/v1/rides?date=ALL', { cookies: { junto_session: cookie } }));

  it('accepts a valid Firebase session cookie', async () => {
    const res = await ridesWithSession(registerSessionCookie('usr-seeker-001'));
    expect(res.status).toBe(200);
  });

  it('rejects a forged session cookie containing a raw user ID', async () => {
    const res = await ridesWithSession('usr-admin-001');
    expect(res.status).toBe(401);
  });

  it('rejects the old unsigned cookie', async () => {
    const res = await listRides(
      makeRequest('/api/v1/rides', { cookies: { societyapps_session: 'usr-admin-001' } })
    );
    expect(res.status).toBe(401);
  });

  it('rejects development session cookies', async () => {
    const res = await ridesWithSession('dev:usr-admin-001');
    expect(res.status).toBe(401);
  });

  it('rejects a revoked session', async () => {
    const cookie = registerSessionCookie('usr-seeker-001');
    const { adminAuth } = await import('@/test/firebase-admin-mock');
    await adminAuth.revokeRefreshTokens('usr-seeker-001');

    const res = await ridesWithSession(cookie);
    expect(res.status).toBe(401);
  });

  it('resolves a Firebase UID linked to an existing user', async () => {
    await repo.updateUser('usr-seeker-001', { firebaseUid: 'firebase-uid-123' });
    const res = await ridesWithSession(registerSessionCookie('firebase-uid-123'));
    expect(res.status).toBe(200);
  });

  it('blocks members pending approval from ride routes', async () => {
    const res = await ridesWithSession(registerSessionCookie('usr-pending-001'));
    expect(res.status).toBe(403);
  });

  it('blocks suspended members from ride routes', async () => {
    await repo.updateMembershipStatus(SOCIETY, 'usr-seeker-001', 'SUSPENDED', 'usr-admin-001');
    const res = await ridesWithSession(registerSessionCookie('usr-seeker-001'));
    expect(res.status).toBe(403);
  });

  it('lets pending members read their own profile', async () => {
    const res = await getMe(
      makeRequest('/api/v1/auth/me', {
        cookies: { junto_session: registerSessionCookie('usr-pending-001') },
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.membership.status).toBe('PENDING_APPROVAL');
  });

  it('allows admin routes only for admins', async () => {
    const asResident = await listResidents(
      makeRequest('/api/v1/admin/residents', {
        cookies: { junto_session: registerSessionCookie('usr-seeker-001') },
      })
    );
    expect(asResident.status).toBe(403);

    const asAdmin = await listResidents(
      makeRequest('/api/v1/admin/residents', {
        cookies: { junto_session: registerSessionCookie('usr-admin-001') },
      })
    );
    expect(asAdmin.status).toBe(200);
  });
});

describe('getRepository in production', () => {
  it('refuses to fall back to the mock repository without Firestore credentials', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('USE_FIRESTORE', '');
    global.__societyRepoInstance = undefined;

    const { getRepository } = await import('@/lib/db');
    expect(() => getRepository()).toThrow(/Firestore is not configured/);
  });
});
