import { NextResponse } from "next/server";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead } from "@/lib/actions";

/**
 * GET /api/notifications
 * Returns all notifications for the current user (most recent first).
 * ?unread=true  → returns only the unread count (for bell badge)
 *
 * Per PLAN.md § 6 Notifications catalog.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";

    if (unreadOnly) {
      const count = await getUnreadNotificationCount();
      return NextResponse.json({ data: { count }, error: null });
    }

    const notifications = await getNotifications();
    return NextResponse.json({ data: notifications, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * Body: { action: "read-all" }
 * Marks all notifications as read.
 *
 * Per PLAN.md § 6: PATCH /api/notifications/read-all
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (body?.action === "read-all") {
      await markAllNotificationsRead();
      return NextResponse.json({ data: { success: true }, error: null });
    }
    return NextResponse.json({ data: null, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
