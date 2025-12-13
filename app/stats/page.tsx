import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserStats } from "@/actions/problem";
import StatsClient from "@/components/StatsClient";


export default async function StatsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const stats = await getUserStats();

  return (
    <div className="min-h-screen p-4 sm:p-8">
        <StatsClient stats={stats} />
    </div>
  );
}
