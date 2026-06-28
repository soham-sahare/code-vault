import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helper";
import { getSheets, createSheet } from "@/lib/actions";
import { z } from "zod";

const createSheetSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
});

/**
 * GET /api/sheets
 * Lists all sheets created by the authenticated user.
 */
export async function GET() {
  try {
    await requireAuth();
    const data = await getSheets();
    return NextResponse.json({ data, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/sheets
 * Creates a new sheet.
 */
export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await req.json();
    const parsed = createSheetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 });
    }

    const sheet = await createSheet(
      parsed.data.name,
      parsed.data.description,
      parsed.data.isPublic ?? false
    );

    return NextResponse.json({ data: sheet, error: null }, { status: 201 });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
