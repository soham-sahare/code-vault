import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helper";
import { addSolution } from "@/lib/actions";
import { db } from "@/lib/db";
import { z } from "zod";

const createSolutionSchema = z.object({
  name: z.string().min(1),
  lang: z.string().min(1),
  intuition: z.string().optional(),
  approach: z.string().optional(),
  code: z.string().min(1),
  time: z.string().default("O(N)"),
  space: z.string().default("O(1)"),
  tags: z.array(z.string()).default([]),
});

/**
 * GET /api/problems/:id/solutions
 * Lists solutions for a problem via indexed problemId query.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    
    // Verify problem ownership / existence
    const problem = await db.problem.findFirst({
      where: { id, userId },
      select: { id: true }
    });
    if (!problem) {
      return NextResponse.json({ data: null, error: "Problem not found" }, { status: 404 });
    }

    const solutions = await db.solution.findMany({
      where: { problemId: id },
      include: { notes: true },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({ data: solutions, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/problems/:id/solutions
 * Creates a solution.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const parsed = createSolutionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 });
    }

    const sol = await addSolution(id, {
      name: parsed.data.name,
      lang: parsed.data.lang,
      intuition: parsed.data.intuition || "",
      approach: parsed.data.approach || "",
      code: parsed.data.code,
      time: parsed.data.time,
      space: parsed.data.space,
      tags: parsed.data.tags,
      notes: [],
    });

    return NextResponse.json({ data: sol, error: null }, { status: 201 });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
