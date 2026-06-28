import { db } from "../lib/db";

async function main() {
  const problems = await db.problem.findMany({
    where: { name: { contains: "3Sum" } },
    include: {
      solutions: {
        include: {
          notes: true
        }
      }
    }
  });
  console.log("Problems matched count:", problems.length);
  for (const problem of problems) {
    console.log("Problem:", problem.name, "ID:", problem.id);
    for (const sol of problem.solutions) {
      console.log("  Solution Name:", sol.name, "ID:", sol.id);
      console.log("  Notes count:", sol.notes.length);
    }
  }
}

main()
  .catch((e) => console.error(e));
