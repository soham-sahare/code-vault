import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const userId = "c66b443d-53f6-49f2-8f32-6886fa130408";

const topics = [
  "Arrays & Hashing",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Binary Search",
  "Linked List",
  "Trees",
  "Heap / Priority Queue",
  "Backtracking",
  "Tries",
  "Graphs",
  "Advanced Graphs",
  "Dynamic Programming",
  "Greedy",
  "Intervals",
  "Math & Geometry"
];

const problemNames = [
  "Two Sum", "Valid Anagram", "Group Anagrams", "Top K Frequent Elements",
  "Product of Array Except Self", "Valid Sudoku", "Longest Consecutive Sequence",
  "Valid Palindrome", "Two Sum II", "Three Sum", "Container With Most Water",
  "Best Time to Buy and Sell Stock", "Longest Substring Without Repeating Characters",
  "Longest Repeating Character Replacement", "Minimum Window Substring",
  "Valid Parentheses", "Min Stack", "Evaluate Reverse Polish Notation",
  "Generate Parentheses", "Daily Temperatures", "Car Fleet",
  "Search a 2D Matrix", "Koko Eating Bananas", "Find Minimum in Rotated Sorted Array",
  "Search in Rotated Sorted Array", "Time Based Key-Value Store",
  "Reverse Linked List", "Merge Two Sorted Lists", "Reorder List",
  "Remove Nth Node From End of List", "Copy List with Random Pointer",
  "Add Two Numbers", "Linked List Cycle", "Find the Duplicate Number",
  "Invert Binary Tree", "Maximum Depth of Binary Tree", "Diameter of Binary Tree",
  "Balanced Binary Tree", "Same Tree", "Subtree of Another Tree",
  "Lowest Common Ancestor of a Binary Search Tree", "Binary Tree Level Order Traversal",
  "Binary Tree Right Side View", "Count Good Nodes in Binary Tree",
  "Validate Binary Search Tree", "Kth Smallest Element in a BST",
  "Construct Binary Tree from Preorder and Inorder Traversal",
  "Kth Largest Element in a Stream", "Last Stone Weight", "K Closest Points to Origin",
  "Kth Largest Element in an Array", "Subsets", "Combination Sum",
  "Permutations", "Subsets II", "Combination Sum II", "Word Search",
  "Palindrome Partitioning", "Letter Combinations of a Phone Number",
  "N-Queens", "Implement Trie (Prefix Tree)", "Design Add and Search Words Data Structure",
  "Word Search II", "Number of Islands", "Clone Graph", "Max Area of Island",
  "Pacific Atlantic Water Flow", "Course Schedule", "Course Schedule II",
  "Redundant Connection", "Number of Connected Components in an Undirected Graph",
  "Graph Valid Tree", "Word Ladder", "Reconstruct Itinerary",
  "Min Cost to Connect All Points", "Network Delay Time", "Swim in Rising Water",
  "Alien Dictionary", "Cheapest Flights Within K Stops",
  "Climbing Stairs", "Min Cost Climbing Stairs", "House Robber",
  "House Robber II", "Longest Palindromic Substring", "Palindromic Substrings",
  "Decode Ways", "Coin Change", "Maximum Product Subarray",
  "Word Break", "Longest Increasing Subsequence",
  "Unique Paths", "Longest Common Subsequence", "Best Time to Buy and Sell Stock with Cooldown",
  "Coin Change II", "Target Sum", "Interleaving String", "Longest Path in a Matrix"
];

const difficulties = ["EASY", "MED", "HARD"];
const intervals = ["Due in 3d", "Due in 7d", "Due in 15d", "Due in 30d", "Recall Stage 1"];

async function main() {
  console.log("Cleaning up old test problems for user...");
  await prisma.problem.deleteMany({
    where: {
      userId,
      name: { startsWith: "[Seeded]" }
    }
  });

  const now = new Date();
  let totalProblems = 0;

  // Let's seed for the past 10 days
  for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
    // Generate date for offset
    const targetDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    
    // Pick random count between 10 and 20 problems per day
    const problemsCount = Math.floor(Math.random() * 11) + 10;
    console.log(`Seeding ${problemsCount} problems for ${targetDate.toDateString()} (Day offset: -${dayOffset})`);

    for (let i = 0; i < problemsCount; i++) {
      const baseName = problemNames[Math.floor(Math.random() * problemNames.length)];
      const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
      const topic = topics[Math.floor(Math.random() * topics.length)];
      
      const diffColor =
        difficulty === "EASY"
          ? "text-emerald-500 bg-emerald-500/10"
          : difficulty === "MED"
            ? "text-amber-500 bg-amber-500/10"
            : "text-rose-500 bg-rose-500/10";

      // Sequential generation of LeetCode numbers
      const maxProb = await prisma.problem.findFirst({
        where: { userId },
        orderBy: { num: "desc" }
      });
      const finalNum = maxProb ? maxProb.num + 1 : 1;

      // Status: Solved is best to test checkAndSyncStatus
      const interval = intervals[Math.floor(Math.random() * intervals.length)];
      
      // If interval is Recall Stage 1, it's Unsolved. Else it's Solved (but dynamic check might change it)
      const initialStatus = interval === "Recall Stage 1" ? "Unsolved" : "Solved";
      const initialStatusColor =
        initialStatus === "Unsolved"
          ? "text-rose-500 bg-rose-500/10 border-rose-500/20"
          : "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";

      // Create Problem
      const problem = await prisma.problem.create({
        data: {
          userId,
          num: finalNum,
          name: `[Seeded] ${baseName} - ${i + 1}`,
          difficulty,
          diffColor,
          topic,
          url: "https://leetcode.com",
          status: initialStatus,
          statusColor: initialStatusColor,
          interval,
          createdAt: targetDate,
          updatedAt: targetDate,
        }
      });

      // If Solved, attach a solution
      if (initialStatus === "Solved") {
        await prisma.solution.create({
          data: {
            problemId: problem.id,
            name: "Optimal Solution",
            lang: "Python",
            intuition: "Generate a hash map or double pointer pass.",
            approach: "Optimal space complexity scan.",
            code: "class Solution:\n    def solve(self, nums):\n        # Seeded solution code here\n        pass",
            time: "O(N)",
            space: "O(1)",
            createdAt: targetDate,
            updatedAt: targetDate,
          }
        });
      }

      totalProblems++;
    }
  }

  console.log(`Successfully seeded ${totalProblems} problems!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
