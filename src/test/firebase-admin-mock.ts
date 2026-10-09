import { vi } from 'vitest';

/**
 * Stand-in for `@/lib/firebase/admin` in route tests:
 *
 *   vi.mock('@/lib/firebase/admin', async () => (await import('@/test/firebase-admin-mock')).firebaseAdminMock);
 *
 * Tokens and session cookies are plain strings registered per test, so tests
 * control exactly which credentials Firebase would accept.
 */

interface DecodedToken {
  uid: string;
  phone_number?: string;
  auth_time: number;
  iat: number;
}

const idTokens = new Map<string, DecodedToken>();
const sessionCookies = new Map<string, { uid: string; phone_number?: string }>();

export const adminAuth = {
  verifyIdToken: vi.fn(async (token: string) => {
    const decoded = idTokens.get(token);
    if (!decoded) throw new Error('auth/argument-error');
    return decoded;
  }),
  createSessionCookie: vi.fn(async (token: string) => {
    const decoded = idTokens.get(token);
    if (!decoded) throw new Error('auth/invalid-id-token');
    const cookie = `session-for-${decoded.uid}`;
    sessionCookies.set(cookie, { uid: decoded.uid, phone_number: decoded.phone_number });
    return cookie;
  }),
  verifySessionCookie: vi.fn(async (cookie: string) => {
    const decoded = sessionCookies.get(cookie);
    if (!decoded) throw new Error('auth/session-cookie-revoked');
    return decoded;
  }),
  revokeRefreshTokens: vi.fn(async (uid: string) => {
    for (const [cookie, decoded] of sessionCookies) {
      if (decoded.uid === uid) sessionCookies.delete(cookie);
    }
  }),
};

const nowSeconds = () => Math.floor(Date.now() / 1000);

/** Registers an ID token Firebase would accept */
export function registerIdToken(
  token: string,
  claims: { uid: string; phone_number?: string; authAgeSeconds?: number; issuedAgeSeconds?: number }
) {
  idTokens.set(token, {
    uid: claims.uid,
    phone_number: claims.phone_number,
    auth_time: nowSeconds() - (claims.authAgeSeconds ?? 0),
    iat: nowSeconds() - (claims.issuedAgeSeconds ?? 0),
  });
}

/** Registers a valid session cookie and returns its value */
export function registerSessionCookie(uid: string, phone_number?: string): string {
  const cookie = `session-for-${uid}`;
  sessionCookies.set(cookie, { uid, phone_number });
  return cookie;
}

export function resetFirebaseMock() {
  idTokens.clear();
  sessionCookies.clear();
  vi.clearAllMocks();
}

export const firebaseAdminMock = {
  adminAuth,
  adminDb: {},
  hasFirebaseCredentials: () => false,
};
