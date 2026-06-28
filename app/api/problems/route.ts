import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helper";
import { getProblems, createProblem } from "@/lib/actions";
import { z } from "zod";

const createProblemSchema = z.object({
  name: z.string().min(1),
  url: z.string().url().optional().or(z.literal("")),
  difficulty: z.enum(["EASY", "MED", "HARD"]),
  topic: z.string().min(1),
  isPublic: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
});

/**
 * GET /api/problems
 * Returns all problems for the current user, optionally filtered.
 * Per PLAN.md § 6 Problems APIs.
 */
export async function GET(req: Request) {
  try {
    await requireAuth(); // verifies session
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || undefined;
    const difficulty = searchParams.get("difficulty") || undefined;
    const tag = searchParams.get("tag") || undefined;
    const company = searchParams.get("company") || undefined;
    const pattern = searchParams.get("pattern") || undefined;
    const status = searchParams.get("status") || undefined;
    const cursor = searchParams.get("cursor") || undefined;

    const data = await getProblems({ q, difficulty, tag, company, pattern, status, cursor });
    return NextResponse.json({ data, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/problems
 * Creates a new problem.
 * Per PLAN.md § 6 Problems APIs.
 */
export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await req.json();
    const parsed = createProblemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 });
    }

    const problem = await createProblem({
      name: parsed.data.name,
      url: parsed.data.url || "#",
      difficulty: parsed.data.difficulty,
      topic: parsed.data.topic,
      isPublic: parsed.data.isPublic ?? false,
    });

    return NextResponse.json({ data: problem, error: null }, { status: 201 });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
