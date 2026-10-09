import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { errorResponse, getSessionUser } from '@/lib/api-auth';
import { SocietySummary } from '@/types';

// Societies the signed-in user belongs to, for the society switcher
export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return errorResponse('Unauthorized', 401);

  const repo = getRepository();
  const memberships = (await repo.listUserMemberships(session.user.id)).filter(
    (m) => m.status !== 'REJECTED' && m.status !== 'DEACTIVATED'
  );

  const societies: SocietySummary[] = [];
  for (const m of memberships) {
    const society = await repo.getSocietyById(m.societyId);
    if (society) {
      const { id, slug, name, address } = society;
      societies.push({ id, slug, name, address });
    }
  }

  return NextResponse.json({ societies });
}
