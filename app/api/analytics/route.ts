import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/actions";

/**
 * GET /api/analytics
 * Returns full analytics payload (heatmap, distributions, streaks).
 * Returns cached snapshot, regenerates if stale (> 1 hour).
 *
 * Per PLAN.md § 6 Analytics catalog.
 */
export async function GET() {
  try {
    const analytics = await getAnalytics();
    return NextResponse.json({ data: analytics, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
