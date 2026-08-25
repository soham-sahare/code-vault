"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { initSchedule, startRevisitCycle, pauseRevisitCycle, resumeRevisitCycle, endRevisitCycle } from "@/lib/srs/scheduler";
import { formatIST, formatISTDate } from "@/lib/timestamps/ist";
import {
  getCachedNotifCount,
  setCachedNotifCount,
  invalidateNotifCount,
  getCachedAnalytics,
  setCachedAnalytics,
  invalidateAnalyticsCache,
  getCachedPublicSheet,
  setCachedPublicSheet,
  invalidatePublicSheetCache,
  getCachedPublicProblem,
  setCachedPublicProblem,
  invalidatePublicProblemCache,
  getCachedTags,
  setCachedTags,
  invalidateTagsCache,
  invalidateUserCaches,
} from "@/lib/redis/cache";
import { dequeueSRS } from "@/lib/redis/srs-queue";
import { requireAuth } from "@/lib/auth-helper";
import { detectSourcePlatform } from "@/lib/utils/formatters";

// Scraper logic: detect platform from URL and fetch metadata if possible
export async function scrapeProblemMetadata(url: string) {
  const sourcePlatform = detectSourcePlatform(url);
  let name = "";
  let difficulty = "MED";
  let topic = "";

  if (!url) return { sourcePlatform, name, difficulty, topic };

  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("leetcode.com")) {
    // Parse slug from URL for display name guess
    const match = url.match(/\/problems\/([^/]+)/);
    if (match && match[1]) {
      name = match[1]
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  } else if (lowerUrl.includes("codeforces.com")) {
    const match = url.match(/\/problemset\/problem\/([^/]+)\/([^/]+)/) || url.match(/\/contest\/([^/]+)\/problem\/([^/]+)/);
    if (match) {
      name = `Codeforces ${match[1]} - ${match[2]}`;
    }
  }

  // Perform a silent server-side fetch with timeout to get the page title
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const html = await res.text();
      const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        let title = titleMatch[1].trim();
        // Clean Leetcode titles
        title = title.replace(/\s*-\s*LeetCode.*/i, "");
        title = title.replace(/\s*-\s*GeeksforGeeks.*/i, "");
        if (title) {
          name = title;
        }
      }
    }
  } catch (e) {
    console.warn("Silent metadata scrape failed or timed out:", e);
  }

  return { sourcePlatform, name, difficulty, topic };
}

// 1. PROBLEMS MUTATIONS WITH COMPANIES AND PATTERNS
export async function getProblems(filters?: {
  q?: string;
  difficulty?: string;
  tag?: string;
  company?: string;
  pattern?: string;
  status?: string;
  cursor?: string;
  limit?: number;
}) {
  const userId = await requireAuth();
  const limit = filters?.limit || 20;

  // Construct filters
  const where: any = { userId };

  if (filters?.q) {
    where.name = { contains: filters.q, mode: "insensitive" };
  }
  if (filters?.difficulty && filters.difficulty !== "ALL") {
    where.difficulty = filters.difficulty;
  }
  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }
  if (filters?.tag && filters.tag !== "ALL") {
    where.topic = { contains: filters.tag, mode: "insensitive" };
  }
  if (filters?.company) {
    where.companies = {
      some: {
        company: {
          slug: filters.company,
        },
      },
    };
  }
  if (filters?.pattern) {
    where.patterns = {
      some: {
        pattern: {
          slug: filters.pattern,
        },
      },
    };
  }

  // Cursor handling
  if (filters?.cursor) {
    try {
      const cursorObj = JSON.parse(Buffer.from(filters.cursor, "base64url").toString("utf-8"));
      where.createdAt = { lte: new Date(cursorObj.createdAt) };
      where.id = { not: cursorObj.id }; // to prevent repeating the exact node
    } catch (e) {
      console.error("Invalid cursor format ignored");
    }
  }

  const problems = await db.problem.findMany({
    where,
    include: {
      solutions: {
        select: {
          id: true,
          name: true,
          lang: true,
          time: true,
          space: true,
          tags: true,
          createdAt: true,
          updatedAt: true
        }
      },
      companies: {
        include: { company: true }
      },
      patterns: {
        include: { pattern: true }
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  const hasNextPage = problems.length > limit;
  const items = hasNextPage ? problems.slice(0, limit) : problems;

  let nextCursor: string | undefined = undefined;
  if (hasNextPage && items.length > 0) {
    const lastItem = items[items.length - 1];
    nextCursor = Buffer.from(
      JSON.stringify({ createdAt: lastItem.createdAt, id: lastItem.id })
    ).toString("base64url");
  }

  // Format dates in return
  const formattedItems = items.map((p) => ({
    ...p,
    createdAtFormatted: formatIST(p.createdAt),
    updatedAtFormatted: formatIST(p.updatedAt),
    solvedAtFormatted: p.solvedAt ? formatIST(p.solvedAt) : null,
  }));

  const result: any = formattedItems;
  result.nextCursor = nextCursor;
  return result;
}

export async function getPaginatedProblems(filters?: {
  q?: string;
  difficulty?: string;
  tag?: string;
  company?: string;
  pattern?: string;
  status?: string;
  limit?: number;
  page?: number;
}) {
  const userId = await requireAuth();
  const limit = filters?.limit || 20;
  const page = filters?.page || 1;
  const skip = (page - 1) * limit;

  // Construct filters
  const where: any = { userId };

  if (filters?.q) {
    where.name = { contains: filters.q, mode: "insensitive" };
  }
  if (filters?.difficulty && filters.difficulty !== "ALL") {
    where.difficulty = filters.difficulty;
  }
  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }
  if (filters?.tag && filters.tag !== "ALL") {
    where.topic = { contains: filters.tag, mode: "insensitive" };
  }
  if (filters?.company) {
    where.companies = {
      some: {
        company: {
          slug: filters.company,
        },
      },
    };
  }
  if (filters?.pattern) {
    where.patterns = {
      some: {
        pattern: {
          slug: filters.pattern,
        },
      },
    };
  }

  // Parallel database execution via Promise.all
  const [problems, totalCount] = await Promise.all([
    db.problem.findMany({
      where,
      include: {
        solutions: {
          select: {
            id: true,
            name: true,
            lang: true,
            time: true,
            space: true,
            tags: true,
            createdAt: true,
            updatedAt: true
          }
        },
        companies: {
          include: { company: true }
        },
        patterns: {
          include: { pattern: true }
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: limit,
    }),
    db.problem.count({ where })
  ]);

  const formattedItems = problems.map((p) => ({
    ...p,
    createdAtFormatted: formatIST(p.createdAt),
    updatedAtFormatted: formatIST(p.updatedAt),
    solvedAtFormatted: p.solvedAt ? formatIST(p.solvedAt) : null,
  }));

  return {
    items: formattedItems,
    totalCount,
  };
}

export async function getProblemDetails(id: string) {
  const userId = await requireAuth();
  const problem = await db.problem.findFirst({
    where: { id, userId },
    include: {
      solutions: {
        include: { notes: true }
      },
      notes: true,
      reminders: true,
      companies: {
        include: { company: true }
      },
      patterns: {
        include: { pattern: true }
      },
      revisitCycles: true,
    }
  });
  if (!problem) throw new Error("Problem not found");
  return {
    ...problem,
    createdAtFormatted: formatIST(problem.createdAt),
    updatedAtFormatted: formatIST(problem.updatedAt),
    solvedAtFormatted: problem.solvedAt ? formatIST(problem.solvedAt) : null,
  };
}

/**
 * Fast lightweight problem list for sheet problem pickers & modals (zero relation over-fetch).
 */
export async function getUserProblemSummaries() {
  const userId = await requireAuth();
  return db.problem.findMany({
    where: { userId },
    select: {
      id: true,
      num: true,
      name: true,
      topic: true,
      difficulty: true,
      diffColor: true,
      status: true,
      statusColor: true,
      interval: true,
      solvedAt: true,
      createdAt: true,
      isPublic: true,
      solutions: {
        select: {
          id: true,
          lang: true,
          time: true,
          space: true,
        },
      },
      reminders: {
        where: { status: "PENDING" },
        orderBy: { dueDate: "asc" },
        take: 1,
        select: {
          id: true,
          dueDate: true,
          stage: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

export async function createProblem(data: {
  name: string;
  difficulty: string;
  topic: string;
  url?: string;
  isPublic?: boolean;
  companyIds?: string[];
  patternIds?: string[];
}) {
  const userId = await requireAuth();

  const diffColor =
    data.difficulty === "EASY"
      ? "text-emerald-500 bg-emerald-500/10"
      : data.difficulty === "MED"
        ? "text-amber-500 bg-amber-500/10"
        : "text-rose-500 bg-rose-500/10";

  // Sequential generation of problem numbers for user
  const maxProb = await db.problem.findFirst({
    where: { userId },
    orderBy: { num: "desc" },
    select: { num: true },
  });
  const finalNum = maxProb ? maxProb.num + 1 : 1;

  // Fast local platform detection (0ms, no network blocking)
  const sourcePlatform = detectSourcePlatform(data.url || "");

  const problem = await db.problem.create({
    data: {
      userId,
      num: finalNum,
      name: data.name,
      difficulty: data.difficulty,
      diffColor,
      topic: data.topic.toLowerCase().trim(),
      url: data.url || "#",
      sourcePlatform,
      status: "Unsolved",
      statusColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
      interval: "Recall Stage 1",
      isPublic: !!data.isPublic,
      companies: {
        create: data.companyIds?.map((cid) => ({ companyId: cid })) || []
      },
      patterns: {
        create: data.patternIds?.map((pid) => ({ patternId: pid })) || []
      }
    },
  });

  // Parallel non-blocking cache invalidation
  await Promise.allSettled([
    db.analyticsCache.deleteMany({ where: { userId } }),
    invalidateAnalyticsCache(userId),
    invalidateTagsCache(userId),
  ]);

  revalidatePath("/dashboard");
  return problem;
}

export async function updateProblem(id: string, data: {
  name: string;
  difficulty: string;
  topic: string;
  url?: string;
  isPublic?: boolean;
  companyIds?: string[];
  patternIds?: string[];
}) {
  const userId = await requireAuth();

  const diffColor =
    data.difficulty === "EASY"
      ? "text-emerald-500 bg-emerald-500/10"
      : data.difficulty === "MED"
        ? "text-amber-500 bg-amber-500/10"
        : "text-rose-500 bg-rose-500/10";

  const existing = await db.problem.findFirst({
    where: { id, userId }
  });
  if (!existing) throw new Error("Problem not found");

  // Fast local platform detection (0ms)
  let sourcePlatform = existing.sourcePlatform;
  if (data.url && data.url !== existing.url) {
    sourcePlatform = detectSourcePlatform(data.url);
  }

  // Update in a transaction to handle junctions
  const problem = await db.$transaction(async (tx) => {
    // Delete existing junctions
    await tx.problemCompany.deleteMany({ where: { problemId: id } });
    await tx.problemPattern.deleteMany({ where: { problemId: id } });

    // Sync note public flags if problem public visibility changes
    if (data.isPublic !== existing.isPublic) {
      await tx.note.updateMany({
        where: { problemId: id },
        data: { isShared: !!data.isPublic },
      });
      await tx.solutionNote.updateMany({
        where: { solution: { problemId: id } },
        data: { isShared: !!data.isPublic },
      });
    }

    return tx.problem.update({
      where: { id },
      data: {
        name: data.name,
        difficulty: data.difficulty,
        diffColor,
        topic: data.topic.toLowerCase().trim(),
        url: data.url || "#",
        sourcePlatform,
        isPublic: !!data.isPublic,
        companies: {
          create: data.companyIds?.map((cid) => ({ companyId: cid })) || []
        },
        patterns: {
          create: data.patternIds?.map((pid) => ({ patternId: pid })) || []
        }
      },
    });
  });

  // Invalidate caches in parallel
  await Promise.allSettled([
    db.analyticsCache.deleteMany({ where: { userId } }),
    invalidateAnalyticsCache(userId),
    invalidateTagsCache(userId),
    existing.isPublic ? invalidatePublicProblemCache(existing.id) : Promise.resolve(),
  ]);

  revalidatePath("/dashboard");
  return problem;
}

export async function deleteProblem(id: string) {
  const userId = await requireAuth();
  
  const existing = await db.problem.findFirst({
    where: { id, userId }
  });
  if (!existing) throw new Error("Problem not found");

  // Fetch pending reminders to clean from Redis
  const pendingReminders = await db.reminder.findMany({
    where: { problemId: id, userId, status: "PENDING" },
    select: { id: true },
  });

  await db.problem.delete({
    where: { id }
  });

  // Parallel Redis & DB cache cleanup
  await Promise.allSettled([
    ...pendingReminders.map((r) => dequeueSRS(userId, r.id)),
    db.analyticsCache.deleteMany({ where: { userId } }),
    invalidateAnalyticsCache(userId),
    invalidateTagsCache(userId),
    existing.isPublic ? invalidatePublicProblemCache(id) : Promise.resolve(),
  ]);

  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleFavorite(id: string) {
  const userId = await requireAuth();

  const existing = await db.problem.findFirst({
    where: { id, userId },
    select: { id: true, isFavorite: true },
  });
  if (!existing) throw new Error("Problem not found");

  const problem = await db.problem.update({
    where: { id },
    data: { isFavorite: !existing.isFavorite },
  });

  revalidatePath("/dashboard");
  return problem;
}

// 2. SOLUTIONS MUTATIONS WITH TRANSACTION-BASED SRS INITIATION
export async function addSolution(problemId: string, data: {
  name: string;
  lang: string;
  intuition: string;
  approach: string;
  code: string;
  time: string;
  space: string;
  tags?: string[];
  notes?: any[];
}) {
  const userId = await requireAuth();

  const solution = await db.$transaction(async (tx) => {
    // Create solution
    const sol = await tx.solution.create({
      data: {
        problemId,
        userId,
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

    // Update parent problem status to Solved
    await tx.problem.update({
      where: { id: problemId },
      data: {
        status: "Solved",
        statusColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        solvedAt: new Date(),
        interval: "Recall Stage 3d",
      }
    });

    return sol;
  });

  // Init schedule reminders in background/concurrently
  await initSchedule(problemId, userId);

  // Invalidate user analytics & tags cache in parallel
  await Promise.allSettled([
    db.analyticsCache.deleteMany({ where: { userId } }),
    invalidateAnalyticsCache(userId),
    invalidateTagsCache(userId),
  ]);

  revalidatePath("/dashboard");
  return solution;
}

export async function deleteSolution(solutionId: string) {
  const userId = await requireAuth();

  const solution = await db.solution.findUnique({
    where: { id: solutionId }
  });
  if (!solution) throw new Error("Solution not found");

  await db.solution.delete({
    where: { id: solutionId }
  });

  // Re-calculate problem solved status if no solutions remain
  const remaining = await db.solution.count({
    where: { problemId: solution.problemId }
  });

  if (remaining === 0) {
    await db.problem.update({
      where: { id: solution.problemId },
      data: {
        status: "Unsolved",
        statusColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        solvedAt: null,
        interval: "Recall Stage 1",
      }
    });
  }

  // Invalidate user analytics & tags cache in parallel
  await Promise.allSettled([
    db.analyticsCache.deleteMany({ where: { userId } }),
    invalidateAnalyticsCache(userId),
    invalidateTagsCache(userId),
  ]);

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
  const userId = await requireAuth();

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

  // Invalidate tags cache in case tags updated
  await invalidateTagsCache(userId);

  revalidatePath("/dashboard");
  return solution;
}

// 3. ENHANCED NOTES MUTATIONS (PROBLEM & SOLUTION LEVEL)
export async function addNote(
  problemIdOrData: string | { problemId?: string; solutionId?: string; type: string; text: string; isShared?: boolean },
  text?: string
) {
  const userId = await requireAuth();

  if (typeof problemIdOrData === "string") {
    const note = await db.note.create({
      data: {
        problemId: problemIdOrData,
        userId,
        text: text || "",
        type: "note",
        isShared: false,
      }
    });
    revalidatePath("/dashboard");
    return note;
  }

  const data = problemIdOrData;
  if (!data.problemId && !data.solutionId) {
    throw new Error("Note must belong to a problem or a solution");
  }

  if (data.problemId && data.solutionId) {
    throw new Error("Note cannot belong to both problem and solution");
  }

  // Set shared flag based on parent problem visibility if shared is enabled
  let isShared = !!data.isShared;
  if (data.problemId) {
    const parent = await db.problem.findUnique({ where: { id: data.problemId } });
    if (parent && !parent.isPublic) isShared = false;
  } else if (data.solutionId) {
    const sol = await db.solution.findUnique({
      where: { id: data.solutionId },
      include: { problem: true }
    });
    if (sol && !sol.problem.isPublic) isShared = false;
  }

  if (data.problemId) {
    const note = await db.note.create({
      data: {
        problemId: data.problemId,
        userId,
        type: data.type,
        text: data.text,
        isShared,
      }
    });
    revalidatePath("/dashboard");
    return note;
  } else {
    const solutionNote = await db.solutionNote.create({
      data: {
        solutionId: data.solutionId!,
        type: data.type,
        text: data.text,
        isShared,
      }
    });
    revalidatePath("/dashboard");
    return solutionNote;
  }
}

export async function updateNote(
  noteId: string,
  textOrIsSolutionNote: string | boolean,
  data?: { text?: string; type?: string; isShared?: boolean }
) {
  await requireAuth();

  if (typeof textOrIsSolutionNote === "string") {
    const note = await db.note.update({
      where: { id: noteId },
      data: { text: textOrIsSolutionNote }
    });
    revalidatePath("/dashboard");
    return note;
  }

  const isSolutionNote = textOrIsSolutionNote;
  if (isSolutionNote) {
    const note = await db.solutionNote.update({
      where: { id: noteId },
      data: {
        text: data?.text,
        type: data?.type,
        isShared: data?.isShared,
      }
    });
    revalidatePath("/dashboard");
    return note;
  } else {
    const note = await db.note.update({
      where: { id: noteId },
      data: {
        text: data?.text,
        type: data?.type,
        isShared: data?.isShared,
      }
    });
    revalidatePath("/dashboard");
    return note;
  }
}

export async function deleteNote(noteId: string, isSolutionNote?: boolean) {
  await requireAuth();

  if (isSolutionNote === true) {
    await db.solutionNote.delete({ where: { id: noteId } });
  } else if (isSolutionNote === false) {
    await db.note.delete({ where: { id: noteId } });
  } else {
    // If not specified, try both (compatibility fallback)
    try {
      await db.note.delete({ where: { id: noteId } });
    } catch (e) {
      await db.solutionNote.delete({ where: { id: noteId } });
    }
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// COMPATIBILITY NOTES MUTATIONS
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

export async function addSolutionNote(solutionId: string, type: string, text: string) {
  await requireAuth();
  const note = await db.solutionNote.create({
    data: {
      solutionId,
      type,
      text,
      isShared: false,
    }
  });
  revalidatePath("/dashboard");
  return note;
}

// 4. REVISIT CYCLE MUTATIONS
export async function markRevisited(id: string, customDays?: number) {
  const userId = await requireAuth();
  const existing = await db.problem.findFirst({
    where: { id, userId }
  });
  if (!existing) throw new Error("Problem not found");

  const reminder = await db.reminder.findFirst({
    where: { problemId: id, userId, status: "PENDING" },
    orderBy: { dueDate: "asc" }
  });

  if (reminder) {
    const { markReminderComplete } = await import("@/lib/srs/scheduler");
    await markReminderComplete(reminder.id);
  } else {
    let nextInterval = "Due in 3d";
    if (customDays !== undefined) {
      nextInterval = `Due in ${customDays}d`;
    } else if (existing.interval.includes("Stage 1") || existing.interval.includes("3d")) {
      nextInterval = "Due in 7d";
    } else if (existing.interval.includes("7d")) {
      nextInterval = "Due in 15d";
    } else if (existing.interval.includes("15d")) {
      nextInterval = "Due in 30d";
    } else if (existing.interval.includes("30d")) {
      nextInterval = "Due in 3d";
    }

    await db.problem.update({
      where: { id },
      data: {
        status: "Solved",
        statusColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        interval: nextInterval,
        solvedAt: new Date(),
      }
    });
  }

  // Parallel cache invalidation
  await Promise.allSettled([
    db.analyticsCache.deleteMany({ where: { userId } }),
    invalidateAnalyticsCache(userId),
    invalidateNotifCount(userId),
  ]);

  revalidatePath("/dashboard");
  return { success: true };
}

export async function requestRevisit(problemId: string) {
  const userId = await requireAuth();
  const res = await startRevisitCycle(problemId, userId);
  revalidatePath("/dashboard");
  return res;
}

export async function pauseRevisit(problemId: string, reason?: string) {
  const userId = await requireAuth();
  const res = await pauseRevisitCycle(problemId, userId, reason);
  revalidatePath("/dashboard");
  return res;
}

export async function resumeRevisit(problemId: string) {
  const userId = await requireAuth();
  const res = await resumeRevisitCycle(problemId, userId);
  revalidatePath("/dashboard");
  return res;
}

export async function endRevisit(problemId: string) {
  const userId = await requireAuth();
  const res = await endRevisitCycle(problemId, userId);
  revalidatePath("/dashboard");
  return res;
}

// 5. SHEETS ACTIONS (FORK & CURATED VALIDATIONS)
export async function getSheets() {
  const userId = await requireAuth();
  const userSheets = await db.sheet.findMany({
    where: { userId },
    include: {
      problems: {
        include: {
          problem: {
            include: {
              solutions: true,
              companies: { include: { company: true } },
              patterns: { include: { pattern: true } },
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Add global curated sheets that this user hasn't copied/created yet
  const curated = await db.sheet.findMany({
    where: { isCurated: true },
    include: {
      problems: {
        include: {
          problem: {
            include: {
              solutions: true,
              companies: { include: { company: true } },
              patterns: { include: { pattern: true } },
            }
          }
        }
      }
    }
  });

  const merged = [...userSheets];
  const seenSlugs = new Set(userSheets.map((s) => s.shareSlug).filter(Boolean));
  for (const c of curated) {
    if (!c.shareSlug || !seenSlugs.has(c.shareSlug)) {
      if (c.shareSlug) seenSlugs.add(c.shareSlug);
      merged.push(c);
    }
  }

  return merged;
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
      isCurated: false,
    }
  });
  revalidatePath("/sheets");
  return sheet;
}

export async function deleteSheet(id: string) {
  const userId = await requireAuth();
  
  // Curated sheet guard
  const existing = await db.sheet.findFirst({ where: { id } });
  if (existing?.isCurated) {
    throw new Error("Forbidden: Curated sheets cannot be deleted. You can only fork them.");
  }

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
  if (existing.isCurated) {
    throw new Error("Forbidden: Curated sheets cannot be modified. Please fork first.");
  }

  // Sharing Validation (all problems in the sheet must be public)
  if (isPublic) {
    const privateProblems = await db.sheetProblem.findMany({
      where: {
        sheetId: id,
        problem: { isPublic: false }
      },
      include: { problem: true }
    });

    if (privateProblems.length > 0) {
      const names = privateProblems.map((p) => p.problem.name).join(", ");
      throw new Error(`Cannot make sheet public: The following problems are private: [${names}]. Set them to public first.`);
    }
  }

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

export async function forkCuratedSheet(sheetId: string) {
  const userId = await requireAuth();

  const curatedSheet = await db.sheet.findUnique({
    where: { id: sheetId },
    include: { problems: true }
  });

  if (!curatedSheet || !curatedSheet.isCurated) {
    throw new Error("Only curated sheets can be forked");
  }

  // Create copy
  const shareSlug = curatedSheet.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "_forked_" + Math.floor(Math.random() * 1000);
  const forked = await db.sheet.create({
    data: {
      userId,
      name: `${curatedSheet.name} (My Copy)`,
      description: curatedSheet.description,
      isPublic: false,
      isCurated: false,
      shareSlug,
    }
  });

  // Copy problems links in a single batch query
  if (curatedSheet.problems.length > 0) {
    await db.sheetProblem.createMany({
      data: curatedSheet.problems.map((prob) => ({
        sheetId: forked.id,
        problemId: prob.problemId,
        order: prob.order,
      })),
    });
  }

  revalidatePath("/sheets");
  return forked;
}

// 6. ANALYTICS & CACHING SNAPS
export async function getAnalytics() {
  const userId = await requireAuth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Check Redis cache first (1h TTL per PLAN.md §12.3)
  const redisCache = await getCachedAnalytics(userId);
  if (redisCache) return redisCache;

  // 2. Check DB analytics_cache (< 1 hour old)
  const cache = await db.analyticsCache.findUnique({
    where: {
      userId_snapshotDate: {
        userId,
        snapshotDate: today,
      }
    }
  });

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Return DB cache if fresh (< 1 hour)
  if (cache && cache.cachedAt > oneHourAgo) {
    await setCachedAnalytics(userId, cache); // back-fill Redis
    return cache;
  }

  // Compile distributions and streaks in parallel via Promise.all
  const [problems, solutions] = await Promise.all([
    db.problem.findMany({
      where: { userId },
      include: {
        companies: { include: { company: true } },
        patterns: { include: { pattern: true } },
      }
    }),
    db.solution.findMany({
      where: { problem: { userId } }
    })
  ]);

  const solvedProblems = problems.filter((p) => p.status === "Solved");
  const problemsSolved = solvedProblems.length;

  // Compute Topic Distribution
  const topicDistribution: Record<string, number> = {};
  // Compute Difficulty Distribution
  const difficultyDistribution = { easy: 0, medium: 0, hard: 0 };
  // Compute Complexity Distribution
  const complexityDistribution = { time: {} as Record<string, number>, space: {} as Record<string, number> };
  // Compute Company Distribution
  const companyDistribution: Record<string, number> = {};
  // Compute Pattern Distribution
  const patternDistribution: Record<string, number> = {};

  for (const p of problems) {
    // topic
    const topic = p.topic || "unknown";
    topicDistribution[topic] = (topicDistribution[topic] || 0) + 1;

    // difficulty
    const diff = p.difficulty.toLowerCase();
    if (diff === "easy") difficultyDistribution.easy++;
    else if (diff === "med" || diff === "medium") difficultyDistribution.medium++;
    else if (diff === "hard") difficultyDistribution.hard++;

    // companies
    for (const c of p.companies) {
      const cname = c.company.name;
      companyDistribution[cname] = (companyDistribution[cname] || 0) + 1;
    }

    // patterns
    for (const pat of p.patterns) {
      const pname = pat.pattern.name;
      patternDistribution[pname] = (patternDistribution[pname] || 0) + 1;
    }
  }

  for (const s of solutions) {
    const t = s.time || "O(1)";
    const sp = s.space || "O(1)";
    complexityDistribution.time[t] = (complexityDistribution.time[t] || 0) + 1;
    complexityDistribution.space[sp] = (complexityDistribution.space[sp] || 0) + 1;
  }

  // Compute Streaks (based on solvedAt dates)
  let currentStreak = 0;
  let longestStreak = 0;

  const solvedDates = solvedProblems
    .map((p) => p.solvedAt)
    .filter(Boolean)
    .map((d) => d!.toISOString().split("T")[0]);

  const uniqueSolvedDates = Array.from(new Set(solvedDates)).sort((a, b) => b.localeCompare(a));

  if (uniqueSolvedDates.length > 0) {
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const lastSolvedDate = uniqueSolvedDates[0];
    const isStreakActive = lastSolvedDate === todayStr || lastSolvedDate === yesterdayStr;

    if (isStreakActive) {
      currentStreak = 1;
      let prevDate = new Date(lastSolvedDate);
      for (let i = 1; i < uniqueSolvedDates.length; i++) {
        const currentDate = new Date(uniqueSolvedDates[i]);
        const diffTime = Math.abs(prevDate.getTime() - currentDate.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
          prevDate = currentDate;
        } else {
          break; // Streak broken
        }
      }
    } else {
      currentStreak = 0;
    }

    // Longest streak calculation
    longestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    const ascSolvedDates = [...uniqueSolvedDates].reverse();
    for (const dStr of ascSolvedDates) {
      const currentDate = new Date(dStr);
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          if (tempStreak > longestStreak) longestStreak = tempStreak;
          tempStreak = 1;
        }
      }
      prevDate = currentDate;
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;
  }

  // Save / Update Cache in DB
  const savedCache = await db.analyticsCache.upsert({
    where: {
      userId_snapshotDate: {
        userId,
        snapshotDate: today,
      }
    },
    update: {
      problemsSolved,
      currentStreak,
      longestStreak,
      topicDistribution,
      difficultyDistribution,
      complexityDistribution,
      companyDistribution,
      patternDistribution,
      cachedAt: new Date(),
    },
    create: {
      userId,
      snapshotDate: today,
      problemsSolved,
      currentStreak,
      longestStreak,
      topicDistribution,
      difficultyDistribution,
      complexityDistribution,
      companyDistribution,
      patternDistribution,
      cachedAt: new Date(),
    }
  });

  // Back-fill Redis cache (1h TTL per PLAN.md §12.3)
  await setCachedAnalytics(userId, savedCache);

  return savedCache;
}

// 7. PUBLIC PAGES QUERIES
export async function getPublicSheetBySlug(slug: string) {
  // 1. Check Redis cache first (24h TTL per PLAN.md §12.3 §8.7)
  const cached = await getCachedPublicSheet(slug);
  if (cached) return cached;

  // 2. Fetch from DB
  const sheet = await db.sheet.findFirst({
    where: {
      shareSlug: slug,
      isPublic: true,
    },
    include: {
      problems: {
        include: {
          problem: {
            include: {
              solutions: {
                include: {
                  notes: { where: { isShared: true } }
                }
              },
              notes: { where: { isShared: true } },
              reminders: true,
              companies: { include: { company: true } },
              patterns: { include: { pattern: true } },
            }
          }
        }
      }
    }
  });

  // 3. Back-fill Redis cache
  if (sheet) await setCachedPublicSheet(slug, sheet);

  return sheet;
}

export async function getPublicProblemBySlug(slug: string) {
  // 1. Check Redis cache first (24h TTL)
  const cached = await getCachedPublicProblem(slug);
  if (cached) return cached;

  const problemInclude = {
    solutions: {
      include: {
        notes: { where: { isShared: true } },
      }
    },
    notes: { where: { isShared: true } },
    reminders: true,
    companies: { include: { company: true } },
    patterns: { include: { pattern: true } },
    user: {
      select: {
        id: true,
        username: true,
        name: true,
        sheets: {
          where: { isPublic: true },
          include: {
            problems: {
              include: { problem: true }
            }
          }
        }
      }
    }
  };

  // Direct ID match
  let problem = await db.problem.findFirst({
    where: { id: slug, isPublic: true },
    include: problemInclude,
  });

  // Formatted slug-to-name match
  if (!problem) {
    const searchName = slug.replace(/-/g, " ").trim();
    problem = await db.problem.findFirst({
      where: {
        name: { equals: searchName, mode: "insensitive" },
        isPublic: true,
      },
      include: problemInclude,
    });
  }

  // Exact fallback check
  if (!problem) {
    const getSlug = (name: string) => {
      if (!name) return "";
      return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    };
    const publicList = await db.problem.findMany({
      where: { isPublic: true },
      select: { id: true, name: true },
    });
    const match = publicList.find((p) => getSlug(p.name) === slug);
    if (match) {
      problem = await db.problem.findUnique({
        where: { id: match.id },
        include: problemInclude,
      });
    }
  }

  // Back-fill Redis cache
  if (problem) {
    await setCachedPublicProblem(slug, problem);
  }

  return problem;
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

  // Invalidate public sheet cache if sheet is public
  if (sheet.shareSlug && sheet.isPublic) {
    await invalidatePublicSheetCache(sheet.shareSlug);
  }

  revalidatePath("/sheets");
  return res;
}

/**
 * Batch add problems to a sheet in 1 single SQL round-trip.
 */
export async function addProblemsToSheet(sheetId: string, problemIds: string[]) {
  const userId = await requireAuth();
  if (!problemIds.length) return { success: true };

  const sheet = await db.sheet.findFirst({
    where: { id: sheetId, userId }
  });
  if (!sheet) throw new Error("Sheet not found");

  const lastProblem = await db.sheetProblem.findFirst({
    where: { sheetId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  let nextOrder = lastProblem ? lastProblem.order + 1 : 0;

  await db.sheetProblem.createMany({
    data: problemIds.map((pid) => ({
      sheetId,
      problemId: pid,
      order: nextOrder++,
    })),
    skipDuplicates: true,
  });

  if (sheet.shareSlug && sheet.isPublic) {
    await invalidatePublicSheetCache(sheet.shareSlug);
  }

  revalidatePath("/sheets");
  return { success: true };
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

  // Invalidate public sheet cache if sheet is public
  if (sheet.shareSlug && sheet.isPublic) {
    await invalidatePublicSheetCache(sheet.shareSlug);
  }

  revalidatePath("/sheets");
  return { success: true };
}

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

// 8. NOTIFICATIONS ACTIONS
/**
 * Get all notifications for the current user, ordered by most recent.
 * Per PLAN.md § 6 Notifications catalog.
 */
export async function getNotifications(limit = 20) {
  const userId = await requireAuth();
  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return notifications.map((n) => ({
    ...n,
    createdAtFormatted: formatIST(n.createdAt),
  }));
}

/**
 * Get count of unread notifications (for bell badge).
 * Uses Redis notif:count:{userId} cache (5 min TTL) per PLAN.md §8.6 & §12.3.
 */
export async function getUnreadNotificationCount() {
  const userId = await requireAuth();

  // 1. Try Redis cache (5 min TTL)
  const cached = await getCachedNotifCount(userId);
  if (cached !== null) return cached;

  // 2. DB fallback
  const count = await db.notification.count({
    where: { userId, isRead: false },
  });

  // 3. Back-fill Redis cache
  await setCachedNotifCount(userId, count);

  return count;
}

/**
 * Mark a single notification as read.
 * Invalidates Redis notif:count cache per PLAN.md §8.6.
 */
export async function markNotificationRead(notifId: string) {
  const userId = await requireAuth();

  const notif = await db.notification.findFirst({
    where: { id: notifId, userId },
  });
  if (!notif) throw new Error("Notification not found");

  const updated = await db.notification.update({
    where: { id: notifId },
    data: { isRead: true },
  });

  // Invalidate Redis count cache so badge updates immediately
  await invalidateNotifCount(userId);

  return updated;
}

/**
 * Mark ALL unread notifications as read.
 * Invalidates Redis notif:count cache per PLAN.md §8.6.
 */
export async function markAllNotificationsRead() {
  const userId = await requireAuth();

  await db.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  // Invalidate Redis count cache
  await invalidateNotifCount(userId);

  return { success: true };
}

/**
 * Delete a notification (optional cleanup).
 */
export async function deleteNotification(notifId: string) {
  const userId = await requireAuth();

  await db.notification.deleteMany({
    where: { id: notifId, userId },
  });

  return { success: true };
}

// 9. COMPANY TAGS & PATTERN TAGS (READ)
/**
 * Get all global company tags (for company tag picker in AddProblem/EditProblem modals).
 * Per PLAN.md § 14 Feature #3: Company Tags.
 */
export async function getCompanyTags() {
  return db.companyTag.findMany({
    orderBy: { name: "asc" },
  });
}

/**
 * Get all global pattern tags, optionally filtered by parentTopic.
 * Per PLAN.md § 14 Feature #12: Problem Pattern Tags.
 */
export async function getPatternTags(parentTopic?: string) {
  return db.pattern.findMany({
    where: parentTopic ? { parentTopic } : undefined,
    orderBy: [{ parentTopic: "asc" }, { name: "asc" }],
  });
}

/**
 * Get all unique topic strings used by the current user (for autocomplete).
 * Uses Redis tags:{userId} cache (1h TTL) per PLAN.md §12.3.
 */
export async function getUserTopics() {
  const userId = await requireAuth();

  // 1. Try Redis cache
  const cached = await getCachedTags(userId);
  if (cached) return cached;

  // 2. DB fallback
  const problems = await db.problem.findMany({
    where: { userId },
    select: { topic: true },
  });

  const topicsSet = new Set<string>();
  for (const p of problems) {
    if (p.topic) {
      const split = p.topic.split(",");
      for (let i = 0; i < split.length; i++) {
        const clean = split[i].trim();
        if (clean) topicsSet.add(clean);
      }
    }
  }
  const tags = Array.from(topicsSet).sort();

  // 3. Back-fill Redis cache
  await setCachedTags(userId, tags);

  return tags;
}

import { highlightCode } from "@/lib/utils/highlightCode";

export async function getHighlightedHtml(
  code: string,
  lang: string,
  theme: "dark" | "light" = "dark"
) {
  return highlightCode(code, lang, theme);
}

export async function checkAuthSession() {
  const session = await auth();
  return session && session.user ? { signedIn: true } : { signedIn: false };
}

export async function validateCredentials(identifier: string, password: string) {
  if (!identifier || !password) {
    return { error: true, message: "Please enter both username/email and password." };
  }

  const raw = identifier.trim();
  const isEmail = raw.includes("@");
  const user = isEmail
    ? await db.user.findFirst({
        where: {
          email: {
            equals: raw,
            mode: "insensitive",
          },
        },
      })
    : await db.user.findFirst({
        where: {
          username: {
            equals: raw,
            mode: "insensitive",
          },
        },
      });

  if (!user) {
    return {
      error: true,
      message: isEmail
        ? "No account found with this email address."
        : "No account found with this username.",
    };
  }

  if (!user.passwordHash) {
    return {
      error: true,
      message: "This account does not have a password configured.",
    };
  }

  const bcrypt = await import("bcryptjs");
  const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordsMatch) {
    return { error: true, message: "Incorrect password. Please try again." };
  }

  return { success: true };
}

/**
 * Permanently deletes the current user's account and cascades all data.
 */
export async function deleteUserAccount() {
  const userId = await requireAuth();

  // Invalidate Redis user caches
  await invalidateUserCaches(userId);

  // Cascade delete user and all problems, solutions, notes, sheets, reminders, and analytics
  await db.user.delete({
    where: { id: userId },
  });

  return { success: true };
}

/**
 * Exports all user problems, solutions, notes, and sheets as a portable JSON backup.
 */
export async function exportUserData() {
  const userId = await requireAuth();

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      email: true,
      defaultLanguage: true,
      createdAt: true,
    },
  });

  const problems = await db.problem.findMany({
    where: { userId },
    orderBy: { num: "asc" },
    include: {
      solutions: {
        include: {
          notes: true,
        },
      },
      notes: true,
    },
  });

  const sheets = await db.sheet.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      problems: {
        include: {
          problem: {
            select: { num: true, name: true },
          },
        },
      },
    },
  });

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    user,
    problems: problems.map((p) => ({
      num: p.num,
      name: p.name,
      url: p.url,
      topic: p.topic,
      difficulty: p.difficulty,
      status: p.status,
      isFavorite: p.isFavorite,
      solutions: p.solutions.map((s) => ({
        name: s.name,
        lang: s.lang,
        intuition: s.intuition,
        approach: s.approach,
        code: s.code,
        time: s.time,
        space: s.space,
        notes: s.notes.map((n) => ({ type: n.type, text: n.text })),
      })),
      notes: p.notes.map((n) => ({ type: n.type, text: n.text })),
    })),
    sheets: sheets.map((s) => ({
      name: s.name,
      description: s.description,
      problems: s.problems.map((sp) => sp.problem.num),
    })),
  };
}

/**
 * Imports problems, solutions, and notes in batch from a JSON backup.
 */
export async function importUserData(data: {
  problems?: Array<{
    name: string;
    url?: string;
    topic?: string;
    difficulty?: string;
    status?: string;
    isFavorite?: boolean;
    solutions?: Array<{
      name?: string;
      lang?: string;
      intuition?: string;
      approach?: string;
      code?: string;
      time?: string;
      space?: string;
      notes?: Array<{ type?: string; text?: string }>;
    }>;
    notes?: Array<{ type?: string; text?: string }>;
  }>;
}) {
  const userId = await requireAuth();

  if (!data || !Array.isArray(data.problems) || data.problems.length === 0) {
    throw new Error("Invalid import data. No problems found to import.");
  }

  // Get current max problem number for this user
  const highestProblem = await db.problem.findFirst({
    where: { userId },
    orderBy: { num: "desc" },
    select: { num: true },
  });

  let nextNum = (highestProblem?.num ?? 0) + 1;
  let importedCount = 0;

  // Process problems inside a single transaction
  await db.$transaction(async (tx) => {
    for (const item of data.problems!) {
      if (!item.name || !item.name.trim()) continue;

      const difficulty = item.difficulty || "Medium";
      const diffColor =
        difficulty === "Easy"
          ? "#10b981"
          : difficulty === "Hard"
          ? "#f43f5e"
          : "#f59e0b";

      const createdProblem = await tx.problem.create({
        data: {
          userId,
          num: nextNum++,
          name: item.name.trim(),
          url: item.url || "#",
          topic: item.topic || "Algorithms",
          difficulty,
          diffColor,
          status: item.status || "Due Today",
          statusColor: "#6366f1",
          isFavorite: !!item.isFavorite,
        },
      });

      // Import solutions if present
      if (Array.isArray(item.solutions) && item.solutions.length > 0) {
        for (const sol of item.solutions) {
          const createdSol = await tx.solution.create({
            data: {
              problemId: createdProblem.id,
              userId,
              name: sol.name || "Default Approach",
              lang: sol.lang || "Python",
              intuition: sol.intuition || "",
              approach: sol.approach || "",
              code: sol.code || "",
              time: sol.time || "O(N)",
              space: sol.space || "O(1)",
              tags: [],
            },
          });

          if (Array.isArray(sol.notes) && sol.notes.length > 0) {
            await tx.solutionNote.createMany({
              data: sol.notes.map((n) => ({
                solutionId: createdSol.id,
                type: n.type || "note",
                text: n.text || "",
              })),
            });
          }
        }
      }

      // Import problem notes if present
      if (Array.isArray(item.notes) && item.notes.length > 0) {
        await tx.note.createMany({
          data: item.notes.map((n) => ({
            problemId: createdProblem.id,
            userId,
            type: n.type || "note",
            text: n.text || "",
          })),
        });
      }

      importedCount++;
    }
  });

  // Invalidate user caches
  await invalidateUserCaches(userId);

  return { success: true, count: importedCount };
}

