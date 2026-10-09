import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/api-auth';
import { MarkNotificationsSchema } from '@/lib/validation/schemas';
import { parseBody } from '@/lib/validation/parse';

// GET all notifications for the active resident
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const repo = getRepository();
  const notifications = await repo.listUserNotifications(auth.societyId, auth.userId);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return NextResponse.json({ notifications, unreadCount });
}

// Mark notifications as read
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await parseBody(req, MarkNotificationsSchema);
  if (body instanceof NextResponse) return body;

  const repo = getRepository();

  if ('markAll' in body) {
    await repo.markAllNotificationsAsRead(auth.societyId, auth.userId);
    return NextResponse.json({ success: true, markedAll: true });
  }

  const marked = await repo.markNotificationAsRead(auth.societyId, body.notificationId, auth.userId);
  if (!marked) return errorResponse('Notification not found', 404);
  return NextResponse.json({ success: true, notificationId: body.notificationId });
}
