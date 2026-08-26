-- ==============================================================================
-- CodeVault Dedicated Schema & Row-Level Security (RLS) Enablement
-- Creates dedicated 'codevault' schema and secures all tables with RLS and server policies.
-- ==============================================================================

-- 0. Ensure 'codevault' Schema Exists
CREATE SCHEMA IF NOT EXISTS codevault;

-- 1. User (codevault schema)
ALTER TABLE IF EXISTS codevault."User" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to User" ON codevault."User";
CREATE POLICY "Allow server-side access to User" ON codevault."User"
  FOR ALL USING (true) WITH CHECK (true);

-- 2. Problem
ALTER TABLE IF EXISTS codevault."Problem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Problem" ON codevault."Problem";
CREATE POLICY "Allow server-side access to Problem" ON codevault."Problem"
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Solution
ALTER TABLE IF EXISTS codevault."Solution" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Solution" ON codevault."Solution";
CREATE POLICY "Allow server-side access to Solution" ON codevault."Solution"
  FOR ALL USING (true) WITH CHECK (true);

-- 4. SolutionNote
ALTER TABLE IF EXISTS codevault."SolutionNote" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to SolutionNote" ON codevault."SolutionNote";
CREATE POLICY "Allow server-side access to SolutionNote" ON codevault."SolutionNote"
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Note
ALTER TABLE IF EXISTS codevault."Note" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Note" ON codevault."Note";
CREATE POLICY "Allow server-side access to Note" ON codevault."Note"
  FOR ALL USING (true) WITH CHECK (true);

-- 6. Reminder
ALTER TABLE IF EXISTS codevault."Reminder" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Reminder" ON codevault."Reminder";
CREATE POLICY "Allow server-side access to Reminder" ON codevault."Reminder"
  FOR ALL USING (true) WITH CHECK (true);

-- 7. SrsRevisitCycle
ALTER TABLE IF EXISTS codevault."SrsRevisitCycle" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to SrsRevisitCycle" ON codevault."SrsRevisitCycle";
CREATE POLICY "Allow server-side access to SrsRevisitCycle" ON codevault."SrsRevisitCycle"
  FOR ALL USING (true) WITH CHECK (true);

-- 8. CompanyTag
ALTER TABLE IF EXISTS codevault."CompanyTag" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to CompanyTag" ON codevault."CompanyTag";
CREATE POLICY "Allow server-side access to CompanyTag" ON codevault."CompanyTag"
  FOR ALL USING (true) WITH CHECK (true);

-- 9. ProblemCompany
ALTER TABLE IF EXISTS codevault."ProblemCompany" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to ProblemCompany" ON codevault."ProblemCompany";
CREATE POLICY "Allow server-side access to ProblemCompany" ON codevault."ProblemCompany"
  FOR ALL USING (true) WITH CHECK (true);

-- 10. Pattern
ALTER TABLE IF EXISTS codevault."Pattern" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Pattern" ON codevault."Pattern";
CREATE POLICY "Allow server-side access to Pattern" ON codevault."Pattern"
  FOR ALL USING (true) WITH CHECK (true);

-- 11. ProblemPattern
ALTER TABLE IF EXISTS codevault."ProblemPattern" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to ProblemPattern" ON codevault."ProblemPattern";
CREATE POLICY "Allow server-side access to ProblemPattern" ON codevault."ProblemPattern"
  FOR ALL USING (true) WITH CHECK (true);

-- 12. Notification
ALTER TABLE IF EXISTS codevault."Notification" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Notification" ON codevault."Notification";
CREATE POLICY "Allow server-side access to Notification" ON codevault."Notification"
  FOR ALL USING (true) WITH CHECK (true);

-- 13. AnalyticsCache
ALTER TABLE IF EXISTS codevault."AnalyticsCache" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to AnalyticsCache" ON codevault."AnalyticsCache";
CREATE POLICY "Allow server-side access to AnalyticsCache" ON codevault."AnalyticsCache"
  FOR ALL USING (true) WITH CHECK (true);

-- 14. Sheet
ALTER TABLE IF EXISTS codevault."Sheet" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Sheet" ON codevault."Sheet";
CREATE POLICY "Allow server-side access to Sheet" ON codevault."Sheet"
  FOR ALL USING (true) WITH CHECK (true);

-- 15. SheetProblem
ALTER TABLE IF EXISTS codevault."SheetProblem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to SheetProblem" ON codevault."SheetProblem";
CREATE POLICY "Allow server-side access to SheetProblem" ON codevault."SheetProblem"
  FOR ALL USING (true) WITH CHECK (true);

-- Also protect public schema tables if present
ALTER TABLE IF EXISTS public."User" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to User" ON public."User";
CREATE POLICY "Allow server-side access to User" ON public."User" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public."Problem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Problem" ON public."Problem";
CREATE POLICY "Allow server-side access to Problem" ON public."Problem" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public."Solution" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Solution" ON public."Solution";
CREATE POLICY "Allow server-side access to Solution" ON public."Solution" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public."SolutionNote" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to SolutionNote" ON public."SolutionNote";
CREATE POLICY "Allow server-side access to SolutionNote" ON public."SolutionNote" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public."Note" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Note" ON public."Note";
CREATE POLICY "Allow server-side access to Note" ON public."Note" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public."Reminder" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Reminder" ON public."Reminder";
CREATE POLICY "Allow server-side access to Reminder" ON public."Reminder" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public."SrsRevisitCycle" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to SrsRevisitCycle" ON public."SrsRevisitCycle";
CREATE POLICY "Allow server-side access to SrsRevisitCycle" ON public."SrsRevisitCycle" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public."CompanyTag" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to CompanyTag" ON public."CompanyTag";
CREATE POLICY "Allow server-side access to CompanyTag" ON public."CompanyTag" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public."ProblemCompany" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to ProblemCompany" ON public."ProblemCompany";
CREATE POLICY "Allow server-side access to ProblemCompany" ON public."ProblemCompany" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public."Pattern" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Pattern" ON public."Pattern";
CREATE POLICY "Allow server-side access to Pattern" ON public."Pattern" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public."ProblemPattern" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to ProblemPattern" ON public."ProblemPattern";
CREATE POLICY "Allow server-side access to ProblemPattern" ON public."ProblemPattern" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public."Notification" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Notification" ON public."Notification";
CREATE POLICY "Allow server-side access to Notification" ON public."Notification" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public."AnalyticsCache" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to AnalyticsCache" ON public."AnalyticsCache";
CREATE POLICY "Allow server-side access to AnalyticsCache" ON public."AnalyticsCache" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public."Sheet" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to Sheet" ON public."Sheet";
CREATE POLICY "Allow server-side access to Sheet" ON public."Sheet" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public."SheetProblem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow server-side access to SheetProblem" ON public."SheetProblem";
CREATE POLICY "Allow server-side access to SheetProblem" ON public."SheetProblem" FOR ALL USING (true) WITH CHECK (true);
