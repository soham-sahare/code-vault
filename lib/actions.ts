"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Ensure user is logged in and retrieve their user ID
async function requireAuth() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

// Helper to dynamically check and persist due/overdue status based on spaced repetition intervals
async function checkAndSyncStatus(p: any) {
  if (p.status !== "Solved") return p;

  let days = 0;
  if (p.interval.includes("3d")) days = 3;
  else if (p.interval.includes("7d")) days = 7;
  else if (p.interval.includes("15d")) days = 15;
  else if (p.interval.includes("30d")) days = 30;

  if (days === 0) return p;

  const updatedDate = new Date(p.updatedAt);
  const dueDate = new Date(updatedDate.getTime() + days * 24 * 60 * 60 * 1000);
  const now = new Date();

  const getISTDayString = (d: Date) => {
    const istTime = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
    return istTime.toISOString().split('T')[0];
  };

  const todayStr = getISTDayString(now);
  const dueStr = getISTDayString(dueDate);

  let newStatus = p.status;
  let newStatusColor = p.statusColor;

  if (todayStr > dueStr) {
    newStatus = "Overdue";
    newStatusColor = "text-rose-500 bg-rose-500/10 border-rose-500/20";
  } else if (todayStr === dueStr) {
    newStatus = "Due Today";
    newStatusColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
  }

  if (newStatus !== p.status) {
    await db.problem.update({
      where: { id: p.id },
      data: {
        status: newStatus,
        statusColor: newStatusColor,
      }
    });
    p.status = newStatus;
    p.statusColor = newStatusColor;
  }

  return p;
}

// 1. PROBLEMS MUTATIONS
export async function getProblems() {
  const userId = await requireAuth();
  const problems = await db.problem.findMany({
    where: { userId },
    include: {
      solutions: {
        include: { notes: true }
      },
      notes: true,
      reminders: true,
    },
    orderBy: { createdAt: "desc" },
  });

  for (let i = 0; i < problems.length; i++) {
    problems[i] = await checkAndSyncStatus(problems[i]);
  }

  return problems;
}

export async function createProblem(data: {
  name: string;
  difficulty: string;
  topic: string;
  url?: string;
  isPublic?: boolean;
}) {
  const userId = await requireAuth();

  const diffColor =
    data.difficulty === "EASY"
      ? "text-emerald-500 bg-emerald-500/10"
      : data.difficulty === "MED"
        ? "text-amber-500 bg-amber-500/10"
        : "text-rose-500 bg-rose-500/10";

  // Sequential generation of LeetCode numbers
  const maxProb = await db.problem.findFirst({
    where: { userId },
    orderBy: { num: "desc" }
  });
  const finalNum = maxProb ? maxProb.num + 1 : 1;

  const problem = await db.problem.create({
    data: {
      userId,
      num: finalNum,
      name: data.name,
      difficulty: data.difficulty,
      diffColor,
      topic: data.topic,
      url: data.url || "#",
      status: "Unsolved",
      statusColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
      interval: "Recall Stage 1",
      isPublic: !!data.isPublic,
    },
  });

  revalidatePath("/dashboard");
  return problem;
}

export async function updateProblem(num: number, data: {
  name: string;
  difficulty: string;
  topic: string;
  url?: string;
  isPublic?: boolean;
}) {
  const userId = await requireAuth();

  const diffColor =
    data.difficulty === "EASY"
      ? "text-emerald-500 bg-emerald-500/10"
      : data.difficulty === "MED"
        ? "text-amber-500 bg-amber-500/10"
        : "text-rose-500 bg-rose-500/10";

  const existing = await db.problem.findFirst({
    where: { num, userId }
  });
  if (!existing) throw new Error("Problem not found");

  const problem = await db.problem.update({
    where: { id: existing.id },
    data: {
      name: data.name,
      difficulty: data.difficulty,
      diffColor,
      topic: data.topic,
      url: data.url || "#",
      isPublic: !!data.isPublic,
    },
  });

  revalidatePath("/dashboard");
  return problem;
}

export async function deleteProblem(num: number) {
  const userId = await requireAuth();
  
  const existing = await db.problem.findFirst({
    where: { num, userId }
  });
  if (!existing) throw new Error("Problem not found");

  await db.problem.delete({
    where: { id: existing.id }
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleFavorite(num: number) {
  const userId = await requireAuth();

  const existing = await db.problem.findFirst({
    where: { num, userId }
  });
  if (!existing) throw new Error("Problem not found");

  const problem = await db.problem.update({
    where: { id: existing.id },
    data: { isFavorite: !existing.isFavorite },
  });

  revalidatePath("/dashboard");
  return problem;
}

// 2. SOLUTIONS MUTATIONS
export async function addSolution(problemId: string, data: {
  name: string;
  lang: string;
  intuition: string;
  approach: string;
  code: string;
  time: string;
  space: string;
  tags?: string[];
  notes?: { type: string; text: string }[];
}) {
  await requireAuth();

  const solution = await db.solution.create({
    data: {
      problemId,
      name: data.name,
      lang: data.lang,
      intuition: data.intuition,
      approach: data.approach,
      code: data.code,
      time: data.time,
      space: data.space,
      tags: data.tags || [],
      notes: {
        create: data.notes?.map((n) => ({
          type: n.type,
          text: n.text,
        })) || []
      }
    },
    include: { notes: true }
  });

  // Automatically advance parent problem status to Solved and set spaced interval
  await db.problem.update({
    where: { id: problemId },
    data: {
      status: "Solved",
      statusColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      interval: "Due in 3d",
    }
  });

  revalidatePath("/dashboard");
  return solution;
}

export async function deleteSolution(solutionId: string) {
  await requireAuth();

  await db.solution.delete({
    where: { id: solutionId }
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateSolution(solutionId: string, data: {
  name: string;
  lang: string;
  intuition: string;
  approach: string;
  code: string;
  time: string;
  space: string;
  tags?: string[];
}) {
  await requireAuth();

  const solution = await db.solution.update({
    where: { id: solutionId },
    data: {
      name: data.name,
      lang: data.lang,
      intuition: data.intuition,
      approach: data.approach,
      code: data.code,
      time: data.time,
      space: data.space,
      tags: data.tags || [],
    }
  });

  revalidatePath("/dashboard");
  return solution;
}

// 3. NOTES MUTATIONS
export async function addNote(problemId: string, text: string) {
  const userId = await requireAuth();

  const note = await db.note.create({
    data: {
      problemId,
      userId,
      text,
    }
  });

  revalidatePath("/dashboard");
  return note;
}

export async function updateNote(noteId: string, text: string) {
  await requireAuth();

  const note = await db.note.update({
    where: { id: noteId },
    data: { text }
  });

  revalidatePath("/dashboard");
  return note;
}

export async function deleteNote(noteId: string) {
  await requireAuth();

  await db.note.delete({
    where: { id: noteId }

  });

  revalidatePath("/dashboard");
  return { success: true };
}

// 4. SPACED REPETITION ENGINE ADVANCEMENT
export async function markRevisited(num: number) {
  const userId = await requireAuth();

  const existing = await db.problem.findFirst({
    where: { num, userId }
  });
  if (!existing) throw new Error("Problem not found");

  // Determine stage and set appropriate spacing interval values
  let nextInterval = "Due in 3d";
  if (existing.interval.includes("Stage 1") || existing.interval.includes("3d")) {
    nextInterval = "Due in 7d";
  } else if (existing.interval.includes("7d")) {
    nextInterval = "Due in 15d";
  } else if (existing.interval.includes("15d")) {
    nextInterval = "Due in 30d";
  } else if (existing.interval.includes("30d")) {
    nextInterval = "Due in 3d"; // Restart cycle
  }

  const problem = await db.problem.update({
    where: { id: existing.id },
    data: {
      status: "Solved",
      statusColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      interval: nextInterval,
    }
  });

  revalidatePath("/dashboard");
  return problem;
}

// 5. SETTINGS & ONBOARDING ACTIONS
export async function saveOnboarding(lang: string) {
  const userId = await requireAuth();
  const user = await db.user.update({
    where: { id: userId },
    data: {
      hasCompletedOnboarding: true,
      defaultLanguage: lang,
    }
  });
  return user;
}

export async function getUserProfile() {
  const userId = await requireAuth();
  return db.user.findUnique({
    where: { id: userId }
  });
}

export async function updateUserProfile(data: {
  name?: string;
  username?: string;
  defaultLanguage?: string;
  isPublicProfile?: boolean;
  theme?: string;
}) {
  const userId = await requireAuth();
  const user = await db.user.update({
    where: { id: userId },
    data
  });
  return user;
}

// 6. SHEETS PLAYLIST ACTIONS
export async function getSheets() {
  const userId = await requireAuth();
  return db.sheet.findMany({
    where: { userId },
    include: {
      problems: {
        include: { problem: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function createSheet(name: string, description?: string, isPublic?: boolean) {
  const userId = await requireAuth();
  const shareSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "_" + Math.floor(Math.random() * 1000);
  const sheet = await db.sheet.create({
    data: {
      userId,
      name,
      description,
      isPublic: !!isPublic,
      shareSlug,
    }
  });
  revalidatePath("/sheets");
  return sheet;
}

export async function deleteSheet(id: string) {
  const userId = await requireAuth();
  await db.sheet.deleteMany({
    where: { id, userId }
  });
  revalidatePath("/sheets");
  return { success: true };
}

export async function updateSheet(id: string, name: string, description?: string, isPublic?: boolean) {
  const userId = await requireAuth();
  const existing = await db.sheet.findFirst({
    where: { id, userId }
  });
  if (!existing) throw new Error("Sheet not found");

  const shareSlug = existing.shareSlug || (name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "_" + Math.floor(Math.random() * 1000));

  const sheet = await db.sheet.update({
    where: { id },
    data: {
      name,
      description,
      isPublic: !!isPublic,
      shareSlug: isPublic ? shareSlug : null,
    }
  });

  revalidatePath("/sheets");
  return sheet;
}

export async function addProblemToSheet(sheetId: string, problemId: string) {
  const userId = await requireAuth();
  
  // Verify sheet belongs to user
  const sheet = await db.sheet.findFirst({
    where: { id: sheetId, userId }
  });
  if (!sheet) throw new Error("Sheet not found");

  // Get max order
  const lastProblem = await db.sheetProblem.findFirst({
    where: { sheetId },
    orderBy: { order: "desc" }
  });
  const nextOrder = lastProblem ? lastProblem.order + 1 : 0;

  const res = await db.sheetProblem.upsert({
    where: {
      sheetId_problemId: { sheetId, problemId }
    },
    create: {
      sheetId,
      problemId,
      order: nextOrder
    },
    update: {}
  });

  revalidatePath("/sheets");
  return res;
}

export async function removeProblemFromSheet(sheetId: string, problemId: string) {
  const userId = await requireAuth();
  
  // Verify sheet belongs to user
  const sheet = await db.sheet.findFirst({
    where: { id: sheetId, userId }
  });
  if (!sheet) throw new Error("Sheet not found");

  await db.sheetProblem.delete({
    where: {
      sheetId_problemId: { sheetId, problemId }
    }
  });

  revalidatePath("/sheets");
  return { success: true };
}

export async function getPublicSheetBySlug(slug: string) {
  return db.sheet.findFirst({
    where: {
      shareSlug: slug,
      isPublic: true,
    },
    include: {
      problems: {
        include: { problem: true }
      }
    }
  });
}

export async function getPublicProfileByUsername(username: string) {
  return db.user.findFirst({
    where: {
      username,
      isPublicProfile: true,
    },
    select: {
      id: true,
      username: true,
      name: true,
      createdAt: true,
      problems: {
        where: { isPublic: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });
}

export async function addSolutionNote(solutionId: string, type: string, text: string) {
  await requireAuth();

  const note = await db.solutionNote.create({
    data: {
      solutionId,
      type,
      text,
    }
  });

  revalidatePath("/dashboard");
  return note;
}

export async function updateSolutionNote(noteId: string, text: string) {
  await requireAuth();

  const note = await db.solutionNote.update({
    where: { id: noteId },
    data: { text }
  });

  revalidatePath("/dashboard");
  return note;
}

export async function deleteSolutionNote(noteId: string) {
  await requireAuth();

  await db.solutionNote.delete({
    where: { id: noteId }
  });

  revalidatePath("/dashboard");
  return { success: true };
}




