"use client";

import Sidebar from "@/components/shell/Sidebar";
import { Clock, AlertTriangle, CheckSquare, Calendar, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function RemindersPage() {
  const overdueReminders = [
    {
      num: 76,
      name: "Minimum Window Substring",
      difficulty: "HARD",
      diffColor: "text-rose-500 bg-rose-500/10",
      stage: "D15 Stage",
      overdueText: "Due 2 days ago",
      topic: "Sliding Window"
    }
  ];

  const dueTodayReminders = [
    {
      num: 42,
      name: "Trapping Rain Water",
      difficulty: "HARD",
      diffColor: "text-rose-500 bg-rose-500/10",
      stage: "D7 Stage",
      timeText: "Due now (IST boundary)",
      topic: "Stack"
    },
    {
      num: 15,
      name: "3Sum",
      difficulty: "MED",
      diffColor: "text-amber-500 bg-amber-500/10",
      stage: "D3 Stage",
      timeText: "Due by tonight",
      topic: "Array, Two Pointers"
    }
  ];

  const upcomingReminders = [
    {
      num: 1,
      name: "Two Sum",
      difficulty: "EASY",
      diffColor: "text-emerald-500 bg-emerald-500/10",
      stage: "D30 Stage",
      upcomingText: "Due in 3 days",
      topic: "Hash Table"
    },
    {
      num: 206,
      name: "Reverse Linked List",
      difficulty: "EASY",
      diffColor: "text-emerald-500 bg-emerald-500/10",
      stage: "D7 Stage",
      upcomingText: "Due in 5 days",
      topic: "Linked List"
    }
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground flex items-center gap-2.5">
            <Clock className="w-8 h-8 text-primary" />
            Reminders
          </h1>
          <p className="font-sans text-xs text-muted mt-1">Your memory-spaced practice agenda</p>
        </div>

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
                  1 item
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {overdueReminders.map((rem, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-2xl bg-surface border border-rose-500/30 hover:border-rose-500 transition-colors shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-sans font-bold text-[10px] text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {rem.overdueText}
                        </span>
                        <span className="text-[10px] font-display font-bold text-muted uppercase">
                          {rem.stage}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-sm text-foreground">
                        {rem.num}. {rem.name}
                      </h3>
                      <p className="font-sans text-xs text-muted mt-1">{rem.topic}</p>
                    </div>

                    <div className="mt-5.5 pt-4.5 border-t border-border flex items-center justify-between">
                      <span className={`font-display font-bold text-[9px] px-2 py-0.5 rounded ${rem.diffColor}`}>
                        {rem.difficulty}
                      </span>
                      <button className="inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-primary hover:bg-primary/95 text-white font-sans font-bold text-xs shadow-sm hover:shadow active:scale-98 transition-all cursor-pointer">
                        Revisit Complete
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* GROUP 2: DUE TODAY (Amber practice checklist) */}
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-border/80 pb-2">
              <CheckSquare className="w-5 h-5 text-amber-500" />
              <h2 className="font-display font-bold text-base text-amber-500">
                Due For Recall Today
              </h2>
              <span className="text-[10px] font-sans font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full">
                2 items
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dueTodayReminders.map((rem, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-5 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-colors shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-sans font-bold text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {rem.timeText}
                      </span>
                      <span className="text-[10px] font-display font-bold text-muted uppercase">
                        {rem.stage}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-sm text-foreground">
                      {rem.num}. {rem.name}
                    </h3>
                    <p className="font-sans text-xs text-muted mt-1">{rem.topic}</p>
                  </div>

                  <div className="mt-5.5 pt-4.5 border-t border-border flex items-center justify-between">
                    <span className={`font-display font-bold text-[9px] px-2 py-0.5 rounded ${rem.diffColor}`}>
                      {rem.difficulty}
                    </span>
                    <button className="inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-primary hover:bg-primary/95 text-white font-sans font-bold text-xs shadow-sm hover:shadow active:scale-98 transition-all cursor-pointer">
                      Revisit Complete
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* GROUP 3: UPCOMING (Blue/Emerald calendar agenda) */}
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-border/80 pb-2">
              <Calendar className="w-5 h-5 text-emerald-500 animate-pulse" />
              <h2 className="font-display font-bold text-base text-emerald-500">
                Upcoming Spacing Schedule
              </h2>
              <span className="text-[10px] font-sans font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">
                2 items
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingReminders.map((rem, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-5 rounded-2xl bg-surface border border-border/60 opacity-80 hover:opacity-100 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-sans font-bold text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {rem.upcomingText}
                      </span>
                      <span className="text-[10px] font-display font-bold text-muted uppercase">
                        {rem.stage}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-sm text-foreground">
                      {rem.num}. {rem.name}
                    </h3>
                    <p className="font-sans text-xs text-muted mt-1">{rem.topic}</p>
                  </div>

                  <div className="mt-5.5 pt-4.5 border-t border-border flex items-center justify-between">
                    <span className={`font-display font-bold text-[9px] px-2 py-0.5 rounded ${rem.diffColor}`}>
                      {rem.difficulty}
                    </span>
                    <span className="text-[10px] font-sans font-bold text-muted italic">
                      Locked
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
