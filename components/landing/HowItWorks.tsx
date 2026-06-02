"use client";

import { motion } from "framer-motion";
import { PlusCircle, BellRing, Trophy } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: <PlusCircle className="w-5 h-5" />,
      title: "Log Your Solutions",
      description: "Paste problem links, write notes, and log one or more code approaches (intuition, mistakes, complexities). Stored in a beautiful Relational DB."
    },
    {
      num: "02",
      icon: <BellRing className="w-5 h-5" />,
      title: "Get Lazy-Load Reminders",
      description: "As time goes by, problem revisit alerts pop up automatically inside your 'Due Today' queue based on the IST wall-clock. No cron lag."
    },
    {
      num: "03",
      icon: <Trophy className="w-5 h-5" />,
      title: "Revisit and Solidify",
      description: "Re-solve the problem directly in Monaco, compare with past solutions, and tap 'Mark Revisited' to advance to the next spacing stage."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 w-full max-w-7xl mx-auto border-t border-border/80 relative">
      
      {/* Background decoration lines */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border/40 -translate-y-1/2 hidden lg:block z-0 max-w-5xl mx-auto" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-18 relative z-10">
        <span className="px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-sans font-bold text-xs uppercase tracking-wider">
          Practice Loop
        </span>
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight mt-5 text-foreground leading-tight">
          How CodeVault Works
        </h2>
        <p className="font-sans text-sm sm:text-base text-muted mt-5 leading-relaxed font-normal">
          Master interview problems with systematic revision intervals that actually conform to how human memory stores complex skills.
        </p>
      </div>

      {/* Steps Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative z-10">
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: idx * 0.15 }}
            className="h-full flex flex-col items-center text-center p-6 rounded-3xl bg-surface border border-border shadow-sm hover:border-accent/30 transition-colors"
          >
            {/* Step Bubble Indicator */}
            <div className="relative flex items-center justify-center mb-6 shrink-0">
              <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 relative z-10 shrink-0">
                {step.icon}
              </div>
              <span className="absolute -top-3.5 -right-3.5 font-display font-extrabold text-3xl text-border/70 select-none">
                {step.num}
              </span>
            </div>

            <h3 className="font-display font-bold text-base text-foreground mt-2">
              {step.title}
            </h3>
            <p className="font-sans text-xs sm:text-sm text-muted mt-3.5 leading-relaxed font-normal">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>

    </section>
  );
}
