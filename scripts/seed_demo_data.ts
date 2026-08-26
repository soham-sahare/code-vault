import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Automatically load .env, .env.local, etc.
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

// ==============================================================================
// 1. DATA DEFINITIONS & TOPIC POOLS
// ==============================================================================

const COMPANIES = [
  { name: "Google", slug: "google", logoUrl: "https://logo.clearbit.com/google.com" },
  { name: "Meta", slug: "meta", logoUrl: "https://logo.clearbit.com/meta.com" },
  { name: "Amazon", slug: "amazon", logoUrl: "https://logo.clearbit.com/amazon.com" },
  { name: "Apple", slug: "apple", logoUrl: "https://logo.clearbit.com/apple.com" },
  { name: "Microsoft", slug: "microsoft", logoUrl: "https://logo.clearbit.com/microsoft.com" },
  { name: "Uber", slug: "uber", logoUrl: "https://logo.clearbit.com/uber.com" },
  { name: "Netflix", slug: "netflix", logoUrl: "https://logo.clearbit.com/netflix.com" },
  { name: "Bloomberg", slug: "bloomberg", logoUrl: "https://logo.clearbit.com/bloomberg.com" },
];

const PATTERNS = [
  { name: "Two Pointers", slug: "two-pointers", parentTopic: "Arrays & Strings", description: "Iterate from both ends or distinct indices toward each other." },
  { name: "Sliding Window", slug: "sliding-window", parentTopic: "Arrays & Strings", description: "Maintain a dynamic contiguous subarray window." },
  { name: "Fast & Slow Pointers", slug: "fast-slow-pointers", parentTopic: "Linked List", description: "Hare & Tortoise cycle detection." },
  { name: "Merge Intervals", slug: "merge-intervals", parentTopic: "Intervals", description: "Sort intervals by start time and resolve overlaps." },
  { name: "Monotonic Stack", slug: "monotonic-stack", parentTopic: "Stack", description: "Maintain monotonically increasing or decreasing elements for next greater/smaller." },
  { name: "Tree BFS / Level Order", slug: "tree-bfs", parentTopic: "Trees", description: "Queue-based traversal exploring layer by layer." },
  { name: "Tree DFS / Postorder", slug: "tree-dfs", parentTopic: "Trees", description: "Recursive bottom-up sub-tree state aggregation." },
  { name: "Top K Elements / Heap", slug: "top-k-heap", parentTopic: "Heap", description: "Min/Max Heap for streaming $K$-th extreme elements." },
  { name: "0/1 Knapsack & Subset DP", slug: "knapsack-dp", parentTopic: "Dynamic Programming", description: "Decision tree optimization over include/exclude states." },
  { name: "Topological Sort / Kahn", slug: "topological-sort", parentTopic: "Graphs", description: "Indegree resolution on Directed Acyclic Graphs (DAGs)." },
  { name: "Binary Search On Answer", slug: "binary-search-answer", parentTopic: "Binary Search", description: "Monotonic feasibility check over output search space." },
  { name: "Trie Prefix Search", slug: "trie-prefix", parentTopic: "Trie", description: "Prefix tree representation for string dictionary lookups." },
];

interface ProblemSeedTemplate {
  num: number;
  name: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  companies: string[];
  patterns: string[];
  url?: string;
  notes: string[];
  solutions: Array<{
    name: string;
    lang: string;
    intuition: string;
    approach: string;
    code: string;
    time: string;
    space: string;
    tags: string[];
  }>;
}

const PROBLEM_BANK: ProblemSeedTemplate[] = [
  {
    num: 1,
    name: "Two Sum",
    topic: "Arrays & Hashing",
    difficulty: "Easy",
    companies: ["google", "meta", "amazon", "apple"],
    patterns: ["two-pointers"],
    url: "https://leetcode.com/problems/two-sum/",
    notes: [
      "Crucial: Store the value's index, not the value itself, in the hash map.",
      "Check if complement exists BEFORE inserting current index to avoid self-pairing.",
    ],
    solutions: [
      {
        name: "One-Pass Hash Map (Optimal)",
        lang: "Python",
        intuition: "As we iterate through the array, compute complement = target - num. If complement is in seen map, pair is found in O(1).",
        approach: "1. Initialize empty hash map seen = {}\n2. For index i, value num in enumerate(nums):\n   complement = target - num\n   if complement in seen: return [seen[complement], i]\n   seen[num] = i",
        code: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
        time: "O(N)",
        space: "O(N)",
        tags: ["hash-map", "array", "lookup"],
      },
      {
        name: "Two Pointers with Sorting",
        lang: "C++",
        intuition: "Sort elements while preserving indices. Squeeze left and right pointers towards target sum.",
        approach: "1. Pair each element with original index and sort by value.\n2. L = 0, R = n - 1.\n3. While L < R: compare sum to target.",
        code: `#include <vector>
#include <algorithm>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    vector<pair<int, int>> indexed;
    for (int i = 0; i < nums.size(); ++i) indexed.push_back({nums[i], i});
    sort(indexed.begin(), indexed.end());
    int l = 0, r = nums.size() - 1;
    while (l < r) {
        int sum = indexed[l].first + indexed[r].first;
        if (sum == target) return {indexed[l].second, indexed[r].second};
        else if (sum < target) l++;
        else r--;
    }
    return {};
}`,
        time: "O(N log N)",
        space: "O(N)",
        tags: ["two-pointers", "sorting"],
      },
    ],
  },
  {
    num: 3,
    name: "Longest Substring Without Repeating Characters",
    topic: "Sliding Window",
    difficulty: "Medium",
    companies: ["amazon", "meta", "google", "bloomberg"],
    patterns: ["sliding-window"],
    url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    notes: [
      "When duplicate found, jump start pointer past previous occurrence: left = max(left, last_idx + 1).",
      "Be mindful of 0-indexed string slicing.",
    ],
    solutions: [
      {
        name: "Optimized Sliding Window with Map",
        lang: "TypeScript",
        intuition: "Track the most recent index of each character. When a duplicate is seen within the active window, shift the left pointer past it.",
        approach: "1. charMap stores char -> last index.\n2. For right pointer 0..n-1:\n   if charMap has s[right] and >= left, left = charMap[s[right]] + 1.\n   maxLen = max(maxLen, right - left + 1)\n   charMap[s[right]] = right",
        code: `function lengthOfLongestSubstring(s: string): number {
  const map = new Map<string, number>();
  let maxLen = 0;
  let left = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    if (map.has(char) && map.get(char)! >= left) {
      left = map.get(char)! + 1;
    }
    map.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`,
        time: "O(N)",
        space: "O(min(N, M))",
        tags: ["sliding-window", "hash-map", "string"],
      },
    ],
  },
  {
    num: 15,
    name: "3Sum",
    topic: "Two Pointers",
    difficulty: "Medium",
    companies: ["meta", "amazon", "apple", "uber"],
    patterns: ["two-pointers"],
    url: "https://leetcode.com/problems/3sum/",
    notes: [
      "Skip duplicate anchor elements: if i > 0 and nums[i] == nums[i-1]: continue.",
      "Skip duplicates on left and right pointers after finding a valid triplet.",
    ],
    solutions: [
      {
        name: "Sort + Two Pointers",
        lang: "Python",
        intuition: "Sort array first. Fix one number nums[i], then use two pointers on the remaining subarray to find two numbers summing to -nums[i].",
        approach: "1. Sort nums.\n2. Iterate i from 0 to n-3. Skip duplicates for i.\n3. Left = i + 1, Right = n - 1.\n4. If sum == 0: record triplet, skip duplicates for L & R, then L++, R--.",
        code: `def threeSum(nums: list[int]) -> list[list[int]]:
    nums.sort()
    res = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s < 0:
                l += 1
            elif s > 0:
                r -= 1
            else:
                res.append([nums[i], nums[l], nums[r]])
                while l < r and nums[l] == nums[l + 1]:
                    l += 1
                while l < r and nums[r] == nums[r - 1]:
                    r -= 1
                l += 1
                r -= 1
    return res`,
        time: "O(N^2)",
        space: "O(1) extra space",
        tags: ["two-pointers", "sorting", "array"],
      },
    ],
  },
  {
    num: 20,
    name: "Valid Parentheses",
    topic: "Stack",
    difficulty: "Easy",
    companies: ["google", "meta", "amazon", "microsoft"],
    patterns: ["monotonic-stack"],
    url: "https://leetcode.com/problems/valid-parentheses/",
    notes: [
      "Check if stack is empty before popping.",
      "Ensure stack is empty at the end (for unbalanced openings like '(').",
    ],
    solutions: [
      {
        name: "Stack with Matching Map",
        lang: "Python",
        intuition: "Push opening brackets. On closing bracket, pop top and ensure matching pair.",
        approach: "1. mapping = {')': '(', '}': '{', ']': '['}\n2. Stack = []\n3. Return len(stack) == 0 at finish.",
        code: `def isValid(s: str) -> bool:
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack`,
        time: "O(N)",
        space: "O(N)",
        tags: ["stack", "string"],
      },
    ],
  },
  {
    num: 42,
    name: "Trapping Rain Water",
    topic: "Two Pointers",
    difficulty: "Hard",
    companies: ["google", "amazon", "meta", "bloomberg"],
    patterns: ["two-pointers", "monotonic-stack"],
    url: "https://leetcode.com/problems/trapping-rain-water/",
    notes: [
      "Water above index i is bounded by min(max_left, max_right) - height[i].",
      "Two pointers can solve this in O(1) space because the smaller max boundary always dictates water capacity.",
    ],
    solutions: [
      {
        name: "Two Pointers (O(1) Space)",
        lang: "Python",
        intuition: "Maintain left_max and right_max. Move pointer with smaller max boundary inward.",
        approach: "1. l, r = 0, n - 1\n2. While l < r:\n   if left_max < right_max: water += left_max - height[l], l++\n   else: water += right_max - height[r], r--",
        code: `def trap(height: list[int]) -> int:
    if not height:
        return 0
    l, r = 0, len(height) - 1
    left_max, right_max = height[l], height[r]
    water = 0
    while l < r:
        if left_max < right_max:
            l += 1
            left_max = max(left_max, height[l])
            water += left_max - height[l]
        else:
            r -= 1
            right_max = max(right_max, height[r])
            water += right_max - height[r]
    return water`,
        time: "O(N)",
        space: "O(1)",
        tags: ["two-pointers", "dynamic-programming", "monotonic-stack"],
      },
    ],
  },
  {
    num: 53,
    name: "Maximum Subarray",
    topic: "Dynamic Programming",
    difficulty: "Medium",
    companies: ["amazon", "microsoft", "apple", "google"],
    patterns: ["0/1 Knapsack & Subset DP"],
    url: "https://leetcode.com/problems/maximum-subarray/",
    notes: [
      "Kadane's algorithm: curr_sum = max(num, curr_sum + num).",
      "Handles all negative arrays correctly by taking maximum single element.",
    ],
    solutions: [
      {
        name: "Kadane's Algorithm",
        lang: "Java",
        intuition: "At each step, decide whether to extend the existing subarray or start fresh from the current element.",
        approach: "1. max_so_far = nums[0], curr_max = nums[0]\n2. Loop i from 1 to n-1: curr_max = max(nums[i], curr_max + nums[i])\n3. max_so_far = max(max_so_far, curr_max)",
        code: `public class Solution {
    public int maxSubArray(int[] nums) {
        int maxSoFar = nums[0];
        int currMax = nums[0];
        for (int i = 1; i < nums.length; i++) {
            currMax = Math.max(nums[i], currMax + nums[i]);
            maxSoFar = Math.max(maxSoFar, currMax);
        }
        return maxSoFar;
    }
}`,
        time: "O(N)",
        space: "O(1)",
        tags: ["kadanes-algorithm", "dynamic-programming", "array"],
      },
    ],
  },
  {
    num: 70,
    name: "Climbing Stairs",
    topic: "Dynamic Programming",
    difficulty: "Easy",
    companies: ["amazon", "google", "apple"],
    patterns: ["0/1 Knapsack & Subset DP"],
    url: "https://leetcode.com/problems/climbing-stairs/",
    notes: ["Fibonacci sequence recurrence relation: dp[i] = dp[i-1] + dp[i-2]."],
    solutions: [
      {
        name: "Constant Space Fibonacci",
        lang: "Python",
        intuition: "To reach step n, you must step from n-1 or n-2. Keep only two previous states.",
        approach: "a, b = 1, 1; for _ in range(n-1): a, b = b, a + b; return b",
        code: `def climbStairs(n: int) -> int:
    a, b = 1, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b`,
        time: "O(N)",
        space: "O(1)",
        tags: ["dynamic-programming", "fibonacci", "math"],
      },
    ],
  },
  {
    num: 98,
    name: "Validate Binary Search Tree",
    topic: "Trees",
    difficulty: "Medium",
    companies: ["meta", "amazon", "microsoft", "bloomberg"],
    patterns: ["tree-dfs"],
    url: "https://leetcode.com/problems/validate-binary-search-tree/",
    notes: [
      "Do not just check node.left < node.val and node.right > node.val. Entire subtrees must satisfy bounds (min_val, max_val).",
    ],
    solutions: [
      {
        name: "Recursive DFS with Min/Max Bounds",
        lang: "Python",
        intuition: "Pass valid range down the recursion tree. Left child upper bound is current node, right child lower bound is current node.",
        approach: "validate(node, low, high): if not node: return True; if not (low < node.val < high): return False; return validate(left, low, node.val) and validate(right, node.val, high)",
        code: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def isValidBST(root: TreeNode) -> bool:
    def validate(node, low=float('-inf'), high=float('inf')):
        if not node:
            return True
        if node.val <= low or node.val >= high:
            return False
        return validate(node.left, low, node.val) and validate(node.right, node.val, high)
    return validate(root)`,
        time: "O(N)",
        space: "O(H) where H is tree height",
        tags: ["tree", "depth-first-search", "binary-search-tree"],
      },
    ],
  },
  {
    num: 121,
    name: "Best Time to Buy and Sell Stock",
    topic: "Arrays & Hashing",
    difficulty: "Easy",
    companies: ["amazon", "meta", "apple", "google", "microsoft"],
    patterns: ["two-pointers", "sliding-window"],
    url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    notes: ["Maintain minimum price seen so far and maximum profit achievable."],
    solutions: [
      {
        name: "Single Pass Track Min",
        lang: "TypeScript",
        intuition: "Record the lowest price seen so far. At each day, calculate profit if sold today and update maxProfit.",
        approach: "1. minPrice = Infinity, maxProfit = 0\n2. For price in prices: minPrice = min(minPrice, price), maxProfit = max(maxProfit, price - minPrice)",
        code: `function maxProfit(prices: number[]): number {
  let minPrice = Infinity;
  let maxProfit = 0;
  for (const price of prices) {
    if (price < minPrice) minPrice = price;
    else if (price - minPrice > maxProfit) maxProfit = price - minPrice;
  }
  return maxProfit;
}`,
        time: "O(N)",
        space: "O(1)",
        tags: ["array", "dynamic-programming", "greedy"],
      },
    ],
  },
  {
    num: 146,
    name: "LRU Cache",
    topic: "Linked List",
    difficulty: "Medium",
    companies: ["meta", "amazon", "google", "microsoft", "uber", "netflix"],
    patterns: ["fast-slow-pointers"],
    url: "https://leetcode.com/problems/lru-cache/",
    notes: [
      "Doubly Linked List + Hash Map provides O(1) get and O(1) put.",
      "Use dummy head and tail nodes to eliminate edge-case null checks.",
    ],
    solutions: [
      {
        name: "Hash Map + Doubly Linked List",
        lang: "Python",
        intuition: "Map stores key -> Node. Doubly Linked list maintains MRU at head, LRU at tail. Removing and inserting nodes is O(1).",
        approach: "1. Node class with key, value, prev, next.\n2. get(key): if key in cache, remove node and insert at head, return val.\n3. put(key, val): if exists, update and move to head; if full, remove tail.prev node.",
        code: `class Node:
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {}
        self.head, self.tail = Node(), Node()
        self.head.next, self.tail.prev = self.tail, self.head

    def _remove(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add_head(self, node):
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: int) -> int:
        if key in self.cache:
            node = self.cache[key]
            self._remove(node)
            self._add_head(node)
            return node.val
        return -1

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self._remove(self.cache[key])
        node = Node(key, value)
        self.cache[key] = node
        self._add_head(node)
        if len(self.cache) > self.cap:
            lru = self.tail.prev
            self._remove(lru)
            del self.cache[lru.key]`,
        time: "O(1) Get and Put",
        space: "O(Capacity)",
        tags: ["hash-table", "linked-list", "design", "doubly-linked-list"],
      },
    ],
  },
  {
    num: 200,
    name: "Number of Islands",
    topic: "Graphs",
    difficulty: "Medium",
    companies: ["amazon", "meta", "google", "microsoft", "bloomberg"],
    patterns: ["tree-bfs"],
    url: "https://leetcode.com/problems/number-of-islands/",
    notes: [
      "Sink visited land cells in-place ('1' -> '0') to avoid a separate visited hash set.",
      "Check row and col bounds carefully before recursion.",
    ],
    solutions: [
      {
        name: "DFS Grid Traversal (In-place Sinking)",
        lang: "Python",
        intuition: "Iterate through each cell. When '1' is found, increment island count and trigger DFS flood fill to sink all connected '1's to '0'.",
        approach: "1. loop r in 0..rows, c in 0..cols\n2. if grid[r][c] == '1': count++, dfs(r, c)\n3. dfs marks cell '0' and recurses in 4 cardinal directions.",
        code: `def numIslands(grid: list[list[str]]) -> int:
    if not grid:
        return 0
    rows, cols = len(grid), len(grid[0])
    count = 0

    def dfs(r, c):
        if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != '1':
            return
        grid[r][c] = '0'
        dfs(r + 1, c)
        dfs(r - 1, c)
        dfs(r, c + 1)
        dfs(r, c - 1)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1':
                count += 1
                dfs(r, c)
    return count`,
        time: "O(M * N)",
        space: "O(M * N) recursion call stack",
        tags: ["depth-first-search", "breadth-first-search", "matrix", "graph"],
      },
    ],
  },
  {
    num: 206,
    name: "Reverse Linked List",
    topic: "Linked List",
    difficulty: "Easy",
    companies: ["amazon", "apple", "google", "meta"],
    patterns: ["fast-slow-pointers"],
    url: "https://leetcode.com/problems/reverse-linked-list/",
    notes: ["Store next node before overwriting curr.next: next_temp = curr.next."],
    solutions: [
      {
        name: "Iterative 3-Pointer Reversal",
        lang: "TypeScript",
        intuition: "Maintain prev, curr, and next pointers. Re-orient curr.next to prev at each node.",
        approach: "prev = null, curr = head; while (curr) { next = curr.next; curr.next = prev; prev = curr; curr = next; } return prev;",
        code: `function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr = head;
  while (curr !== null) {
    const nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  return prev;
}`,
        time: "O(N)",
        space: "O(1)",
        tags: ["linked-list", "pointers"],
      },
    ],
  },
  {
    num: 207,
    name: "Course Schedule",
    topic: "Graphs",
    difficulty: "Medium",
    companies: ["google", "amazon", "meta", "microsoft"],
    patterns: ["topological-sort"],
    url: "https://leetcode.com/problems/course-schedule/",
    notes: ["Cycle detection in directed graph using Kahn's Algorithm (in-degree array + queue)."],
    solutions: [
      {
        name: "Kahn's Algorithm (BFS Topological Sort)",
        lang: "Python",
        intuition: "Count in-degree for every course. Queue courses with 0 in-degree. Pop course, decrement neighbors. If processed courses == numCourses, valid.",
        approach: "1. Build adjacency list and in-degree table.\n2. Queue courses with in-degree 0.\n3. While queue: pop, count++, decrement neighbor in-degrees, if 0 enqueue.\n4. Return count == numCourses.",
        code: `from collections import deque

def canFinish(numCourses: int, prerequisites: list[list[int]]) -> bool:
    adj = {i: [] for i in range(numCourses)}
    indegree = [0] * numCourses
    for dest, src in prerequisites:
        adj[src].append(dest)
        indegree[dest] += 1

    q = deque([i for i in range(numCourses) if indegree[i] == 0])
    taken = 0
    while q:
        curr = q.popleft()
        taken += 1
        for neighbor in adj[curr]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                q.append(neighbor)
    return taken == numCourses`,
        time: "O(V + E)",
        space: "O(V + E)",
        tags: ["topological-sort", "graph", "bfs", "kahn"],
      },
    ],
  },
  {
    num: 215,
    name: "Kth Largest Element in an Array",
    topic: "Heap",
    difficulty: "Medium",
    companies: ["meta", "amazon", "apple", "google"],
    patterns: ["top-k-heap"],
    url: "https://leetcode.com/problems/kth-largest-element-in-an-array/",
    notes: ["Min-Heap of size K maintains the K largest elements. Top element is the K-th largest."],
    solutions: [
      {
        name: "Min Heap of Size K",
        lang: "Python",
        intuition: "Push elements into min-heap. When heap size exceeds K, pop smallest. The remaining root is the Kth largest.",
        approach: "heap = []; for num in nums: heappush(heap, num); if len(heap) > k: heappop(heap); return heap[0]",
        code: `import heapq

def findKthLargest(nums: list[int], k: int) -> int:
    min_heap = []
    for num in nums:
        heapq.heappush(min_heap, num)
        if len(min_heap) > k:
            heapq.heappop(min_heap)
    return min_heap[0]`,
        time: "O(N log K)",
        space: "O(K)",
        tags: ["heap", "priority-queue", "sorting"],
      },
    ],
  },
  {
    num: 300,
    name: "Longest Increasing Subsequence",
    topic: "Dynamic Programming",
    difficulty: "Medium",
    companies: ["google", "meta", "microsoft", "amazon"],
    patterns: ["binary-search-answer", "0/1 Knapsack & Subset DP"],
    url: "https://leetcode.com/problems/longest-increasing-subsequence/",
    notes: [
      "DP O(N^2) vs Patience Sorting + Binary Search O(N log N).",
      "tails[i] stores smallest tail of all increasing subsequences of length i+1.",
    ],
    solutions: [
      {
        name: "Patience Sorting with Binary Search",
        lang: "Python",
        intuition: "Maintain an array tails. For each num, binary search position in tails. If num > all elements, append; else overwrite smallest element >= num.",
        approach: "import bisect; tails = []; for x in nums: idx = bisect_left(tails, x); if idx == len(tails): tails.append(x); else: tails[idx] = x; return len(tails)",
        code: `import bisect

def lengthOfLIS(nums: list[int]) -> int:
    tails = []
    for x in nums:
        idx = bisect.bisect_left(tails, x)
        if idx == len(tails):
            tails.append(x)
        else:
            tails[idx] = x
    return len(tails)`,
        time: "O(N log N)",
        space: "O(N)",
        tags: ["binary-search", "dynamic-programming", "patience-sorting"],
      },
    ],
  },
];

// Additional procedural templates to populate remaining 90 days with variety
const TOPICS = [
  "Arrays & Hashing",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Binary Search",
  "Linked List",
  "Trees",
  "Tries",
  "Heap",
  "Backtracking",
  "Graphs",
  "Dynamic Programming",
  "Intervals",
  "Greedy",
];

const PROBLEM_NAMES_POOL = [
  { name: "Container With Most Water", diff: "Medium" as const, topic: "Two Pointers" },
  { name: "Merge Two Sorted Lists", diff: "Easy" as const, topic: "Linked List" },
  { name: "Merge k Sorted Lists", diff: "Hard" as const, topic: "Heap" },
  { name: "Search in Rotated Sorted Array", diff: "Medium" as const, topic: "Binary Search" },
  { name: "Combination Sum", diff: "Medium" as const, topic: "Backtracking" },
  { name: "Word Search", diff: "Medium" as const, topic: "Backtracking" },
  { name: "Subsets", diff: "Medium" as const, topic: "Backtracking" },
  { name: "Binary Tree Level Order Traversal", diff: "Medium" as const, topic: "Trees" },
  { name: "Maximum Depth of Binary Tree", diff: "Easy" as const, topic: "Trees" },
  { name: "Invert Binary Tree", diff: "Easy" as const, topic: "Trees" },
  { name: "Lowest Common Ancestor of a BST", diff: "Medium" as const, topic: "Trees" },
  { name: "Implement Trie (Prefix Tree)", diff: "Medium" as const, topic: "Tries" },
  { name: "Word Break", diff: "Medium" as const, topic: "Dynamic Programming" },
  { name: "Coin Change", diff: "Medium" as const, topic: "Dynamic Programming" },
  { name: "House Robber", diff: "Medium" as const, topic: "Dynamic Programming" },
  { name: "House Robber II", diff: "Medium" as const, topic: "Dynamic Programming" },
  { name: "Decode Ways", diff: "Medium" as const, topic: "Dynamic Programming" },
  { name: "Unique Paths", diff: "Medium" as const, topic: "Dynamic Programming" },
  { name: "Longest Common Subsequence", diff: "Medium" as const, topic: "Dynamic Programming" },
  { name: "Palindromic Substrings", diff: "Medium" as const, topic: "Dynamic Programming" },
  { name: "Pacific Atlantic Water Flow", diff: "Medium" as const, topic: "Graphs" },
  { name: "Clone Graph", diff: "Medium" as const, topic: "Graphs" },
  { name: "Graph Valid Tree", diff: "Medium" as const, topic: "Graphs" },
  { name: "Alien Dictionary", diff: "Hard" as const, topic: "Graphs" },
  { name: "Non-overlapping Intervals", diff: "Medium" as const, topic: "Intervals" },
  { name: "Meeting Rooms II", diff: "Medium" as const, topic: "Intervals" },
  { name: "Minimum Window Substring", diff: "Hard" as const, topic: "Sliding Window" },
  { name: "Median of Two Sorted Arrays", diff: "Hard" as const, topic: "Binary Search" },
  { name: "Serialize and Deserialize Binary Tree", diff: "Hard" as const, topic: "Trees" },
  { name: "Word Ladder", diff: "Hard" as const, topic: "Graphs" },
  { name: "Find Median from Data Stream", diff: "Hard" as const, topic: "Heap" },
  { name: "Binary Tree Maximum Path Sum", diff: "Hard" as const, topic: "Trees" },
  { name: "Merge Intervals", diff: "Medium" as const, topic: "Intervals" },
  { name: "Insert Interval", diff: "Medium" as const, topic: "Intervals" },
  { name: "Daily Temperatures", diff: "Medium" as const, topic: "Stack" },
  { name: "Min Stack", diff: "Medium" as const, topic: "Stack" },
  { name: "Evaluate Reverse Polish Notation", diff: "Medium" as const, topic: "Stack" },
  { name: "Generate Parentheses", diff: "Medium" as const, topic: "Backtracking" },
  { name: "Koko Eating Bananas", diff: "Medium" as const, topic: "Binary Search" },
  { name: "Find Minimum in Rotated Sorted Array", diff: "Medium" as const, topic: "Binary Search" },
  { name: "Reorder List", diff: "Medium" as const, topic: "Linked List" },
  { name: "Remove Nth Node From End of List", diff: "Medium" as const, topic: "Linked List" },
  { name: "Copy List with Random Pointer", diff: "Medium" as const, topic: "Linked List" },
  { name: "Diameter of Binary Tree", diff: "Easy" as const, topic: "Trees" },
  { name: "Balanced Binary Tree", diff: "Easy" as const, topic: "Trees" },
  { name: "Same Tree", diff: "Easy" as const, topic: "Trees" },
  { name: "Subtree of Another Tree", diff: "Easy" as const, topic: "Trees" },
  { name: "Kth Smallest Element in a BST", diff: "Medium" as const, topic: "Trees" },
  { name: "Construct Binary Tree from Preorder and Inorder", diff: "Medium" as const, topic: "Trees" },
  { name: "Design Add and Search Words Data Structure", diff: "Medium" as const, topic: "Tries" },
  { name: "Word Search II", diff: "Hard" as const, topic: "Tries" },
  { name: "Last Stone Weight", diff: "Easy" as const, topic: "Heap" },
  { name: "K Closest Points to Origin", diff: "Medium" as const, topic: "Heap" },
  { name: "Task Scheduler", diff: "Medium" as const, topic: "Heap" },
  { name: "Design Twitter", diff: "Medium" as const, topic: "Heap" },
  { name: "Permutations", diff: "Medium" as const, topic: "Backtracking" },
  { name: "Subsets II", diff: "Medium" as const, topic: "Backtracking" },
  { name: "Combination Sum II", diff: "Medium" as const, topic: "Backtracking" },
  { name: "Palindrome Partitioning", diff: "Medium" as const, topic: "Backtracking" },
  { name: "Letter Combinations of a Phone Number", diff: "Medium" as const, topic: "Backtracking" },
  { name: "N-Queens", diff: "Hard" as const, topic: "Backtracking" },
  { name: "Max Area of Island", diff: "Medium" as const, topic: "Graphs" },
  { name: "Surrounded Regions", diff: "Medium" as const, topic: "Graphs" },
  { name: "Rotting Oranges", diff: "Medium" as const, topic: "Graphs" },
  { name: "Walls and Gates", diff: "Medium" as const, topic: "Graphs" },
  { name: "Course Schedule II", diff: "Medium" as const, topic: "Graphs" },
  { name: "Redundant Connection", diff: "Medium" as const, topic: "Graphs" },
  { name: "Number of Connected Components in an Undirected Graph", diff: "Medium" as const, topic: "Graphs" },
  { name: "Reconstruct Itinerary", diff: "Hard" as const, topic: "Graphs" },
  { name: "Min Cost to Connect All Points", diff: "Medium" as const, topic: "Graphs" },
  { name: "Network Delay Time", diff: "Medium" as const, topic: "Graphs" },
  { name: "Swim in Rising Water", diff: "Hard" as const, topic: "Graphs" },
  { name: "Cheapest Flights Within K Stops", diff: "Medium" as const, topic: "Graphs" },
  { name: "Min Cost Climbing Stairs", diff: "Easy" as const, topic: "Dynamic Programming" },
  { name: "Coin Change II", diff: "Medium" as const, topic: "Dynamic Programming" },
  { name: "Target Sum", diff: "Medium" as const, topic: "Dynamic Programming" },
  { name: "Interleaving String", diff: "Medium" as const, topic: "Dynamic Programming" },
  { name: "Longest Increasing Path in a Matrix", diff: "Hard" as const, topic: "Dynamic Programming" },
  { name: "Distinct Subsequences", diff: "Hard" as const, topic: "Dynamic Programming" },
  { name: "Edit Distance", diff: "Medium" as const, topic: "Dynamic Programming" },
  { name: "Burst Balloons", diff: "Hard" as const, topic: "Dynamic Programming" },
  { name: "Regular Expression Matching", diff: "Hard" as const, topic: "Dynamic Programming" },
];

function getDiffColor(diff: string): string {
  switch (diff) {
    case "Easy": return "emerald";
    case "Medium": return "amber";
    case "Hard": return "rose";
    default: return "emerald";
  }
}

// ==============================================================================
// 2. MAIN SEEDER FUNCTION
// ==============================================================================

async function main() {
  if (!process.env.POSTGRES_PRISMA_URL && !process.env.DATABASE_URL) {
    console.log("⚠️ POSTGRES_PRISMA_URL not found in environment. Skipping data seeding.");
    return;
  }

  console.log("🌱 Seeding realistic 90-day activity, problems, solutions, notes, sheets, reminders, and analytics...");

  // 1. Ensure or create demo user
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "hunter@codevault.dev" },
        { username: "hunter" },
      ],
    },
  });

  if (!user) {
    // If there is any existing user in DB, seed to that user
    user = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
    });
  }

  if (!user) {
    const passwordHash = await bcrypt.hash("Password123!", 10);
    user = await prisma.user.create({
      data: {
        email: "hunter@codevault.dev",
        username: "hunter",
        name: "Hunter",
        passwordHash,
        defaultLanguage: "Python",
        hasCompletedOnboarding: true,
        isPublicProfile: true,
        theme: "SYSTEM",
      },
    });
    console.log(`👤 Created demo user: hunter@codevault.dev (username: hunter)`);
  } else {
    console.log(`👤 Found active user for seeding: ${user.email} (${user.id})`);
  }

  const userId = user.id;

  // 2. Seed Company Tags
  console.log("🏢 Seeding company tags...");
  const companyMap = new Map<string, string>();
  for (const comp of COMPANIES) {
    const record = await prisma.companyTag.upsert({
      where: { slug: comp.slug },
      update: { name: comp.name, logoUrl: comp.logoUrl },
      create: { name: comp.name, slug: comp.slug, logoUrl: comp.logoUrl },
    });
    companyMap.set(comp.slug, record.id);
  }

  // 3. Seed Patterns
  console.log("🧩 Seeding algorithmic patterns...");
  const patternMap = new Map<string, string>();
  for (const pat of PATTERNS) {
    const record = await prisma.pattern.upsert({
      where: { slug: pat.slug },
      update: { name: pat.name, parentTopic: pat.parentTopic, description: pat.description },
      create: { name: pat.name, slug: pat.slug, parentTopic: pat.parentTopic, description: pat.description },
    });
    patternMap.set(pat.slug, record.id);
  }

  // 4. Check if problems are already seeded
  const existingCount = await prisma.problem.count({ where: { userId } });
  if (existingCount >= 100) {
    console.log(`✨ User already has ${existingCount} problems seeded. Skipping bulk question regeneration.`);
    return;
  }

  console.log("📚 Generating 90-day chronological problem solving history (2-3 problems/day with 1-3 solutions each)...");

  const now = new Date();
  const createdProblemIds: string[] = [];
  let problemNumCounter = 1;
  let poolIndex = 0;

  // Build a 90-day timeline from 90 days ago up to day 0 (today)
  for (let dayOffset = 90; dayOffset >= 0; dayOffset--) {
    const dayDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    // Set realistic time of day (e.g. 10:00 AM to 9:00 PM IST)
    dayDate.setHours(14, Math.floor(Math.random() * 50), 0, 0);

    // 2 to 3 problems per day
    const problemsForToday = (dayOffset % 3 === 0) ? 3 : 2;

    for (let p = 0; p < problemsForToday; p++) {
      let template: ProblemSeedTemplate;

      if (poolIndex < PROBLEM_BANK.length) {
        template = PROBLEM_BANK[poolIndex];
      } else {
        const item = PROBLEM_NAMES_POOL[(poolIndex - PROBLEM_BANK.length) % PROBLEM_NAMES_POOL.length];
        const num = 350 + poolIndex;
        template = {
          num,
          name: item.name,
          topic: item.topic,
          difficulty: item.diff,
          companies: ["google", "amazon", "meta"].slice(0, 1 + (poolIndex % 3)),
          patterns: ["two-pointers", "sliding-window", "tree-dfs", "0/1 Knapsack & Subset DP"].slice(0, 1 + (poolIndex % 2)),
          url: `https://leetcode.com/problems/${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/`,
          notes: [
            `Key insight for ${item.name}: Maintain optimal subproblem bounds and watch for edge cases.`,
            `Time complexity verified at O(N) or O(N log N) during testing.`,
          ],
          solutions: [
            {
              name: "Optimal Solution",
              lang: "Python",
              intuition: `Standard optimal approach for ${item.name} leveraging ${item.topic} properties.`,
              approach: `1. Initialize state variables.\n2. Iterate through input space.\n3. Return optimized result.`,
              code: `# Optimal Python3 implementation for ${item.name}\ndef solveProblem(data):\n    # Process input efficiently\n    result = []\n    for item in data:\n        result.append(item)\n    return result`,
              time: "O(N)",
              space: "O(1)",
              tags: [item.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-"), "optimal"],
            },
            ...(poolIndex % 2 === 0 ? [{
              name: "Alternative Approach (C++)",
              lang: "C++",
              intuition: `Alternative iteration strategy in C++ with minimal heap allocations.`,
              approach: `1. Setup pointers and vectors.\n2. Execute core logic.\n3. Return result.`,
              code: `// C++ implementation for ${item.name}\n#include <vector>\nusing namespace std;\n\nint solve(vector<int>& nums) {\n    int ans = 0;\n    for (int x : nums) ans += x;\n    return ans;\n}`,
              time: "O(N log N)",
              space: "O(N)",
              tags: ["c++", "alternative"],
            }] : []),
          ],
        };
      }

      poolIndex++;
      const currentProblemNum = template.num || problemNumCounter++;

      // Create Problem record
      const problem = await prisma.problem.create({
        data: {
          userId,
          num: currentProblemNum,
          name: template.name,
          url: template.url || "#",
          sourcePlatform: "leetcode",
          topic: template.topic,
          difficulty: template.difficulty,
          diffColor: getDiffColor(template.difficulty),
          status: dayOffset > 10 ? "Solved" : (dayOffset % 2 === 0 ? "Due Today" : "Reviewing"),
          statusColor: dayOffset > 10 ? "emerald" : "amber",
          interval: dayOffset > 30 ? "Recall Stage 5" : (dayOffset > 14 ? "Recall Stage 4" : (dayOffset > 7 ? "Recall Stage 3" : "Recall Stage 1")),
          isFavorite: dayOffset % 4 === 0,
          isPublic: dayOffset % 3 === 0,
          solvedAt: dayDate,
          createdAt: dayDate,
          updatedAt: dayDate,
        },
      });

      createdProblemIds.push(problem.id);

      // Create 1 to 3 Solutions for this problem
      for (const sol of template.solutions) {
        const solution = await prisma.solution.create({
          data: {
            problemId: problem.id,
            userId,
            name: sol.name,
            lang: sol.lang,
            intuition: sol.intuition,
            approach: sol.approach,
            code: sol.code,
            time: sol.time,
            space: sol.space,
            tags: sol.tags,
            createdAt: dayDate,
            updatedAt: dayDate,
          },
        });

        // Add Solution Note
        await prisma.solutionNote.create({
          data: {
            solutionId: solution.id,
            type: "note",
            text: `Mistake log: Tested on large inputs, space complexity adheres to ${sol.space}.`,
            isShared: true,
            createdAt: dayDate,
          },
        });
      }

      // Create Problem Note
      for (const noteText of template.notes) {
        await prisma.note.create({
          data: {
            problemId: problem.id,
            userId,
            type: "mistake",
            text: noteText,
            isShared: true,
            createdAt: dayDate,
          },
        });
      }

      // Link Company Tags
      for (const compSlug of template.companies) {
        const companyId = companyMap.get(compSlug);
        if (companyId) {
          await prisma.problemCompany.create({
            data: { problemId: problem.id, companyId },
          }).catch(() => {}); // Ignore duplicate pair
        }
      }

      // Link Pattern Tags
      for (const patSlug of template.patterns) {
        const patternId = patternMap.get(patSlug);
        if (patternId) {
          await prisma.problemPattern.create({
            data: { problemId: problem.id, patternId },
          }).catch(() => {});
        }
      }

      // Create SRS Reminder Stages for this problem
      const stages = ["Stage 1", "Stage 2", "Stage 3", "Stage 4", "Stage 5"];
      const intervals = [1, 3, 7, 14, 30];

      for (let s = 0; s < stages.length; s++) {
        const reminderDate = new Date(dayDate.getTime() + intervals[s] * 24 * 60 * 60 * 1000);
        const isPastDue = reminderDate.getTime() <= now.getTime();

        await prisma.reminder.create({
          data: {
            problemId: problem.id,
            userId,
            dueDate: reminderDate,
            stage: stages[s],
            cycle: 1,
            status: isPastDue ? "COMPLETED" : "PENDING",
            completedAt: isPastDue ? reminderDate : null,
            createdAt: dayDate,
          },
        });
      }

      // For older problems, register active SRS Revisit Cycle
      if (dayOffset > 45) {
        await prisma.srsRevisitCycle.create({
          data: {
            problemId: problem.id,
            userId,
            cycleNumber: 1,
            status: "active",
            startedAt: new Date(dayDate.getTime() + 35 * 24 * 60 * 60 * 1000),
            createdAt: dayDate,
          },
        }).catch(() => {});
      }
    }
  }

  // 5. Create Curated Practice Sheets
  console.log("📑 Creating curated practice sheets...");
  const SHEETS_CONFIG = [
    {
      name: "Blind 75 Essentials",
      description: "The definitive 75 LeetCode problems to master technical interview patterns.",
      isPublic: true,
      shareSlug: "blind-75-essentials",
      count: 25,
    },
    {
      name: "NeetCode 150 Core",
      description: "Comprehensive coverage of all major data structures and algorithms.",
      isPublic: true,
      shareSlug: "neetcode-150-core",
      count: 35,
    },
    {
      name: "Dynamic Programming Mastery",
      description: "From 1D linear subproblems to 2D grid pathing and knapsack variations.",
      isPublic: true,
      shareSlug: "dynamic-programming-mastery",
      count: 20,
    },
    {
      name: "FAANG Top 50 Interview Queue",
      description: "High-frequency interview questions asked at Google, Meta, and Amazon.",
      isPublic: true,
      shareSlug: "faang-top-50-queue",
      count: 30,
    },
  ];

  for (const sheetDef of SHEETS_CONFIG) {
    const sheet = await prisma.sheet.upsert({
      where: { shareSlug: sheetDef.shareSlug },
      update: { name: sheetDef.name, description: sheetDef.description, isPublic: true },
      create: {
        userId,
        name: sheetDef.name,
        description: sheetDef.description,
        isPublic: sheetDef.isPublic,
        shareSlug: sheetDef.shareSlug,
        isCurated: true,
      },
    });

    // Attach problems to sheet
    const problemsToAttach = createdProblemIds.slice(0, sheetDef.count);
    for (let idx = 0; idx < problemsToAttach.length; idx++) {
      await prisma.sheetProblem.upsert({
        where: {
          sheetId_problemId: {
            sheetId: sheet.id,
            problemId: problemsToAttach[idx],
          },
        },
        update: { order: idx },
        create: {
          sheetId: sheet.id,
          problemId: problemsToAttach[idx],
          order: idx,
        },
      });
    }
  }

  // 6. Generate 90-Day Analytics Cache Snapshots
  console.log("📊 Generating daily 90-day analytics heatmap & streak snapshots...");
  let cumulativeSolved = 0;
  for (let dayOffset = 90; dayOffset >= 0; dayOffset--) {
    const snapshotDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    snapshotDate.setHours(0, 0, 0, 0);

    cumulativeSolved += (dayOffset % 3 === 0) ? 3 : 2;
    const streak = 91 - dayOffset;

    await prisma.analyticsCache.upsert({
      where: {
        userId_snapshotDate: {
          userId,
          snapshotDate,
        },
      },
      update: {
        problemsSolved: cumulativeSolved,
        currentStreak: streak,
        longestStreak: Math.max(streak, 90),
      },
      create: {
        userId,
        snapshotDate,
        problemsSolved: cumulativeSolved,
        currentStreak: streak,
        longestStreak: 90,
        topicDistribution: {
          "Arrays & Hashing": Math.floor(cumulativeSolved * 0.22),
          "Two Pointers": Math.floor(cumulativeSolved * 0.15),
          "Sliding Window": Math.floor(cumulativeSolved * 0.12),
          "Trees": Math.floor(cumulativeSolved * 0.18),
          "Dynamic Programming": Math.floor(cumulativeSolved * 0.20),
          "Graphs": Math.floor(cumulativeSolved * 0.13),
        },
        difficultyDistribution: {
          Easy: Math.floor(cumulativeSolved * 0.35),
          Medium: Math.floor(cumulativeSolved * 0.50),
          Hard: Math.floor(cumulativeSolved * 0.15),
        },
        complexityDistribution: {
          "O(1)": Math.floor(cumulativeSolved * 0.25),
          "O(N)": Math.floor(cumulativeSolved * 0.55),
          "O(N log N)": Math.floor(cumulativeSolved * 0.15),
          "O(N^2)": Math.floor(cumulativeSolved * 0.05),
        },
      },
    });
  }

  // 7. Seed Notifications
  console.log("🔔 Seeding milestone and reminder notifications...");
  const sampleProblem = createdProblemIds[0];
  await prisma.notification.createMany({
    data: [
      {
        userId,
        type: "milestone",
        message: "🔥 90-day streak achieved! You have solved over 200 coding problems.",
        isRead: false,
        createdAt: now,
      },
      {
        userId,
        type: "srs_revisit",
        message: "Problem #1 \"Two Sum\" is scheduled for Stage 5 mastery revisit today.",
        relatedId: sampleProblem,
        isRead: false,
        createdAt: now,
      },
      {
        userId,
        type: "srs_revisit",
        message: "Problem #3 \"Longest Substring Without Repeating Characters\" recall interval is ready.",
        relatedId: createdProblemIds[1] || sampleProblem,
        isRead: true,
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log(`✅ Seeding completed successfully! Created ${createdProblemIds.length} problems with full solutions, notes, reminders, sheets, and 90-day analytics.`);
}

main()
  .catch((e) => {
    console.error("❌ Failed to seed demo data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
