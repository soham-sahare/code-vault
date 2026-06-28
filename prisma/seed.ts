import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const companies = [
  "Google", "Amazon", "Meta", "Apple", "Microsoft", "Netflix", "Uber", "Airbnb", 
  "LinkedIn", "Twitter/X", "Stripe", "Dropbox", "Snapchat", "Pinterest", "Salesforce", 
  "Adobe", "Oracle", "SAP", "Cisco", "Intel", "Nvidia", "Qualcomm", "Atlassian", 
  "Shopify", "Spotify", "PayPal", "Square/Block", "Robinhood", "DoorDash", "Lyft", 
  "Coinbase", "Databricks", "Snowflake", "MongoDB", "Palantir", "Twilio", "Zoom", 
  "Slack", "Okta", "ServiceNow", "Workday", "Intuit", "HubSpot", "Zendesk", 
  "Goldman Sachs", "JPMorgan", "Morgan Stanley", "Two Sigma", "Jane Street", 
  "Citadel", "Optiver", "DE Shaw", "Quora", "Reddit", "ByteDance/TikTok"
];

const patterns = [
  { name: "Sliding Window", parentTopic: "Arrays", description: "Useful for tracking subarrays or subsegments" },
  { name: "Two Pointers", parentTopic: "Arrays", description: "Using two pointers moving towards each other or at different speeds" },
  { name: "Fast & Slow Pointers", parentTopic: "Linked Lists", description: "Pointers moving at different speeds to find cycles or midpoints" },
  { name: "Merge Intervals", parentTopic: "Arrays", description: "Handling overlapping intervals" },
  { name: "BFS", parentTopic: "Graphs/Trees", description: "Breadth-First Search" },
  { name: "DFS", parentTopic: "Graphs/Trees", description: "Depth-First Search" },
  { name: "Backtracking", parentTopic: "Recursion", description: "Exploring all paths and backtracking on dead ends" },
  { name: "Dynamic Programming", parentTopic: "DP", description: "Optimizing recursive solutions via memoization or tabulation" },
  { name: "0/1 Knapsack", parentTopic: "DP", description: "Classic DP selector pattern" },
  { name: "Unbounded Knapsack", parentTopic: "DP", description: "DP selector with infinite items" },
  { name: "Fibonacci Sequence", parentTopic: "DP", description: "State transition depending on previous two states" },
  { name: "Palindromic Subsequence", parentTopic: "DP/Strings", description: "Finding palindromes in subsequences" },
  { name: "Tree BFS", parentTopic: "Trees", description: "Level order tree traversal" },
  { name: "Tree DFS", parentTopic: "Trees", description: "Preorder/inorder/postorder tree traversal" },
  { name: "Two Heaps", parentTopic: "Heaps", description: "Maintaining min and max heap simultaneously" },
  { name: "Top K Elements", parentTopic: "Heaps", description: "Using heap to track K largest/smallest elements" },
  { name: "Monotonic Stack", parentTopic: "Stacks", description: "Stack maintaining sorted order of elements" },
  { name: "Topological Sort", parentTopic: "Graphs", description: "Linear ordering of directed acyclic graph vertices" },
  { name: "Union Find", parentTopic: "Graphs", description: "Disjoint set union data structure operations" },
  { name: "Trie", parentTopic: "Strings", description: "Prefix tree for efficient string searches" },
  { name: "Binary Search", parentTopic: "Arrays", description: "Logarithmic search on sorted arrays" },
  { name: "Prefix Sum", parentTopic: "Arrays", description: "Preprocessing to compute subarray sums in O(1)" },
  { name: "Greedy", parentTopic: "Greedy", description: "Making locally optimal choices at each step" },
  { name: "Divide & Conquer", parentTopic: "Recursion", description: "Breaking problem down and merging results" },
  { name: "Cyclic Sort", parentTopic: "Arrays", description: "Sorting numbers in range 1 to N in O(N)" },
  { name: "Bit Manipulation", parentTopic: "Bits", description: "Applying bitwise operators to solve problems" }
];

async function main() {
  console.log("Seeding companies...");
  for (const company of companies) {
    const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await prisma.companyTag.upsert({
      where: { slug },
      update: { name: company },
      create: { name: company, slug }
    });
  }

  console.log("Seeding patterns...");
  for (const pattern of patterns) {
    const slug = pattern.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await prisma.pattern.upsert({
      where: { slug },
      update: {
        name: pattern.name,
        parentTopic: pattern.parentTopic,
        description: pattern.description
      },
      create: {
        name: pattern.name,
        slug,
        parentTopic: pattern.parentTopic,
        description: pattern.description
      }
    });
  }

  console.log("Seeding curated sheets...");
  const curatedSheets = [
    { name: "Blind 75", description: "Popular collection of 75 essential LeetCode questions." },
    { name: "NeetCode 150", description: "150 practice problems covering key patterns." },
    { name: "Top Interview 150", description: "Top interview questions from LeetCode." },
    { name: "Grind 169", description: "Curated 169 problems to master software engineering interviews." }
  ];

  for (const sheet of curatedSheets) {
    const shareSlug = sheet.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "_curated";
    // Since curated sheets are system-wide but technically need a user owner or can have a nullable user owner,
    // let's assign them to a dummy system user or let them be created for the first registered user, 
    // or let them be created without a user ID if user_id is nullable (but user_id is NOT NULL in prisma schema!).
    // Let's find any user or skip creating curated sheets until at least one user exists, or let's create a system user.
    let systemUser = await prisma.user.findFirst();
    if (!systemUser) {
      console.log("No user found. Skipping curated sheets seeding. Curated sheets will be seeded on demand or when a user logs in.");
      continue;
    }

    await prisma.sheet.upsert({
      where: { shareSlug },
      update: {
        name: sheet.name,
        description: sheet.description,
        isPublic: true,
        isCurated: true,
        userId: systemUser.id
      },
      create: {
        name: sheet.name,
        description: sheet.description,
        isPublic: true,
        isCurated: true,
        shareSlug,
        userId: systemUser.id
      }
    });
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
