"use client";

import { motion } from "framer-motion";
import { Clock, CheckCircle2, AlertCircle, Star, TrendingUp } from "lucide-react";

export default function FloatingMockups() {
  // Common animation configurations for gentle continuous floating
  const floatAnimation = (delay: number = 0, duration: number = 6) => ({
    animate: {
      y: [-8, 8, -8],
    },
    transition: {
      y: {
        duration,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay,
      },
      scale: {
        type: "spring" as const,
        stiffness: 400,
        damping: 20,
      },
      rotate: {
        type: "spring" as const,
        stiffness: 400,
        damping: 20,
      },
      default: {
        type: "spring" as const,
        stiffness: 400,
        damping: 20,
      }
    },
  });

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP LAYOUT (Absolutely positioned around the hero text)            */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block">
        
        {/* CARD 1: TOP-LEFT - Caveman Tip Sticky Note */}
        <motion.div
          {...floatAnimation(0, 5.5)}
          whileHover={{ scale: 1.05, rotate: -3 }}
          className="absolute top-[8%] left-0 xl:left-8 w-[240px] p-5 rounded-2xl border border-border shadow-lg cursor-grab active:cursor-grabbing bg-[#FFFbeb] text-amber-900 dark:bg-surface dark:text-foreground -rotate-[4deg] pointer-events-auto"
        >
          <div className="flex items-start gap-2.5">
            <span className="text-xl">💡</span>
            <div>
              <h4 className="font-display font-semibold text-xs text-amber-800 dark:text-accent tracking-wider uppercase">
                Caveman Tip
              </h4>
              <p className="font-sans text-xs mt-1.5 leading-relaxed font-medium">
                Solve DP with equations first! Then make table. Do not jump straight to loop-scratches.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CARD 2: TOP-RIGHT - Spaced Reminder Card */}
        <motion.div
          {...floatAnimation(1.5, 6)}
          whileHover={{ scale: 1.05, y: -4, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
          className="absolute top-[12%] right-0 xl:right-8 w-[260px] p-5 rounded-2xl bg-surface border border-border shadow-lg hover:border-primary/40 transition-colors cursor-pointer pointer-events-auto"
        >
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-foreground">
                  Spaced Recall
                </h4>
                <p className="font-sans text-[10px] text-muted">Interval Stage 2</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 font-display font-bold text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full">
              <Star className="w-2.5 h-2.5 fill-accent" />
              Due
            </span>
          </div>

          <div className="mt-4">
            <h3 className="font-display font-bold text-sm text-foreground">
              15. 3Sum (Array)
            </h3>
            <p className="font-sans text-[11px] text-muted mt-1">
              Revisit schedules automatically: 3d → 7d → 15d
            </p>

            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 bg-border/40 h-2 rounded-full overflow-hidden">
                <div className="w-[42%] bg-primary h-full rounded-full transition-all" />
              </div>
              <span className="font-display font-bold text-[10px] text-primary">
                3d left
              </span>
            </div>
          </div>
        </motion.div>

        {/* CARD 3: BOTTOM-LEFT - Today's Practice Queue Table */}
        <motion.div
          {...floatAnimation(0.8, 6.5)}
          whileHover={{ scale: 1.03 }}
          className="absolute bottom-[10%] left-0 xl:left-4 w-[330px] p-5 rounded-3xl bg-surface border border-border shadow-xl pointer-events-auto"
        >
          <div className="flex items-center justify-between mb-4.5">
            <div>
              <h3 className="font-display font-bold text-sm text-foreground">
                Today's Practice Queue
              </h3>
              <p className="font-sans text-[11px] text-muted">
                Revisit due today (lazy load)
              </p>
            </div>
            <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-lg">
              3 Due
            </span>
          </div>

          <div className="space-y-2">
            {/* Row 1 */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border/80 hover:bg-surface-2 transition-colors duration-150">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="font-sans font-semibold text-xs text-foreground truncate max-w-[130px]">
                  Merge k Sorted Lists
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-[9px] text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                  HARD
                </span>
                <span className="text-[10px] font-sans font-bold text-muted flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-400" /> Overdue
                </span>
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border/80 hover:bg-surface-2 transition-colors duration-150">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="font-sans font-semibold text-xs text-foreground truncate max-w-[130px]">
                  Longest Palindromic Sub...
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-[9px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  MED
                </span>
                <span className="text-[10px] font-sans font-bold text-primary flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary" /> Due Today
                </span>
              </div>
            </div>

            {/* Row 3 */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border/80 hover:bg-surface-2 transition-colors duration-150">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-sans font-semibold text-xs text-foreground truncate max-w-[130px]">
                  Two Sum
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-[9px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  EASY
                </span>
                <span className="text-[10px] font-sans font-bold text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Solved
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CARD 4: BOTTOM-RIGHT - Retention Analytics Circular Chart (Spectra style) */}
        <motion.div
          {...floatAnimation(2.2, 5.8)}
          whileHover={{ scale: 1.05, rotate: 1 }}
          className="absolute bottom-[12%] right-0 xl:right-4 w-[250px] p-5 rounded-3xl bg-surface border border-border shadow-xl hover:border-accent/40 transition-colors pointer-events-auto"
        >
          <div className="flex items-center justify-between mb-3.5">
            <h4 className="font-display font-bold text-xs text-foreground uppercase tracking-wider">
              Recall Activity
            </h4>
            <span className="w-7 h-7 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex items-center justify-center py-2.5">
            <div className="relative flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  stroke="currentColor"
                  strokeWidth="7"
                  fill="transparent"
                  className="text-border/40"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  stroke="currentColor"
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray="239"
                  strokeDashoffset="28"
                  className="text-accent stroke-linecap-round transition-all"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-display font-extrabold text-lg text-foreground tracking-tight">
                  +88%
                </span>
                <span className="text-[9px] text-muted font-sans font-bold">
                  Retention
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-border/80 text-center">
            <p className="font-sans font-bold text-[10px] text-muted">
              Recall rate <span className="text-accent">+13%</span> since last week
            </p>
          </div>
        </motion.div>

      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE & TABLET LAYOUT (Responsive grid rendered below buttons)       */}
      {/* ========================================================================= */}
      <div className="relative w-full max-w-4xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 px-4 lg:hidden pointer-events-auto">
        
        {/* CARD 1: Caveman Tip */}
        <div className="p-5 rounded-2xl border border-border shadow-md bg-[#FFFbeb] text-amber-900 dark:bg-surface dark:text-foreground">
          <div className="flex items-start gap-2.5">
            <span className="text-xl">💡</span>
            <div>
              <h4 className="font-display font-semibold text-xs text-amber-800 dark:text-accent tracking-wider uppercase">
                Caveman Tip
              </h4>
              <p className="font-sans text-xs mt-1.5 leading-relaxed font-medium">
                Solve DP with equations first! Then make table. Do not jump straight to loop-scratches.
              </p>
            </div>
          </div>
        </div>

        {/* CARD 2: Spaced Recall Card */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-md">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-foreground">
                  Spaced Recall
                </h4>
                <p className="font-sans text-[10px] text-muted">Interval Stage 2</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 font-display font-bold text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full">
              <Star className="w-2.5 h-2.5 fill-accent" />
              Due
            </span>
          </div>

          <div className="mt-4">
            <h3 className="font-display font-bold text-sm text-foreground">
              15. 3Sum (Array)
            </h3>
            <p className="font-sans text-[11px] text-muted mt-1">
              Revisit schedules automatically: 3d → 7d → 15d
            </p>

            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 bg-border/40 h-2 rounded-full overflow-hidden">
                <div className="w-[42%] bg-primary h-full rounded-full transition-all" />
              </div>
              <span className="font-display font-bold text-[10px] text-primary">
                3d left
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: Today's Practice Queue */}
        <div className="p-5 rounded-3xl bg-surface border border-border shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-sm text-foreground">
                Today's Practice Queue
              </h3>
              <p className="font-sans text-[11px] text-muted">
                Revisit due today
              </p>
            </div>
            <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-lg">
              3 Due
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="font-sans font-semibold text-xs text-foreground truncate max-w-[130px]">
                  Merge k Sorted Lists
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-[9px] text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                  HARD
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="font-sans font-semibold text-xs text-foreground truncate max-w-[130px]">
                  Longest Palindromic
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-[9px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  MED
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-sans font-semibold text-xs text-foreground truncate max-w-[130px]">
                  Two Sum
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-[9px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  EASY
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: Recall Activity */}
        <div className="p-5 rounded-3xl bg-surface border border-border shadow-md">
          <div className="flex items-center justify-between mb-3.5">
            <h4 className="font-display font-bold text-xs text-foreground uppercase tracking-wider">
              Recall Activity
            </h4>
            <span className="w-7 h-7 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex items-center justify-center py-1">
            <div className="relative flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-border/40"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="201"
                  strokeDashoffset="24"
                  className="text-accent stroke-linecap-round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-display font-extrabold text-sm text-foreground">
                  +88%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-border/80 text-center">
            <p className="font-sans font-semibold text-[10px] text-muted">
              Recall rate <span className="text-accent">+13%</span> this week
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
