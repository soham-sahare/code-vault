import { db } from "../lib/db";

async function main() {
  const problems = await db.problem.findMany({
    include: {
      solutions: true,
    }
  });
  console.log("PROBLEMS:", JSON.stringify(problems, null, 2));
}

main()
  .catch(err => console.error(err))
  .finally(() => db.$disconnect());
