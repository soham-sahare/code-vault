"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";

export default function Pricing() {
  const perks = [
    "Unlimited DSA Problems & Solutions",
    "Timezone-Aware (IST) Spaced Recalls",
    "Free-form multiple code approaches",
    "Monaco Code Editor & syntax highlights",
    "Custom Sheets (playlists) & sharing",
    "GitHub-style retention heatmaps",
    "Omnipresent Cmd+K keyboard palette"
  ];

  return (
    <section id="pricing" className="py-24 px-6 w-full max-w-7xl mx-auto border-t border-border/80 relative">
      
      {/* Background radial glow */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none blur-[100px]">
        <div className="w-[300px] h-[300px] rounded-full bg-primary/30" />
      </div>

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-18 relative z-10">
        <span className="px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-sans font-bold text-xs uppercase tracking-wider">
          Pricing
        </span>
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight mt-5 text-foreground leading-tight">
          Simple, Free Forever
        </h2>
        <p className="font-sans text-sm sm:text-base text-muted mt-5 leading-relaxed font-normal">
          No credit card. No artificial limits. CodeVault is built to help developers solve, retain, and smash technical interviews.
        </p>
      </div>

      {/* Pricing Card Wrapper - Extremely Minimal & Airy */}
      <div className="relative z-10 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="p-8 sm:p-12 rounded-3xl bg-surface/40 dark:bg-surface/30 border border-border/80 shadow-md backdrop-blur-md relative overflow-hidden"
        >
          {/* Pricing Headline */}
          <div className="text-center border-b border-border/60 pb-8">
            <h3 className="font-display font-extrabold text-sm text-foreground uppercase tracking-widest">
              Developer Tier
            </h3>
            <p className="text-muted font-sans text-xs mt-1">Free for individuals</p>
            <div className="mt-5 flex items-baseline justify-center gap-1">
              <span className="font-display font-extrabold text-5xl sm:text-6xl text-foreground tracking-tight">
                $0
              </span>
              <span className="font-sans font-semibold text-sm text-muted">/ forever</span>
            </div>
          </div>

          {/* Perks list - Minimal Checkmarks */}
          <ul className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-w-xl mx-auto">
            {perks.map((perk, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="font-sans text-xs sm:text-sm text-foreground/80 font-medium leading-relaxed">
                  {perk}
                </span>
              </li>
            ))}
          </ul>

          {/* Action button - Tactile spring scale click animation */}
          <div className="mt-10 max-w-md mx-auto">
            <motion.a
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              href="/signup"
              className="w-full relative inline-flex items-center justify-center gap-2 font-sans font-bold text-sm bg-primary hover:bg-primary/90 text-white py-4 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all group cursor-pointer"
            >
              Start free demo
              <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" />
            </motion.a>
          </div>

        </motion.div>
      </div>

    </section>
  );
}
