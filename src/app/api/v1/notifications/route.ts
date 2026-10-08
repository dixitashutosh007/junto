import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { getAuthContext, errorResponse } from '@/lib/api-auth';

// GET all notifications for the active resident
export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return errorResponse('Unauthorized', 401);

  const repo = getRepository();
  const notifications = await repo.listUserNotifications(auth.societyId, auth.userId);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return NextResponse.json({ notifications, unreadCount });
}

// Mark notifications as read
export async function PATCH(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return errorResponse('Unauthorized', 401);

  const body = await req.json().catch(() => ({}));
  const { notificationId, markAll } = body;

  const repo = getRepository();

  if (markAll) {
    await repo.markAllNotificationsAsRead(auth.societyId, auth.userId);
    return NextResponse.json({ success: true, markedAll: true });
  }

  if (notificationId) {
    await repo.markNotificationAsRead(auth.societyId, notificationId, auth.userId);
    return NextResponse.json({ success: true, notificationId });
  }

  return errorResponse('Provide either notificationId or markAll');
}
