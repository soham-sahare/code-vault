"use client";

import { motion } from "framer-motion";
import { Terminal, Shield, BrainCircuit } from "lucide-react";

export default function About() {
  return (
    <section id="about" className="py-24 px-6 w-full max-w-7xl mx-auto border-t border-border/80 relative">
      
      {/* Background radial glow */}
      <div className="absolute top-1/2 right-10 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Text Block */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-sans font-bold text-xs uppercase tracking-wider">
            Our Origin
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight mt-5 text-foreground leading-tight">
            Forged by developers, <br />
            <span className="bg-gradient-to-r from-accent via-foreground/90 to-accent bg-clip-text text-transparent">
              for high-retention prep.
            </span>
          </h2>
          <p className="font-sans text-sm sm:text-base text-muted mt-6 leading-relaxed font-normal">
            Every software engineer knows the pain: you solve a complex Dynamic Programming or Graph problem on LeetCode, feel like a genius, and then three weeks later... you can't even remember the core subproblem state!
          </p>
          <p className="font-sans text-sm sm:text-base text-muted mt-4 leading-relaxed font-normal">
            Generic flashcard apps don't work for code. Code requires relational context—mistake logs, time/space complexities, recursive vs iterative intuition, and a timezone-aware IST practice cycle. That is why we built **CodeVault**: a private, robust memory bank for technical skills.
          </p>

          <div className="mt-8.5 space-y-4">
            <div className="flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <BrainCircuit className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-display font-bold text-sm text-foreground">Active Memory Retrieval</h4>
                <p className="font-sans text-xs text-muted mt-1">Conforms to scientifically backed SM-2 spaced spacing intervals.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                <Shield className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-display font-bold text-sm text-foreground">Private Row-Level Isolation</h4>
                <p className="font-sans text-xs text-muted mt-1">Your solutions are completely your own, scoped strictly under session keys.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Visual Graphic Block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-xl overflow-hidden aspect-[4/3] flex flex-col justify-between group"
        >
          {/* Header Visual */}
          <div className="flex items-center justify-between border-b border-border/80 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <span className="font-mono text-[10px] text-muted flex items-center gap-1.5 font-semibold bg-surface-2 px-2.5 py-1 rounded-md border border-border">
              <Terminal className="w-3 h-3 text-primary" />
              vault-engine.ts
            </span>
          </div>

          {/* Graphic Terminal Body */}
          <div className="flex-1 flex flex-col justify-center font-mono text-[11px] sm:text-xs text-foreground/80 space-y-3 pl-2 py-4">
            <p className="text-muted font-semibold">// Running memory decay check...</p>
            <p>
              <span className="text-primary">const</span> timeSinceLastReview = <span className="text-accent">259200000</span>; <span className="text-muted">// 3 days</span>
            </p>
            <p>
              <span className="text-primary">if</span> (timeSinceLastReview &gt;= <span className="text-accent">node.interval</span>) &#123;
            </p>
            <p className="pl-5 text-emerald-500 font-semibold">
              dashboard.bell.push("Revisit problem!");
            </p>
            <p className="pl-5 text-primary">
              problem.status = <span className="text-amber-500">"UNSOLVED"</span>;
            </p>
            <p>&#125;</p>
          </div>

          {/* Footer Visual */}
          <div className="pt-4 border-t border-border/80 text-center">
            <p className="font-sans font-bold text-[10px] text-muted uppercase tracking-wider">
              Automated lazily in 213ms without CRON lags
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
