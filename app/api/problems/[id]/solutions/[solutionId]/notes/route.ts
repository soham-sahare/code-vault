import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helper";
import { addSolutionNote, getProblems } from "@/lib/actions";
import { z } from "zod";

const createSolNoteSchema = z.object({
  text: z.string().min(1),
  type: z.enum(["note", "warning", "success", "mistake"]).default("note"),
  isShared: z.boolean().optional(),
});

/**
 * GET /api/problems/:id/solutions/:solutionId/notes
 * Lists notes for a solution.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; solutionId: string }> }
) {
  try {
    await requireAuth();
    const { id, solutionId } = await params;
    const all = await getProblems();
    const problem = all.find((p: any) => p.id === id);
    if (!problem) {
      return NextResponse.json({ data: null, error: "Problem not found" }, { status: 404 });
    }
    const solution = problem.solutions?.find((s: any) => s.id === solutionId);
    if (!solution) {
      return NextResponse.json({ data: null, error: "Solution not found" }, { status: 404 });
    }
    return NextResponse.json({ data: solution.notes || [], error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/problems/:id/solutions/:solutionId/notes
 * Adds a note to a solution.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; solutionId: string }> }
) {
  try {
    await requireAuth();
    const { solutionId } = await params;
    const body = await req.json();
    const parsed = createSolNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 });
    }

    const note = await addSolutionNote(
      solutionId,
      parsed.data.type,
      parsed.data.text
    );

    return NextResponse.json({ data: note, error: null }, { status: 201 });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
