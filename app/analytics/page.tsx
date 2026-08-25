"use client";

import { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/shell/Sidebar";
import { BarChart3, Star, Award, Zap, CheckCircle2, ChevronRight, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserProblemSummaries, getUserProfile } from "@/lib/actions";
import { useTheme } from "next-themes";
import Link from "next/link";
import NotificationBell from "@/components/notifications/NotificationBell";
import { getInitials } from "@/lib/utils/formatters";


export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<any[]>([]);
  const { resolvedTheme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [complexityTab, setComplexityTab] = useState<"time" | "space">("time");

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

  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D" | "ALL">("7D");

  useEffect(() => {
    async function load() {
      try {
        const data = await getUserProblemSummaries();
        setProblems(data);
      } catch (err) {
        console.error("Failed to load analytics data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredData = useMemo(() => {
    if (timeRange === "ALL") return problems;
    const now = new Date();
    let limitDays = 7;
    if (timeRange === "30D") limitDays = 30;
    if (timeRange === "90D") limitDays = 90;
    
    const cutoffDate = new Date(now.getTime() - limitDays * 24 * 60 * 60 * 1000);
    return problems.filter((p) => {
      const pDate = p.solvedAt ? new Date(p.solvedAt) : new Date(p.createdAt);
      return pDate >= cutoffDate;
    });
  }, [problems, timeRange]);

  const totalSolved = useMemo(() => filteredData.filter((p) => p.status === "Solved").length, [filteredData]);
  const retentionRate = useMemo(
    () => (totalSolved > 0 ? Math.round((filteredData.filter((p) => p.interval !== "Recall Stage 1").length / filteredData.length) * 100) : 0),
    [filteredData, totalSolved]
  );
  
  // Topic aggregation - split comma-separated strings to get individual topic statistics
  const topics = useMemo(() => {
    const topicMap: Record<string, { solved: number; total: number }> = {};
    filteredData.forEach((p) => {
      const rawTopic = p.topic || "Unknown";
      const individualTopics = rawTopic.split(",").map((t: string) => t.trim()).filter(Boolean);
      
      individualTopics.forEach((t: string) => {
        if (!topicMap[t]) {
          topicMap[t] = { solved: 0, total: 0 };
        }
        topicMap[t].total += 1;
        if (p.status === "Solved") {
          topicMap[t].solved += 1;
        }
      });
    });
    return Object.entries(topicMap).map(([name, stat]) => ({
      name,
      solved: stat.solved,
      total: stat.total,
      percent: stat.total > 0 ? `${Math.round((stat.solved / stat.total) * 100)}%` : "0%"
    }));
  }, [filteredData]);

  const getStreakData = (allProblems: any[]) => {
    const solvedProblems = allProblems.filter((p) => p.status === "Solved" && p.solvedAt);
    if (solvedProblems.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const solvedDates = solvedProblems
      .map((p) => {
        const d = new Date(p.solvedAt);
        return d.toISOString().split("T")[0];
      });

    const uniqueSolvedDates = Array.from(new Set(solvedDates)).sort((a, b) => b.localeCompare(a));

    if (uniqueSolvedDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const lastSolvedDate = uniqueSolvedDates[0];
    const isStreakActive = lastSolvedDate === todayStr || lastSolvedDate === yesterdayStr;

    let currentStreak = 0;
    if (isStreakActive) {
      currentStreak = 1;
      let prevDate = new Date(lastSolvedDate);
      for (let i = 1; i < uniqueSolvedDates.length; i++) {
        const currentDate = new Date(uniqueSolvedDates[i]);
        const diffTime = Math.abs(prevDate.getTime() - currentDate.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
          prevDate = currentDate;
        } else {
          break;
        }
      }
    }

    // Longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    const ascSolvedDates = [...uniqueSolvedDates].reverse();
    for (const dStr of ascSolvedDates) {
      const currentDate = new Date(dStr);
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          if (tempStreak > longestStreak) longestStreak = tempStreak;
          tempStreak = 1;
        }
      }
      prevDate = currentDate;
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;

    return { currentStreak, longestStreak };
  };

  const streakData = useMemo(() => getStreakData(problems), [problems]);
  const { currentStreak, longestStreak } = streakData;

  const normalizeComplexity = (val: string): string => {
    const clean = val.toLowerCase().replace(/\s+/g, "").trim();
    if (!clean) return "";
    if (clean.includes("o(1)")) return "O(1)";
    if (clean.includes("o(nlogn)") || clean.includes("o(nlog(n))") || clean.includes("o(n*logn)")) return "O(N log N)";
    if (clean.includes("o(n2)") || clean.includes("o(n^2)")) return "O(N²)";
    if (clean.includes("o(n)")) return "O(N)";
    if (clean.includes("o(logn)") || clean.includes("o(log(n))")) return "O(log N)";
    if (clean.startsWith("o(") && clean.endsWith(")")) {
      const inner = val.slice(2, -1).trim();
      return `O(${inner})`;
    }
    return val.trim();
  };

  const timeComplexityData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((p) => {
      p.solutions?.forEach((sol: any) => {
        const val = sol.time;
        if (!val) return;
        const normalized = normalizeComplexity(val);
        if (normalized) {
          counts[normalized] = (counts[normalized] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const spaceComplexityData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((p) => {
      p.solutions?.forEach((sol: any) => {
        const val = sol.space;
        if (!val) return;
        const normalized = normalizeComplexity(val);
        if (normalized) {
          counts[normalized] = (counts[normalized] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const difficultyData = useMemo(() => {
    const counts = { EASY: 0, MED: 0, HARD: 0 };
    filteredData.forEach((p) => {
      const diff = (p.difficulty || "EASY").toUpperCase();
      if (diff === "EASY") counts.EASY++;
      else if (diff === "MED" || diff === "MEDIUM") counts.MED++;
      else if (diff === "HARD") counts.HARD++;
    });
    return [
      { label: "Easy", count: counts.EASY, color: "#34D399" },
      { label: "Medium", count: counts.MED, color: "#FBBF24" },
      { label: "Hard", count: counts.HARD, color: "#F87171" }
    ].filter(item => item.count > 0);
  }, [filteredData]);

  const languageData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((p) => {
      p.solutions?.forEach((sol: any) => {
        const val = sol.lang;
        if (!val) return;
        const normalized = val.trim();
        if (normalized) {
          counts[normalized] = (counts[normalized] || 0) + 1;
        }
      });
    });
    
    const langColors: Record<string, string> = {
      Python: "#10B981",
      JavaScript: "#FBBF24",
      TypeScript: "#3B82F6",
      "C++": "#8B5CF6",
      Cpp: "#8B5CF6",
      Java: "#EF4444",
      Go: "#06B6D4",
      Rust: "#F97316",
    };
    const fallbackColors = ["#EC4899", "#14B8A6", "#6366F1", "#A855F7"];

    return Object.entries(counts)
      .map(([label, count], index) => {
        const color = langColors[label] || fallbackColors[index % fallbackColors.length];
        return { label, count, color };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const totalDifficultySolves = useMemo(
    () => difficultyData.reduce((acc, item) => acc + item.count, 0),
    [difficultyData]
  );

  const totalLanguageSolves = useMemo(
    () => languageData.reduce((acc, item) => acc + item.count, 0),
    [languageData]
  );

  const getRecallVolumeData = () => {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ... 5 = Fri, 6 = Sat
    
    // Calculate start of current week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    problems.forEach((p) => {
      if (p.status === "Solved" && p.solvedAt) {
        const d = new Date(p.solvedAt);
        if (d >= startOfWeek && d <= endOfWeek) {
          const day = d.getDay();
          dayCounts[day]++;
        }
      }
    });

    const maxCount = Math.max(...dayCounts);
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return daysOfWeek.map((day, idx) => {
      const count = dayCounts[idx];
      const h = maxCount > 0 ? (count > 0 ? `${(count / maxCount) * 75 + 20}%` : "0%") : "0%";
      const isToday = idx === currentDayOfWeek;
      const c = isToday ? "bg-[#B7A8F5] shadow-sm shadow-[#B7A8F5]/30" : "bg-muted";
      return { day, h, c, count };
    });
  };

  const recallVolumeData = getRecallVolumeData();

  const getTreemapData = () => {
    // Sort topics by total solves descending
    const sortedTopics = [...topics].sort((a, b) => b.total - a.total);
    
    let displayTopics = sortedTopics;
    if (sortedTopics.length > 8) {
      const top = sortedTopics.slice(0, 7);
      const rest = sortedTopics.slice(7);
      const restTotal = rest.reduce((acc, t) => acc + t.total, 0);
      const restSolved = rest.reduce((acc, t) => acc + t.solved, 0);
      if (restTotal > 0) {
        top.push({
          name: "Others",
          solved: restSolved,
          total: restTotal,
          percent: `${Math.round((restSolved / restTotal) * 100)}%`
        });
      }
      displayTopics = top;
    }

    const sumTotals = displayTopics.reduce((acc, t) => acc + t.total, 0);
    return displayTopics.map((t, idx) => {
      const share = sumTotals > 0 ? (t.total / sumTotals) * 100 : 0;
      const lightness = displayTopics.length > 1 
        ? 40 + Math.round((idx / (displayTopics.length - 1)) * 25)
        : 45;
      const bgStyle = `hsl(262, 70%, ${lightness}%)`;
      return {
        ...t,
        share,
        bgStyle
      };
    });
  };

  const treemapData = getTreemapData();

  const getTreemapColumns = () => {
    const col1: any[] = [];
    const col2: any[] = [];
    const col3: any[] = [];

    const cols = [
      { items: col1, share: 0 },
      { items: col2, share: 0 },
      { items: col3, share: 0 }
    ];

    // Greedy packaging to balance column widths
    treemapData.forEach((tile) => {
      const targetCol = cols.reduce((minCol, c) => c.share < minCol.share ? c : minCol, cols[0]);
      targetCol.items.push(tile);
      targetCol.share += tile.share;
    });

    return cols.filter(c => c.items.length > 0);
  };

  const treemapColumns = getTreemapColumns();

  const totalTimeSolves = timeComplexityData.reduce((acc, item) => acc + item.count, 0);
  const totalSpaceSolves = spaceComplexityData.reduce((acc, item) => acc + item.count, 0);

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
      val: `${currentStreak} Days`,
      icon: <Zap className="w-5 h-5 text-primary" />,
      sub: "active daily fire"
    },
    {
      label: "Spaced Agenda",
      val: `${filteredData.filter((p) => p.status === "Due Today").length} Due`,
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
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex items-center justify-between gap-4">
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
              <NotificationBell />

              {/* User Avatar Circle with Initials & Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-extrabold text-xs text-primary hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm select-none"
                >
                  {getInitials(userProfile)}
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

          <div className="flex justify-center w-full">
            <div className="flex items-center gap-3 bg-surface-2 p-1.5 rounded-2xl border border-border max-w-md w-full justify-around">
              {(["7D", "30D", "90D", "ALL"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`flex-1 py-2 rounded-xl font-sans font-bold text-xs cursor-pointer text-center transition-all ${
                    timeRange === range
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted hover:text-foreground hover:bg-surface/50"
                  }`}
                >
                  {range === "ALL" ? "All Time" : range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Insights Section */}
        <div className="mb-10">
          <h2 className="font-display font-extrabold text-sm text-foreground mb-6 uppercase tracking-wider">
            Insights
          </h2>
          
          {/* Row 1: Topic Breakdown Treemap */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-sm mb-8 flex flex-col justify-between"
          >
            <div>
              <h3 className="font-display font-bold text-sm text-foreground">
                Topic Breakdown
              </h3>
              <p className="font-sans text-[10px] text-muted mt-0.5 mb-4">Topic proportion distribution across all logged solves</p>
            </div>

            {treemapData.length === 0 ? (
              <p className="text-xs text-muted font-sans py-6 text-center">Add problems with topics to populate the treemap.</p>
            ) : (
              <div className="w-full flex h-64 rounded-2xl overflow-hidden border border-border/40 gap-1.5">
                {treemapColumns.map((col, colIdx) => (
                  <div 
                    key={colIdx} 
                    style={{ flexGrow: col.share, flexBasis: 0 }} 
                    className="flex flex-col gap-1.5 h-full"
                  >
                    {col.items.map((tile, idx) => (
                      <motion.div
                        key={tile.name}
                        initial={{ flexGrow: 0 }}
                        animate={{ flexGrow: tile.share }}
                        transition={{ duration: 0.8, delay: idx * 0.05 }}
                        style={{ backgroundColor: tile.bgStyle, flexBasis: 0 }}
                        className="flex flex-col justify-between p-4 hover:opacity-95 transition-opacity cursor-help text-white font-sans relative group overflow-hidden"
                        title={`${tile.name}: ${tile.solved}/${tile.total} Solved (${tile.percent})`}
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-display font-extrabold text-[12px] sm:text-sm truncate max-w-full drop-shadow-sm select-none">
                            {tile.name}
                          </span>
                        </div>
                        <span className="text-[11px] font-extrabold text-white/95 self-end select-none bg-black/20 px-2 py-0.5 rounded-md">
                          {tile.solved}/{tile.total} solved
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
          {/* Row 2: Difficulty, Language, and Combined Complexity (Time & Space) Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
            
            {/* Difficulty Distribution Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-6 rounded-3xl bg-surface border border-border shadow-sm flex flex-col justify-between"
            >
              <div>
                <h2 className="font-display font-bold text-base text-foreground mb-1">
                  Difficulty Distribution
                </h2>
                <p className="font-sans text-[11px] text-muted leading-relaxed mb-6">
                  Distribution of solved problems by difficulty level.
                </p>
              </div>

              <div className="flex flex-col items-center justify-between mt-4 gap-6">
                <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
                  {(() => {
                    const r = 62;
                    const circ = 2 * Math.PI * r;

                    if (totalDifficultySolves === 0) {
                      return (
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="80" cy="80" r="62" className="stroke-muted/15 fill-none" strokeWidth="13" />
                        </svg>
                      );
                    }

                    let accumulatedPercent = 0;
                    return (
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="80" cy="80" r="62" className="stroke-muted/15 fill-none" strokeWidth="13" />
                        {difficultyData.map((item) => {
                          const pct = (item.count / totalDifficultySolves) * circ;
                          const offset = -accumulatedPercent;
                          accumulatedPercent += pct;

                          return (
                            <circle
                              key={item.label}
                              cx="80"
                              cy="80"
                              r="62"
                              fill="none"
                              stroke={item.color}
                              strokeWidth="13"
                              strokeDasharray={`${pct} ${circ}`}
                              strokeDashoffset={offset}
                              className="cursor-pointer transition-all duration-300"
                            >
                              <title>{item.label}: {item.count} Solved ({Math.round((item.count / totalDifficultySolves) * 100)}%)</title>
                            </circle>
                          );
                        })}
                      </svg>
                    );
                  })()}
                  <div className="absolute flex flex-col items-center select-none pointer-events-none">
                    <span className="font-display font-extrabold text-xl text-foreground">
                      {totalDifficultySolves}
                    </span>
                    <span className="text-[9px] font-sans font-bold text-muted uppercase">Solves</span>
                  </div>
                </div>

                <div className="w-full text-[10px] font-mono space-y-2 font-semibold max-h-24 overflow-y-auto pr-1">
                  {difficultyData.length === 0 ? (
                    <div className="text-center text-[8px] text-muted italic">No solves recorded</div>
                  ) : (
                    difficultyData.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center cursor-help border-b border-border/20 pb-1.5" title={`${item.count} Solves`}>
                        <span style={{ color: item.color }} className="font-bold">{item.label}</span>
                        <span className="text-muted">{item.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>

            {/* Language Distribution Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              className="p-6 rounded-3xl bg-surface border border-border shadow-sm flex flex-col justify-between"
            >
              <div>
                <h2 className="font-display font-bold text-base text-foreground mb-1">
                  Language Distribution
                </h2>
                <p className="font-sans text-[11px] text-muted leading-relaxed mb-6">
                  Distribution of solutions by programming language.
                </p>
              </div>

              <div className="flex flex-col items-center justify-between mt-4 gap-6">
                <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
                  {(() => {
                    const r = 62;
                    const circ = 2 * Math.PI * r;

                    if (totalLanguageSolves === 0) {
                      return (
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="80" cy="80" r="62" className="stroke-muted/15 fill-none" strokeWidth="13" />
                        </svg>
                      );
                    }

                    let accumulatedPercent = 0;
                    return (
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="80" cy="80" r="62" className="stroke-muted/15 fill-none" strokeWidth="13" />
                        {languageData.map((item) => {
                          const pct = (item.count / totalLanguageSolves) * circ;
                          const offset = -accumulatedPercent;
                          accumulatedPercent += pct;

                          return (
                            <circle
                              key={item.label}
                              cx="80"
                              cy="80"
                              r="62"
                              fill="none"
                              stroke={item.color}
                              strokeWidth="13"
                              strokeDasharray={`${pct} ${circ}`}
                              strokeDashoffset={offset}
                              className="cursor-pointer transition-all duration-300"
                            >
                              <title>{item.label}: {item.count} Solutions ({Math.round((item.count / totalLanguageSolves) * 100)}%)</title>
                            </circle>
                          );
                        })}
                      </svg>
                    );
                  })()}
                  <div className="absolute flex flex-col items-center select-none pointer-events-none">
                    <span className="font-display font-extrabold text-xl text-foreground">
                      {totalLanguageSolves}
                    </span>
                    <span className="text-[9px] font-sans font-bold text-muted uppercase">Sols</span>
                  </div>
                </div>

                <div className="w-full text-[10px] font-mono space-y-2 font-semibold max-h-24 overflow-y-auto pr-1">
                  {languageData.length === 0 ? (
                    <div className="text-center text-[8px] text-muted italic">No solutions recorded</div>
                  ) : (
                    languageData.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center cursor-help border-b border-border/20 pb-1.5" title={`${item.count} Solutions`}>
                        <span style={{ color: item.color }} className="font-bold">{item.label}</span>
                        <span className="text-muted">{item.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>

            {/* Combined Complexity Distribution Card (Time & Space) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="p-6 rounded-3xl bg-surface border border-border shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h2 className="font-display font-bold text-base text-foreground">
                    Complexity Distribution
                  </h2>
                  <div className="flex items-center bg-surface-2 p-0.5 rounded-xl border border-border">
                    <button
                      onClick={() => setComplexityTab("time")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-sans transition-all cursor-pointer ${
                        complexityTab === "time"
                          ? "bg-primary text-white shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      Time (O)
                    </button>
                    <button
                      onClick={() => setComplexityTab("space")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-sans transition-all cursor-pointer ${
                        complexityTab === "space"
                          ? "bg-primary text-white shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      Space (O)
                    </button>
                  </div>
                </div>
                <p className="font-sans text-[11px] text-muted leading-relaxed mb-6">
                  {complexityTab === "time"
                    ? "Asymptotic time complexity metrics mapped from logged solutions."
                    : "Asymptotic space complexity metrics mapped from logged solutions."}
                </p>
              </div>

              <div className="flex flex-col items-center justify-between mt-4 gap-6">
                <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
                  {(() => {
                    const r = 62;
                    const circ = 2 * Math.PI * r;
                    const chartColors = ["#B7A8F5", "#EE8E5A", "#60A5FA", "#34D399", "#F87171", "#FBBF24", "#A78BFA"];
                    const activeData = complexityTab === "time" ? timeComplexityData : spaceComplexityData;
                    const activeTotal = complexityTab === "time" ? totalTimeSolves : totalSpaceSolves;

                    if (activeTotal === 0) {
                      return (
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="80" cy="80" r="62" className="stroke-muted/15 fill-none" strokeWidth="13" />
                        </svg>
                      );
                    }

                    let accumulatedPercent = 0;
                    return (
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="80" cy="80" r="62" className="stroke-muted/15 fill-none" strokeWidth="13" />
                        {activeData.map((item, idx) => {
                          const pct = (item.count / activeTotal) * circ;
                          const offset = -accumulatedPercent;
                          accumulatedPercent += pct;
                          const strokeColor = chartColors[idx % chartColors.length];

                          return (
                            <circle
                              key={item.label}
                              cx="80"
                              cy="80"
                              r="62"
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth="13"
                              strokeDasharray={`${pct} ${circ}`}
                              strokeDashoffset={offset}
                              className="cursor-pointer transition-all duration-300"
                            >
                              <title>{item.label}: {item.count} Solved ({Math.round((item.count / activeTotal) * 100)}%)</title>
                            </circle>
                          );
                        })}
                      </svg>
                    );
                  })()}
                  <div className="absolute flex flex-col items-center select-none pointer-events-none">
                    <span className="font-display font-extrabold text-xl text-foreground">
                      {complexityTab === "time" ? totalTimeSolves : totalSpaceSolves}
                    </span>
                    <span className="text-[9px] font-sans font-bold text-muted uppercase">Solves</span>
                  </div>
                </div>

                <div className="w-full text-[10px] font-mono space-y-2 font-semibold max-h-24 overflow-y-auto pr-1">
                  {(complexityTab === "time" ? timeComplexityData : spaceComplexityData).length === 0 ? (
                    <div className="text-center text-[8px] text-muted italic">No solves recorded</div>
                  ) : (
                    (complexityTab === "time" ? timeComplexityData : spaceComplexityData).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center cursor-help border-b border-border/20 pb-1.5" title={`${item.count} Solves`}>
                        <span className="text-primary font-bold">{item.label}</span>
                        <span className="text-muted">{item.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Row 3: Recall Volume (Full Width) */}
          <div className="mb-8.5">
            
            {/* RECALL VOLUME GRAPH */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-sm flex flex-col justify-between"
            >
              <div>
                <h3 className="font-display font-bold text-sm text-foreground">
                  Recall Volume
                </h3>
                <p className="font-sans text-[10px] text-muted mt-0.5">Solves across current week</p>
              </div>
              <div className="h-44 flex items-end justify-between mt-6 px-2">
                {recallVolumeData.map((bar, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 gap-2.5 group cursor-pointer" title={`${bar.count} solves`}>
                    <div className={`w-5 rounded-md h-32 flex items-end overflow-hidden transition-all ${
                      bar.count > 0 
                        ? "bg-surface-2 border border-border/40 shadow-inner" 
                        : "bg-transparent border border-transparent"
                    }`}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: bar.h }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                        className={`w-full rounded-b-md ${bar.c}`}
                      />
                    </div>
                    <span className="font-sans text-[10px] font-bold text-muted group-hover:text-foreground transition-colors">
                      {bar.day}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>

          {/* Row 4: Metrics Grid */}
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

      </main>

    </div>
  );
}
