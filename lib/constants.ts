export const LANGUAGES = [
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "C++", value: "cpp" },
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
];

export const TIME_COMPLEXITY = [
  { label: "O(1)", value: "O(1)" },
  { label: "O(log n)", value: "O(log n)" },
  { label: "O(n)", value: "O(n)" },
  { label: "O(n log n)", value: "O(n log n)" },
  { label: "O(n^2)", value: "O(n^2)" },
  { label: "O(n^3)", value: "O(n^3)" },
  { label: "O(2^n)", value: "O(2^n)" },
  { label: "O(n!)", value: "O(n!)" },
  { label: "O(m*n)", value: "O(m*n)" },
  { label: "O(m+n)", value: "O(m+n)" },
];

export const SPACE_COMPLEXITY = [
  { label: "O(1)", value: "O(1)" },
  { label: "O(log n)", value: "O(log n)" },
  { label: "O(n)", value: "O(n)" },
  { label: "O(n^2)", value: "O(n^2)" },
  { label: "O(m*n)", value: "O(m*n)" },
];

export const TOPIC_OPTIONS = [
  { label: "Array", value: "Array" },
  { label: "String", value: "String" },
  { label: "Hash Table", value: "Hash Table" },
  { label: "Two Pointers", value: "Two Pointers" },
  { label: "Dynamic Programming", value: "DP" },
  { label: "Stack", value: "Stack" },
  { label: "Heap", value: "Heap" },
  { label: "Graph", value: "Graph" },
  { label: "Tree", value: "Tree" },
  { label: "Binary Search", value: "Binary Search" },
  { label: "Backtracking", value: "Backtracking" },
];

export const TAG_OPTIONS = [
  { label: "Sliding Window", value: "Sliding Window" },
  { label: "Two Pointers", value: "Two Pointers" },
  { label: "Fast & Slow Pointers", value: "Fast & Slow Pointers" },
  { label: "Merge Intervals", value: "Merge Intervals" },
  { label: "Cyclic Sort", value: "Cyclic Sort" },
  { label: "In-place Reversal of LinkedList", value: "In-place Reversal of LinkedList" },
  { label: "Tree BFS", value: "Tree BFS" },
  { label: "Tree DFS", value: "Tree DFS" },
  { label: "Two Heaps", value: "Two Heaps" },
  { label: "Subsets", value: "Subsets" },
  { label: "Modified Binary Search", value: "Modified Binary Search" },
  { label: "Bitwise XOR", value: "Bitwise XOR" },
  { label: "Top 'K' Elements", value: "Top 'K' Elements" },
  { label: "K-way Merge", value: "K-way Merge" },
  { label: "Topological Sort", value: "Topological Sort" }
];

export const DIFFICULTY_OPTIONS = [
  { label: "Easy", value: "Easy" },
  { label: "Medium", value: "Medium" },
  { label: "Hard", value: "Hard" }
];

export const FILTER_DIFFICULTY_OPTIONS = [
  { label: "All Difficulties", value: "" },
  ...DIFFICULTY_OPTIONS
];
