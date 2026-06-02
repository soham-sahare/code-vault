"use client";

import { motion } from "framer-motion";
import { Sparkles, Calendar, RotateCcw } from "lucide-react";

export default function SpacedTimeline() {
  const timelineNodes = [
    {
      day: "Day 0",
      label: "Initial Solve",
      icon: <Sparkles className="w-4 h-4 text-accent" />,
      sub: "Log problem solutions and notes"
    },
    {
      day: "Day 3",
      label: "Stage 1 Recall",
      icon: <Calendar className="w-4 h-4 text-primary" />,
      sub: "Quick check: reinforce initial memory pathways"
    },
    {
      day: "Day 7",
      label: "Stage 2 Recall",
      icon: <Calendar className="w-4 h-4 text-primary" />,
      sub: "Solidify approaches and complexity logic"
    },
    {
      day: "Day 15",
      label: "Stage 3 Recall",
      icon: <Calendar className="w-4 h-4 text-primary" />,
      sub: "Deepen recall against alternate interview parameters"
    },
    {
      day: "Day 30",
      label: "Stage 4 Recall",
      icon: <Calendar className="w-4 h-4 text-primary" />,
      sub: "Perform standard final retrieval review"
    },
    {
      day: "Loop",
      label: "Next Cycle",
      icon: <RotateCcw className="w-4 h-4 text-accent" />,
      sub: "Increment cycle count, loop back to Day 3"
    }
  ];

  return (
    <section id="spaced-timeline" className="py-24 px-6 w-full max-w-7xl mx-auto border-t border-border/80 relative">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-sans font-bold text-xs uppercase tracking-wider">
          Memory Curve
        </span>
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight mt-5 text-foreground leading-tight">
          The 3/7/15/30 Day Curve
        </h2>
        <p className="font-sans text-sm sm:text-base text-muted mt-5 leading-relaxed font-normal">
          Forgetting curves are steep. By reviewing problems exactly as your memory decay accelerates, you lock details into permanent long-term storage.
        </p>
      </div>

      {/* Horizontal Timeline (Desktop) */}
      <div className="hidden lg:block relative w-full pt-16 pb-8">
        
        {/* Horizontal Connector Line */}
        <div className="absolute top-[88px] left-0 right-0 h-1 bg-border/40 rounded-full" />
        <motion.div 
          initial={{ width: 0 }}
          whileInView={{ width: "96%" }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-[88px] left-0 h-1 bg-gradient-to-r from-primary to-accent rounded-full" 
        />

        {/* Nodes */}
        <div className="grid grid-cols-6 gap-4 relative">
          {timelineNodes.map((node, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.15 }}
              className="flex flex-col items-center group"
            >
              {/* Day Badge */}
              <span className="font-display font-extrabold text-xs text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full mb-5 group-hover:scale-105 transition-transform">
                {node.day}
              </span>

              {/* Node Dot Icon */}
              <div className="w-10 h-10 rounded-full bg-surface border-2 border-border group-hover:border-primary flex items-center justify-center shadow-md relative z-10 group-hover:scale-110 transition-all duration-200">
                {node.icon}
              </div>

              {/* Text info */}
              <h4 className="font-display font-bold text-sm text-foreground mt-5.5 text-center">
                {node.label}
              </h4>
              <p className="font-sans text-[11px] text-muted mt-1.5 leading-relaxed text-center px-2">
                {node.sub}
              </p>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Vertical Timeline (Mobile & Tablet) */}
      <div className="lg:hidden relative pl-8 py-4">
        
        {/* Vertical Connector Line */}
        <div className="absolute top-0 bottom-0 left-3.5 w-0.5 bg-border/40 rounded-full" />

        {/* Nodes */}
        <div className="space-y-10">
          {timelineNodes.map((node, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="relative flex items-start gap-5.5"
            >
              {/* Node Dot Icon */}
              <div className="w-8 h-8 rounded-full bg-surface border-2 border-border flex items-center justify-center shadow-md absolute -left-8.5 z-10">
                {node.icon}
              </div>

              <div>
                <span className="inline-block font-display font-bold text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                  {node.day}
                </span>
                <h4 className="font-display font-bold text-sm text-foreground mt-1.5">
                  {node.label}
                </h4>
                <p className="font-sans text-xs text-muted mt-1 leading-relaxed max-w-sm">
                  {node.sub}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

    </section>
  );
}
