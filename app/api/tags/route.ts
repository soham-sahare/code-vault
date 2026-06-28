import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helper";
import { getUserTopics } from "@/lib/actions";

/**
 * GET /api/tags
 * Returns all user topic tags for autocomplete suggestions.
 */
export async function GET() {
  try {
    await requireAuth();
    const data = await getUserTopics();
    return NextResponse.json({ data, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
