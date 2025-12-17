import { getProblems, getUserStats } from "@/actions/problem";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const [problems, statsResult] = await Promise.all([
    getProblems(),
    getUserStats()
  ]);
  
  let stats: any = statsResult;

  if (stats?.error) {
      // Fallback empty stats or handle error
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

  return (
    <div className="min-h-screen p-4 sm:p-8">
       <DashboardClient initialProblems={problems} stats={stats} />
    </div>
  );
}
