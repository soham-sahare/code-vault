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

// 1. PROBLEMS MUTATIONS
export async function getProblems() {
  const userId = await requireAuth();
  return db.problem.findMany({
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
      status: "Due Today",
      statusColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
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
