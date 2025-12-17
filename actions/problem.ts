"use server";

import mongoose from "mongoose";
import Problem from "@/models/Problem";
import Solution from "@/models/Solution";
import { revalidatePath } from "next/cache";
import { authenticatedAction } from "@/lib/action-utils";

export async function getProblems() {
  return authenticatedAction(async (_, { user }) => {
    // Optimized query with lean() and minimal fields
    const problems = await Problem.find({ userId: user.id })
      .select("title difficulty topic tags status link createdAt lastPracticed nextReviewDate")
      .sort({ createdAt: -1 })
      .lean()
      .exec(); // Add exec() for better performance
    
    return JSON.parse(JSON.stringify(problems));
  });
}

export async function getProblemDetails(id: string) {
  return authenticatedAction(async (problemId: string, { user }) => {
    // Parallel fetch with Promise.all and lean()
    const [problem, solutions] = await Promise.all([
        Problem.findOne({ _id: problemId, userId: user.id })
          .lean()
          .exec(),
        Solution.find({ problemId })
          .select("title language code approach timeComplexity spaceComplexity createdAt")
          .sort({ createdAt: -1 })
          .lean()
          .exec()
    ]);
    
    if (!problem) {
      return { error: "Problem not found" };
    }
    
    return {
      problem: JSON.parse(JSON.stringify(problem)),
      solutions: JSON.parse(JSON.stringify(solutions))
    };
  }, id);
}

export async function createProblem(data: any) {
  return authenticatedAction(async (problemData: any, { user }) => {
    try {
      const newProblem = await Problem.create({
        ...problemData,
        userId: user.id,
        status: "Todo",
        topic: Array.isArray(problemData.topic) ? problemData.topic : [problemData.topic],
        tags: Array.isArray(problemData.tags) ? problemData.tags : problemData.tags.split(",").map((t: string) => t.trim()),
      });
      
      // Only revalidate necessary paths
      revalidatePath("/dashboard");
      return { success: true, id: (newProblem as any)._id.toString() };
    } catch (error) {
      return { error: "Failed to create problem" };
    }
  }, data);
}

export async function deleteProblem(id: string) {
  return authenticatedAction(async (problemId: string, { user }) => {
    // Use deleteOne instead of findOneAndDelete for better performance
    await Promise.all([
        Problem.deleteOne({ _id: problemId, userId: user.id }),
        Solution.deleteMany({ problemId })
    ]);
    
    revalidatePath("/dashboard");
    return { success: true };
  }, id);
}

export async function addSolution(data: any) {
  return authenticatedAction(async (solutionData: any, { user }) => {
    // Verify ownership without loading full document
    const problem = await Problem.findOne({ _id: solutionData.problemId, userId: user.id })
      .select("_id")
      .lean()
      .exec();
      
    if (!problem) return { error: "Problem not found or unauthorized" };

    // Create solution and update problem in parallel
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);

    await Promise.all([
      Solution.create(solutionData),
      Problem.updateOne(
        { _id: solutionData.problemId },
        {
          $set: {
            status: "Solved",
            lastPracticed: new Date(),
            reviewInterval: 3,
            nextReviewDate: nextDate
          }
        }
      )
    ]);
    
    revalidatePath("/dashboard");
    return { success: true };
  }, data);
}

export async function getDueProblems() {
  return authenticatedAction(async (_, { user }) => {
    const problems = await Problem.find({
      userId: user.id,
      status: "Solved",
      nextReviewDate: { $lte: new Date() }
    })
    .select("_id title nextReviewDate")
    .sort({ nextReviewDate: 1 })
    .limit(10) // Limit for performance
    .lean()
    .exec();

    return JSON.parse(JSON.stringify(problems));
  });
}

export async function getUserStats(from?: string | Date, to?: string | Date) {
  return authenticatedAction(async (_, { user }) => {
    const userId = new mongoose.Types.ObjectId(user.id);
    
    // IST Timezone Offset
    const IST_OFFSET = "+05:30";

    // Date filter logic for problems (lastPracticed)
    const dateFilter: any = { userId };
    if (from || to) {
        dateFilter.lastPracticed = {};
        if (from) {
            // Construct IST-aware Date object for start of day
            const startDate = new Date(`${from}T00:00:00${IST_OFFSET}`);
            dateFilter.lastPracticed.$gte = startDate;
        }
        if (to) {
            // Construct IST-aware Date object for end of day
            const endDate = new Date(`${to}T23:59:59.999${IST_OFFSET}`);
            dateFilter.lastPracticed.$lte = endDate;
        }
    }

    try {
      // Single optimized aggregation pipeline
      const [problemStats] = await Problem.aggregate([
        { $match: dateFilter },
        { 
          $facet: {
            counts: [
                { $group: { 
                    _id: null, 
                    total: { $sum: 1 },
                    solved: { $sum: { $cond: [{ $eq: ["$status", "Solved"] }, 1, 0] } }
                }}
            ],
            byDifficulty: [
                { $group: { _id: "$difficulty", count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ],
            byTopic: [
                { $unwind: "$topic" },
                { $group: { _id: "$topic", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 20 }
            ],
            byTag: [
                { $unwind: "$tags" },
                { $group: { _id: "$tags", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 30 }
            ],
            ids: [{ $project: { _id: 1 } }]
          } 
        }
      ]).exec();

      const total = problemStats.counts[0]?.total || 0;
      const solved = problemStats.counts[0]?.solved || 0;
      const byDifficulty = problemStats.byDifficulty || [];
      const byTopic = problemStats.byTopic || [];
      const byTag = problemStats.byTag || [];
      
      const distinctTopics = byTopic.map((t: any) => t._id);
      const distinctTags = byTag.map((t: any) => t._id);
      
      const problemIds = problemStats.ids.map((p: any) => p._id);

      let byTimeComplexity: any[] = [];
      let bySpaceComplexity: any[] = [];
      let activityTimeline: any[] = [];

      // For solutions, we filter by createdAt using the same range
      const solutionDateFilter: any = { problemId: { $in: problemIds } };
      if (from || to) {
          solutionDateFilter.createdAt = {};
          if (from) solutionDateFilter.createdAt.$gte = new Date(from);
          if (to) {
              const endDate = new Date(to);
              endDate.setHours(23, 59, 59, 999);
              solutionDateFilter.createdAt.$lte = endDate;
          }
      } else {
           // Default to 12 months for timeline if no filter
           const twelveMonthsAgo = new Date();
           twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
           solutionDateFilter.createdAt = { $gte: twelveMonthsAgo };
      }

      if (problemIds.length > 0) {
          const [solutionStats] = await Solution.aggregate([
             { $match: solutionDateFilter },
             {
                 $facet: {
                     byTime: [
                         { $match: { timeComplexity: { $exists: true, $ne: "" } } },
                         { $group: { _id: "$timeComplexity", count: { $sum: 1 } } },
                         { $sort: { count: -1 } },
                         { $limit: 10 }
                     ],
                     bySpace: [
                         { $match: { spaceComplexity: { $exists: true, $ne: "" } } },
                         { $group: { _id: "$spaceComplexity", count: { $sum: 1 } } },
                         { $sort: { count: -1 } },
                         { $limit: 10 }
                     ],
                     timeline: [
                         { $group: { 
                             _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+05:30" } }, 
                             solutions: { $sum: 1 },
                             distinctProblems: { $addToSet: "$problemId" }
                         }},
                         { $project: {
                             _id: 1,
                             solutions: 1,
                             problems: { $size: "$distinctProblems" }
                         }},
                         { $sort: { _id: 1 } }
                     ]
                 }
             }
          ]).exec();

          byTimeComplexity = solutionStats.byTime || [];
          bySpaceComplexity = solutionStats.bySpace || [];
          activityTimeline = solutionStats.timeline || [];
      }

      return {
        total,
        solved,
        byDifficulty,
        byTopic,
        byTag,
        distinctTopics,
        distinctTags,
        byTimeComplexity,
        bySpaceComplexity,
        activityTimeline
      };
    } catch (error) {
      console.error("Stats Error:", error);
      return { error: "Failed to fetch stats" };
    }
  });
}

export async function reviewProblem(id: string) {
  return authenticatedAction(async (problemId: string, { user }) => {
    // Verify ownership and get current interval in one query
    const problem = await Problem.findOne({ _id: problemId, userId: user.id })
      .select("reviewInterval")
      .lean()
      .exec();
      
    if (!problem) return { error: "Problem not found" };

    const intervals = [0, 3, 7, 15, 30, 60];
    let nextIntervalIndex = intervals.indexOf(problem.reviewInterval) + 1;
    if (nextIntervalIndex >= intervals.length) nextIntervalIndex = intervals.length - 1;

    const nextInterval = intervals[nextIntervalIndex];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextInterval);

    await Problem.updateOne(
      { _id: problemId },
      {
        $set: {
          lastPracticed: new Date(),
          reviewInterval: nextInterval,
          nextReviewDate: nextDate,
        }
      }
    );

    revalidatePath("/dashboard");
    return { success: true };
  }, id);
}

export async function updateProblem(id: string, data: any) {
  return authenticatedAction(async (problemData: any, { user }) => {
    try {
      const updated = await Problem.updateOne(
        { _id: id, userId: user.id },
        {
          $set: {
            ...problemData,
            topic: Array.isArray(problemData.topic) ? problemData.topic : [problemData.topic],
            tags: Array.isArray(problemData.tags) ? problemData.tags : problemData.tags.split(",").map((t: string) => t.trim()),
          }
        }
      );

      if (updated.matchedCount === 0) return { error: "Problem not found" };

      revalidatePath("/dashboard");
      return { success: true };
    } catch (error) {
      return { error: "Failed to update problem" };
    }
  }, data);
}

export async function deleteSolution(id: string) {
  return authenticatedAction(async (solutionId: string, { user }) => {
    const solution = await Solution.findById(solutionId).select("problemId").lean().exec();
    if (!solution) return { error: "Solution not found" };

    const problem = await Problem.findOne({ _id: solution.problemId, userId: user.id })
      .select("_id")
      .lean()
      .exec();
      
    if (!problem) return { error: "Unauthorized" };

    // Delete solution and check count in parallel
    const [, remainingCount] = await Promise.all([
      Solution.deleteOne({ _id: solutionId }),
      Solution.countDocuments({ problemId: solution.problemId })
    ]);
    
    // If this was the last solution, reset problem status
    if (remainingCount === 0) {
        await Problem.updateOne(
          { _id: solution.problemId },
          {
            $set: {
              status: "Todo",
              lastPracticed: null,
            }
          }
        );
    }

    revalidatePath("/dashboard");
    return { success: true };
  }, id);
}

export async function updateSolution(id: string, data: any) {
  return authenticatedAction(async (solutionData: any, { user }) => {
    const solution = await Solution.findById(id).select("problemId").lean().exec();
    if (!solution) return { error: "Solution not found" };

    const problem = await Problem.findOne({ _id: solution.problemId, userId: user.id })
      .select("_id")
      .lean()
      .exec();
      
    if (!problem) return { error: "Unauthorized" };

    await Solution.updateOne({ _id: id }, { $set: solutionData });

    revalidatePath("/dashboard");
    return { success: true };
  }, data);
}

export async function resetUserStats() {
  return authenticatedAction(async (_, { user }) => {
    try {
      const userProblems = await Problem.find({ userId: user.id })
        .select("_id")
        .lean()
        .exec();
        
      const problemIds = userProblems.map(p => p._id);

      // Parallel operations for better performance
      await Promise.all([
        problemIds.length > 0 ? Solution.deleteMany({ problemId: { $in: problemIds } }) : Promise.resolve(),
        Problem.updateMany(
          { userId: user.id },
          { 
            $set: { 
              status: "Todo",
              lastPracticed: null,
              nextReviewDate: null,
              reviewInterval: 0
            } 
          }
        )
      ]);

      revalidatePath("/dashboard");
      revalidatePath("/stats");
      return { success: true };
    } catch (error) {
      return { error: "Failed to reset stats" };
    }
  });
}

export async function deleteAllData() {
  return authenticatedAction(async (_, { user }) => {
    try {
      // Find all problems to potentially delete related solutions first
      // Actually, we can just delete solutions by problemId if we filtered by problems belonging to user
      // Or safer: Find all user's problems, get IDs, delete solutions with those IDs.
      const userProblems = await Problem.find({ userId: user.id }).select("_id").lean().exec();
      const problemIds = userProblems.map(p => p._id);

      await Promise.all([
        problemIds.length > 0 ? Solution.deleteMany({ problemId: { $in: problemIds } }) : Promise.resolve(),
        Problem.deleteMany({ userId: user.id })
      ]);

      revalidatePath("/dashboard");
      revalidatePath("/stats");
      return { success: true };
    } catch (error) {
      console.error("Delete All Data Error:", error);
      return { error: "Failed to delete all data" };
    }
  });
}
