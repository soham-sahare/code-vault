"use server";

import mongoose from "mongoose";
import Problem from "@/models/Problem";
import Solution from "@/models/Solution";
import { revalidatePath } from "next/cache";
import { authenticatedAction } from "@/lib/action-utils";

function escapeRegex(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export async function getProblems() {
  return authenticatedAction(async (_, { user }) => {
    // Optimization: Fetch ALL problems for the user. 
    // Filtering will now be handled Client-Side for instant UI feedback.
    const problems = await Problem.find({ userId: user.id })
      .select("title difficulty topic tags status link createdAt")
      .sort({ createdAt: -1 })
      .lean();
    
    return JSON.parse(JSON.stringify(problems));
  });
}

export async function getProblemDetails(id: string) {
  return authenticatedAction(async (problemId: string, { user }) => {
    const [problem, solutions] = await Promise.all([
        Problem.findOne({ _id: problemId, userId: user.id }).lean(),
        Solution.find({ problemId }).lean()
    ]);
    
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
        status: "Todo", // Default to Todo (Unsolved)
        topic: Array.isArray(problemData.topic) ? problemData.topic : [problemData.topic],
        tags: Array.isArray(problemData.tags) ? problemData.tags : problemData.tags.split(",").map((t: string) => t.trim()),
      });
      
      revalidatePath("/dashboard");
      return { success: true, id: (newProblem as any)._id.toString() };
    } catch (error) {
      return { error: "Failed to create problem" };
    }
  }, data);
}

export async function deleteProblem(id: string) {
  return authenticatedAction(async (problemId: string, { user }) => {
    await Promise.all([
        Problem.findOneAndDelete({ _id: problemId, userId: user.id }),
        Solution.deleteMany({ problemId })
    ]);
    
    revalidatePath("/dashboard");
    return { success: true };
  }, id);
}

export async function addSolution(data: any) {
  return authenticatedAction(async (solutionData: any, { user }) => {
    const problem = await Problem.findOne({ _id: solutionData.problemId, userId: user.id });
    if (!problem) return { error: "Problem not found or unauthorized" };

    await Solution.create(solutionData);

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);

    await Problem.findByIdAndUpdate(solutionData.problemId, {
      status: "Solved",
      lastPracticed: new Date(),
      reviewInterval: 3,
      nextReviewDate: nextDate
    });
    
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
    .lean();

    return JSON.parse(JSON.stringify(problems));
  });
}

export async function getUserStats() {
  return authenticatedAction(async (_, { user }) => {
    const userId = new mongoose.Types.ObjectId(user.id);

    try {
      // 1. Fetch all Problem-related stats in ONE efficient query using $facet
      // This allows parallel processing on the DB server and reduces network round-trips (latency)
      const [problemStats] = await Problem.aggregate([
        { $match: { userId } },
        { 
          $facet: {
            // Basic Counts
            counts: [
                { $group: { 
                    _id: null, 
                    total: { $sum: 1 },
                    solved: { $sum: { $cond: [{ $eq: ["$status", "Solved"] }, 1, 0] } }
                }}
            ],
            // Distribution by properties
            byDifficulty: [
                { $group: { _id: "$difficulty", count: { $sum: 1 } } }
            ],
            byTopic: [
                { $unwind: "$topic" },
                { $group: { _id: "$topic", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ],
            byTag: [
                { $unwind: "$tags" },
                { $group: { _id: "$tags", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ],
            // Just getting IDs for the next step (Solution stats)
            ids: [{ $project: { _id: 1 } }] 
          } 
        }
      ]);

      // Unpack Problem Stats
      const total = problemStats.counts[0]?.total || 0;
      const solved = problemStats.counts[0]?.solved || 0;
      const byDifficulty = problemStats.byDifficulty || [];
      const byTopic = problemStats.byTopic || [];
      const byTag = problemStats.byTag || [];
      
      // Extract distinct lists from the aggregation results
      const distinctTopics = byTopic.map((t: any) => t._id);
      const distinctTags = byTag.map((t: any) => t._id);
      
      const problemIds = problemStats.ids.map((p: any) => p._id);

      // 2. Fetch Solution Stats - Only if we have problems
      // Using $facet for solutions too
      let byTimeComplexity: any[] = [];
      let bySpaceComplexity: any[] = [];
      let activityTimeline: any[] = [];

      if (problemIds.length > 0) {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

          const [solutionStats] = await Solution.aggregate([
             { $match: { problemId: { $in: problemIds } } },
             {
                 $facet: {
                     byTime: [
                         { $match: { timeComplexity: { $exists: true, $ne: "" } } },
                         { $group: { _id: "$timeComplexity", count: { $sum: 1 } } },
                         { $sort: { count: -1 } }
                     ],
                     bySpace: [
                         { $match: { spaceComplexity: { $exists: true, $ne: "" } } },
                         { $group: { _id: "$spaceComplexity", count: { $sum: 1 } } },
                         { $sort: { count: -1 } }
                     ],
                     timeline: [
                         { $match: { createdAt: { $gte: sixMonthsAgo } } },
                         { $group: { 
                             _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                             count: { $sum: 1 } 
                         }},
                         { $sort: { _id: 1 } }
                     ]
                 }
             }
          ]);

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
    const problem = await Problem.findOne({ _id: problemId, userId: user.id });
    if (!problem) return { error: "Problem not found" };

    const intervals = [0, 3, 7, 15, 30, 60];
    let nextIntervalIndex = intervals.indexOf(problem.reviewInterval) + 1;
    if (nextIntervalIndex >= intervals.length) nextIntervalIndex = intervals.length - 1;

    const nextInterval = intervals[nextIntervalIndex];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextInterval);

    await Problem.findByIdAndUpdate(problemId, {
      lastPracticed: new Date(),
      reviewInterval: nextInterval,
      nextReviewDate: nextDate,
    });

    revalidatePath("/dashboard");
    return { success: true };
  }, id);
}

export async function updateProblem(id: string, data: any) {
  return authenticatedAction(async (problemData: any, { user }) => {
    try {
      const updated = await Problem.findOneAndUpdate(
        { _id: id, userId: user.id },
        {
           ...problemData,
          topic: Array.isArray(problemData.topic) ? problemData.topic : [problemData.topic],
          tags: Array.isArray(problemData.tags) ? problemData.tags : problemData.tags.split(",").map((t: string) => t.trim()),
        },
        { new: true }
      );

      if (!updated) return { error: "Problem not found" };

      revalidatePath("/dashboard");
      return { success: true };
    } catch (error) {
      return { error: "Failed to update problem" };
    }
  }, data);
}

export async function deleteSolution(id: string) {
  return authenticatedAction(async (solutionId: string, { user }) => {
    const solution = await Solution.findById(solutionId);
    if (!solution) return { error: "Solution not found" };

    const problem = await Problem.findOne({ _id: solution.problemId, userId: user.id });
    if (!problem) return { error: "Unauthorized" };

    await Solution.findByIdAndDelete(solutionId);
    
    // Check if any solutions remain
    const remainingCount = await Solution.countDocuments({ problemId: solution.problemId });
    if (remainingCount === 0) {
        await Problem.findByIdAndUpdate(solution.problemId, {
            status: "Todo",
            lastPracticed: null, // Optional: Reset practice date? Maybe keep it.
            // keeping lastPracticed might be good to know when you *last* worked on it, even if solution is gone.
            // But usually 'status: Todo' implies not solved.
        });
    }

    revalidatePath("/dashboard");
    return { success: true };
  }, id);
}

export async function updateSolution(id: string, data: any) {
  return authenticatedAction(async (solutionData: any, { user }) => {
    const solution = await Solution.findById(id);
    if (!solution) return { error: "Solution not found" };

    const problem = await Problem.findOne({ _id: solution.problemId, userId: user.id });
    if (!problem) return { error: "Unauthorized" };

    await Solution.findByIdAndUpdate(id, solutionData);

    revalidatePath("/dashboard");
    return { success: true };
  }, data);
}

export async function resetUserStats() {
  return authenticatedAction(async (_, { user }) => {
    try {
      const userProblems = await Problem.find({ userId: user.id }).select("_id");
      const problemIds = userProblems.map(p => p._id);

      const deletePromise = problemIds.length > 0 
          ? Solution.deleteMany({ problemId: { $in: problemIds } }) 
          : Promise.resolve();

      const updatePromise = Problem.updateMany(
          { userId: user.id },
          { 
              $set: { 
                  status: "Unsolved",
                  lastPracticed: null,
                  nextReviewDate: null,
                  reviews: 0,
                  reviewInterval: 0
              } 
          }
      );

      await Promise.all([deletePromise, updatePromise]);

      revalidatePath("/dashboard");
      revalidatePath("/stats");
      return { success: true };
    } catch (error) {
      return { error: "Failed to reset stats" };
    }
  });
}
