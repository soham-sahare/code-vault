"use client";

import { use } from "react";
import { useState } from "react";
import Link from "next/link";
import { Library, Globe, ArrowLeft, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function SharedSheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  // Mock public sheets database lookup
  const [sheet, setSheet] = useState({
    name: "Blind 75 Curated",
    description: "Standard 75 coding interview questions curated by Yangshun. Public view-only mirror.",
    solvedCount: 42,
    problemsCount: 75,
    problems: [
      { num: 15, name: "3Sum", difficulty: "MEDIUM", status: "Solved", url: "https://leetcode.com/problems/3sum/" },
      { num: 1, name: "Two Sum", difficulty: "EASY", status: "Solved", url: "https://leetcode.com/problems/two-sum/" },
      { num: 76, name: "Minimum Window Substring", difficulty: "HARD", status: "Due Today", url: "https://leetcode.com/problems/minimum-window-substring/" }
    ]
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans text-xs p-6 md:p-12 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to CodeVault Home
        </Link>

        {/* Sheet Banner */}
        <div className="p-6 rounded-3xl bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <h1 className="font-display font-extrabold text-xl sm:text-2xl text-foreground flex items-center gap-2">
                <Library className="w-7 h-7 text-primary" />
                {sheet.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-sans">
                <Globe className="w-2.5 h-2.5" />
                Public Shared Sheet
              </span>
            </div>
            <p className="font-sans text-xs text-muted max-w-xl">
              {sheet.description}
            </p>
          </div>

          {/* Progress Widget */}
          <div className="flex flex-col items-end gap-1.5 min-w-[200px]">
            <div className="w-full text-right font-sans text-xs font-bold text-muted">
              Solved Progress: <span className="text-primary">{sheet.solvedCount}</span> / {sheet.problemsCount}
              <div className="w-full h-2 bg-surface-2 border border-border/40 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(sheet.solvedCount / sheet.problemsCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Problems list */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm">
          <h2 className="font-display font-bold text-sm text-foreground mb-4">
            Practice Challenges List
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-border/80 text-muted font-bold tracking-wider uppercase text-[9px]">
                  <th className="pb-3.5 pl-2">Problem Name</th>
                  <th className="pb-3.5">Difficulty</th>
                  <th className="pb-3.5">Status</th>
                  <th className="pb-3.5 text-right pr-2">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {sheet.problems.map((prob, idx) => (
                  <tr key={idx} className="hover:bg-surface-2/30 transition-all duration-150">
                    <td className="py-3.5 pl-2 font-display font-bold text-foreground">
                      {prob.name}
                    </td>
                    <td className="py-3.5">
                      <span className={`font-display font-bold text-[9px] px-2 py-0.5 rounded ${
                        prob.difficulty === "EASY" ? "text-emerald-500 bg-emerald-500/10" : prob.difficulty === "HARD" ? "text-rose-500 bg-rose-500/10" : "text-amber-500 bg-amber-500/10"
                      }`}>
                        {prob.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1 font-sans font-bold text-[10px] border px-2 py-0.5 rounded-full ${
                        prob.status === "Solved" ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-amber-500 bg-amber-500/10 border-amber-500/20"
                      }`}>
                        {prob.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <a
                        href={prob.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
                      >
                        LeetCode
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
