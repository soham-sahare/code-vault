import { NextResponse } from "next/server";
import { markReminderComplete, startRevisitCycle, pauseRevisitCycle, resumeRevisitCycle, endRevisitCycle } from "@/lib/srs/scheduler";
import { requireAuth } from "@/lib/auth-helper";

/**
 * POST /api/srs/[scheduleId]/complete
 * Mark a reminder interval as reviewed (completed).
 *
 * Per PLAN.md § 6:
 *  "POST /api/srs/:scheduleId/complete — Mark interval reviewed."
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    await requireAuth();
    const { scheduleId } = await params;
    const result = await markReminderComplete(scheduleId);
    return NextResponse.json({ data: result, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "Reminder not found") {
      return NextResponse.json({ data: null, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
