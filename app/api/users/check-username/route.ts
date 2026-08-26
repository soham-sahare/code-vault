import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUsername = searchParams.get("username");

    if (!rawUsername) {
      return NextResponse.json(
        { available: false, reason: "Username parameter is required." },
        { status: 400 }
      );
    }

    const cleanUsername = rawUsername.trim().toLowerCase();

    if (cleanUsername.length < 2 || cleanUsername.length > 30) {
      return NextResponse.json({
        available: false,
        reason: "Username must be between 2 and 30 characters.",
      });
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      return NextResponse.json({
        available: false,
        reason: "Only lowercase letters, numbers, and underscores are allowed.",
      });
    }

    const session = await auth();
    const currentUserId = session?.user?.id;

    // Fast O(1) indexed case-insensitive lookup
    const existing = await db.user.findFirst({
      where: {
        username: {
          equals: cleanUsername,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ available: true, isCurrent: false });
    }

    if (currentUserId && existing.id === currentUserId) {
      return NextResponse.json({ available: true, isCurrent: true });
    }

    return NextResponse.json({
      available: false,
      reason: "This username is already taken.",
    });
  } catch (error) {
    console.error("Check username error:", error);
    return NextResponse.json(
      { available: false, error: "Failed to check username availability." },
      { status: 500 }
    );
  }
}
