import { db } from "@/lib/db";
import { enqueueSRS, dequeueSRS, getDueFromQueue } from "@/lib/redis/srs-queue";
import { computeDueDate } from "@/lib/timestamps/ist";

const SRS_INTERVALS = [3, 7, 15, 30];

/**
 * Initializes a 4-interval SRS schedule for a solved problem.
 */
export async function initSchedule(
  problemId: string,
  userId: string,
  solvedAt: Date = new Date()
): Promise<void> {
  // Check if reminders already exist for this problem
  const existing = await db.reminder.findFirst({
    where: { problemId, userId, cycle: 1 },
    select: { id: true },
  });
  if (existing) return;

  // Create reminders for 3d, 7d, 15d, 30d
  const remindersData = SRS_INTERVALS.map((days) => {
    const dueDate = computeDueDate(solvedAt, days);
    return {
      problemId,
      userId,
      dueDate,
      stage: `Recall Stage ${days}d`,
      cycle: 1,
      status: "PENDING",
    };
  });

  // Batch insert into database
  await db.reminder.createMany({
    data: remindersData,
  });

  // Fetch reminder IDs for Redis queue
  const createdReminders = await db.reminder.findMany({
    where: { problemId, userId, cycle: 1, status: "PENDING" },
    select: { id: true, dueDate: true },
  });

  // Parallel non-blocking Redis queue pushes
  await Promise.allSettled(
    createdReminders.map((r) => {
      const score = Math.floor(r.dueDate.getTime() / 1000);
      return enqueueSRS(userId, r.id, score);
    })
  );
}

/**
 * Get all due reminder items for a user
 */
export async function getDueItems(userId: string): Promise<any[]> {
  const nowSec = Math.floor(Date.now() / 1000);
  const dueIds = await getDueFromQueue(userId, nowSec);

  if (dueIds.length > 0) {
    return db.reminder.findMany({
      where: {
        id: { in: dueIds },
        status: "PENDING",
      },
      include: { problem: true },
    });
  }

  // Fallback: Query database directly
  return db.reminder.findMany({
    where: {
      userId,
      status: "PENDING",
      dueDate: { lte: new Date() },
    },
    include: { problem: true },
  });
}

/**
 * Mark a single reminder interval complete
 */
export async function markReminderComplete(reminderId: string): Promise<any> {
  const reminder = await db.reminder.findUnique({
    where: { id: reminderId },
    include: { problem: true },
  });
  if (!reminder) throw new Error("Reminder not found");

  const updated = await db.reminder.update({
    where: { id: reminderId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  // Remove from Redis queue
  await dequeueSRS(reminder.userId, reminderId);

  // Invalidate notification counter or create notification for loop/next
  // Let's create a notification
  const message = `Spaced Repetition: stage "${reminder.stage}" completed for problem "${reminder.problem.name}".`;
  
  // Deduplication logic (Section 9.3): check if similar notif exists today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const existingNotif = await db.notification.findFirst({
    where: {
      userId: reminder.userId,
      relatedId: reminder.problemId,
      type: "srs_due",
      createdAt: { gte: todayStart },
    },
  });

  if (!existingNotif) {
    await db.notification.create({
      data: {
        userId: reminder.userId,
        type: "srs_due",
        message,
        relatedId: reminder.problemId,
      },
    });
  }

  // Update parent problem status to sync latest interval
  // Find next pending reminder for this problem/cycle
  const nextReminder = await db.reminder.findFirst({
    where: {
      problemId: reminder.problemId,
      userId: reminder.userId,
      cycle: reminder.cycle,
      status: "PENDING",
    },
    orderBy: { dueDate: "asc" },
  });

  if (nextReminder) {
    await db.problem.update({
      where: { id: reminder.problemId },
      data: {
        interval: nextReminder.stage,
      },
    });
  } else {
    // All reminders for this cycle are complete
    await db.problem.update({
      where: { id: reminder.problemId },
      data: {
        interval: "Cycle Completed",
      },
    });

    // Notify loop complete
    await db.notification.create({
      data: {
        userId: reminder.userId,
        type: "loop_complete",
        message: `Congratulations! You have completed the full SRS cycle for "${reminder.problem.name}".`,
        relatedId: reminder.problemId,
      },
    });
  }

  return updated;
}

/**
 * Request a new revisit cycle post-30d completion
 */
export async function startRevisitCycle(problemId: string, userId: string): Promise<any> {
  // Guard: Verify last 30d interval of cycle is completed
  const lastReminder = await db.reminder.findFirst({
    where: {
      problemId,
      userId,
      stage: "Recall Stage 30d",
      status: "COMPLETED",
    },
    orderBy: { cycle: "desc" },
  });

  if (!lastReminder) {
    throw new Error("Cannot request revisit: The primary 30-day review is not completed yet.");
  }

  // Determine new cycle number
  const nextCycle = lastReminder.cycle + 1;

  // Create revisit cycle record
  const revisitCycle = await db.srsRevisitCycle.create({
    data: {
      problemId,
      userId,
      cycleNumber: nextCycle,
      status: "active",
      startedAt: new Date(),
    },
  });

  // Create reminders for next cycle
  const solvedAt = new Date();
  const remindersData = SRS_INTERVALS.map((days) => {
    const dueDate = computeDueDate(solvedAt, days);
    return {
      problemId,
      userId,
      dueDate,
      stage: `Revisit ${nextCycle} - Stage ${days}d`,
      cycle: nextCycle,
      status: "PENDING",
    };
  });

  await db.reminder.createMany({ data: remindersData });

  const createdReminders = await db.reminder.findMany({
    where: { problemId, userId, cycle: nextCycle, status: "PENDING" },
    select: { id: true, dueDate: true },
  });

  await Promise.allSettled(
    createdReminders.map((r) => {
      const score = Math.floor(r.dueDate.getTime() / 1000);
      return enqueueSRS(userId, r.id, score);
    })
  );

  // Update problem interval
  await db.problem.update({
    where: { id: problemId },
    data: {
      interval: `Revisit ${nextCycle} - Stage 3d`,
      revisitRequestedAt: new Date(),
    },
  });

  return revisitCycle;
}

/**
 * Pause active revisit cycle
 */
export async function pauseRevisitCycle(problemId: string, userId: string, reason?: string): Promise<any> {
  const activeCycle = await db.srsRevisitCycle.findFirst({
    where: { problemId, userId, status: "active" },
  });
  if (!activeCycle) throw new Error("No active revisit cycle found for this problem");

  const updatedCycle = await db.srsRevisitCycle.update({
    where: { id: activeCycle.id },
    data: {
      status: "paused",
      pausedAt: new Date(),
      pauseReason: reason,
    },
  });

  // Remove pending cycle reminders from Redis ZSET
  const pendingReminders = await db.reminder.findMany({
    where: {
      problemId,
      userId,
      cycle: activeCycle.cycleNumber,
      status: "PENDING",
    },
    select: { id: true },
  });

  await Promise.allSettled(pendingReminders.map((r) => dequeueSRS(userId, r.id)));

  return updatedCycle;
}

/**
 * Resume a paused revisit cycle
 */
export async function resumeRevisitCycle(problemId: string, userId: string): Promise<any> {
  const pausedCycle = await db.srsRevisitCycle.findFirst({
    where: { problemId, userId, status: "paused" },
  });
  if (!pausedCycle) throw new Error("No paused revisit cycle found for this problem");

  const updatedCycle = await db.srsRevisitCycle.update({
    where: { id: pausedCycle.id },
    data: {
      status: "active",
      pausedAt: null,
    },
  });

  // Re-enqueue remaining reminders
  const pendingReminders = await db.reminder.findMany({
    where: {
      problemId,
      userId,
      cycle: pausedCycle.cycleNumber,
      status: "PENDING",
    },
  });

  const now = new Date();
  await Promise.allSettled(
    pendingReminders.map(async (reminder) => {
      let dueDate = reminder.dueDate;
      if (dueDate.getTime() < now.getTime()) {
        dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        await db.reminder.update({
          where: { id: reminder.id },
          data: { dueDate },
        });
      }
      const score = Math.floor(dueDate.getTime() / 1000);
      return enqueueSRS(userId, reminder.id, score);
    })
  );

  return updatedCycle;
}

/**
 * End/Archive active revisit cycle
 */
export async function endRevisitCycle(problemId: string, userId: string): Promise<any> {
  const activeCycle = await db.srsRevisitCycle.findFirst({
    where: {
      problemId,
      userId,
      status: { in: ["active", "paused"] },
    },
  });
  if (!activeCycle) throw new Error("No active/paused revisit cycle found for this problem");

  const endedCycle = await db.srsRevisitCycle.update({
    where: { id: activeCycle.id },
    data: {
      status: "ended",
      endedAt: new Date(),
    },
  });

  // Mark pending reminders as SKIPPED & remove from Redis
  const pendingReminders = await db.reminder.findMany({
    where: {
      problemId,
      userId,
      cycle: activeCycle.cycleNumber,
      status: "PENDING",
    },
    select: { id: true },
  });

  await db.reminder.updateMany({
    where: {
      id: { in: pendingReminders.map((r) => r.id) },
    },
    data: { status: "SKIPPED" },
  });

  await Promise.allSettled(pendingReminders.map((r) => dequeueSRS(userId, r.id)));

  // Reset problem interval
  await db.problem.update({
    where: { id: problemId },
    data: {
      interval: "Revisit Ended",
    },
  });

  return endedCycle;
}
