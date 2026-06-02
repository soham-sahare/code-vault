"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { User, Globe, ArrowLeft, ExternalLink, ShieldCheck, Award, Flame, Search } from "lucide-react";
import { motion } from "framer-motion";
import { getPublicProfileByUsername } from "@/lib/actions";

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = use(params);
  const username = resolvedParams.username;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getPublicProfileByUsername(username);
        setProfile(data);
      } catch (err) {
        console.error("Failed to load public profile:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300 items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="font-sans font-semibold text-xs text-muted">Retrieving public profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans text-xs p-6 md:p-12 transition-colors duration-300 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <User className="w-12 h-12 text-muted/40 mx-auto" />
          <h2 className="font-display font-extrabold text-sm text-foreground">Profile Not Found</h2>
          <p className="text-muted leading-relaxed">
            This user profile does not exist or has been configured to remain private.
          </p>
          <Link href="/" className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Go to CodeVault Home
          </Link>
        </div>
      </div>
    );
  }

  const easyCount = profile.problems.filter((p: any) => p.difficulty === "EASY").length;
  const mediumCount = profile.problems.filter((p: any) => p.difficulty === "MED").length;
  const hardCount = profile.problems.filter((p: any) => p.difficulty === "HARD").length;
  const totalSolved = profile.problems.length;

  const filteredProblems = profile.problems.filter((p: any) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const joinYear = new Date(profile.createdAt).getFullYear();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans text-xs p-6 md:p-12 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to CodeVault Home
        </Link>

        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <User className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-xl text-foreground">
                  @{profile.username}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-sans">
                  <Globe className="w-2.5 h-2.5" />
                  Public Profile
                </span>
              </div>
              <p className="text-[10px] text-muted">Member of CodeVault since {joinYear}</p>
            </div>
          </div>

          {/* Quick stats badges */}
          <div className="flex flex-wrap gap-4">
            <div className="px-4 py-2 rounded-2xl bg-surface-2 border border-border flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <div>
                <span className="block text-[9px] text-muted uppercase font-bold">Streak</span>
                <span className="font-display font-extrabold text-xs text-foreground">{totalSolved > 0 ? "7" : "0"} Days</span>
              </div>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-surface-2 border border-border flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              <div>
                <span className="block text-[9px] text-muted uppercase font-bold">Level</span>
                <span className="font-display font-extrabold text-xs text-foreground">
                  {totalSolved > 10 ? "Grandmaster" : totalSolved > 5 ? "Expert" : "Pupil"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Distribution & Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-3xl bg-surface border border-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-muted uppercase tracking-wider text-[9px]">Easy Solved</span>
              <span className="font-display font-extrabold text-emerald-500 text-base">{easyCount}</span>
            </div>
            <div className="w-full h-1.5 bg-surface-2 border border-border/40 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalSolved > 0 ? (easyCount / totalSolved) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-surface border border-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-muted uppercase tracking-wider text-[9px]">Medium Solved</span>
              <span className="font-display font-extrabold text-amber-500 text-base">{mediumCount}</span>
            </div>
            <div className="w-full h-1.5 bg-surface-2 border border-border/40 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${totalSolved > 0 ? (mediumCount / totalSolved) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-surface border border-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-muted uppercase tracking-wider text-[9px]">Hard Solved</span>
              <span className="font-display font-extrabold text-rose-500 text-base">{hardCount}</span>
            </div>
            <div className="w-full h-1.5 bg-surface-2 border border-border/40 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${totalSolved > 0 ? (hardCount / totalSolved) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        {/* Problems list */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-display font-bold text-sm text-foreground">
              Solved Challenges ({totalSolved})
            </h2>

            {/* Search filter input */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted" />
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-foreground font-semibold placeholder:font-normal"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-border/80 text-muted font-bold tracking-wider uppercase text-[9px]">
                  <th className="pb-3.5 pl-2">Problem Name</th>
                  <th className="pb-3.5">Difficulty</th>
                  <th className="pb-3.5">Topic</th>
                  <th className="pb-3.5">Date Solved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {filteredProblems.map((prob: any, idx: number) => (
                  <tr key={idx} className="hover:bg-surface-2/30 transition-all duration-150">
                    <td className="py-3.5 pl-2 font-display font-bold text-foreground">
                      {prob.name}
                    </td>
                    <td className="py-3.5">
                      <span className={`font-display font-bold text-[9px] px-2 py-0.5 rounded ${
                        prob.difficulty === "EASY" ? "text-emerald-500 bg-emerald-500/10" : prob.difficulty === "HARD" ? "text-rose-500 bg-rose-500/10" : "text-amber-500 bg-amber-500/10"
                      }`}>
                        {prob.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 text-muted font-semibold">
                      {prob.topic}
                    </td>
                    <td className="py-3.5 text-muted">
                      {new Date(prob.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {filteredProblems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted">
                      No matching challenges found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
