import { getProblems, getUserStats } from "@/actions/problem";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage(props: {
  searchParams: Promise<{ topic?: string; difficulty?: string; search?: string; tags?: string }>;
}) {
  const searchParams = await props.searchParams;
  const problems = await getProblems(searchParams);
  const stats = await getUserStats();

  return (
    <div className="min-h-screen p-4 sm:p-8">
       <DashboardClient initialProblems={problems} stats={stats} />
    </div>
  );
}
