"use client";

import { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/shell/Sidebar";
import {
  BarChart3,
  Star,
  Award,
  Zap,
  CheckCircle2,
  Sun,
  Moon,
  Flame,
  TrendingUp,
  Layers,
  Search,
  RotateCcw,
  Check,
  Code2,
  Calendar,
  Building2,
  Briefcase,
  GitMerge,
  Network,
  Workflow,
  Boxes,
  Cpu,
  Compass,
  Hash,
  Activity,
  Target,
  ShieldCheck,
  Sparkles,
  Globe,
  ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserProblemSummaries, getUserProfile } from "@/lib/actions";
import { useTheme } from "next-themes";
import Link from "next/link";
import NotificationBell from "@/components/notifications/NotificationBell";
import { getInitials } from "@/lib/utils/formatters";
import { Skeleton } from "@/components/ui/Skeleton";


export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<any[]>([]);
  const { resolvedTheme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [complexityTab, setComplexityTab] = useState<"time" | "space">("time");

  // Filter States
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D" | "ALL">("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<"ALL" | "EASY" | "MED" | "HARD">("ALL");
  const [topicSearch, setTopicSearch] = useState("");

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

  useEffect(() => {
    async function load() {
      try {
        const data = await getUserProblemSummaries();
        setProblems(data || []);
      } catch (err) {
        console.error("Failed to load analytics data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Multi-dimensional filtering: Time Range + Difficulty + Topic Search
  const filteredData = useMemo(() => {
    const now = new Date();
    let limitDays: number | null = null;
    if (timeRange === "7D") limitDays = 7;
    else if (timeRange === "30D") limitDays = 30;
    else if (timeRange === "90D") limitDays = 90;

    const cutoffDate = limitDays ? new Date(now.getTime() - limitDays * 24 * 60 * 60 * 1000) : null;

    return problems.filter((p) => {
      // 1. Time range filter
      if (cutoffDate) {
        const pDate = p.solvedAt ? new Date(p.solvedAt) : new Date(p.createdAt);
        if (pDate < cutoffDate) return false;
      }

      // 2. Difficulty filter
      if (difficultyFilter !== "ALL") {
        const diff = (p.difficulty || "EASY").toUpperCase();
        const normDiff = diff === "MEDIUM" ? "MED" : diff;
        if (normDiff !== difficultyFilter) return false;
      }

      // 3. Topic search filter
      if (topicSearch.trim()) {
        const q = topicSearch.trim().toLowerCase();
        const matchesTopic = p.topic && p.topic.toLowerCase().includes(q);
        const matchesName = p.name && p.name.toLowerCase().includes(q);
        if (!matchesTopic && !matchesName) return false;
      }

      return true;
    });
  }, [problems, timeRange, difficultyFilter, topicSearch]);

  // Core Metrics
  const totalSolved = useMemo(() => filteredData.filter((p) => p.status === "Solved").length, [filteredData]);
  const totalProblemsCount = filteredData.length;

  const retentionHealth = useMemo(() => {
    if (filteredData.length === 0) return 0;
    const nonOverdue = filteredData.filter((p) => p.status !== "Overdue").length;
    return Math.round((nonOverdue / filteredData.length) * 100);
  }, [filteredData]);

  // SRS 4-Stage Recall Breakdown
  const srsStageCounts = useMemo(() => {
    let stage1 = 0; // 3d
    let stage2 = 0; // 7d
    let stage3 = 0; // 15d
    let stage4 = 0; // 30d / Mastered

    filteredData.forEach((p) => {
      const rawInv = (p.interval || p.reminders?.[0]?.stage || "").toLowerCase().trim();
      if (rawInv.includes("30d") || rawInv.includes("stage 4") || rawInv.includes("mastered")) {
        stage4++;
      } else if (rawInv.includes("15d") || (rawInv.includes("stage 3") && !rawInv.includes("3d"))) {
        stage3++;
      } else if (rawInv.includes("7d") || rawInv.includes("stage 2")) {
        stage2++;
      } else {
        // Stage 1 (3d, Recall Stage 3d, Stage 1, Initial)
        stage1++;
      }
    });

    const total = filteredData.length || 1;
    return [
      { stage: "Stage 1 (3d)", count: stage1, pct: Math.round((stage1 / total) * 100), desc: "Initial Recall" },
      { stage: "Stage 2 (7d)", count: stage2, pct: Math.round((stage2 / total) * 100), desc: "Reinforced Retention" },
      { stage: "Stage 3 (15d)", count: stage3, pct: Math.round((stage3 / total) * 100), desc: "Consolidated Memory" },
      { stage: "Stage 4 (30d)", count: stage4, pct: Math.round((stage4 / total) * 100), desc: "Mastered Long-term" },
    ];
  }, [filteredData]);

  // Approach Multiplicity (Solutions per Problem)
  const avgSolutionsPerProblem = useMemo(() => {
    if (filteredData.length === 0) return "0.0";
    const totalSols = filteredData.reduce((acc, p) => acc + (p.solutions?.length || 0), 0);
    return (totalSols / filteredData.length).toFixed(1);
  }, [filteredData]);

  // Weekly Problem Solving Velocity
  const solvingVelocity = useMemo(() => {
    const solved = filteredData.filter((p) => p.status === "Solved" && p.solvedAt);
    if (solved.length === 0) return 0;
    const dates = solved.map((p) => new Date(p.solvedAt).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates, Date.now());
    const diffWeeks = Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24 * 7));
    return (solved.length / diffWeeks).toFixed(1);
  }, [filteredData]);

  // Topic Aggregation
  const topics = useMemo(() => {
    const topicMap: Record<string, { solved: number; total: number }> = {};
    filteredData.forEach((p) => {
      const rawTopic = p.topic || "General DSA";
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
    return Object.entries(topicMap)
      .map(([name, stat]) => ({
        name,
        solved: stat.solved,
        total: stat.total,
        percent: stat.total > 0 ? Math.round((stat.solved / stat.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // Target Companies Aggregation
  const companiesData = useMemo(() => {
    const compMap: Record<string, { solved: number; total: number }> = {};
    filteredData.forEach((p) => {
      if (p.companies && Array.isArray(p.companies)) {
        p.companies.forEach((c: any) => {
          const name = c.company?.name || c.name;
          if (!name) return;
          if (!compMap[name]) compMap[name] = { solved: 0, total: 0 };
          compMap[name].total += 1;
          if (p.status === "Solved") compMap[name].solved += 1;
        });
      }
    });
    return Object.entries(compMap)
      .map(([name, stat]) => ({
        name,
        solved: stat.solved,
        total: stat.total,
        percent: stat.total > 0 ? Math.round((stat.solved / stat.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // Algorithmic Patterns Aggregation
  const patternsData = useMemo(() => {
    const patMap: Record<string, { solved: number; total: number }> = {};
    filteredData.forEach((p) => {
      if (p.patterns && Array.isArray(p.patterns)) {
        p.patterns.forEach((pat: any) => {
          const name = pat.pattern?.name || pat.name;
          if (!name) return;
          if (!patMap[name]) patMap[name] = { solved: 0, total: 0 };
          patMap[name].total += 1;
          if (p.status === "Solved") patMap[name].solved += 1;
        });
      }
    });
    return Object.entries(patMap)
      .map(([name, stat]) => ({
        name,
        solved: stat.solved,
        total: stat.total,
        percent: stat.total > 0 ? Math.round((stat.solved / stat.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // Multiple Actionable Insights & Intelligence
  const actionableInsights = useMemo(() => {
    const topCompany = companiesData[0];
    const topPattern = patternsData[0];

    // Find pattern needing practice
    const patternNeedingWork = [...patternsData].sort((a, b) => a.percent - b.percent)[0];

    // Company Readiness Calculation
    const totalCompSolves = companiesData.reduce((acc, c) => acc + c.solved, 0);
    const totalCompProblems = companiesData.reduce((acc, c) => acc + c.total, 0);
    const companyReadinessPct = totalCompProblems > 0 
      ? Math.round((totalCompSolves / totalCompProblems) * 100)
      : Math.min(100, Math.round((totalSolved / Math.max(1, totalProblemsCount)) * 85));

    // Pattern Breadth Score
    const corePatternsCount = 12;
    const patternCoveragePct = Math.min(100, Math.round((patternsData.length / corePatternsCount) * 100));

    return [
      {
        title: "Target Tech Readiness",
        value: `${companyReadinessPct}%`,
        description: topCompany 
          ? `Top company footprint: ${topCompany.name} (${topCompany.solved}/${topCompany.total} solved, ${topCompany.percent}%)`
          : "Tag problems with target companies to unlock dedicated readiness metrics.",
        badge: "Interview Index",
        icon: <Building2 className="w-4 h-4 text-amber-500" />,
        accentColor: "border-amber-500/20 bg-amber-500/5 text-amber-500",
      },
      {
        title: "Pattern Versatility",
        value: `${patternsData.length} Patterns`,
        description: `${patternCoveragePct}% core pattern coverage across ${topics.length} DSA topic categories.`,
        badge: "Algorithmic Breadth",
        icon: <GitMerge className="w-4 h-4 text-cyan-500" />,
        accentColor: "border-cyan-500/20 bg-cyan-500/5 text-cyan-500",
      },
      {
        title: "Top Pattern Strength",
        value: topPattern ? topPattern.name : "N/A",
        description: topPattern 
          ? `${topPattern.solved}/${topPattern.total} problems solved with ${topPattern.percent}% mastery completion.`
          : "Add pattern tags to track algorithmic mastery across problem sets.",
        badge: "High Competence",
        icon: <Award className="w-4 h-4 text-emerald-500" />,
        accentColor: "border-emerald-500/20 bg-emerald-500/5 text-emerald-500",
      },
      {
        title: "Practice Recommendation",
        value: patternNeedingWork ? patternNeedingWork.name : "Active Review",
        description: patternNeedingWork 
          ? `Lowest solve rate (${patternNeedingWork.percent}% solved). Prioritize practice in this pattern.`
          : "Continue clearing pending reviews in your Spaced Repetition queue.",
        badge: "Strategic Focus",
        icon: <Zap className="w-4 h-4 text-purple-500" />,
        accentColor: "border-purple-500/20 bg-purple-500/5 text-purple-500",
      },
    ];
  }, [companiesData, patternsData, totalSolved, totalProblemsCount, topics]);

  // Streak Calculation
  const streakData = useMemo(() => {
    const solvedProblems = problems.filter((p) => p.status === "Solved" && p.solvedAt);
    if (solvedProblems.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const solvedDates = solvedProblems.map((p) => new Date(p.solvedAt).toISOString().split("T")[0]);
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
  }, [problems]);

  const { currentStreak, longestStreak } = streakData;

  // Asymptotic Complexity Normalization
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
      { label: "Hard", count: counts.HARD, color: "#F87171" },
    ].filter((item) => item.count > 0);
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

  const totalTimeSolves = timeComplexityData.reduce((acc, item) => acc + item.count, 0);
  const totalSpaceSolves = spaceComplexityData.reduce((acc, item) => acc + item.count, 0);

  // Dynamic Activity / Recall Timeline Data adapted to Time Range
  const timelineData = useMemo(() => {
    const daysCount = timeRange === "7D" ? 7 : timeRange === "30D" ? 14 : timeRange === "90D" ? 12 : 7;
    const now = new Date();
    const result: { label: string; count: number; h: string; isCurrent: boolean }[] = [];

    if (timeRange === "7D" || timeRange === "ALL") {
      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const counts = [0, 0, 0, 0, 0, 0, 0];
      const currentDay = now.getDay();

      filteredData.forEach((p) => {
        if (p.status === "Solved" && p.solvedAt) {
          const d = new Date(p.solvedAt);
          counts[d.getDay()]++;
        }
      });

      const maxCount = Math.max(...counts, 1);
      return daysOfWeek.map((day, idx) => ({
        label: day,
        count: counts[idx],
        h: counts[idx] > 0 ? `${Math.min(100, Math.max(15, (counts[idx] / maxCount) * 100))}%` : "4%",
        isCurrent: idx === currentDay,
      }));
    } else {
      // Group by intervals for 30D / 90D
      const stepDays = timeRange === "30D" ? 2 : 7;
      const buckets: number[] = new Array(daysCount).fill(0);
      const labels: string[] = [];

      for (let i = daysCount - 1; i >= 0; i--) {
        const bucketDate = new Date(now.getTime() - i * stepDays * 24 * 60 * 60 * 1000);
        labels.push(`${bucketDate.getMonth() + 1}/${bucketDate.getDate()}`);
      }

      filteredData.forEach((p) => {
        if (p.status === "Solved" && p.solvedAt) {
          const pDate = new Date(p.solvedAt).getTime();
          const diffDays = Math.floor((now.getTime() - pDate) / (1000 * 60 * 60 * 24));
          const bucketIdx = daysCount - 1 - Math.floor(diffDays / stepDays);
          if (bucketIdx >= 0 && bucketIdx < daysCount) {
            buckets[bucketIdx]++;
          }
        }
      });

      const maxCount = Math.max(...buckets, 1);
      return buckets.map((count, idx) => ({
        label: labels[idx],
        count,
        h: count > 0 ? `${Math.min(100, Math.max(15, (count / maxCount) * 100))}%` : "4%",
        isCurrent: idx === daysCount - 1,
      }));
    }
  }, [filteredData, timeRange]);

  // Treemap Calculations
  const treemapData = useMemo(() => {
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
          percent: restTotal > 0 ? Math.round((restSolved / restTotal) * 100) : 0,
        });
      }
      displayTopics = top;
    }

    const sumTotals = displayTopics.reduce((acc, t) => acc + t.total, 0);
    return displayTopics.map((t, idx) => {
      const share = sumTotals > 0 ? (t.total / sumTotals) * 100 : 0;
      const lightness =
        displayTopics.length > 1
          ? 40 + Math.round((idx / (displayTopics.length - 1)) * 25)
          : 45;
      const bgStyle = `hsl(262, 70%, ${lightness}%)`;
      return { ...t, share, bgStyle };
    });
  }, [topics]);

  const treemapColumns = useMemo(() => {
    const col1: any[] = [];
    const col2: any[] = [];
    const col3: any[] = [];

    const cols = [
      { items: col1, share: 0 },
      { items: col2, share: 0 },
      { items: col3, share: 0 },
    ];

    treemapData.forEach((tile) => {
      const targetCol = cols.reduce((minCol, c) => (c.share < minCol.share ? c : minCol), cols[0]);
      targetCol.items.push(tile);
      targetCol.share += tile.share;
    });

    return cols.filter((c) => c.items.length > 0);
  }, [treemapData]);

  // High Impact Top Metrics
  const stats = [
    {
      label: "Total Solved",
      val: `${totalSolved}`,
      icon: <CheckCircle2 className="w-5 h-5 text-primary" />,
      sub: `${totalProblemsCount} in filtered scope`,
    },
    {
      label: "Retention Health",
      val: `${retentionHealth}%`,
      icon: <Star className="w-5 h-5 text-accent" />,
      sub: "on-schedule retention",
    },
    {
      label: "Active Recall Streak",
      val: `${currentStreak} Days`,
      icon: <Flame className="w-5 h-5 text-rose-500" />,
      sub: `Best: ${longestStreak} days`,
    },
    {
      label: "Spaced Agenda",
      val: `${filteredData.filter((p) => p.status === "Due Today" || p.status === "Overdue").length} Due`,
      icon: <Award className="w-5 h-5 text-amber-500" />,
      sub: "requiring revisit",
    },
    {
      label: "Approach Multiplicity",
      val: `${avgSolutionsPerProblem}x`,
      icon: <Code2 className="w-5 h-5 text-primary" />,
      sub: "solutions per problem",
    },
    {
      label: "Solving Velocity",
      val: `${solvingVelocity}/wk`,
      icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
      sub: "average weekly solve rate",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Header Bar with Real Title & Subtitle */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground flex items-center gap-2.5">
                  <BarChart3 className="w-8 h-8 text-primary" />
                  Analytics & Insights
                </h1>
                <p className="font-sans text-xs text-muted mt-1">
                  Real-time algorithmic mastery, spaced recall retention, and complexity metrics
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-10 h-10 rounded-full" />
              </div>
            </div>

            {/* Filter Bar Skeleton */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-border">
              <Skeleton className="h-10 w-full sm:w-64 rounded-xl" />
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Skeleton className="h-10 w-44 rounded-xl" />
                <Skeleton className="h-10 w-48 rounded-xl" />
              </div>
            </div>
          </div>

          {/* 6 Metric Cards Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-5 rounded-2xl bg-surface border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-16 rounded-md" />
                  <Skeleton className="w-7 h-7 rounded-lg" />
                </div>
                <Skeleton className="h-7 w-20 rounded-xl" />
                <Skeleton className="h-2.5 w-24 rounded-md" />
              </div>
            ))}
          </div>

          {/* SRS Stage Funnel Skeleton */}
          <div className="p-6 rounded-2xl bg-surface border border-border mb-8 space-y-4">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-surface-2/40 border border-border/60 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-4 w-12 rounded-md" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Topic Treemap Skeleton */}
          <div className="p-6 rounded-2xl bg-surface border border-border mb-8 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 h-48">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="rounded-xl h-full" />
              ))}
            </div>
          </div>

          {/* 3 Distribution Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-2xl bg-surface border border-border space-y-6">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-36 rounded-lg" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <div className="flex items-center justify-center py-4">
                  <Skeleton className="w-36 h-36 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-full rounded-md" />
                  <Skeleton className="h-3.5 w-4/5 rounded-md" />
                  <Skeleton className="h-3.5 w-2/3 rounded-md" />
                </div>
              </div>
            ))}
          </div>

          {/* Timeline Chart Skeleton */}
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Top Header Bar */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground flex items-center gap-2.5">
                <BarChart3 className="w-8 h-8 text-primary" />
                Analytics & Insights
              </h1>
              <p className="font-sans text-xs text-muted mt-1">
                Real-time algorithmic mastery, spaced recall retention, and complexity metrics
              </p>
            </div>

            <div className="flex items-center gap-3">
              {themeMounted && (
                <button
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title={resolvedTheme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
                >
                  {resolvedTheme === "dark" ? (
                    <Sun className="w-4.5 h-4.5 text-accent" />
                  ) : (
                    <Moon className="w-4.5 h-4.5 text-primary" />
                  )}
                </button>
              )}

              <NotificationBell />

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

          {/* Interactive Multi-Filter Control Panel */}
          <div className="p-4 rounded-3xl bg-surface border border-border shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4 font-sans text-xs">
            {/* Search filter */}
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter by pattern or topic..."
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                className="w-full pl-9.5 pr-8 py-2 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-foreground placeholder:text-muted/70 text-xs font-semibold"
              />
              {topicSearch && (
                <button
                  onClick={() => setTopicSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
              {/* Difficulty Segmented Filter */}
              <div className="flex items-center bg-surface-2 p-1 rounded-xl border border-border">
                {(
                  [
                    { id: "ALL", label: "All Levels", color: "" },
                    { id: "EASY", label: "Easy", color: "text-emerald-500" },
                    { id: "MED", label: "Med", color: "text-amber-500" },
                    { id: "HARD", label: "Hard", color: "text-rose-500" },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDifficultyFilter(d.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      difficultyFilter === d.id
                        ? "bg-surface text-foreground shadow-sm border border-border/80"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    <span className={d.color || ""}>{d.label}</span>
                  </button>
                ))}
              </div>

              {/* Time Range Filter */}
              <div className="flex items-center bg-surface-2 p-1 rounded-xl border border-border">
                {(["7D", "30D", "90D", "ALL"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer text-center transition-all ${
                      timeRange === range
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {range === "ALL" ? "All Time" : range}
                  </button>
                ))}
              </div>

              {/* Reset filter button if any filter active */}
              {(difficultyFilter !== "ALL" || topicSearch || timeRange !== "ALL") && (
                <button
                  onClick={() => {
                    setDifficultyFilter("ALL");
                    setTopicSearch("");
                    setTimeRange("ALL");
                  }}
                  className="px-3 py-1.5 rounded-xl border border-border/80 hover:bg-surface-2 text-muted hover:text-foreground font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 6 High-Impact Primary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-sans font-semibold text-[11px] text-muted truncate max-w-[80%]">
                  {stat.label}
                </span>
                <div className="w-7 h-7 rounded-lg bg-surface-2 flex items-center justify-center border border-border/60 shrink-0">
                  {stat.icon}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-foreground">
                  {stat.val}
                </h3>
                <p className="font-sans text-[10px] text-muted mt-0.5 truncate">{stat.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* SRS 4-Stage Recall Loop Funnel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-sm mb-8 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display font-extrabold text-base text-foreground flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Spaced Repetition Recall Funnel
              </h2>
              <p className="font-sans text-[11px] text-muted mt-0.5">
                Distribution of problems across the 4 automated spaced recall intervals
              </p>
            </div>
            <span className="font-sans font-bold text-xs text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 w-fit">
              {totalProblemsCount} Active Tracked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {srsStageCounts.map((stage, idx) => {
              const stageColors = [
                "bg-sky-500",
                "bg-indigo-500",
                "bg-purple-500",
                "bg-emerald-500",
              ];
              const borderColors = [
                "border-sky-500/20",
                "border-indigo-500/20",
                "border-purple-500/20",
                "border-emerald-500/20",
              ];

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl bg-surface-2/40 border ${borderColors[idx]} space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-extrabold text-xs text-foreground">
                      {stage.stage}
                    </span>
                    <span className="font-mono text-xs font-bold text-muted">
                      {stage.count} ({stage.pct}%)
                    </span>
                  </div>

                  <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden border border-border/40">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stage.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.1 + idx * 0.1 }}
                      className={`h-full rounded-full ${stageColors[idx]}`}
                    />
                  </div>                    <p className="font-sans text-[10px] text-muted">{stage.desc}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Actionable Intelligence & Interview Insights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {actionableInsights.map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.12 + idx * 0.05 }}
              className="p-5 rounded-2xl bg-surface border border-border/80 shadow-sm flex flex-col justify-between hover:border-border transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2 py-0.5 rounded-md font-sans font-extrabold text-[9px] uppercase tracking-wider ${insight.accentColor}`}>
                  {insight.badge}
                </span>
                <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center border border-border/60 shrink-0">
                  {insight.icon}
                </div>
              </div>
              <div className="mt-4">
                <span className="text-[11px] font-semibold text-muted font-sans block">
                  {insight.title}
                </span>
                <h3 className="font-display font-extrabold text-xl sm:text-2xl text-foreground mt-0.5 tracking-tight truncate">
                  {insight.value}
                </h3>
                <p className="font-sans text-[11px] text-muted/90 mt-1.5 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Topic Breakdown Treemap */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="w-full p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-sm mb-8 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-base text-foreground">
                Topic Mastery Breakdown
              </h3>
              <p className="font-sans text-[11px] text-muted mt-0.5">
                Relative volume and solve percentages across patterns
              </p>
            </div>
            {topics.length > 0 && (
              <span className="font-sans text-xs text-muted">
                {topics.length} Pattern{topics.length === 1 ? "" : "s"} Logged
              </span>
            )}
          </div>

          {treemapData.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-surface-2/30 border border-border/60">
              <p className="text-xs text-muted font-sans">No problems match the current filter selection.</p>
            </div>
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
                      onClick={() => setTopicSearch(tile.name === "Others" ? "" : tile.name)}
                      className="flex flex-col justify-between p-4 hover:opacity-95 transition-opacity cursor-pointer text-white font-sans relative group overflow-hidden"
                      title={`Filter by ${tile.name}: ${tile.solved}/${tile.total} Solved (${tile.percent}%)`}
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-display font-extrabold text-[12px] sm:text-sm truncate max-w-full drop-shadow-sm select-none">
                          {tile.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-extrabold text-white/95 self-end select-none bg-black/20 px-2 py-0.5 rounded-md">
                        {tile.solved}/{tile.total} solved ({tile.percent}%)
                      </span>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* 2-Column Grid: Target Companies Breakdown & Algorithmic Patterns Mastery */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Target Company Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                    <Building2 className="w-4.5 h-4.5 text-amber-500" />
                    Target Company Distribution
                  </h3>
                  <p className="font-sans text-[11px] text-muted mt-0.5">
                    Problem solve rate by company interview tags
                  </p>
                </div>
                {companiesData.length > 0 && (
                  <span className="font-sans text-xs text-muted">
                    {companiesData.length} Companies Tagged
                  </span>
                )}
              </div>

              {companiesData.length === 0 ? (
                <div className="py-12 text-center rounded-2xl bg-surface-2/30 border border-border/60">
                  <Building2 className="w-8 h-8 text-muted/40 mx-auto mb-2" />
                  <p className="text-xs text-muted font-sans">No company-tagged problems recorded yet.</p>
                  <p className="text-[10px] text-muted/70 font-sans mt-1">Tag problems with FAANG and tech companies in your dashboard to view company analytics.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                  {companiesData.map((comp, idx) => (
                    <div
                      key={comp.name}
                      className="p-3 rounded-2xl bg-surface-2/40 border border-border/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-xs text-foreground">
                          {comp.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-muted">
                            {comp.solved}/{comp.total} solved
                          </span>
                          <span className="font-sans font-bold text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            {comp.percent}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden border border-border/40">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${comp.percent}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.05 }}
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Algorithmic Patterns Mastery */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                    <GitMerge className="w-4.5 h-4.5 text-cyan-500" />
                    Algorithmic Patterns Breakdown
                  </h3>
                  <p className="font-sans text-[11px] text-muted mt-0.5">
                    Mastery depth across algorithmic technique patterns
                  </p>
                </div>
                {patternsData.length > 0 && (
                  <span className="font-sans text-xs text-muted">
                    {patternsData.length} Patterns Active
                  </span>
                )}
              </div>

              {patternsData.length === 0 ? (
                <div className="py-12 text-center rounded-2xl bg-surface-2/30 border border-border/60">
                  <GitMerge className="w-8 h-8 text-muted/40 mx-auto mb-2" />
                  <p className="text-xs text-muted font-sans">No pattern-tagged problems recorded yet.</p>
                  <p className="text-[10px] text-muted/70 font-sans mt-1">Tag problems with algorithmic patterns like Two Pointers or Sliding Window to track mastery.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                  {patternsData.map((pat, idx) => (
                    <div
                      key={pat.name}
                      className="p-3 rounded-2xl bg-surface-2/40 border border-border/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-xs text-foreground">
                          {pat.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-muted">
                            {pat.solved}/{pat.total} solved
                          </span>
                          <span className="font-sans font-bold text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                            {pat.percent}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden border border-border/40">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pat.percent}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.05 }}
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* 3-Card Distribution Grid: Difficulty, Language, Complexity */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
          {/* 1. Difficulty Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="p-6 rounded-3xl bg-surface border border-border shadow-sm flex flex-col justify-between"
          >
            <div>
              <h2 className="font-display font-bold text-base text-foreground mb-1">
                Difficulty Distribution
              </h2>
              <p className="font-sans text-[11px] text-muted leading-relaxed mb-6">
                Distribution of solved problems by difficulty level
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
                            <title>
                              {item.label}: {item.count} Solved (
                              {Math.round((item.count / totalDifficultySolves) * 100)}%)
                            </title>
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
                    <div
                      key={idx}
                      className="flex justify-between items-center cursor-help border-b border-border/20 pb-1.5"
                      title={`${item.count} Solves`}
                    >
                      <span style={{ color: item.color }} className="font-bold">
                        {item.label}
                      </span>
                      <span className="text-muted">
                        {item.count} ({Math.round((item.count / totalDifficultySolves) * 100)}%)
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* 2. Language Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="p-6 rounded-3xl bg-surface border border-border shadow-sm flex flex-col justify-between"
          >
            <div>
              <h2 className="font-display font-bold text-base text-foreground mb-1">
                Language Distribution
              </h2>
              <p className="font-sans text-[11px] text-muted leading-relaxed mb-6">
                Distribution of solutions by programming language
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
                            <title>
                              {item.label}: {item.count} Solutions (
                              {Math.round((item.count / totalLanguageSolves) * 100)}%)
                            </title>
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
                    <div
                      key={idx}
                      className="flex justify-between items-center cursor-help border-b border-border/20 pb-1.5"
                      title={`${item.count} Solutions`}
                    >
                      <span style={{ color: item.color }} className="font-bold">
                        {item.label}
                      </span>
                      <span className="text-muted">
                        {item.count} ({Math.round((item.count / totalLanguageSolves) * 100)}%)
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* 3. Combined Complexity Distribution (Time & Space) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
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
                  const chartColors = [
                    "#B7A8F5",
                    "#EE8E5A",
                    "#60A5FA",
                    "#34D399",
                    "#F87171",
                    "#FBBF24",
                    "#A78BFA",
                  ];
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
                            <title>
                              {item.label}: {item.count} Solved (
                              {Math.round((item.count / activeTotal) * 100)}%)
                            </title>
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
                    <div
                      key={idx}
                      className="flex justify-between items-center cursor-help border-b border-border/20 pb-1.5"
                      title={`${item.count} Solves`}
                    >
                      <span className="text-primary font-bold">{item.label}</span>
                      <span className="text-muted">
                        {item.count} (
                        {Math.round(
                          (item.count / (complexityTab === "time" ? totalTimeSolves : totalSpaceSolves)) *
                            100
                        )}
                        %)
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Activity & Recall Timeline Graph */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="w-full p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-foreground">
                Activity & Problem Solving Velocity
              </h3>
              <p className="font-sans text-[11px] text-muted mt-0.5">
                Solves logged across selected scope ({timeRange === "ALL" ? "All Time" : timeRange})
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-muted">
              {filteredData.filter((p) => p.status === "Solved").length} Solved in Period
            </span>
          </div>

          <div className="h-44 flex items-end justify-between mt-6 px-2 gap-2">
            {timelineData.map((bar, i) => (
              <div
                key={i}
                className="flex flex-col items-center flex-1 gap-2.5 group cursor-pointer"
                title={`${bar.count} solve${bar.count === 1 ? "" : "s"} on ${bar.label}`}
              >
                <div
                  className={`w-full max-w-[28px] rounded-md h-32 flex items-end overflow-hidden transition-all ${
                    bar.count > 0
                      ? "bg-surface-2 border border-border/40 shadow-inner"
                      : "bg-transparent border border-transparent"
                  }`}
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: bar.h }}
                    transition={{ duration: 0.8, delay: 0.1 + i * 0.03 }}
                    className={`w-full rounded-b-md ${
                      bar.isCurrent
                        ? "bg-primary shadow-sm shadow-primary/30"
                        : bar.count > 0
                        ? "bg-accent/80 hover:bg-accent"
                        : "bg-muted/20"
                    }`}
                  />
                </div>
                <span className="font-sans text-[10px] font-bold text-muted group-hover:text-foreground transition-colors">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
