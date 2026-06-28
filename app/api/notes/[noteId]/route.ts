import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helper";
import { updateNote, deleteNote } from "@/lib/actions";
import { z } from "zod";

const updateNoteSchema = z.object({
  text: z.string().min(1).optional(),
  type: z.enum(["note", "warning", "success", "mistake"]).optional(),
  isShared: z.boolean().optional(),
});

/**
 * PATCH /api/notes/:noteId
 * Updates an existing problem-level note.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    await requireAuth();
    const { noteId } = await params;
    const body = await req.json();
    const parsed = updateNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 });
    }

    // Since this endpoint is for problem-level notes (non-solution), we pass isSolutionNote = false
    const updated = await updateNote(noteId, false, parsed.data);
    return NextResponse.json({ data: updated, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/notes/:noteId
 * Deletes a note.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    await requireAuth();
    const { noteId } = await params;
    await deleteNote(noteId);
    return NextResponse.json({ data: { success: true }, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
