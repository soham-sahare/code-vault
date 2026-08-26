-- ==============================================================================
-- CodeVault Row-Level Security (RLS) Enablement & Policy Migration
-- Enables RLS on all 15 database tables and configures secure server access policies.
-- ==============================================================================

-- 1. User
ALTER TABLE IF EXISTS "User" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to User" ON "User";
CREATE POLICY "Allow server-side access to User" ON "User"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Problem
ALTER TABLE IF EXISTS "Problem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Problem" ON "Problem";
CREATE POLICY "Allow server-side access to Problem" ON "Problem"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. Solution
ALTER TABLE IF EXISTS "Solution" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Solution" ON "Solution";
CREATE POLICY "Allow server-side access to Solution" ON "Solution"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. SolutionNote
ALTER TABLE IF EXISTS "SolutionNote" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to SolutionNote" ON "SolutionNote";
CREATE POLICY "Allow server-side access to SolutionNote" ON "SolutionNote"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Note
ALTER TABLE IF EXISTS "Note" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Note" ON "Note";
CREATE POLICY "Allow server-side access to Note" ON "Note"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Reminder
ALTER TABLE IF EXISTS "Reminder" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Reminder" ON "Reminder";
CREATE POLICY "Allow server-side access to Reminder" ON "Reminder"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. SrsRevisitCycle
ALTER TABLE IF EXISTS "SrsRevisitCycle" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to SrsRevisitCycle" ON "SrsRevisitCycle";
CREATE POLICY "Allow server-side access to SrsRevisitCycle" ON "SrsRevisitCycle"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 8. CompanyTag
ALTER TABLE IF EXISTS "CompanyTag" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to CompanyTag" ON "CompanyTag";
CREATE POLICY "Allow server-side access to CompanyTag" ON "CompanyTag"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 9. ProblemCompany
ALTER TABLE IF EXISTS "ProblemCompany" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to ProblemCompany" ON "ProblemCompany";
CREATE POLICY "Allow server-side access to ProblemCompany" ON "ProblemCompany"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 10. Pattern
ALTER TABLE IF EXISTS "Pattern" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Pattern" ON "Pattern";
CREATE POLICY "Allow server-side access to Pattern" ON "Pattern"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 11. ProblemPattern
ALTER TABLE IF EXISTS "ProblemPattern" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to ProblemPattern" ON "ProblemPattern";
CREATE POLICY "Allow server-side access to ProblemPattern" ON "ProblemPattern"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 12. Notification
ALTER TABLE IF EXISTS "Notification" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Notification" ON "Notification";
CREATE POLICY "Allow server-side access to Notification" ON "Notification"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 13. AnalyticsCache
ALTER TABLE IF EXISTS "AnalyticsCache" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to AnalyticsCache" ON "AnalyticsCache";
CREATE POLICY "Allow server-side access to AnalyticsCache" ON "AnalyticsCache"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 14. Sheet
ALTER TABLE IF EXISTS "Sheet" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Sheet" ON "Sheet";
CREATE POLICY "Allow server-side access to Sheet" ON "Sheet"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 15. SheetProblem
ALTER TABLE IF EXISTS "SheetProblem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to SheetProblem" ON "SheetProblem";
CREATE POLICY "Allow server-side access to SheetProblem" ON "SheetProblem"
  FOR ALL
  USING (true)
  WITH CHECK (true);
