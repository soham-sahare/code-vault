import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helper";
import { addProblemToSheet, removeProblemFromSheet } from "@/lib/actions";
import { z } from "zod";

const sheetProblemSchema = z.object({
  problemId: z.string().min(1),
  order: z.number().optional(),
});

/**
 * POST /api/sheets/:id/problems
 * Adds a problem to a sheet.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const parsed = sheetProblemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 });
    }

    const updated = await addProblemToSheet(id, parsed.data.problemId);
    return NextResponse.json({ data: updated, error: null }, { status: 201 });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/sheets/:id/problems
 * Removes a problem from a sheet.
 * Body parameter or Query parameter contains problemId.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    
    // Check query params first
    const { searchParams } = new URL(req.url);
    let problemId = searchParams.get("problemId");

    // Fallback to body read if not in query
    if (!problemId) {
      const body = await req.json();
      problemId = body?.problemId;
    }

    if (!problemId) {
      return NextResponse.json({ data: null, error: "problemId is required" }, { status: 400 });
    }

    const updated = await removeProblemFromSheet(id, problemId);
    return NextResponse.json({ data: updated, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
