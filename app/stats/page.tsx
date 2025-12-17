import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserStats, getProblems } from "@/actions/problem";
import StatsClient from "@/components/StatsClient";


export default async function StatsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  // Calculate default 7-day range
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  
  const startStr = sevenDaysAgo.toISOString().split('T')[0];
  const endStr = today.toISOString().split('T')[0];

  let stats: any = await getUserStats(startStr, endStr);

  if (stats?.error) {
      stats = {
          total: 0,
          solved: 0,
          byDifficulty: [],
          byTopic: [],
          byTag: [],
          distinctTopics: [],
          distinctTags: [],
          byTimeComplexity: [],
          bySpaceComplexity: [],
          activityTimeline: []
      };
  }

  // Fetch problems for analytics insights
  const problemsResult = await getProblems();
  const problems = problemsResult.error ? [] : problemsResult.problems || [];

  return (
    <div className="min-h-screen p-4 sm:p-8">
        <StatsClient stats={stats} problems={problems} />
    </div>
  );
}
