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
    const defaultLanguage = data.get("defaultLanguage") as string;
    const currentPassword = data.get("currentPassword") as string;
    const newPassword = data.get("newPassword") as string;

    const dbUser = await User.findOne({ email: user.email }).select("+password");
    if (!dbUser) return { error: "User not found" };

    // Separate password update from profile update for cleaner logic
    if (newPassword) {
       if (!currentPassword) return { error: "Current password is required" };
       const userWithPassword = await User.findById(dbUser._id).select("+password");
       const isMatch = await bcrypt.compare(currentPassword, userWithPassword.password);
       if (!isMatch) return { error: "Incorrect current password" };
       
       await User.findByIdAndUpdate(dbUser._id, { 
           password: await bcrypt.hash(newPassword, 10) 
       });
    }

    // Update other fields
    const updates: any = {};
    if (name && name !== dbUser.name) {
        // Unique check
        const existing = await User.findOne({ name, _id: { $ne: dbUser._id } });
        if (existing) return { error: "Username already taken" };
        updates.name = name;
    }
    if (defaultLanguage) {
        updates.defaultLanguage = defaultLanguage;
    }

    if (Object.keys(updates).length > 0) {
        await User.findByIdAndUpdate(dbUser._id, { $set: updates });
    }

    revalidatePath("/profile");
    revalidatePath("/", "layout");

    return { success: true };
  }, formData);
}
