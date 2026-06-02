"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Library, Globe, ArrowLeft, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { getPublicSheetBySlug } from "@/lib/actions";

export default function SharedSheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPublicSheetBySlug(slug);
        setSheet(data);
      } catch (err) {
        console.error("Failed to load public sheet:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300 items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="font-sans font-semibold text-xs text-muted">Retrieving public sheet...</span>
        </div>
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans text-xs p-6 md:p-12 transition-colors duration-300 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <Library className="w-12 h-12 text-muted/40 mx-auto" />
          <h2 className="font-display font-extrabold text-sm text-foreground">Sheet Not Found</h2>
          <p className="text-muted leading-relaxed">
            This sheet may have been deleted, set to private, or the link is incorrect.
          </p>
          <Link href="/" className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Go to CodeVault Home
          </Link>
        </div>
      </div>
    );
  }

  const problemsCount = sheet.problems?.length || 0;
  const solvedCount = sheet.problems?.filter((p: any) => p.problem.status === "Solved").length || 0;

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
              {sheet.description || "No description provided."}
            </p>
          </div>

          {/* Progress Widget */}
          <div className="flex flex-col items-end gap-1.5 min-w-[200px]">
            <div className="w-full text-right font-sans text-xs font-bold text-muted">
              Solved Progress: <span className="text-primary">{solvedCount}</span> / {problemsCount}
              <div className="w-full h-2 bg-surface-2 border border-border/40 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${problemsCount > 0 ? (solvedCount / problemsCount) * 100 : 0}%` }}
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

          {problemsCount === 0 ? (
            <div className="text-center py-12 text-muted font-sans text-xs">
              <Library className="w-12 h-12 text-muted/40 mx-auto mb-3" />
              No problems are currently added to this public sheet.
            </div>
          ) : (
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
                  {sheet.problems.map((prob: any, idx: number) => {
                    const p = prob.problem;
                    return (
                      <tr key={idx} className="hover:bg-surface-2/30 transition-all duration-150">
                        <td className="py-3.5 pl-2 font-display font-bold text-foreground">
                          {p.name}
                        </td>
                        <td className="py-3.5">
                          <span className={`font-display font-bold text-[9px] px-2 py-0.5 rounded ${
                            p.difficulty === "EASY" ? "text-emerald-500 bg-emerald-500/10" : p.difficulty === "HARD" ? "text-rose-500 bg-rose-500/10" : "text-amber-500 bg-amber-500/10"
                          }`}>
                            {p.difficulty}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center gap-1 font-sans font-bold text-[10px] border px-2 py-0.5 rounded-full ${
                            p.status === "Solved" ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-amber-500 bg-amber-500/10 border-amber-500/20"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <a
                            href={p.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
                          >
                            LeetCode
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
