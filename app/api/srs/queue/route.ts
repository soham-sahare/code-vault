import { NextResponse } from "next/server";
import { getDueItems, markReminderComplete } from "@/lib/srs/scheduler";
import { requireAuth } from "@/lib/auth-helper";

/**
 * GET /api/srs/queue
 * Fetch problems due for review today. Checks Redis sorted set first,
 * falls back to DB query.
 *
 * Per PLAN.md § 6 SRS catalog.
 */
export async function GET() {
  try {
    const userId = await requireAuth();
    const dueItems = await getDueItems(userId);
    return NextResponse.json({ data: dueItems, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
