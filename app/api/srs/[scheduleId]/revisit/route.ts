import { NextResponse } from "next/server";
import { startRevisitCycle, pauseRevisitCycle, resumeRevisitCycle, endRevisitCycle } from "@/lib/srs/scheduler";
import { requireAuth } from "@/lib/auth-helper";

/**
 * POST /api/srs/[scheduleId]/revisit
 * Start, pause, resume, or end a post-30d revisit cycle.
 *
 * Body: { action: 'start' | 'pause' | 'end' | 'resume', problemId: string, reason?: string }
 *
 * Per PLAN.md § 6:
 *  "POST /api/srs/:scheduleId/revisit — Start a revisit cycle after 30d completion.
 *   Body: { action: 'start' | 'pause' | 'end' }.
 *   Only callable when interval_days=30 and status='completed'."
 *
 * Per PLAN.md § 9.4 Post-30d Revisit Cycle.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const userId = await requireAuth();
    const body = await request.json();
    const { action, problemId, reason } = body as {
      action: "start" | "pause" | "end" | "resume";
      problemId: string;
      reason?: string;
    };

    if (!problemId) {
      return NextResponse.json(
        { data: null, error: "problemId is required" },
        { status: 400 }
      );
    }

    let result: any;
    switch (action) {
      case "start":
        result = await startRevisitCycle(problemId, userId);
        break;
      case "pause":
        result = await pauseRevisitCycle(problemId, userId, reason);
        break;
      case "resume":
        result = await resumeRevisitCycle(problemId, userId);
        break;
      case "end":
        result = await endRevisitCycle(problemId, userId);
        break;
      default:
        return NextResponse.json(
          { data: null, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ data: result, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    // 409 for revisit guard violations (already active, 30d not completed, etc.)
    if (
      err.message.includes("Cannot request revisit") ||
      err.message.includes("already")
    ) {
      return NextResponse.json({ data: null, error: err.message }, { status: 409 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
