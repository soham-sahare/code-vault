import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helper";
import { updateUserProfile } from "@/lib/actions";
import { z } from "zod";

const userUpdateSchema = z.object({
  username: z.string().min(2).optional(),
  name: z.string().min(2).optional(),
  defaultLanguage: z.string().optional(),
  isPublicProfile: z.boolean().optional(),
  theme: z.string().optional(),
});

/**
 * PATCH /api/users/me
 * Updates current authenticated user profile attributes.
 * Per PLAN.md § 6 Auth APIs.
 */
export async function PATCH(req: Request) {
  try {
    const userId = await requireAuth();
    const body = await req.json();
    
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 });
    }

    const updated = await updateUserProfile(parsed.data);
    return NextResponse.json({ data: updated, error: null });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
