import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helper";
import { updateSolution, deleteSolution, getProblems } from "@/lib/actions";
import { z } from "zod";

const updateSolutionSchema = z.object({
  name: z.string().min(1).optional(),
  lang: z.string().min(1).optional(),
  intuition: z.string().optional(),
  approach: z.string().optional(),
  code: z.string().min(1).optional(),
  time: z.string().optional(),
  space: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * PATCH /api/problems/:id/solutions/:solutionId
 * Updates an existing solution.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; solutionId: string }> }
) {
  try {
    await requireAuth();
    const { solutionId } = await params;
    const body = await req.json();
    const parsed = updateSolutionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 });
    }

    const all = await getProblems();
    let existingSol: any = null;
    for (const p of all) {
      const found = p.solutions?.find((s: any) => s.id === solutionId);
      if (found) {
        existingSol = found;
        break;
      }
    }
    if (!existingSol) {
      return NextResponse.json({ data: null, error: "Solution not found" }, { status: 404 });
    }

    const updated = await updateSolution(solutionId, {
      name: parsed.data.name ?? existingSol.name,
      lang: parsed.data.lang ?? existingSol.lang,
      intuition: parsed.data.intuition ?? existingSol.intuition,
      approach: parsed.data.approach ?? existingSol.approach,
      code: parsed.data.code ?? existingSol.code,
      time: parsed.data.time ?? existingSol.time,
      space: parsed.data.space ?? existingSol.space,
      tags: parsed.data.tags ?? existingSol.tags,
    });
    return NextResponse.json({ data: updated, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/problems/:id/solutions/:solutionId
 * Deletes a solution.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; solutionId: string }> }
) {
  try {
    await requireAuth();
    const { solutionId } = await params;
    await deleteSolution(solutionId);
    return NextResponse.json({ data: { success: true }, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
