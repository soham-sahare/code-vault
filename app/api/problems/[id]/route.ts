import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helper";
import { updateProblem, deleteProblem, getProblemDetails } from "@/lib/actions";
import { z } from "zod";

const updateProblemSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional().or(z.literal("")),
  difficulty: z.enum(["EASY", "MED", "HARD"]).optional(),
  topic: z.string().min(1).optional(),
  isPublic: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  status: z.string().optional(),
});

/**
 * GET /api/problems/:id
 * Fetch a single problem by ID (O(1) indexed scan).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const problem = await getProblemDetails(id).catch(() => null);
    if (!problem) {
      return NextResponse.json({ data: null, error: "Problem not found" }, { status: 404 });
    }
    return NextResponse.json({ data: problem, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/problems/:id
 * Updates an existing problem (O(1) direct lookup).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateProblemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 });
    }

    const problem = await getProblemDetails(id).catch(() => null);
    if (!problem) {
      return NextResponse.json({ data: null, error: "Problem not found" }, { status: 404 });
    }

    const updated = await updateProblem(problem.num, {
      name: parsed.data.name ?? problem.name,
      difficulty: parsed.data.difficulty ?? problem.difficulty,
      topic: parsed.data.topic ?? problem.topic,
      url: parsed.data.url ?? problem.url,
      isPublic: parsed.data.isPublic ?? problem.isPublic,
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
 * DELETE /api/problems/:id
 * Deletes a problem (O(1) direct lookup).
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const problem = await getProblemDetails(id).catch(() => null);
    if (!problem) {
      return NextResponse.json({ data: null, error: "Problem not found" }, { status: 404 });
    }

    await deleteProblem(problem.num);
    return NextResponse.json({ data: { success: true }, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
