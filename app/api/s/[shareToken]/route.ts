import { NextResponse } from "next/server";
import { getPublicSheetBySlug } from "@/lib/actions";

/**
 * GET /api/s/[shareToken]
 * Public sheet read — no authentication required.
 * Returns the sheet with all its public problems, solutions, and shared notes.
 *
 * Per PLAN.md § 6:
 *  "GET /api/s/:shareToken — No auth required — Public sheet read (problems + solutions)."
 * Per PLAN.md § 12.5:
 *  "/s/[shareToken] uses ISR (revalidate = 3600) — cached at the CDN edge."
 */

// ISR: cache at edge for 1 hour
export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;
    const sheet = await getPublicSheetBySlug(shareToken);

    if (!sheet) {
      return NextResponse.json(
        { data: null, error: "Sheet not found or not public" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: sheet, error: null });
  } catch (err: any) {
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
