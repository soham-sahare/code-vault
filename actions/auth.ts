"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { authenticatedAction } from "@/lib/action-utils";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "Please provide all fields" };
  }

  try {
    await connectDB();

    const userExists = await User.findOne({ email });
    if (userExists) {
      return { error: "User already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return { success: true };
  } catch (error) {
    return { error: "Something went wrong" };
  }
}

export async function updateProfile(formData: FormData) {
  return authenticatedAction(async (data: FormData, { user }) => {
    const name = data.get("name") as string;
    const currentPassword = data.get("currentPassword") as string;
    const newPassword = data.get("newPassword") as string;

    const dbUser = await User.findOne({ email: user.email }).select("+password");
    if (!dbUser) return { error: "User not found" };

    if (name && name !== dbUser.name) {
      const existingUser = await User.findOne({ name });
      if (existingUser) return { error: "Username already taken" };
      dbUser.name = name;
    }

    if (newPassword) {
      if (!currentPassword) return { error: "Current password is required" };
      
      const isMatch = await bcrypt.compare(currentPassword, dbUser.password);
      if (!isMatch) return { error: "Incorrect current password" };

      dbUser.password = await bcrypt.hash(newPassword, 10);
    }

    await dbUser.save();
    revalidatePath("/profile");
    revalidatePath("/", "layout");

    return { success: true };
  }, formData);
}
