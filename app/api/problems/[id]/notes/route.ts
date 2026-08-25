import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helper";
import { addNote } from "@/lib/actions";
import { db } from "@/lib/db";
import { z } from "zod";

const createNoteSchema = z.object({
  text: z.string().min(1),
  type: z.enum(["note", "warning", "success", "mistake"]).default("note"),
  isShared: z.boolean().optional(),
});

/**
 * GET /api/problems/:id/notes
 * Lists all problem-level notes for the problem via indexed problemId query.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const notes = await db.note.findMany({
      where: { problemId: id, userId },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json({ data: notes, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/problems/:id/notes
 * Creates a new problem-level note.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 });
    }

    const note = await addNote({
      problemId: id,
      text: parsed.data.text,
      type: parsed.data.type,
      isShared: parsed.data.isShared ?? false,
    });

    return NextResponse.json({ data: note, error: null }, { status: 201 });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
