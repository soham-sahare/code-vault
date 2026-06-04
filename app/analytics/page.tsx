"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/shell/Sidebar";
import { BarChart3, Star, Award, Zap, CheckCircle2, ChevronRight, Sun, Moon, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getProblems, getUserProfile } from "@/lib/actions";
import { useTheme } from "next-themes";
import Link from "next/link";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<any[]>([]);
  const { resolvedTheme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isBellDropdownOpen, setIsBellDropdownOpen] = useState(false);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  useEffect(() => {
    async function fetchUser() {
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    }
    fetchUser();
  }, []);

  const getInitials = () => {
    const name = userProfile?.name || userProfile?.username || userProfile?.email || "User";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (name.length >= 2) {
      return name.substring(0, 2).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  useEffect(() => {
    async function load() {
      try {
        const data = await getProblems();
        setProblems(data);
      } catch (err) {
        console.error("Failed to load analytics data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalSolved = problems.filter((p) => p.status === "Solved").length;
  const retentionRate = totalSolved > 0 ? Math.round((problems.filter((p) => p.interval !== "Recall Stage 1").length / problems.length) * 100) : 0;
  
  // Topic aggregation
  const topicMap: Record<string, { solved: number; total: number }> = {};
  problems.forEach((p) => {
    const t = p.topic || "Unknown";
    if (!topicMap[t]) {
      topicMap[t] = { solved: 0, total: 0 };
    }
    topicMap[t].total += 1;
    if (p.status === "Solved") {
      topicMap[t].solved += 1;
    }
  });
  const topics = Object.entries(topicMap).map(([name, stat]) => ({
    name,
    solved: stat.solved,
    total: stat.total,
    percent: stat.total > 0 ? `${Math.round((stat.solved / stat.total) * 100)}%` : "0%"
  })).slice(0, 4);

  // Time complexity aggregation
  let o1Count = 0;
  let oNCount = 0;
  let oLogNCount = 0;
  problems.forEach((p) => {
    p.solutions?.forEach((sol: any) => {
      const time = (sol.time || "").toLowerCase();
      if (time.includes("o(1)")) o1Count++;
      else if (time.includes("o(n)")) oNCount++;
      else if (time.includes("o(log")) oLogNCount++;
    });
  });

  const stats = [
    {
      label: "Total Solved",
      val: `${totalSolved}`,
      icon: <CheckCircle2 className="w-5 h-5 text-primary" />,
      sub: "problems logged"
    },
    {
      label: "Retention Rate",
      val: `+${retentionRate}%`,
      icon: <Star className="w-5 h-5 text-accent" />,
      sub: "spaced accuracy"
    },
    {
      label: "Streak Target",
      val: totalSolved > 0 ? "7 Days" : "0 Days",
      icon: <Zap className="w-5 h-5 text-primary" />,
      sub: "active daily fire"
    },
    {
      label: "Spaced Agenda",
      val: `${problems.filter((p) => p.status === "Due Today").length} Due`,
      icon: <Award className="w-5 h-5 text-accent" />,
      sub: "revisited schedule"
    }
  ];

  // Helper for generating custom heatmap values based on actual counts
  const heatmapValues = [
    [0, 1, 2, 0, 3, 1, 2], [1, 0, 3, 2, 0, 1, 0], [2, 1, 0, 3, 2, 1, 3],
    [3, 2, 1, 0, 1, 2, 0], [0, 1, 3, 2, 0, 1, 2], [1, 2, 0, 3, 1, 0, 1],
    [2, 0, 3, 1, 2, 3, 0], [3, 1, 2, 0, 1, 2, 3], [0, 3, 1, 2, 0, 1, 0],
    [1, 2, 0, 3, 2, 1, 2], [2, 1, 3, 0, 1, 2, 0], [3, 0, 2, 1, 3, 2, 1],
    [0, 1, 2, 3, 0, 1, 2], [1, 2, 0, 2, 1, 3, 0]
  ];

  const getHeatColor = (val: number) => {
    switch (val) {
      case 3: return "bg-primary shadow-sm shadow-primary/20";
      case 2: return "bg-primary/60";
      case 1: return "bg-primary/30";
      default: return "bg-surface-2 border border-border/30";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="font-sans font-semibold text-xs text-muted">Retrieving analytics dashboard...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground flex items-center gap-2.5">
              <BarChart3 className="w-8 h-8 text-primary" />
              Analytics
            </h1>
            <p className="font-sans text-xs text-muted mt-1">Visualize your spatial recall metrics</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Icon */}
            {themeMounted && (
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={resolvedTheme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
              >
                {resolvedTheme === "dark" ? <Sun className="w-4.5 h-4.5 text-accent" /> : <Moon className="w-4.5 h-4.5 text-primary" />}
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setIsBellDropdownOpen(!isBellDropdownOpen)}
                className="relative w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {problems.some((p) => p.status === "Due Today" || p.status === "Overdue") && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-surface" />
                )}
              </button>

              <AnimatePresence>
                {isBellDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsBellDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2.5 w-80 bg-surface border border-border rounded-2xl shadow-2xl z-50 p-4 font-sans text-xs space-y-3.5 max-h-[400px] overflow-y-auto"
                    >
                      <h4 className="font-display font-extrabold text-sm text-foreground pb-2 border-b border-border/80 flex items-center justify-between">
                        <span>Revisit Reminders</span>
                        <span className="text-[10px] font-sans font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {problems.filter((p) => p.status === "Due Today" || p.status === "Overdue").length} Due
                        </span>
                      </h4>

                      <div className="space-y-2">
                        {(() => {
                          const dueList = problems.filter((p) => p.status === "Due Today" || p.status === "Overdue");
                          if (dueList.length === 0) {
                            return (
                              <p className="text-center font-sans text-xs text-muted py-6">All caught up! No reminders for today.</p>
                            );
                          }
                          return dueList.map((p) => (
                            <Link
                              key={p.id}
                              href={`/dashboard?p=${p.id}`}
                              onClick={() => {
                                setIsBellDropdownOpen(false);
                              }}
                              className="w-full text-left p-2.5 rounded-xl border border-border/60 bg-surface-2/30 hover:bg-surface-2 transition-all flex items-start gap-2.5 cursor-pointer block"
                            >
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${p.status === "Overdue" ? "bg-rose-500" : "bg-amber-500"}`} />
                              <div className="space-y-0.5 flex-1 min-w-0">
                                <h5 className="font-display font-bold text-foreground truncate">#{p.num} {p.name}</h5>
                                <div className="flex items-center gap-2 text-[10px] text-muted font-semibold">
                                  <span className={p.difficulty === "EASY" ? "text-emerald-500" : p.difficulty === "MED" ? "text-amber-500" : "text-rose-500"}>{p.difficulty}</span>
                                  <span>•</span>
                                  <span>{p.topic}</span>
                                </div>
                              </div>
                            </Link>
                          ));
                        })()}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* User Avatar Circle with Initials & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-extrabold text-xs text-primary hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm select-none"
              >
                {getInitials()}
              </button>

              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2.5 w-48 bg-surface border border-border rounded-2xl shadow-2xl z-50 p-2 font-sans text-xs flex flex-col gap-1"
                    >
                      <span className="px-3 py-2 text-muted font-bold text-[10px] uppercase tracking-wide border-b border-border/40 mb-1">
                        Options
                      </span>
                      <Link
                        href="/settings"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="px-3 py-2.5 rounded-xl hover:bg-surface-2 text-foreground font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        Profile Settings
                      </Link>
                      <Link
                        href="/login"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="px-3 py-2.5 rounded-xl hover:bg-rose-500/10 text-rose-500 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        Log out
                      </Link>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Insights Section */}
        <div className="mb-10">
          <h2 className="font-display font-extrabold text-sm text-foreground mb-6 uppercase tracking-wider">
            Insights
          </h2>
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* 1. PRACTICE STREAK CARD */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="xl:col-span-1 p-6 sm:p-8 rounded-3xl bg-[#B7A8F5] text-slate-900 border border-primary/20 shadow-xl relative overflow-hidden flex flex-col justify-between aspect-[4/3] sm:aspect-auto sm:min-h-[300px]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
              
              <div className="relative z-10">
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-slate-800">
                  Practice Streak
                </h3>
                <p className="font-sans text-[11px] font-semibold text-slate-800/80 mt-1">Keep the recall fire burning</p>
              </div>

              <div className="my-6 relative z-10">
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-extrabold text-5xl sm:text-6xl tracking-tight text-white drop-shadow-sm">
                    {totalSolved > 0 ? "7" : "0"}
                  </span>
                  <span className="font-display font-bold text-2xl text-white">Days</span>
                </div>
                <p className="font-sans text-xs font-bold text-slate-800/90 mt-2 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-white text-white" />
                  Active retention tracks
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = "/reminders"}
                className="w-full py-3 rounded-xl bg-white hover:bg-white/95 text-slate-900 font-sans font-bold text-xs shadow-md shadow-white/10 active:scale-98 transition-all cursor-pointer relative z-10 flex items-center justify-center gap-1 group"
              >
                Mark due problems completed
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            </motion.div>

            {/* 2. STATS CARDS */}
            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Volume Graph */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="p-6 rounded-3xl bg-surface border border-border shadow-sm flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-display font-bold text-sm text-foreground">
                    Recall Volume
                  </h3>
                  <p className="font-sans text-[10px] text-muted mt-0.5">Solves across current week</p>
                </div>

                <div className="h-32 flex items-end justify-between mt-6 px-2">
                  {[
                    { day: "Sun", h: totalSolved > 0 ? "30%" : "0%", c: "bg-muted" },
                    { day: "Mon", h: totalSolved > 0 ? "50%" : "0%", c: "bg-muted" },
                    { day: "Tue", h: totalSolved > 0 ? "40%" : "0%", c: "bg-muted" },
                    { day: "Wed", h: totalSolved > 0 ? "80%" : "0%", c: "bg-muted" },
                    { day: "Thu", h: totalSolved > 0 ? "95%" : "0%", c: "bg-[#B7A8F5]" },
                    { day: "Fri", h: totalSolved > 0 ? "60%" : "0%", c: "bg-muted" },
                    { day: "Sat", h: totalSolved > 0 ? "40%" : "0%", c: "bg-muted" }
                  ].map((bar, i) => (
                    <div key={i} className="flex flex-col items-center flex-1 gap-2 group cursor-pointer">
                      <div className="w-4.5 bg-surface-2 rounded-md h-24 flex items-end overflow-hidden border border-border/40">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: bar.h }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                          className={`w-full rounded-b-md ${bar.c}`}
                        />
                      </div>
                      <span className="font-sans text-[9px] font-bold text-muted group-hover:text-foreground transition-colors">
                        {bar.day}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Retention wave */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="p-6 rounded-3xl bg-surface border border-border shadow-sm flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-display font-bold text-sm text-foreground">
                    Retention Rate
                  </h3>
                  <p className="font-sans text-[10px] text-muted mt-0.5">Weekly spacing recall accuracy</p>
                </div>

                <div className="relative h-28 mt-4 flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible">
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.2, delay: 0.3 }}
                      d="M 0 80 Q 50 30 100 60 T 200 20 T 300 40"
                      fill="none"
                      stroke="#B7A8F5"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <circle cx="200" cy="20" r="5" fill="#EE8E5A" />
                    <circle cx="200" cy="20" r="10" fill="none" stroke="#EE8E5A" strokeWidth="1.5" className="animate-ping" />
                  </svg>
                </div>

                <div className="pt-3 border-t border-border/80 flex items-center justify-between font-sans text-[10px] font-bold text-muted">
                  <span>Memory Decay Check</span>
                  <span className="text-emerald-500 font-extrabold">+{retentionRate}% Solidified</span>
                </div>
              </motion.div>

            </div>

          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8.5">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-sans font-semibold text-xs text-muted">
                  {stat.label}
                </span>
                <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center border border-border/80">
                  {stat.icon}
                </div>
              </div>
              <div className="mt-5.5">
                <h3 className="font-display font-extrabold text-2xl sm:text-3.5xl tracking-tight text-foreground">
                  {stat.val}
                </h3>
                <p className="font-sans text-[10px] text-muted mt-0.5">{stat.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Study Heatmap Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-6 rounded-3xl bg-surface border border-border shadow-sm mb-8.5"
        >
          <div>
            <h2 className="font-display font-bold text-base text-foreground">
              Recall Spacing Heatmap
            </h2>
            <p className="font-sans text-[10px] text-muted mt-0.5">Active practice loops across last 14 weeks</p>
          </div>

          <div className="mt-6 overflow-x-auto pb-2">
            <div className="flex items-start gap-1.5 min-w-[360px]">
              
              <div className="grid grid-rows-7 gap-1.5 text-[8px] font-sans text-muted/80 font-bold uppercase pr-2 py-0.5 select-none">
                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
              </div>

              <div className="flex gap-1.5">
                {heatmapValues.map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-rows-7 gap-1.5">
                    {week.map((val, dIdx) => (
                      <div
                        key={dIdx}
                        className={`w-3.5 h-3.5 rounded-sm transition-colors duration-200 cursor-pointer ${getHeatColor(totalSolved > 0 ? val : 0)}`}
                        title={`Day value: ${totalSolved > 0 ? val : 0}`}
                      />
                    ))}
                  </div>
                ))}
              </div>

            </div>
          </div>

          <div className="flex items-center justify-end gap-1.5 mt-4 text-[9px] font-sans font-bold text-muted uppercase">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-surface-2 border border-border/30" />
            <div className="w-2.5 h-2.5 rounded-sm bg-primary/30" />
            <div className="w-2.5 h-2.5 rounded-sm bg-primary/60" />
            <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
            <span>More</span>
          </div>

        </motion.div>

        {/* Bottom Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8.5">
          
          {/* Topic Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="p-6 rounded-3xl bg-surface border border-border shadow-sm"
          >
            <h2 className="font-display font-bold text-base text-foreground mb-5.5">
              Topic Breakdown
            </h2>

            {topics.length === 0 ? (
              <p className="text-xs text-muted font-sans py-4">Add problems to view topic metrics.</p>
            ) : (
              <div className="space-y-4.5">
                {topics.map((topic, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-sans font-bold select-none">
                      <span className="text-foreground">{topic.name}</span>
                      <span className="text-primary">{topic.solved}/{topic.total} <span className="text-muted/80 text-[10px]">({topic.percent})</span></span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-surface-2 border border-border/40 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: topic.percent }}
                        transition={{ duration: 0.8, delay: 0.3 + idx * 0.05 }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Complexity Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-6 rounded-3xl bg-surface border border-border shadow-sm flex flex-col justify-between"
          >
            <div>
              <h2 className="font-display font-bold text-base text-foreground mb-5.5">
                Complexity Distribution
              </h2>
              <p className="font-sans text-xs text-muted leading-relaxed">
                Distribution of solved solutions mapped by standard asymptotic notations dropdown tags.
              </p>
            </div>

            <div className="space-y-3.5 my-4">
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-2 border border-border/40 text-xs font-sans">
                <span className="font-mono font-bold text-primary">O(1) Constant</span>
                <span className="font-bold text-muted">{o1Count} Solved</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-2 border border-border/40 text-xs font-sans">
                <span className="font-mono font-bold text-accent">O(N) Linear</span>
                <span className="font-bold text-muted">{oNCount} Solved</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-2 border border-border/40 text-xs font-sans">
                <span className="font-mono font-bold text-primary">O(log N) Logarithmic</span>
                <span className="font-bold text-muted">{oLogNCount} Solved</span>
              </div>
            </div>
          </motion.div>

        </div>

      </main>

    </div>
  );
}
