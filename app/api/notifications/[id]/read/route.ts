import { NextResponse } from "next/server";
import { markNotificationRead, deleteNotification } from "@/lib/actions";

/**
 * PATCH /api/notifications/[id]/read
 * Marks a single notification as read.
 *
 * Per PLAN.md § 6.
 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updated = await markNotificationRead(id);
    return NextResponse.json({ data: updated, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "Notification not found") {
      return NextResponse.json({ data: null, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications/[id]
 * Removes a notification for the current user.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteNotification(id);
    return NextResponse.json({ data: { success: true }, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
