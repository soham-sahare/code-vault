import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Automatically load .env, .env.local, etc.
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

// Comprehensive pools for procedural generation
const TOPICS = [
  "Arrays & Hashing",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Binary Search",
  "Linked List",
  "Trees",
  "Tries",
  "Heap / Priority Queue",
  "Backtracking",
  "Graphs",
  "Advanced Graphs",
  "1-D Dynamic Programming",
  "2-D Dynamic Programming",
  "Greedy",
  "Intervals",
  "Math & Geometry",
  "Bit Manipulation",
];

const PROBLEM_TEMPLATES: Record<string, string[]> = {
  "Arrays & Hashing": [
    "Two Sum", "Valid Anagram", "Contains Duplicate", "Group Anagrams", "Top K Frequent Elements",
    "Product of Array Except Self", "Valid Sudoku", "Encode and Decode Strings", "Longest Consecutive Sequence",
    "Subarray Sum Equals K", "Next Permutation", "Set Matrix Zeroes", "Pascal's Triangle", "Spiral Matrix",
    "Rotate Image", "Four Sum", "Majority Element", "Find All Numbers Disappeared in an Array"
  ],
  "Two Pointers": [
    "Valid Palindrome", "Two Sum II Input Array Is Sorted", "3Sum", "Container With Most Water",
    "Trapping Rain Water", "Remove Duplicates from Sorted Array", "Move Zeroes", "Boats to Save People",
    "Backspace String Compare", "Sort Colors", "Squares of a Sorted Array", "Interval List Intersections"
  ],
  "Sliding Window": [
    "Best Time to Buy and Sell Stock", "Longest Substring Without Repeating Characters",
    "Longest Repeating Character Replacement", "Permutation in String", "Minimum Window Substring",
    "Sliding Window Maximum", "Subarrays with K Different Integers", "Fruit Into Baskets", "Max Consecutive Ones III"
  ],
  "Stack": [
    "Valid Parentheses", "Min Stack", "Evaluate Reverse Polish Notation", "Generate Parentheses",
    "Daily Temperatures", "Car Fleet", "Largest Rectangle in Histogram", "Next Greater Element I",
    "Online Stock Span", "Decode String", "Simplify Path", "Remove All Adjacent Duplicates in String"
  ],
  "Binary Search": [
    "Binary Search", "Search a 2D Matrix", "Koko Eating Bananas", "Find Minimum in Rotated Sorted Array",
    "Search in Rotated Sorted Array", "Time Based Key-Value Store", "Median of Two Sorted Arrays",
    "Find Peak Element", "Capacity To Ship Packages Within D Days", "Single Element in a Sorted Array"
  ],
  "Linked List": [
    "Reverse Linked List", "Merge Two Sorted Lists", "Reorder List", "Remove Nth Node From End of List",
    "Copy List with Random Pointer", "Add Two Numbers", "Linked List Cycle", "Find the Duplicate Number",
    "Merge k Sorted Lists", "Reverse Nodes in k-Group", "LRU Cache", "Rotate List", "Partition List"
  ],
  "Trees": [
    "Invert Binary Tree", "Maximum Depth of Binary Tree", "Diameter of Binary Tree", "Balanced Binary Tree",
    "Same Tree", "Subtree of Another Tree", "Lowest Common Ancestor of a BST", "Binary Tree Level Order Traversal",
    "Binary Tree Right Side View", "Count Good Nodes in Binary Tree", "Validate Binary Search Tree",
    "Kth Smallest Element in a BST", "Construct Binary Tree from Preorder and Inorder Traversal",
    "Binary Tree Maximum Path Sum", "Serialize and Deserialize Binary Tree", "Flatten Binary Tree to Linked List"
  ],
  "Tries": [
    "Implement Trie Prefix Tree", "Design Add and Search Words Data Structure", "Word Search II",
    "Replace Words", "Map Sum Pairs", "Maximum XOR of Two Numbers in an Array"
  ],
  "Heap / Priority Queue": [
    "Kth Largest Element in a Stream", "Last Stone Weight", "K Closest Points to Origin",
    "Kth Largest Element in an Array", "Task Scheduler", "Design Twitter", "Find Median from Data Stream",
    "Reorganize String", "Furthest Building You Can Reach", "Top K Frequent Words"
  ],
  "Backtracking": [
    "Subsets", "Combination Sum", "Combination Sum II", "Permutations", "Subsets II",
    "Word Search", "Palindrome Partitioning", "Letter Combinations of a Phone Number", "N-Queens",
    "Sudoku Solver", "Restore IP Addresses"
  ],
  "Graphs": [
    "Number of Islands", "Clone Graph", "Max Area of Island", "Pacific Atlantic Water Flow",
    "Surrounded Regions", "Rotting Oranges", "Walls and Gates", "Course Schedule", "Course Schedule II",
    "Redundant Connection", "Number of Connected Components in an Undirected Graph", "Graph Valid Tree",
    "Word Ladder", "Alien Dictionary", "Accounts Merge", "Minimum Height Trees"
  ],
  "Advanced Graphs": [
    "Reconstruct Itinerary", "Min Cost to Connect All Points", "Network Delay Time",
    "Swim in Rising Water", "Cheapest Flights Within K Stops", "Critical Connections in a Network"
  ],
  "1-D Dynamic Programming": [
    "Climbing Stairs", "Min Cost Climbing Stairs", "House Robber", "House Robber II",
    "Longest Palindromic Substring", "Palindromic Substrings", "Decode Ways", "Coin Change",
    "Maximum Product Subarray", "Word Break", "Longest Increasing Subsequence", "Partition Equal Subset Sum"
  ],
  "2-D Dynamic Programming": [
    "Unique Paths", "Longest Common Subsequence", "Best Time to Buy and Sell Stock with Cooldown",
    "Coin Change II", "Target Sum", "Interleaving String", "Longest Increasing Path in a Matrix",
    "Distinct Subsequences", "Edit Distance", "Burst Balloons", "Regular Expression Matching"
  ],
  "Greedy": [
    "Maximum Subarray", "Jump Game", "Jump Game II", "Gas Station", "Hand of Straights",
    "Merge Triplets to Form Target Triplet", "Partition Labels", "Valid Parenthesis String"
  ],
  "Intervals": [
    "Insert Interval", "Merge Intervals", "Non-overlapping Intervals", "Meeting Rooms",
    "Meeting Rooms II", "Minimum Number of Arrows to Burst Balloons"
  ],
  "Math & Geometry": [
    "Rotate Image", "Spiral Matrix", "Set Matrix Zeroes", "Happy Number", "Plus One",
    "Pow(x, n)", "Multiply Strings", "Detect Squares", "Count Primes"
  ],
  "Bit Manipulation": [
    "Single Number", "Number of 1 Bits", "Counting Bits", "Reverse Bits",
    "Missing Number", "Sum of Two Integers", "Reverse Integer", "Bitwise AND of Numbers Range"
  ],
};

const LANGUAGES = ["Python", "TypeScript", "JavaScript", "C++", "Java", "Go", "Rust"];

const COMPLEXITY_TIME_CHOICES = ["O(1)", "O(log N)", "O(N)", "O(N log N)", "O(N²)", "O(M * N)"];
const COMPLEXITY_SPACE_CHOICES = ["O(1)", "O(log N)", "O(N)", "O(M * N)"];

const CODE_SNIPPETS: Record<string, (name: string, diff: string) => string> = {
  Python: (name, diff) => `class Solution:
    def solve(self, data: list[int]) -> int:
        """
        Optimal implementation for ${name} [${diff}].
        Time: O(N), Space: O(1)
        """
        left, right = 0, len(data) - 1
        res = 0
        while left < right:
            mid = (left + right) // 2
            if data[mid] >= 0:
                res += data[left]
                left += 1
            else:
                res += data[right]
                right -= 1
        return res`,

  TypeScript: (name, diff) => `/**
 * Solution for ${name} (${diff})
 * @param nums Array of inputs
 * @returns Result value
 */
function solveProblem(nums: number[]): number {
  let optimalVal = 0;
  const lookup = new Map<number, number>();

  for (let i = 0; i < nums.length; i++) {
    const val = nums[i];
    if (lookup.has(val)) {
      optimalVal = Math.max(optimalVal, lookup.get(val)! + i);
    }
    lookup.set(val, i);
  }
  return optimalVal;
}`,

  JavaScript: (name, diff) => `/**
 * Fast JavaScript ES6 Solution for ${name}
 */
const solve = function(items) {
  const seen = new Set();
  let maxCount = 0;
  for (const item of items) {
    if (!seen.has(item)) {
      seen.add(item);
      maxCount = Math.max(maxCount, seen.size);
    }
  }
  return maxCount;
};`,

  "C++": (name, diff) => `#include <vector>
#include <unordered_map>
#include <algorithm>
using namespace std;

class Solution {
public:
    int solve(vector<int>& nums) {
        // High-performance competitive programming implementation
        ios_base::sync_with_stdio(false);
        cin.tie(NULL);
        
        int n = nums.size();
        unordered_map<int, int> seen;
        int ans = 0;
        for (int i = 0; i < n; ++i) {
            seen[nums[i]]++;
            ans = max(ans, seen[nums[i]]);
        }
        return ans;
    }
};`,

  Java: (name, diff) => `import java.util.*;

public class Solution {
    public int solve(int[] nums) {
        if (nums == null || nums.length == 0) return 0;
        int maxVal = 0;
        Map<Integer, Integer> freq = new HashMap<>();
        for (int x : nums) {
            freq.put(x, freq.getOrDefault(x, 0) + 1);
            maxVal = Math.max(maxVal, freq.get(x));
        }
        return maxVal;
    }
}`,

  Go: (name, diff) => `package main

func solve(nums []int) int {
    seen := make(map[int]int, len(nums))
    maxVal := 0
    for idx, num := range nums {
        if prev, ok := seen[num]; ok {
            if idx - prev > maxVal {
                maxVal = idx - prev
            }
        }
        seen[num] = idx
    }
    return maxVal
}`,

  Rust: (name, diff) => `pub struct Solution;

impl Solution {
    pub fn solve(nums: Vec<i32>) -> i32 {
        use std::collections::HashMap;
        let mut lookup: HashMap<i32, usize> = HashMap::with_capacity(nums.len());
        let mut best = 0;
        for (i, &x) in nums.iter().enumerate() {
            lookup.entry(x).and_modify(|pos| {
                best = best.max((i - *pos) as i32);
                *pos = i;
            }).or_insert(i);
        }
        best
    }
}`,
};

const APPROACH_DESCRIPTIONS = [
  {
    name: "Optimal Two-Pointer Contraction",
    intuition: "Maintain left and right boundaries to reduce state search space from O(N²) to O(N).",
    approach: "1. Initialize two pointers at extremes.\n2. Evaluate window condition.\n3. Greedily advance the bottleneck pointer inward.",
  },
  {
    name: "Hash Table Complement Query",
    intuition: "Store seen elements in an O(1) hash map to resolve match queries in a single pass.",
    approach: "1. Build frequency/index table on the fly.\n2. Check for required target complement.\n3. Update lookup record.",
  },
  {
    name: "Tabulation Dynamic Programming",
    intuition: "Break down problem into optimal subproblems and fill bottom-up state table.",
    approach: "1. Define DP state array dp[i].\n2. Establish base cases.\n3. Compute transition equations iteratively.",
  },
  {
    name: "In-Place Binary Search",
    intuition: "Exploit monotonicity to eliminate half the search space on each iteration.",
    approach: "1. Set low and high bounds.\n2. Compute mid.\n3. Discard infeasible half based on predicate condition.",
  },
  {
    name: "Topological Sort BFS",
    intuition: "Track in-degree counts to process acyclic dependencies in linear time.",
    approach: "1. Compute in-degrees.\n2. Enqueue zero in-degree nodes.\n3. Process queue and decrement neighbor in-degrees.",
  },
  {
    name: "Monotonic Stack Reduction",
    intuition: "Maintain strictly decreasing or increasing order to resolve next greater element queries.",
    approach: "1. Iterate elements.\n2. Pop while stack top violates invariant.\n3. Record answer and push current index.",
  },
];

async function main() {
  if (!process.env.POSTGRES_PRISMA_URL && !process.env.DATABASE_URL) {
    console.log("⚠️ POSTGRES_PRISMA_URL not found in environment. Skipping database seed.");
    return;
  }

  console.log("🌱 Starting Full 1-Year Procedural Database Seed for CodeVault...");

  // 1. Upsert Admin User
  const adminEmail = "admin@codevault.dev";
  const adminPassword = "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      name: "Admin User",
      username: "admin",
      hasCompletedOnboarding: true,
      defaultLanguage: "Python",
      isPublicProfile: true,
    },
    create: {
      email: adminEmail,
      name: "Admin User",
      username: "admin",
      passwordHash,
      hasCompletedOnboarding: true,
      defaultLanguage: "Python",
      isPublicProfile: true,
      theme: "DARK",
    },
  });

  console.log(`👤 Admin user ready: ${admin.email} (Password: ${adminPassword})`);

  // Clear previous data for this user
  await prisma.notification.deleteMany({ where: { userId: admin.id } });
  await prisma.sheetProblem.deleteMany({ where: { sheet: { userId: admin.id } } });
  await prisma.sheet.deleteMany({ where: { userId: admin.id } });
  await prisma.reminder.deleteMany({ where: { userId: admin.id } });
  await prisma.solutionNote.deleteMany({ where: { solution: { userId: admin.id } } });
  await prisma.solution.deleteMany({ where: { userId: admin.id } });
  await prisma.note.deleteMany({ where: { userId: admin.id } });
  await prisma.problemCompany.deleteMany({ where: { problem: { userId: admin.id } } });
  await prisma.problemPattern.deleteMany({ where: { problem: { userId: admin.id } } });
  await prisma.problem.deleteMany({ where: { userId: admin.id } });
  await prisma.analyticsCache.deleteMany({ where: { userId: admin.id } });

  console.log("🧹 Previous data cleared.");

  const now = new Date();
  const totalDays = 365;
  let globalProblemNum = 1;

  const allCreatedProblemIds: string[] = [];

  console.log(`📅 Generating daily problems (2-3 problems, 2-4 solutions each) for 365 days...`);

  // Loop through all 365 days from 365 days ago up to today
  for (let dayOffset = totalDays; dayOffset >= 0; dayOffset--) {
    const dayDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    // 2 to 3 problems per day
    const problemsForToday = 2 + (dayOffset % 2 === 0 ? 1 : 0);

    for (let pIndex = 0; pIndex < problemsForToday; pIndex++) {
      // Pick random topic & problem name template
      const topic = TOPICS[(dayOffset * 3 + pIndex) % TOPICS.length];
      const templateList = PROBLEM_TEMPLATES[topic] || PROBLEM_TEMPLATES["Arrays & Hashing"];
      const baseName = templateList[(dayOffset * 7 + pIndex) % templateList.length];
      const problemName = (dayOffset > 30 && (dayOffset % 5 === 0)) ? `${baseName} II` : baseName;

      // Difficulty distribution: 40% Easy, 40% Medium, 20% Hard
      const diffMod = (dayOffset + pIndex) % 5;
      const difficulty = diffMod <= 1 ? "EASY" : diffMod <= 3 ? "MED" : "HARD";
      const diffColor =
        difficulty === "EASY"
          ? "text-emerald-500 bg-emerald-500/10"
          : difficulty === "MED"
          ? "text-amber-500 bg-amber-500/10"
          : "text-rose-500 bg-rose-500/10";

      // Status and SRS Interval determination based on recency
      let status = "Solved";
      let statusColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      let interval = "Recall Stage 30d";
      let dueDate = new Date(dayDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      let stage = "Recall Stage 30d";
      let reminderStatus = "COMPLETED";

      if (dayOffset === 0) {
        // Today's problems
        status = pIndex === 0 ? "Due Today" : "Solved";
        statusColor = pIndex === 0 ? "text-amber-500 bg-amber-500/10 border-amber-500/20" : "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
        interval = "Recall Stage 3d";
        stage = "Recall Stage 3d";
        dueDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        reminderStatus = "PENDING";
      } else if (dayOffset <= 3) {
        // Recent 1-3 days: Stage 1 (3d)
        interval = "Recall Stage 3d";
        stage = "Recall Stage 3d";
        dueDate = new Date(dayDate.getTime() + 3 * 24 * 60 * 60 * 1000);
        reminderStatus = dueDate < now ? "PENDING" : "PENDING";
        if (dueDate < now) {
          status = "Overdue";
          statusColor = "text-rose-500 bg-rose-500/10 border-rose-500/20";
        }
      } else if (dayOffset <= 10) {
        // 4-10 days: Stage 2 (7d)
        interval = "Recall Stage 7d";
        stage = "Recall Stage 7d";
        dueDate = new Date(dayDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        reminderStatus = dueDate < now ? "COMPLETED" : "PENDING";
      } else if (dayOffset <= 25) {
        // 11-25 days: Stage 3 (15d)
        interval = "Recall Stage 15d";
        stage = "Recall Stage 15d";
        dueDate = new Date(dayDate.getTime() + 15 * 24 * 60 * 60 * 1000);
        reminderStatus = dueDate < now ? "COMPLETED" : "PENDING";
      } else {
        // Older: Mastered / Stage 4
        interval = (dayOffset > 100) ? "Mastered" : "Recall Stage 30d";
        stage = "Recall Stage 30d";
        dueDate = new Date(dayDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        reminderStatus = "COMPLETED";
      }

      // Generate 2 to 4 solutions per problem
      const numSolutions = 2 + ((dayOffset + pIndex) % 3); // 2, 3, or 4 solutions
      const problemSolutions: any[] = [];
      const usedLangs = new Set<string>();

      for (let sIdx = 0; sIdx < numSolutions; sIdx++) {
        const langChoice = LANGUAGES[(dayOffset * 2 + pIndex + sIdx) % LANGUAGES.length];
        const lang = usedLangs.has(langChoice) ? LANGUAGES[(sIdx * 3) % LANGUAGES.length] : langChoice;
        usedLangs.add(lang);

        const approachTemplate = APPROACH_DESCRIPTIONS[(dayOffset + sIdx) % APPROACH_DESCRIPTIONS.length];
        const timeComplexity = COMPLEXITY_TIME_CHOICES[(dayOffset + sIdx) % COMPLEXITY_TIME_CHOICES.length];
        const spaceComplexity = COMPLEXITY_SPACE_CHOICES[(dayOffset + sIdx) % COMPLEXITY_SPACE_CHOICES.length];
        const codeGenerator = CODE_SNIPPETS[lang] || CODE_SNIPPETS["Python"];

        problemSolutions.push({
          userId: admin.id,
          name: `${approachTemplate.name} (${lang})`,
          lang,
          intuition: approachTemplate.intuition,
          approach: approachTemplate.approach,
          code: codeGenerator(problemName, difficulty),
          time: timeComplexity,
          space: spaceComplexity,
          tags: ["Optimal", topic, lang],
          createdAt: dayDate,
        });
      }

      // Create problem with nested solutions and reminder
      const problem = await prisma.problem.create({
        data: {
          userId: admin.id,
          num: globalProblemNum++,
          name: problemName,
          url: `https://leetcode.com/problems/${problemName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/`,
          sourcePlatform: "leetcode",
          topic,
          difficulty,
          diffColor,
          status,
          statusColor,
          interval,
          isFavorite: (dayOffset + pIndex) % 7 === 0,
          isPublic: true,
          solvedAt: status === "Unsolved" ? null : dayDate,
          createdAt: dayDate,
          solutions: {
            create: problemSolutions,
          },
          reminders: {
            create: [
              {
                userId: admin.id,
                dueDate,
                stage,
                cycle: 1,
                status: reminderStatus,
                createdAt: dayDate,
              },
            ],
          },
        },
      });

      allCreatedProblemIds.push(problem.id);
    }
  }

  console.log(`✅ Successfully generated and inserted ${allCreatedProblemIds.length} problems spanning 365 days!`);

  // 3. Create Curated Practice Sheets
  console.log("📑 Creating Curated Practice Sheets...");

  const sheetData = [
    {
      name: "Blind 75 Essentials",
      description: "Must-do standard coding interview questions spanning all core patterns.",
      shareSlug: "blind-75-essentials-vault",
      isCurated: true,
      count: 75,
    },
    {
      name: "NeetCode 150 Core",
      description: "Comprehensive list of fundamental problems across major DSA topics.",
      shareSlug: "neetcode-150-core-vault",
      isCurated: false,
      count: 150,
    },
    {
      name: "Dynamic Programming Mastery",
      description: "Essential 1D and 2D DP patterns: Subsequences, Knapsack, and Tabulation.",
      shareSlug: "dp-mastery-vault",
      isCurated: false,
      count: 35,
    },
    {
      name: "Graphs & Trees Deep-Dive",
      description: "Traversals, Shortest Paths, Topological Sort, and Tree Recursion.",
      shareSlug: "graphs-trees-vault",
      isCurated: false,
      count: 40,
    },
    {
      name: "Top Interview 150",
      description: "Top algorithmic questions asked by Tier-1 tech companies.",
      shareSlug: "top-interview-150-vault",
      isCurated: false,
      count: 100,
    },
  ];

  for (const s of sheetData) {
    const selectedProblemIds = allCreatedProblemIds.slice(0, Math.min(s.count, allCreatedProblemIds.length));
    await prisma.sheet.create({
      data: {
        userId: admin.id,
        name: s.name,
        description: s.description,
        isPublic: true,
        shareSlug: s.shareSlug,
        isCurated: s.isCurated,
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        problems: {
          create: selectedProblemIds.map((pid, idx) => ({
            problemId: pid,
            order: idx + 1,
          })),
        },
      },
    });
  }

  console.log(`✅ Created ${sheetData.length} Curated Practice Sheets.`);

  // 4. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        type: "SRS_DUE",
        message: "You have spaced repetition recall items due today. Review them to lock in long-term memory!",
        isRead: false,
        createdAt: new Date(),
      },
      {
        userId: admin.id,
        type: "ACHIEVEMENT",
        message: "🔥 365-Day Problem Solving Streak Achieved! Master tier unlocked.",
        isRead: true,
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        userId: admin.id,
        type: "SYSTEM",
        message: "Welcome to CodeVault! Your 1-year algorithmic memory vault is fully populated.",
        isRead: true,
        createdAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("🎉 Complete 1-Year Database Seeding Finished Successfully!");
  console.log("=======================================================");
  console.log("🔑 ADMIN LOGIN CREDENTIALS:");
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Username: admin`);
  console.log(`   Password: ${adminPassword}`);
  console.log("=======================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
