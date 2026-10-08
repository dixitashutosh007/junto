import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getRepository } from '@/lib/db';
import { User, SocietyMembership } from '@/types';

/**
 * Exchange Firebase ID token from client for a secure HTTP-Only session cookie
 * or verify active resident profile based on Firebase Auth UID / Phone Number.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, societyId } = body;

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    const targetSocietyId = societyId || 'soc-ggh-001';
    const repo = getRepository();

    const isProduction = process.env.NODE_ENV === 'production';
    let uid: string;
    let phoneNumber: string = '+919811122233';

    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      uid = decodedToken.uid;
      phoneNumber = decodedToken.phone_number || phoneNumber;
    } catch (tokenErr) {
      // In production, token MUST be authentic and signed by Firebase Admin
      if (isProduction) {
        console.error('Firebase token verification failed in production:', tokenErr);
        return NextResponse.json({ error: 'Invalid or expired Firebase authentication token' }, { status: 401 });
      }
      // In local dev/test mode only:
      if (idToken.startsWith('dev-token-')) {
        uid = idToken.replace('dev-token-', '');
      } else {
        uid = 'usr-offerer-001';
      }
    }

    // 2. Fetch existing user by UID or phone number
    let user = await repo.getUserById(uid);
    if (!user && phoneNumber) {
      user = await repo.getUserByPhone(phoneNumber);
    }

    const isNewUser = !user;
    if (!user) {
      // Initial user stub awaiting resident onboarding
      user = await repo.createUser({
        id: uid,
        cognitoSub: `fb-${uid}`,
        email: `${phoneNumber.replace(/\D/g, '')}@societyapps.org`,
        mobile: phoneNumber,
        fullName: 'Resident Member',
        gender: 'PREFER_NOT_TO_SAY',
        profileCompleted: false,
        createdAt: new Date().toISOString(),
      });
    }

    // 3. Ensure society membership
    let membership = await repo.getMembership(targetSocietyId, user.id);
    if (!membership) {
      const society = await repo.getSocietyById(targetSocietyId);
      membership = await repo.createMembership({
        id: `mem-${Date.now()}`,
        societyId: targetSocietyId,
        userId: user.id,
        flatNumber: 'Pending Verification',
        role: 'RESIDENT',
        status: 'PENDING_APPROVAL',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 4. Return session response and set secure HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user,
      membership,
      societyId: targetSocietyId,
    });

    response.cookies.set('societyapps_session', uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    response.cookies.set('societyapps_society_id', targetSocietyId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err: any) {
    console.error('Session creation error:', err);
    return NextResponse.json({ error: err.message || 'Authentication error' }, { status: 500 });
  }
}

// Clear session cookie on logout
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.cookies.delete('societyapps_session');
  response.cookies.delete('societyapps_society_id');
  return response;
}
