import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { getAuthContext, errorResponse } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return errorResponse('Unauthorized', 401);

  const repo = getRepository();
  const user = await repo.getUserById(auth.userId);
  const society = await repo.getSocietyById(auth.societyId);
  const membership = await repo.getMembership(auth.societyId, auth.userId);

  return NextResponse.json({
    user,
    society,
    membership,
  });
}

export async function PUT(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return errorResponse('Unauthorized', 401);

  const body = await req.json().catch(() => ({}));
  const { fullName, email, mobile, flatNumber, commuteIntent, workLocationName, gender, profileCompleted } = body;

  const repo = getRepository();

  // 1. Update user record
  const userUpdates: any = {};
  if (fullName) userUpdates.fullName = fullName;
  if (email) userUpdates.email = email;
  if (mobile) userUpdates.mobile = mobile;
  if (commuteIntent) userUpdates.commuteIntent = commuteIntent;
  if (workLocationName !== undefined) userUpdates.workLocationName = workLocationName;
  if (gender) userUpdates.gender = gender;
  if (profileCompleted !== undefined) userUpdates.profileCompleted = Boolean(profileCompleted);

  const updatedUser = await repo.updateUser(auth.userId, userUpdates);

  // 2. Update membership flat if provided
  let updatedMembership = await repo.getMembership(auth.societyId, auth.userId);
  if (flatNumber && updatedMembership) {
    updatedMembership = await repo.updateMembership(auth.societyId, auth.userId, { flatNumber });
  }

  // 3. Check vehicles if user wants to be an OFFERER
  const vehicles = await repo.listUserVehicles(auth.societyId, auth.userId);

  return NextResponse.json({
    success: true,
    user: updatedUser,
    membership: updatedMembership,
    hasVehicle: vehicles.length > 0,
  });
}
