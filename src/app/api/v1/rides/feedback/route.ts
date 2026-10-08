import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { getAuthContext, errorResponse } from '@/lib/api-auth';
import { Feedback } from '@/types';
import { FeedbackSchema } from '@/lib/validation/schemas';

export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return errorResponse('Unauthorized', 401);

  const body = await req.json().catch(() => ({}));
  const parseResult = FeedbackSchema.safeParse(body);
  if (!parseResult.success) {
    return errorResponse(parseResult.error.issues[0]?.message || 'Invalid feedback parameters');
  }

  const { journeyId, toUserId, role, outcome, qualitativeTags, privateNote } = parseResult.data;

  const repo = getRepository();

  const feedback: Feedback = {
    id: `fb-${Date.now()}`,
    societyId: auth.societyId,
    journeyId,
    fromUserId: auth.userId,
    toUserId,
    role: role || 'SEEKER',
    outcome,
    qualitativeTags: qualitativeTags || [],
    privateNote,
    createdAt: new Date().toISOString(),
  };

  const saved = await repo.createFeedback(feedback);

  return NextResponse.json({ success: true, feedback: saved });
}

// GET qualitative feedback badges received by a user
export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return errorResponse('Unauthorized', 401);

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('userId') || auth.userId;

  const repo = getRepository();
  const feedbackList = await repo.listUserFeedbackReceived(auth.societyId, targetUserId);

  // Aggregate qualitative tags
  const tagCounts: Record<string, number> = {};
  for (const fb of feedbackList) {
    for (const tag of fb.qualitativeTags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  return NextResponse.json({
    feedback: feedbackList,
    totalCommutesCompleted: feedbackList.filter((f) => f.outcome === 'COMPLETED').length,
    tagBadges: Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count),
  });
}
