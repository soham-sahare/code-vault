"use client";

import { useEffect, useState, useMemo } from "react";
import Sidebar from "@/components/shell/Sidebar";
import Link from "next/link";
import { Clock, AlertTriangle, CheckSquare, Calendar, ChevronRight, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { getUserProblemSummaries, markRevisited, getUserProfile } from "@/lib/actions";
import NotificationBell from "@/components/notifications/NotificationBell";
import { getInitials } from "@/lib/utils/formatters";
import { Skeleton } from "@/components/ui/Skeleton";


export default function RemindersPage() {
  const formatTopics = (topicStr?: string) => {
    if (!topicStr) return "";
    const parts = topicStr.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 3) {
      return parts.slice(0, 3).join(", ") + "...";
    }
    return parts.join(", ");
  };

  const getDiffColor = (diff?: string) => {
    const d = (diff || "MEDIUM").toUpperCase();
    if (d === "EASY") return "text-emerald-500";
    if (d === "MED" || d === "MEDIUM") return "text-amber-500";
    return "text-rose-500";
  };

  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<any[]>([]);
  const { resolvedTheme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

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
        console.error("Failed to load reminders:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleComplete = async (id: string) => {
    try {
      await markRevisited(id);
      const data = await getUserProblemSummaries();
      setProblems(data || []);
    } catch (err) {
      console.error("Revisit error:", err);
    }
  };

  const overdueReminders = useMemo(
    () => problems.filter((p) => p.status === "Overdue"),
    [problems]
  );
  const dueTodayReminders = useMemo(
    () => problems.filter((p) => p.status === "Due Today"),
    [problems]
  );
  const upcomingReminders = useMemo(
    () =>
      problems.filter(
        (p) =>
          p.status === "Solved" ||
          (p.interval && typeof p.interval === "string" && p.interval.startsWith("Due in"))
      ),
    [problems]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-10 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-8 h-8 rounded-xl" />
                <Skeleton className="h-8 w-40 rounded-xl" />
              </div>
              <Skeleton className="h-3.5 w-56 rounded-lg" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="w-10 h-10 rounded-full" />
            </div>
          </div>

          {/* Cards Skeleton Grid */}
          <div className="space-y-10">
            {[1, 2].map((section) => (
              <div key={section} className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/80">
                  <Skeleton className="w-5 h-5 rounded-md" />
                  <Skeleton className="h-5 w-44 rounded-lg" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((card) => (
                    <div key={card} className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-between">
                      <div className="space-y-2 flex-1 mr-4">
                        <Skeleton className="h-4 w-3/4 rounded-lg" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-3 w-12 rounded-md" />
                          <Skeleton className="h-3 w-12 rounded-md" />
                          <Skeleton className="h-3 w-20 rounded-md" />
                        </div>
                      </div>
                      <Skeleton className="w-4 h-4 rounded-md shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground flex items-center gap-2.5">
              <Clock className="w-8 h-8 text-primary" />
              Reminders
            </h1>
            <p className="font-sans text-xs text-muted mt-1">Your memory-spaced practice agenda</p>
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

        {problems.length === 0 ? (
          <div className="p-10 rounded-3xl bg-surface border border-border text-center max-w-lg mx-auto mt-12 space-y-3 font-sans">
            <Clock className="w-10 h-10 text-primary mx-auto opacity-70" />
            <h3 className="font-display font-extrabold text-sm text-foreground">Zero Scheduled Reminders</h3>
            <p className="text-xs text-muted leading-relaxed">
              Add coding problems and attach standard code solutions inside your dashboard to trigger the automatic spacing loop!
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            
            {/* GROUP 1: OVERDUE (Rose visual alerts) */}
            {overdueReminders.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4 border-b border-border/80 pb-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <h2 className="font-display font-bold text-base text-rose-500">
                    Overdue Recall Items
                  </h2>
                  <span className="text-[10px] font-sans font-bold bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full">
                    {overdueReminders.length} {overdueReminders.length === 1 ? "item" : "items"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {overdueReminders.map((rem, idx) => (
                    <Link
                      key={idx}
                      href={`/dashboard?p=${rem.id}`}
                      className="block"
                    >
                      <motion.div
                        whileHover={{ y: -3, borderColor: "rgba(239, 68, 68, 0.4)" }}
                        className="p-5 rounded-2xl bg-surface border border-rose-500/20 hover:border-rose-500/50 transition-all shadow-sm cursor-pointer flex items-center justify-between group"
                      >
                        <div className="space-y-1 min-w-0">
                          <h3 className="font-display font-extrabold text-sm text-foreground truncate group-hover:text-rose-500 transition-colors">
                            #{rem.num} {rem.name}
                          </h3>
                          <div className="flex items-center gap-2 text-[10px] text-muted font-semibold">
                            <span className="text-rose-500 uppercase">Overdue</span>
                            <span>•</span>
                            <span className={getDiffColor(rem.difficulty)}>
                              {rem.difficulty || "Medium"}
                            </span>
                            <span>•</span>
                            <span>{formatTopics(rem.topic)}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted/40 group-hover:text-rose-500 transition-colors shrink-0" />
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* GROUP 2: DUE TODAY (Amber practice checklist) */}
            {dueTodayReminders.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4 border-b border-border/80 pb-2">
                  <CheckSquare className="w-5 h-5 text-amber-500" />
                  <h2 className="font-display font-bold text-base text-amber-500">
                    Due For Recall Today
                  </h2>
                  <span className="text-[10px] font-sans font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full">
                    {dueTodayReminders.length} {dueTodayReminders.length === 1 ? "item" : "items"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dueTodayReminders.map((rem, idx) => (
                    <Link
                      key={idx}
                      href={`/dashboard?p=${rem.id}`}
                      className="block"
                    >
                      <motion.div
                        whileHover={{ y: -3, borderColor: "rgba(245, 158, 11, 0.4)" }}
                        className="p-5 rounded-2xl bg-surface border border-amber-500/20 hover:border-amber-500/50 transition-all shadow-sm cursor-pointer flex items-center justify-between group"
                      >
                        <div className="space-y-1 min-w-0">
                          <h3 className="font-display font-extrabold text-sm text-foreground truncate group-hover:text-amber-500 transition-colors">
                            #{rem.num} {rem.name}
                          </h3>
                          <div className="flex items-center gap-2 text-[10px] text-muted font-semibold">
                            <span className="text-amber-500 uppercase">Due Today</span>
                            <span>•</span>
                            <span className={getDiffColor(rem.difficulty)}>
                              {rem.difficulty || "Medium"}
                            </span>
                            <span>•</span>
                            <span>{formatTopics(rem.topic)}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted/40 group-hover:text-amber-500 transition-colors shrink-0" />
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* GROUP 3: UPCOMING (Blue/Emerald calendar agenda) */}
            {upcomingReminders.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4 border-b border-border/80 pb-2">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  <h2 className="font-display font-bold text-base text-emerald-500">
                    Upcoming Spacing Schedule
                  </h2>
                  <span className="text-[10px] font-sans font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">
                    {upcomingReminders.length} {upcomingReminders.length === 1 ? "item" : "items"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingReminders.map((rem, idx) => (
                    <Link
                      key={idx}
                      href={`/dashboard?p=${rem.id}`}
                      className="block"
                    >
                      <motion.div
                        whileHover={{ y: -3, borderColor: "rgba(16, 185, 129, 0.4)" }}
                        className="p-5 rounded-2xl bg-surface border border-border/80 hover:border-emerald-500/50 transition-all shadow-sm cursor-pointer flex items-center justify-between group"
                      >
                        <div className="space-y-1 min-w-0">
                          <h3 className="font-display font-extrabold text-sm text-foreground truncate group-hover:text-emerald-500 transition-colors">
                            #{rem.num} {rem.name}
                          </h3>
                          <div className="flex items-center gap-2 text-[10px] text-muted font-semibold">
                            <span className="text-emerald-500 uppercase">{rem.interval || "Scheduled"}</span>
                            <span>•</span>
                            <span className={getDiffColor(rem.difficulty)}>
                              {rem.difficulty || "Medium"}
                            </span>
                            <span>•</span>
                            <span>{formatTopics(rem.topic)}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted/40 group-hover:text-emerald-500 transition-colors shrink-0" />
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

    </div>
  );
}
