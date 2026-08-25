import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(2, "Username must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, username: rawUsername, email, password } = result.data;
    const cleanEmail = email.toLowerCase().trim();

    // Determine target username: user-provided username or derived from name / email
    const rawTarget = rawUsername || name || cleanEmail.split("@")[0];
    const cleanUsername = rawTarget.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
    if (!cleanUsername || cleanUsername.length < 2) {
      return NextResponse.json(
        { error: "Username must be at least 2 alphanumeric characters" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUsername = await db.user.findFirst({
      where: {
        username: {
          equals: cleanUsername,
          mode: "insensitive",
        },
      },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: "Username is already taken. Please choose another." },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user with exact username
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        username: cleanUsername,
        passwordHash: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: "User registered successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}
