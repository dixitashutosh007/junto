import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { errorResponse, getSessionUser } from '@/lib/api-auth';
import { SocietySummary } from '@/types';

// Societies the signed-in user belongs to, for the society switcher
export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return errorResponse('Unauthorized', 401);

  const repo = getRepository();
  const societies = await repo.listSocieties();

  const memberships = await Promise.all(
    societies.map((s) => repo.getMembership(s.id, session.user.id))
  );

  const mine: SocietySummary[] = societies
    .filter((_, i) => {
      const status = memberships[i]?.status;
      return status !== undefined && status !== 'REJECTED' && status !== 'DEACTIVATED';
    })
    .map(({ id, slug, name, address }) => ({ id, slug, name, address }));

  return NextResponse.json({ societies: mine });
}
