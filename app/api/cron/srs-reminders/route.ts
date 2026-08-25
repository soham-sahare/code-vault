import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Automated Cron Endpoint for Spaced Repetition (SRS) Review Reminders.
 * Designed to run daily (e.g. via Vercel Cron or external scheduler).
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Secure webhook if CRON_SECRET is configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Fetch all pending reminders due today or earlier
    const dueReminders = await db.reminder.findMany({
      where: {
        status: "PENDING",
        dueDate: { lte: now },
      },
      include: {
        problem: {
          select: {
            id: true,
            num: true,
            name: true,
            userId: true,
          },
        },
      },
      take: 500, // Batch limit for performance
    });

    if (dueReminders.length === 0) {
      return NextResponse.json({ message: "No pending reminders due today", count: 0 });
    }

    let notificationsCreated = 0;

    for (const rem of dueReminders) {
      if (!rem.problem || !rem.problem.userId) continue;

      // Check if an unread notification for this problem was already created today to avoid spam
      const existingNotification = await db.notification.findFirst({
        where: {
          userId: rem.problem.userId,
          relatedId: rem.problem.id,
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
        },
      });

      if (!existingNotification) {
        await db.notification.create({
          data: {
            userId: rem.problem.userId,
            type: "srs_revisit",
            message: `Problem #${rem.problem.num} "${rem.problem.name}" is scheduled for revisit today (${rem.stage})`,
            relatedId: rem.problem.id,
          },
        });
        notificationsCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      processedReminders: dueReminders.length,
      notificationsDispatched: notificationsCreated,
    });
  } catch (error) {
    console.error("Cron SRS reminder error:", error);
    return NextResponse.json(
      { error: "Internal server error processing SRS reminders" },
      { status: 500 }
    );
  }
}
