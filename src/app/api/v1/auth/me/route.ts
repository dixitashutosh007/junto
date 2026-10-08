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
