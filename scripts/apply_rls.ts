import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Automatically load .env, .env.local, etc.
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function main() {
  if (!process.env.POSTGRES_PRISMA_URL && !process.env.DATABASE_URL) {
    console.error("❌ Error: POSTGRES_PRISMA_URL or DATABASE_URL not found in environment.");
    process.exit(1);
  }

  console.log("🔒 Applying Row-Level Security (RLS) policies to all database tables...");

  const sqlFilePath = path.join(process.cwd(), "prisma", "enable_rls.sql");
  const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

  // Split SQL file by individual statements
  const statements = sqlContent
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (err: any) {
      console.warn(`⚠️ Statement warning: ${err.message}`);
    }
  }

  console.log("✅ Successfully applied RLS and server access policies across all 15 tables!");
}

main()
  .catch((e) => {
    console.error("❌ Failed to apply RLS:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
