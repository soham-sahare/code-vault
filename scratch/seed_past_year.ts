import { PrismaClient } from "@prisma/client";
import { invalidateAnalyticsCache } from "../lib/redis/cache";

const prisma = new PrismaClient();

const PROBLEM_POOLS: Record<string, string[]> = {
  arrays: [
    "Two Sum", "Contains Duplicate", "Best Time to Buy and Sell Stock", "Product of Array Except Self",
    "Maximum Subarray", "Maximum Product Subarray", "Find Minimum in Rotated Sorted Array",
    "Search in Rotated Sorted Array", "3Sum", "Container With Most Water", "Merge Intervals",
    "Insert Interval", "Non-overlapping Intervals", "Meeting Rooms", "Meeting Rooms II",
    "Rotate Image", "Spiral Matrix", "Set Matrix Zeroes", "Game of Life", "Move Zeroes"
  ],
  strings: [
    "Valid Anagram", "Group Anagrams", "Valid Palindrome", "Longest Palindromic Substring",
    "Palindromic Substrings", "Encode and Decode Strings", "Longest Substring Without Repeating Characters",
    "Longest Repeating Character Replacement", "Minimum Window Substring", "Valid Parentheses",
    "Remove Parentheses", "Reverse String", "Valid Palindrome II", "Implement strStr()",
    "String to Integer (atoi)", "Longest Common Prefix", "Integer to Roman", "Roman to Integer"
  ],
  "hash tables": [
    "Intersection of Two Arrays", "Two Sum II", "Happy Number", "Isomorphic Strings",
    "Word Pattern", "Design HashSet", "Design HashMap", "First Unique Character in a String",
    "Find All Anagrams in a String", "Subarray Sum Equals K"
  ],
  "two pointers": [
    "Valid Palindrome", "3Sum", "Container With Most Water", "Two Sum II - Input Array Is Sorted",
    "Remove Element", "Remove Duplicates from Sorted Array", "Sort Colors", "Merge Sorted Array",
    "Is Subsequence", "Backspace String Compare"
  ],
  "sliding window": [
    "Longest Substring Without Repeating Characters", "Longest Repeating Character Replacement",
    "Minimum Window Substring", "Permutation in String", "Minimum Size Subarray Sum",
    "Sliding Window Maximum", "Find All Anagrams in a String", "Max Consecutive Ones III"
  ],
  "linked lists": [
    "Reverse Linked List", "Detect Cycle in a Linked List", "Merge Two Sorted Lists",
    "Merge K Sorted Lists", "Remove Nth Node From End of List", "Reorder List",
    "Linked List Cycle II", "Copy List with Random Pointer", "Add Two Numbers",
    "Palindrome Linked List", "Intersection of Two Linked Lists", "Remove Linked List Elements"
  ],
  trees: [
    "Maximum Depth of Binary Tree", "Same Tree", "Invert Binary Tree", "Binary Tree Maximum Path Sum",
    "Binary Tree Level Order Traversal", "Serialize and Deserialize Binary Tree", "Subtree of Another Tree",
    "Construct Binary Tree from Preorder and Inorder Traversal", "Validate Binary Search Tree",
    "Kth Smallest Element in a BST", "Lowest Common Ancestor of a BST", "Lowest Common Ancestor of a Binary Tree",
    "Binary Tree Right Side View", "Path Sum", "Path Sum II", "Path Sum III", "Diameter of Binary Tree"
  ],
  graphs: [
    "Clone Graph", "Course Schedule", "Pacific Atlantic Water Flow", "Number of Islands",
    "Longest Consecutive Sequence", "Alien Dictionary", "Graph Valid Tree",
    "Number of Connected Components in an Undirected Graph", "Word Ladder", "Network Delay Time",
    "Cheapest Flights Within K Stops"
  ],
  "dynamic programming": [
    "Climbing Stairs", "Coin Change", "Longest Increasing Subsequence", "Longest Common Subsequence",
    "Word Break", "Combination Sum IV", "House Robber", "House Robber II", "Decode Ways",
    "Unique Paths", "Jump Game", "Edit Distance", "Partition Equal Subset Sum", "Knapsack 0/1"
  ],
  greedy: [
    "Jump Game", "Jump Game II", "Gas Station", "Candy", "Assign Cookies", "Task Scheduler",
    "Partition Labels", "Valid Parenthesis String", "Queue Reconstruction by Height"
  ],
  sorting: [
    "Merge Sort", "Quick Sort", "Heap Sort", "Sort an Array", "Kth Largest Element in an Array",
    "Top K Frequent Elements", "Sort Colors", "Largest Number", "Car Fleet"
  ],
  "binary search": [
    "Binary Search", "Search a 2D Matrix", "Find Minimum in Rotated Sorted Array",
    "Search in Rotated Sorted Array", "Search Insert Position", "First and Last Position of Element",
    "Find Peak Element", "Capacity To Ship Packages Within D Days", "Koko Eating Bananas"
  ],
  heaps: [
    "Kth Largest Element in an Array", "Top K Frequent Elements", "Find Median from Data Stream",
    "Merge K Sorted Lists", "Smallest Number in Infinite Set", "K Closest Points to Origin"
  ],
  stacks: [
    "Valid Parentheses", "Min Stack", "Evaluate Reverse Polish Notation", "Daily Temperatures",
    "Generate Parentheses", "Largest Rectangle in Histogram", "Trapping Rain Water"
  ],
  recursion: [
    "Generate Parentheses", "Letter Combinations of a Phone Number", "Subsets", "Subsets II",
    "Permutations", "Permutations II", "Combinations", "Sudoku Solver", "N-Queens"
  ],
  "bit manipulation": [
    "Number of 1 Bits", "Counting Bits", "Reverse Bits", "Missing Number",
    "Sum of Two Integers", "Single Number", "Single Number II"
  ]
};

const TOPICS = Object.keys(PROBLEM_POOLS);

const LANGUAGES = ["Python", "JavaScript", "C++", "Java", "Go", "Rust"];

const TIME_COMPLEXITIES = ["O(1)", "O(log N)", "O(N)", "O(N log N)", "O(N^2)", "O(2^N)"];
const SPACE_COMPLEXITIES = ["O(1)", "O(N)", "O(N^2)"];

const MOCK_CODES: Record<string, string> = {
  Python: `def solve(nums):\n    # Optimized solution\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []`,
  JavaScript: `function solve(nums) {\n  // Optimized solution\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (seen.has(diff)) {\n      return [seen.get(diff), i];\n    }\n    seen.set(nums[i], i);\n  }\n  return [];\n}`,
  "C++": `vector<int> solve(vector<int>& nums) {\n    unordered_map<int, int> seen;\n    for (int i = 0; i < nums.size(); ++i) {\n        int diff = target - nums[i];\n        if (seen.count(diff)) {\n            return {seen[diff], i};\n        }\n        seen[nums[i]] = i;\n    }\n    return {};\n}`,
  Java: `class Solution {\n    public int[] solve(int[] nums, int target) {\n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int diff = target - nums[i];\n            if (seen.containsKey(diff)) {\n                return new int[] { seen.get(diff), i };\n            }\n            seen.put(nums[i], i);\n        }\n        return new int[0];\n    }\n}`
};

async function main() {
  const userId = "d82cc0fc-cdfb-494e-a0e0-976810ce987c";

  // Check if target user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error(`User with ID ${userId} not found in database.`);
    return;
  }

  console.log(`Starting clean seed for user: ${user.email} (${user.id})`);

  // Delete all existing user-specific data to start fresh and avoid constraints
  console.log("Cleaning existing records...");
  await prisma.problem.deleteMany({ where: { userId } });
  await prisma.sheet.deleteMany({ where: { userId } });
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.analyticsCache.deleteMany({ where: { userId } });

  // Load companies and patterns to associate
  const allCompanies = await prisma.companyTag.findMany();
  const allPatterns = await prisma.pattern.findMany();

  console.log(`Loaded ${allCompanies.length} companies and ${allPatterns.length} patterns.`);

  // Create sheets
  console.log("Creating sheets...");
  const sheetNames = [
    "LeetCode Top 100", "Graphs Masterclass", "Dynamic Programming Deep Dive",
    "Recursion & Backtracking", "System Design Coding", "Bit Manipulation Essentials",
    "Two Pointer Classics", "Sliding Window Patterns"
  ];
  
  const sheets = [];
  for (let i = 0; i < sheetNames.length; i++) {
    const sheet = await prisma.sheet.create({
      data: {
        userId,
        name: sheetNames[i],
        description: `Curated list for ${sheetNames[i]} pattern practice.`,
        isPublic: Math.random() > 0.5,
        shareSlug: `${sheetNames[i].toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.floor(Math.random() * 10000)}`
      }
    });
    sheets.push(sheet);
  }

  // Iterate over the last 365 days
  console.log("Generating 1 year of daily problem solves (3-5 per day)...");
  const now = new Date();
  const problemsToInsert: any[] = [];
  const solutionsToInsert: any[] = [];
  const notesToInsert: any[] = [];
  const remindersToInsert: any[] = [];
  const revisitCyclesToInsert: any[] = [];

  let globalProblemNum = 1;
  const createdProblemIds: string[] = [];

  for (let d = 365; d >= 0; d--) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - d);
    
    // Set consistent hours/mins to make it look like they solved it during the day
    targetDate.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);

    // 3 to 5 solves daily
    const dailyCount = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5

    for (let c = 0; c < dailyCount; c++) {
      const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
      const pool = PROBLEM_POOLS[topic];
      const baseName = pool[Math.floor(Math.random() * pool.length)];
      
      // Add a slight suffix or random variation if duplicates occur
      const problemName = `${baseName} (Set ${Math.floor(globalProblemNum / 30) + 1})`;
      
      const difficultyRoll = Math.random();
      let difficulty = "MED";
      let diffColor = "text-amber-500 bg-amber-500/10";
      if (difficultyRoll < 0.35) {
        difficulty = "EASY";
        diffColor = "text-emerald-500 bg-emerald-500/10";
      } else if (difficultyRoll > 0.85) {
        difficulty = "HARD";
        diffColor = "text-rose-500 bg-rose-500/10";
      }

      const problemId = `p-${globalProblemNum}-${Math.floor(Math.random() * 1000000)}`;

      problemsToInsert.push({
        id: problemId,
        userId,
        num: globalProblemNum,
        name: problemName,
        url: `https://leetcode.com/problems/${problemName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        sourcePlatform: "leetcode",
        topic,
        difficulty,
        diffColor,
        status: "Solved",
        statusColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        interval: "Recall Stage 3d",
        isFavorite: Math.random() > 0.9,
        isPublic: Math.random() > 0.8,
        solvedAt: targetDate,
        createdAt: targetDate,
        updatedAt: targetDate
      });

      createdProblemIds.push(problemId);

      // Create a solution
      const lang = LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)];
      const time = TIME_COMPLEXITIES[Math.floor(Math.random() * TIME_COMPLEXITIES.length)];
      const space = SPACE_COMPLEXITIES[Math.floor(Math.random() * SPACE_COMPLEXITIES.length)];
      const code = MOCK_CODES[lang] || MOCK_CODES["Python"];

      const solutionId = `sol-${globalProblemNum}-${Math.floor(Math.random() * 1000000)}`;
      solutionsToInsert.push({
        id: solutionId,
        problemId,
        userId,
        name: `${lang} Optimized Solution`,
        lang,
        intuition: `Using optimal approach for ${topic}.`,
        approach: `We can optimize time complexity to ${time} and space complexity to ${space}.`,
        code,
        time,
        space,
        tags: [topic, lang.toLowerCase()],
        createdAt: targetDate,
        updatedAt: targetDate
      });

      // 10% chance of a general note
      if (Math.random() < 0.1) {
        notesToInsert.push({
          id: `note-${globalProblemNum}-${Math.floor(Math.random() * 1000000)}`,
          problemId,
          userId,
          type: "note",
          text: `Remember to handle edge cases for ${problemName}.`,
          isShared: Math.random() > 0.8,
          createdAt: targetDate,
          updatedAt: targetDate
        });
      }

      // If the problem was solved in the last 7 days, let's create a reminder due in the future
      if (d <= 7) {
        const dueDate = new Date(targetDate);
        dueDate.setDate(dueDate.getDate() + 3); // due in 3 days
        remindersToInsert.push({
          id: `rem-${globalProblemNum}-${Math.floor(Math.random() * 1000000)}`,
          problemId,
          userId,
          dueDate,
          stage: "Recall Stage 3d",
          cycle: 1,
          status: "PENDING",
          createdAt: targetDate
        });

        // and revisit cycle
        revisitCyclesToInsert.push({
          id: `rc-${globalProblemNum}-${Math.floor(Math.random() * 1000000)}`,
          problemId,
          userId,
          cycleNumber: 1,
          status: "active",
          startedAt: targetDate,
          createdAt: targetDate
        });
      }

      globalProblemNum++;
    }
  }

  // Insert problems in chunks
  console.log(`Writing ${problemsToInsert.length} problems to database...`);
  const chunkSize = 100;
  for (let i = 0; i < problemsToInsert.length; i += chunkSize) {
    const chunk = problemsToInsert.slice(i, i + chunkSize);
    await prisma.problem.createMany({ data: chunk });
  }

  console.log(`Writing ${solutionsToInsert.length} solutions to database...`);
  for (let i = 0; i < solutionsToInsert.length; i += chunkSize) {
    const chunk = solutionsToInsert.slice(i, i + chunkSize);
    await prisma.solution.createMany({ data: chunk });
  }

  if (notesToInsert.length > 0) {
    console.log(`Writing ${notesToInsert.length} notes...`);
    for (let i = 0; i < notesToInsert.length; i += chunkSize) {
      const chunk = notesToInsert.slice(i, i + chunkSize);
      await prisma.note.createMany({ data: chunk });
    }
  }

  if (remindersToInsert.length > 0) {
    console.log(`Writing ${remindersToInsert.length} reminders...`);
    await prisma.reminder.createMany({ data: remindersToInsert });
  }

  if (revisitCyclesToInsert.length > 0) {
    console.log(`Writing ${revisitCyclesToInsert.length} revisit cycles...`);
    await prisma.srsRevisitCycle.createMany({ data: revisitCyclesToInsert });
  }

  // Relate problems to companies and patterns
  console.log("Relating problems to companies and patterns...");
  const problemCompaniesToInsert = [];
  const problemPatternsToInsert = [];

  for (const pid of createdProblemIds) {
    // 60% chance to have 1-2 companies
    if (Math.random() < 0.6) {
      const companyCount = Math.floor(Math.random() * 2) + 1;
      const shuffledCompanies = [...allCompanies].sort(() => 0.5 - Math.random());
      for (let k = 0; k < Math.min(companyCount, shuffledCompanies.length); k++) {
        problemCompaniesToInsert.push({
          problemId: pid,
          companyId: shuffledCompanies[k].id
        });
      }
    }

    // 70% chance to have 1 pattern
    if (Math.random() < 0.7 && allPatterns.length > 0) {
      const randomPattern = allPatterns[Math.floor(Math.random() * allPatterns.length)];
      problemPatternsToInsert.push({
        problemId: pid,
        patternId: randomPattern.id
      });
    }
  }

  if (problemCompaniesToInsert.length > 0) {
    console.log(`Inserting ${problemCompaniesToInsert.length} problem-company associations...`);
    for (let i = 0; i < problemCompaniesToInsert.length; i += chunkSize) {
      const chunk = problemCompaniesToInsert.slice(i, i + chunkSize);
      await prisma.problemCompany.createMany({ data: chunk });
    }
  }

  if (problemPatternsToInsert.length > 0) {
    console.log(`Inserting ${problemPatternsToInsert.length} problem-pattern associations...`);
    for (let i = 0; i < problemPatternsToInsert.length; i += chunkSize) {
      const chunk = problemPatternsToInsert.slice(i, i + chunkSize);
      await prisma.problemPattern.createMany({ data: chunk });
    }
  }

  // Populate SheetProblem relationships
  console.log("Adding problems to sheets...");
  const sheetProblemsToInsert = [];
  for (const sheet of sheets) {
    // Select 10-15 random problems
    const shuffledProblemIds = [...createdProblemIds].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 6) + 10; // 10 to 15
    for (let o = 0; o < Math.min(count, shuffledProblemIds.length); o++) {
      sheetProblemsToInsert.push({
        sheetId: sheet.id,
        problemId: shuffledProblemIds[o],
        order: o
      });
    }
  }

  if (sheetProblemsToInsert.length > 0) {
    console.log(`Inserting ${sheetProblemsToInsert.length} sheet-problem associations...`);
    await prisma.sheetProblem.createMany({ data: sheetProblemsToInsert });
  }

  // Create some notifications for the user
  console.log("Generating notifications...");
  const notifications = [
    { userId, type: "system", message: "Welcome to CodeVault! Your premium space-repetition tracks are initialized.", isRead: true, createdAt: new Date(now.getTime() - 10 * 24 * 3600 * 1000) },
    { userId, type: "reminder", message: "Recall Stage 3d: 5 problems are due for revisit today.", isRead: false, createdAt: new Date(now.getTime() - 2 * 3600 * 1000) },
    { userId, type: "sheet", message: "Your sheet 'Dynamic Programming Deep Dive' has been shared successfully.", isRead: false, createdAt: new Date(now.getTime() - 50 * 60 * 1000) }
  ];
  await prisma.notification.createMany({ data: notifications });

  // Invalidate Redis/DB caches to trigger recalculation of analytics
  console.log("Invalidating analytics cache...");
  await invalidateAnalyticsCache(userId);

  console.log("Seeding script completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error running seed script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
