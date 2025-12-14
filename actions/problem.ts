"use server";

import mongoose from "mongoose";
import Problem from "@/models/Problem";
import Solution from "@/models/Solution";
import { revalidatePath } from "next/cache";
import { authenticatedAction } from "@/lib/action-utils";

export async function getProblems(filters: any = {}) {
  return authenticatedAction(async (data: any, { user }) => {
    const query: any = { userId: user.id };

    if (data.topic) query.topic = data.topic;
    if (data.tags) query.tags = data.tags;
    if (data.difficulty) query.difficulty = data.difficulty;
    if (data.status) {
        // Map "Unsolved" from UI to "Todo" in DB if necessary, or just use filter
        // Assuming UI sends "Unsolved" but DB has "Todo"
        if (data.status === "Unsolved") query.status = { $ne: "Solved" };
        else query.status = data.status;
    }
    if (data.search) {
      query.title = { $regex: data.search, $options: "i" };
    }

    // Optimization: Just fetch the problems. Rely on Problem.status.
    const problems = await Problem.find(query).sort({ createdAt: -1 }).lean();
    
    // Quick fix: Map 'Todo' to 'Unsolved' for the UI if strictly needed, 
    // or rely on UI handling "anything not Solved is Unsolved" (which it does).
    
    return JSON.parse(JSON.stringify(problems));
  }, filters);
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
    const userId = user.id;

    try {
      // Parallelize independent queries
      const pTotal = Problem.countDocuments({ userId });
      const pSolved = Problem.countDocuments({ userId, status: "Solved" });
      
      const pByDifficulty = Problem.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: "$difficulty", count: { $sum: 1 } } }
      ]);

      const pDistinctTopics = Problem.distinct("topic", { userId });
      const pDistinctTags = Problem.distinct("tags", { userId });

      const pByTopic = Problem.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $unwind: "$topic" },
        { $group: { _id: "$topic", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const pByTag = Problem.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Fetch IDs for solution stats (needed for next batch)
      const pUserProblems = Problem.find({ userId }).select("_id");

      // Await the problems list first as others depend on it
      const userProblems = await pUserProblems;
      const problemIds = userProblems.map(p => p._id);

      // Start dependent queries
      const pByTimeComplexity = Solution.aggregate([
        { $match: { problemId: { $in: problemIds }, timeComplexity: { $exists: true, $ne: "" } } },
        { $group: { _id: "$timeComplexity", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const pBySpaceComplexity = Solution.aggregate([
        { $match: { problemId: { $in: problemIds }, spaceComplexity: { $exists: true, $ne: "" } } },
        { $group: { _id: "$spaceComplexity", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Activity: Last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const pActivityTimeline = Solution.aggregate([
        { $match: { 
            problemId: { $in: problemIds },
            createdAt: { $gte: sixMonthsAgo }
        }},
        { $group: { 
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
            count: { $sum: 1 } 
        }},
        { $sort: { _id: 1 } }
      ]);

      // Await all efficiently
      const [
        total,
        solved,
        byDifficulty,
        distinctTopics,
        distinctTags,
        byTopic,
        byTag,
        byTimeComplexity,
        bySpaceComplexity,
        activityTimeline
      ] = await Promise.all([
        pTotal,
        pSolved,
        pByDifficulty,
        pDistinctTopics,
        pDistinctTags,
        pByTopic,
        pByTag,
        pByTimeComplexity,
        pBySpaceComplexity,
        pActivityTimeline
      ]);

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
