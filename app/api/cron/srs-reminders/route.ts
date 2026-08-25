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

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const userIds = Array.from(new Set(dueReminders.map(r => r.problem?.userId).filter(Boolean))) as string[];
    const problemIds = Array.from(new Set(dueReminders.map(r => r.problem?.id).filter(Boolean))) as string[];

    // 1 single batch query to check existing notifications for today
    const existingNotifications = await db.notification.findMany({
      where: {
        userId: { in: userIds },
        relatedId: { in: problemIds },
        createdAt: { gte: startOfDay },
      },
      select: {
        userId: true,
        relatedId: true,
      },
    });

    const existingNotifSet = new Set(
      existingNotifications.map(n => `${n.userId}:${n.relatedId}`)
    );

    const notificationsToCreate: Array<{
      userId: string;
      type: string;
      message: string;
      relatedId: string;
    }> = [];

    const seenInBatch = new Set<string>();

    for (const rem of dueReminders) {
      if (!rem.problem || !rem.problem.userId) continue;
      const key = `${rem.problem.userId}:${rem.problem.id}`;

      if (!existingNotifSet.has(key) && !seenInBatch.has(key)) {
        seenInBatch.add(key);
        notificationsToCreate.push({
          userId: rem.problem.userId,
          type: "srs_revisit",
          message: `Problem #${rem.problem.num} "${rem.problem.name}" is scheduled for revisit today (${rem.stage})`,
          relatedId: rem.problem.id,
        });
      }
    }

    if (notificationsToCreate.length > 0) {
      await db.notification.createMany({
        data: notificationsToCreate,
      });
    }

    return NextResponse.json({
      success: true,
      processedReminders: dueReminders.length,
      notificationsDispatched: notificationsToCreate.length,
    });
  } catch (error) {
    console.error("Cron SRS reminder error:", error);
    return NextResponse.json(
      { error: "Internal server error processing SRS reminders" },
      { status: 500 }
    );
  }
}
