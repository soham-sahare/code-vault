"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Header() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white overflow-hidden shadow-md shadow-primary/30 group-hover:scale-105 transition-transform duration-200">
            {/* Visual shape representing vault/bracket */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent group-hover:opacity-90">
            CodeVault
          </span>
        </a>

        {/* Desktop Nav Links - Only Features and About */}
        <nav className="hidden md:flex items-center gap-8 font-sans font-semibold text-sm text-muted">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#about" className="hover:text-foreground transition-colors">
            About
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Sun / Moon Toggle - Colored in Lavender B7A8F5 */}
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="w-10 h-10 rounded-xl bg-surface hover:bg-primary/5 border-2 border-primary/50 text-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm shadow-primary/10"
            aria-label="Toggle theme"
          >
            {mounted && (resolvedTheme === "dark" ? (
              <motion.div initial={{ rotate: -90, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }}>
                <Sun className="w-5 h-5 text-accent" />
              </motion.div>
            ) : (
              <motion.div initial={{ rotate: 90, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }}>
                <Moon className="w-5 h-5 text-primary" />
              </motion.div>
            ))}
            {!mounted && <div className="w-5 h-5" />}
          </button>

          {/* Call to Actions - Both filled Lavender */}
          <a
            href="/login"
            className="hidden sm:inline-flex items-center justify-center gap-1.5 font-sans font-bold text-sm bg-primary hover:bg-primary/90 text-white px-4.5 py-2.5 rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-98 transition-all group"
          >
            Sign in
          </a>

        </div>
      </div>
    </header>
  );
}
