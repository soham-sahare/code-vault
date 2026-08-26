"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function Footer() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="w-full border-t border-border/80 bg-surface/30 transition-colors duration-300 py-16 px-6 relative z-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Branding & Logo */}
        <div className="flex flex-col items-center md:items-start gap-3">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-7.5 h-7.5 rounded-lg bg-primary flex items-center justify-center text-white overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-200">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 17L2 12l4-5M18 7l4 5-4 5" />
                <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                <line x1="12" y1="9.5" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
              </svg>
            </div>
            <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
              CodeVault
            </span>
          </a>
          <p className="font-sans text-xs text-muted text-center md:text-left max-w-xs mt-1">
            Build your second brain for DSA and interview prep. Solve, recall, master.
          </p>
        </div>

        {/* Quick Links */}
        <nav className="flex flex-wrap justify-center gap-6 md:gap-10 font-sans font-semibold text-xs text-muted">
          <a href="#about" className="hover:text-foreground transition-colors">
            About
          </a>
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            How It Works
          </a>
        </nav>

        {/* Socials & Theme Status */}
        <div className="flex items-center gap-5">
          {/* GitHub Repository Link */}
          <a
            href="https://github.com/soham-sahare/code-vault"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg bg-surface border border-border hover:bg-surface-2 flex items-center justify-center text-muted hover:text-foreground transition-all"
            aria-label="GitHub Repository"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
          </a>

          {/* Theme status indicator text */}
          {mounted && (
            <div className="flex items-center gap-1.5 font-sans font-semibold text-[10px] text-muted border border-border/80 px-2.5 py-1 rounded-full bg-surface-2/40">
              {resolvedTheme === "dark" ? (
                <>
                  <Moon className="w-3 h-3 text-primary animate-pulse" />
                  <span>Night Skin</span>
                </>
              ) : (
                <>
                  <Sun className="w-3 h-3 text-accent animate-spin-slow" />
                  <span>Sun Skin</span>
                </>
              )}
            </div>
          )}
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-border/40 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-sans text-[11px] text-muted">
          © {new Date().getFullYear()} CodeVault.
        </p>
        <p className="font-sans text-xs text-muted">
          Made with ❤️ by{" "}
          <a
            href="https://sohamsahare.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary font-semibold transition-colors"
          >
            sohamsahare
          </a>
        </p>
      </div>

    </footer>
  );
}
