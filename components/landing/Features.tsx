"use client";

import { motion } from "framer-motion";
import { Clock, BookOpen, Layers, FileText, Code2, Terminal } from "lucide-react";

export default function Features() {
  const featureList = [
    {
      icon: <Clock className="w-6 h-6 text-primary" />,
      title: "Spaced Repetition Scheduler",
      description: "Automatic recall triggers at 3-day, 7-day, 15-day, and 30-day intervals. Reminders are lazy-loaded on read without complex database crons."
    },
    {
      icon: <Layers className="w-6 h-6 text-accent" />,
      title: "Multi-Solution Logs",
      description: "Don't settle for one solution. Attach multiple files, log your intuition, iterative approaches, and space/time complexities (O(1), O(N), etc.)."
    },
    {
      icon: <BookOpen className="w-6 h-6 text-primary" />,
      title: "Custom Sheets (Playlists)",
      description: "Organize problems into targeted sheets like 'Blind 75' or 'Neetcode 150'. Track progress bars and toggle public view-only sharing links."
    },
    {
      icon: <FileText className="w-6 h-6 text-accent" />,
      title: "Mistakes Log & Notes",
      description: "Write down your mental traps. Maintain rich markdown notes detailing where you got stuck, helping you avoid repeating the same bugs."
    },
    {
      icon: <Code2 className="w-6 h-6 text-primary" />,
      title: "Integrated Syntax Highlighter",
      description: "Read your solutions cleanly using a lightweight read-only code layout with quick copy buttons and multi-language syntax formatting."
    },
    {
      icon: <Terminal className="w-6 h-6 text-accent" />,
      title: "Cmd+K Command Palette",
      description: "Navigate, filter, search, and quick-add problems directly using an omnipresent power keyboard command center."
    }
  ];

  return (
    <section id="features" className="py-24 px-6 w-full max-w-7xl mx-auto border-t border-border/80">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-18">
        <span className="px-3.5 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 text-primary font-sans font-bold text-xs uppercase tracking-wider">
          Built for Mastery
        </span>
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight mt-5 text-foreground leading-tight">
          Everything you need to <br />
          <span className="bg-gradient-to-r from-muted via-foreground/80 to-muted bg-clip-text text-transparent">
            retain your DSA skills.
          </span>
        </h2>
        <p className="font-sans text-sm sm:text-base text-muted mt-5 leading-relaxed font-normal">
          Designed by developers, for developers. Stop solving the same problem 10 times. Solve it once, organize it properly, and remember it forever.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6.5">
        {featureList.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              opacity: { duration: 0.5, delay: idx * 0.08 },
              y: { type: "spring", stiffness: 300, damping: 20 },
              scale: { type: "spring", stiffness: 300, damping: 20 }
            }}
            whileHover={{ scale: 1.025, y: -4 }}
            className="h-full flex flex-col p-6 rounded-3xl bg-surface border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-colors duration-200 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-border/80 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
              {feature.icon}
            </div>
            <h3 className="font-display font-bold text-base text-foreground mt-5">
              {feature.title}
            </h3>
            <p className="font-sans text-xs sm:text-sm text-muted mt-2.5 leading-relaxed font-normal flex-1">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>

    </section>
  );
}
