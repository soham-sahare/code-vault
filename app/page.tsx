"use client";

import Header from "@/components/landing/Header";
import FloatingMockups from "@/components/landing/FloatingMockups";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import SpacedTimeline from "@/components/landing/SpacedTimeline";
import About from "@/components/landing/About";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";
import { ArrowRight, Sparkles, BookOpen, Clock, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden transition-colors duration-300">
      
      {/* 1. Navbar */}
      <Header />

      {/* 2. Hero Wrapper Section with Dot Grid Pattern */}
      <main className="flex-1 relative flex flex-col items-center justify-center py-20 px-6 dots-pattern">
        
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/10 to-accent/5 blur-[120px] pointer-events-none" />

        {/* Outer relative container that holds both text and mockups */}
        <div className="relative w-full max-w-7xl mx-auto min-h-[620px] lg:min-h-[700px] flex flex-col items-center justify-center py-6 px-4">
          
          {/* Centered Hero Content Block */}
          <div className="relative z-25 max-w-3xl mx-auto flex flex-col items-center text-center">
            
            {/* Glowing Pill Tag */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 text-primary dark:text-primary hover:scale-102 transition-transform duration-200 cursor-pointer shadow-sm shadow-primary/5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-sans font-semibold text-xs tracking-wide uppercase">
                Next-Gen Spaced Repetition for LeetCode
              </span>
            </motion.div>

            {/* Huge Geometric Two-Tone Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7.5xl leading-[1.08] tracking-tight mt-6.5 max-w-3xl"
            >
              Solve it once.
              <br />
              <span className="bg-gradient-to-r from-muted via-foreground/70 to-muted bg-clip-text text-transparent dark:from-muted dark:via-foreground/80 dark:to-muted">
                Remember it forever.
              </span>
            </motion.h1>

            {/* Subtext description */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-sans text-base sm:text-lg lg:text-xl text-muted mt-6 max-w-2xl leading-relaxed font-normal"
            >
              A personal brain-vault for coding problems. Save multiple solutions, organize custom sheets, and get automated, timezone-aware revisit reminders.
            </motion.p>

            {/* Action Call-to-actions */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4.5 mt-8.5"
            >
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="/signup"
                className="relative inline-flex items-center justify-center gap-2 font-sans font-bold text-sm bg-primary hover:bg-primary-hover text-white px-7 py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-97 transition-all cursor-pointer group"
              >
                Start free demo
                <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 font-sans font-bold text-sm bg-surface hover:bg-surface-2 text-foreground border border-border px-7 py-3.5 rounded-xl shadow-sm hover:shadow active:scale-97 transition-all cursor-pointer"
              >
                See how it works
              </motion.a>
            </motion.div>

          </div>

          {/* Floating Mockup Cards (Desktop absolute surrounds center, mobile renders inline grid below) */}
          <FloatingMockups />
        </div>

        {/* Feature Highlights Row (ChronoTask / Spectra aesthetic) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative z-25 w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6.5 mt-10.5 px-4"
        >
          {/* Mini Feature 1 */}
          <div className="h-full flex items-start gap-4 p-5 rounded-2xl bg-surface border border-border shadow-sm hover:border-primary/20 hover:shadow-md transition-all duration-200 group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-foreground">
                3/7/15/30 Day Schedules
              </h3>
              <p className="font-sans text-xs text-muted mt-1 leading-relaxed">
                Interval triggers automatically computed on-read. Zero cron configs needed.
              </p>
            </div>
          </div>

          {/* Mini Feature 2 */}
          <div className="h-full flex items-start gap-4 p-5 rounded-2xl bg-surface border border-border shadow-sm hover:border-primary/20 hover:shadow-md transition-all duration-200 group">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-105 transition-transform shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-foreground">
                Multi-Solution Sheet Playlists
              </h3>
              <p className="font-sans text-xs text-muted mt-1 leading-relaxed">
                Attach multiple code approaches per problem. Group into public shareable lists.
              </p>
            </div>
          </div>

          {/* Mini Feature 3 */}
          <div className="h-full flex items-start gap-4 p-5 rounded-2xl bg-surface border border-border shadow-sm hover:border-primary/20 hover:shadow-md transition-all duration-200 group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-foreground">
                Retention Heatmaps
              </h3>
              <p className="font-sans text-xs text-muted mt-1 leading-relaxed">
                Visualize recall activity with GitHub-style heatmaps and streak targets.
              </p>
            </div>
          </div>
        </motion.div>

      </main>

      {/* 3. Features Section */}
      <Features />

      {/* 4. How It Works Section */}
      <HowItWorks />

      {/* 5. Spaced Repetition Timeline */}
      <SpacedTimeline />

      {/* 6. About Section */}
      <About />

      {/* 7. Pricing Section */}
      <Pricing />

      {/* 8. Footer Section */}
      <Footer />

    </div>
  );
}
