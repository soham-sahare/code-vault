-- 1. DROP EXISTING CONSTRAINTS AND TABLES (Cascading ensures complete deletion)
DROP TABLE IF EXISTS "SheetProblem" CASCADE;
DROP TABLE IF EXISTS "Sheet" CASCADE;
DROP TABLE IF EXISTS "AnalyticsCache" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "ProblemPattern" CASCADE;
DROP TABLE IF EXISTS "Pattern" CASCADE;
DROP TABLE IF EXISTS "ProblemCompany" CASCADE;
DROP TABLE IF EXISTS "CompanyTag" CASCADE;
DROP TABLE IF EXISTS "SrsRevisitCycle" CASCADE;
DROP TABLE IF EXISTS "Reminder" CASCADE;
DROP TABLE IF EXISTS "Note" CASCADE;
DROP TABLE IF EXISTS "SolutionNote" CASCADE;
DROP TABLE IF EXISTS "Solution" CASCADE;
DROP TABLE IF EXISTS "Problem" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- 2. CREATE MASTER SCHEMAS (Standard & Partitioned Tables)

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "passwordHash" TEXT,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'Python',
    "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
    "isPublicProfile" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'SYSTEM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "num" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '#',
    "sourcePlatform" TEXT NOT NULL DEFAULT 'other',
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "diffColor" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Due Today',
    "statusColor" TEXT NOT NULL,
    "interval" TEXT NOT NULL DEFAULT 'Recall Stage 1',
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "solvedAt" TIMESTAMP(3),
    "revisitRequestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- PARTITIONED TABLE: Solution (Hash-partitioned by userId per PLAN.md §12.2)
CREATE TABLE "Solution" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "intuition" TEXT NOT NULL,
    "approach" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "space" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solution_pkey" PRIMARY KEY ("id", "userId")
) PARTITION BY HASH ("userId");

-- Solution partitions (4 segments)
CREATE TABLE "Solution_p0" PARTITION OF "Solution" FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE "Solution_p1" PARTITION OF "Solution" FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE "Solution_p2" PARTITION OF "Solution" FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE "Solution_p3" PARTITION OF "Solution" FOR VALUES WITH (MODULUS 4, REMAINDER 3);

CREATE TABLE "SolutionNote" (
    "id" TEXT NOT NULL,
    "solutionId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'note',
    "text" TEXT NOT NULL,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolutionNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'note',
    "text" TEXT NOT NULL,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- PARTITIONED TABLE: Reminder (Hash-partitioned by userId per PLAN.md §12.2)
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "stage" TEXT NOT NULL,
    "cycle" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id", "userId")
) PARTITION BY HASH ("userId");

-- Reminder partitions (4 segments)
CREATE TABLE "Reminder_p0" PARTITION OF "Reminder" FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE "Reminder_p1" PARTITION OF "Reminder" FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE "Reminder_p2" PARTITION OF "Reminder" FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE "Reminder_p3" PARTITION OF "Reminder" FOR VALUES WITH (MODULUS 4, REMAINDER 3);

CREATE TABLE "SrsRevisitCycle" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cycleNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "pauseReason" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pausedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SrsRevisitCycle_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SrsRevisitCycle_problemId_userId_status_key" ON "SrsRevisitCycle"("problemId", "userId", "status");

CREATE TABLE "CompanyTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,

    CONSTRAINT "CompanyTag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CompanyTag_slug_key" ON "CompanyTag"("slug");

CREATE TABLE "ProblemCompany" (
    "problemId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "ProblemCompany_pkey" PRIMARY KEY ("problemId", "companyId")
);

CREATE TABLE "Pattern" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentTopic" TEXT NOT NULL,

    CONSTRAINT "Pattern_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Pattern_slug_key" ON "Pattern"("slug");

CREATE TABLE "ProblemPattern" (
    "problemId" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,

    CONSTRAINT "ProblemPattern_pkey" PRIMARY KEY ("problemId","patternId")
);

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- PARTITIONED TABLE: AnalyticsCache (Range-partitioned by snapshotDate per PLAN.md §12.2)
CREATE TABLE "AnalyticsCache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "problemsSolved" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "topicDistribution" JSONB NOT NULL DEFAULT '{}',
    "difficultyDistribution" JSONB NOT NULL DEFAULT '{}',
    "complexityDistribution" JSONB NOT NULL DEFAULT '{}',
    "companyDistribution" JSONB NOT NULL DEFAULT '{}',
    "patternDistribution" JSONB NOT NULL DEFAULT '{}',
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsCache_pkey" PRIMARY KEY ("id", "snapshotDate")
) PARTITION BY RANGE ("snapshotDate");

-- AnalyticsCache partitions (pre-created range templates for y2025, y2026, y2027)
CREATE TABLE "AnalyticsCache_y2025" PARTITION OF "AnalyticsCache" FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE "AnalyticsCache_y2026" PARTITION OF "AnalyticsCache" FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE "AnalyticsCache_y2027" PARTITION OF "AnalyticsCache" FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

CREATE TABLE "Sheet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "shareSlug" TEXT,
    "isCurated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sheet_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Sheet_shareSlug_key" ON "Sheet"("shareSlug");

CREATE TABLE "SheetProblem" (
    "sheetId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SheetProblem_pkey" PRIMARY KEY ("sheetId", "problemId")
);


-- 3. APPLY ENGINE AND HOT-PATH PERFORMANCE INDICES (PLAN.md §12.1)

CREATE INDEX "Problem_userId_createdAt_idx" ON "Problem"("userId", "createdAt" DESC);
CREATE INDEX "Problem_userId_status_idx" ON "Problem"("userId", "status");
CREATE INDEX "Problem_userId_difficulty_idx" ON "Problem"("userId", "difficulty");
CREATE INDEX "Problem_userId_isFavorite_createdAt_idx" ON "Problem"("userId", "isFavorite", "createdAt" DESC) WHERE "isFavorite" = TRUE;
CREATE INDEX "Problem_userId_isPublic_createdAt_idx" ON "Problem"("userId", "isPublic", "createdAt" DESC) WHERE "isPublic" = TRUE;

CREATE INDEX "Solution_problemId_createdAt_idx" ON "Solution"("problemId", "createdAt");
CREATE INDEX "Solution_userId_lang_idx" ON "Solution"("userId", "lang");

CREATE INDEX "Reminder_userId_dueDate_idx" ON "Reminder"("userId", "dueDate");
CREATE INDEX "Reminder_problemId_stage_idx" ON "Reminder"("problemId", "stage");

CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt" DESC) WHERE "isRead" = FALSE;
CREATE INDEX "Sheet_userId_createdAt_idx" ON "Sheet"("userId", "createdAt" DESC);


-- 4. APPLY CORE FOREIGN KEY RELATIONSHIPS AND INTEGRITIES
-- (For partitioned parent tables like Solution and Reminder, FKs must map to target composite PKs)

ALTER TABLE "Problem" ADD CONSTRAINT "Problem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE "SolutionNote" ADD CONSTRAINT "SolutionNote_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE; -- maps notes directly to problem scope or solved constraints
ALTER TABLE "Note" ADD CONSTRAINT "Note_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SrsRevisitCycle" ADD CONSTRAINT "SrsRevisitCycle_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SrsRevisitCycle" ADD CONSTRAINT "SrsRevisitCycle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProblemCompany" ADD CONSTRAINT "ProblemCompany_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProblemCompany" ADD CONSTRAINT "ProblemCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProblemPattern" ADD CONSTRAINT "ProblemPattern_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProblemPattern" ADD CONSTRAINT "ProblemPattern_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sheet" ADD CONSTRAINT "Sheet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SheetProblem" ADD CONSTRAINT "SheetProblem_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "Sheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SheetProblem" ADD CONSTRAINT "SheetProblem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
