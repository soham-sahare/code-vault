import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helper";
import { updateSheet, deleteSheet } from "@/lib/actions";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSheetSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
});

/**
 * GET /api/sheets/:id
 * Fetches a single sheet by ID (O(1) indexed query).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const sheet = await db.sheet.findFirst({
      where: {
        id,
        OR: [{ userId }, { isCurated: true }, { isPublic: true }]
      },
      include: {
        problems: {
          include: {
            problem: {
              include: {
                solutions: true,
                companies: { include: { company: true } },
                patterns: { include: { pattern: true } },
              }
            }
          }
        }
      }
    });
    if (!sheet) {
      return NextResponse.json({ data: null, error: "Sheet not found" }, { status: 404 });
    }
    return NextResponse.json({ data: sheet, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/sheets/:id
 * Updates sheet properties (O(1) lookup).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSheetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 });
    }

    const sheet = await db.sheet.findFirst({
      where: { id, userId }
    });
    if (!sheet) {
      return NextResponse.json({ data: null, error: "Sheet not found or unauthorized" }, { status: 404 });
    }

    const updated = await updateSheet(
      id,
      parsed.data.name ?? sheet.name,
      parsed.data.description ?? sheet.description ?? undefined,
      parsed.data.isPublic ?? sheet.isPublic
    );
    return NextResponse.json({ data: updated, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/sheets/:id
 * Deletes a sheet.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    await deleteSheet(id);
    return NextResponse.json({ data: { success: true }, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
