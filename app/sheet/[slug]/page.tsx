"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Library, Globe, ArrowLeft, ExternalLink, Star, Copy, Check, Calendar, AlertCircle, AlertTriangle, CheckCircle2, FileText, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatISTDate } from "@/lib/timestamps/ist";
import { getPublicSheetBySlug, getHighlightedHtml } from "@/lib/actions";
import { useTheme } from "next-themes";

export default function SharedSheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<any>(null);

  // Modal Details states
  const [activeProblem, setActiveProblem] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"solutions" | "notes" | "history">("solutions");
  const [selSolIdx, setSelSolIdx] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [highlightedSolHtml, setHighlightedSolHtml] = useState("");

  const { resolvedTheme } = useTheme();
  const selectedSol = activeProblem?.solutions?.[selSolIdx];

  useEffect(() => {
    if (selectedSol) {
      getHighlightedHtml(selectedSol.code, selectedSol.lang, resolvedTheme === "light" ? "light" : "dark").then((html) => {
        setHighlightedSolHtml(html);
      });
    } else {
      setHighlightedSolHtml("");
    }
  }, [selectedSol, resolvedTheme]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

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
              <table className="min-w-[600px] w-full border-collapse text-left text-xs font-sans">
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
                      <tr 
                        key={idx} 
                        onClick={() => {
                          setActiveProblem(p);
                          setSelSolIdx(0);
                          setActiveTab("solutions");
                        }}
                        className="hover:bg-surface-2/30 transition-all duration-150 cursor-pointer"
                      >
                        <td className="py-3.5 pl-2 font-display font-bold text-foreground hover:text-primary transition-colors">
                          {p.name}
                        </td>
                        <td className="py-3.5">
                          <span className={`font-display font-bold text-[9px] px-2 py-0.5 rounded ${
                            p.difficulty === "EASY" ? "text-emerald-500 bg-emerald-500/10" : p.difficulty === "HARD" ? "text-rose-500 bg-rose-500/10" : "text-amber-500 bg-amber-500/10"
                          }`}>
                            {p.difficulty === "MED" ? "MEDIUM" : p.difficulty}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center gap-1 font-sans font-bold text-[10px] border px-2 py-0.5 rounded-full ${
                            p.status === "Solved" ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-amber-500 bg-amber-500/10 border-amber-500/20"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right pr-2" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={p.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/40 hover:bg-surface-2 text-primary cursor-pointer transition-colors"
                            title="View Problem Source"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
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

      {/* Problem Details Modal */}
      <AnimatePresence>
        {activeProblem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[90vh] bg-surface border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden text-foreground"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between bg-surface-2/20 shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-display font-extrabold text-base sm:text-lg text-foreground">
                      {activeProblem.name}
                    </h2>
                    {activeProblem.isFavorite && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                  </div>
                  <div className="flex flex-nowrap items-center gap-2 max-w-full overflow-hidden select-none">
                    <span className={`font-display font-bold text-[9px] px-2 py-0.5 rounded whitespace-nowrap shrink-0 ${
                      activeProblem.difficulty === "EASY" ? "text-emerald-500 bg-emerald-500/10" : activeProblem.difficulty === "HARD" ? "text-rose-500 bg-rose-500/10" : "text-amber-500 bg-amber-500/10"
                    }`}>
                      {activeProblem.difficulty === "MED" ? "MEDIUM" : activeProblem.difficulty}
                    </span>
                    {(() => {
                      const parts = (activeProblem.topic || "").split(",").map((t: string) => t.trim()).filter(Boolean);
                      const displayParts = parts.slice(0, 3);
                      return (
                        <>
                          {displayParts.map((t: string, idx: number) => (
                            <span key={idx} className="bg-surface-2 border border-border px-2 py-0.5 rounded text-[9px] font-bold text-muted whitespace-nowrap shrink-0">
                              {t}
                            </span>
                          ))}
                          {parts.length > 3 && (
                            <span className="bg-surface-2 border border-border px-2 py-0.5 rounded text-[9px] font-bold text-muted whitespace-nowrap shrink-0">
                              ...
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={activeProblem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-border bg-surface-2 hover:bg-border/20 text-muted hover:text-foreground cursor-pointer transition-colors"
                    title="View Problem Source"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setActiveProblem(null)}
                    className="w-8 h-8 rounded-xl border border-border bg-surface-2 hover:bg-border/20 text-muted hover:text-foreground flex items-center justify-center cursor-pointer transition-all active:scale-95"
                    title="Close details"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Modal Tabs */}
              <div className="px-6 border-b border-border/80 bg-surface-2/45 flex font-sans font-bold text-[11px] tracking-wider uppercase text-muted shrink-0">
                {(["solutions", "notes", "history"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 border-b-2 transition-all cursor-pointer ${
                      activeTab === tab ? "border-primary text-primary" : "border-transparent hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 bg-background/30 space-y-6">
                {activeTab === "solutions" && (
                  <div className="space-y-6">
                    {activeProblem.solutions.length === 0 ? (
                      <div className="p-12 text-center text-muted font-sans text-xs bg-surface border border-border rounded-3xl">
                        No solutions shared for this challenge yet.
                      </div>
                    ) : (
                      (() => {
                        // We already defined selectedSol above
                        return (
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Left Column */}
                            <div className="lg:col-span-4 space-y-4">
                              <div className="bg-surface border border-border rounded-3xl p-4 space-y-2">
                                <span className="font-semibold text-muted tracking-wider uppercase text-[9px] px-1 block mb-2">
                                  Approach Playlists
                                </span>
                                {activeProblem.solutions.map((sol: any, idx: number) => (
                                  <button
                                    key={idx}
                                    onClick={() => setSelSolIdx(idx)}
                                    className={`w-full text-left p-3 rounded-2xl border transition-all text-xs cursor-pointer ${
                                      selSolIdx === idx
                                        ? "bg-primary/5 border-primary/45 text-foreground font-bold"
                                        : "bg-surface-2/40 border-border text-muted hover:text-foreground"
                                    }`}
                                  >
                                    <span className="block font-display text-[11px] font-extrabold">{sol.name}</span>
                                    <span className="text-[10px] text-primary mt-0.5 block">{sol.lang}</span>
                                  </button>
                                ))}
                              </div>

                              <div className="bg-surface border border-border rounded-3xl p-5 space-y-4 font-sans">
                                <div>
                                  <span className="font-semibold text-primary tracking-wider uppercase text-[9px] block">
                                    Intuition
                                  </span>
                                  <p className="mt-1.5 text-foreground/80 leading-relaxed font-medium whitespace-pre-wrap break-words">
                                    {selectedSol.intuition}
                                  </p>
                                </div>
                                <div className="border-t border-border/40 pt-4">
                                  <span className="font-semibold text-primary tracking-wider uppercase text-[9px] block">
                                    Approach
                                  </span>
                                  <p className="mt-1.5 text-foreground/80 leading-relaxed font-medium whitespace-pre-wrap break-words">
                                    {selectedSol.approach}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Right Column */}
                            <div className="lg:col-span-8 space-y-4">
                              {/* Complexities bar */}
                              <div className="flex gap-6 p-4 rounded-xl bg-surface border border-border/40 font-sans text-xs font-bold text-muted justify-start items-center">
                                <span className="text-[10px] tracking-wider uppercase text-muted/80">Complexities:</span>
                                <span className="flex items-center gap-1">Time: <span className="text-primary font-extrabold">{selectedSol.time}</span></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-border" />
                                <span className="flex items-center gap-1">Space: <span className="text-accent font-extrabold">{selectedSol.space}</span></span>
                              </div>

                              {/* Code Editor Box */}
                              <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
                                <div className="px-5 py-3.5 border-b border-border/80 flex items-center justify-between bg-surface-2/20">
                                  <span className="font-mono text-[10px] font-bold text-muted flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                                    {selectedSol.lang} Source
                                  </span>
                                  
                                  <button
                                    onClick={() => copyToClipboard(selectedSol.code)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-surface-2 hover:bg-border/20 text-muted hover:text-foreground font-sans font-bold text-[10px] cursor-pointer transition-colors"
                                  >
                                    {copiedCode ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-emerald-400">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                <div 
                                  className="rounded-xl overflow-hidden font-mono text-[11px] leading-relaxed [&>pre]:p-5 [&>pre]:overflow-x-auto [&>pre]:w-full text-foreground dark:text-slate-300 has-line-numbers"
                                  dangerouslySetInnerHTML={{ __html: highlightedSolHtml || "Loading code..." }} 
                                />
                              </div>

                              {/* Solution Notes */}
                              {(selectedSol.notes || []).length > 0 && (
                                <div className="space-y-2">
                                  <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-muted px-1">Solution Notes</span>
                                  <div className="space-y-2">
                                    {(selectedSol.notes || []).map((n: any, ni: number) => {
                                      const noteIconMap: Record<string, React.ReactNode> = {
                                        mistake: <AlertCircle className="w-3.5 h-3.5" />,
                                        warning: <AlertTriangle className="w-3.5 h-3.5" />,
                                        success: <CheckCircle2 className="w-3.5 h-3.5" />,
                                        note:    <FileText className="w-3.5 h-3.5" />,
                                      };
                                      const cfg = {
                                        mistake: { border: "border-rose-500/30",    bg: "bg-rose-500/5",    text: "text-rose-400",    label: "Mistake" },
                                        warning: { border: "border-warning-card",   bg: "bg-warning-card",   text: "text-warning",     label: "Warning" },
                                        success: { border: "border-emerald-500/30", bg: "bg-emerald-500/5", text: "text-emerald-400", label: "Success" },
                                        note:    { border: "border-primary/20",     bg: "bg-primary/5",     text: "text-primary",     label: "Note"    },
                                      }[n.type as string] || { border: "border-primary/20", bg: "bg-primary/5", text: "text-primary", label: "Note" };
                                      const Icon = noteIconMap[n.type as string] ?? noteIconMap.note;
                                      const isWarning = n.type === "warning";
                                      return (
                                        <div 
                                          key={ni} 
                                          className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.border} ${cfg.bg} font-sans text-xs`}
                                          style={isWarning ? { borderColor: "rgba(245, 158, 11, 0.3)", backgroundColor: "rgba(245, 158, 11, 0.05)" } : {}}
                                        >
                                          <span 
                                            className={`mt-0.5 shrink-0 ${cfg.text}`}
                                            style={isWarning ? { color: "#fbbf24" } : {}}
                                          >
                                            {Icon}
                                          </span>
                                          <div className="flex-1">
                                            <span 
                                              className={`font-bold text-[9px] uppercase tracking-wider ${cfg.text}`}
                                              style={isWarning ? { color: "#fbbf24" } : {}}
                                            >
                                              {cfg.label}
                                            </span>
                                            <p className="mt-0.5 text-foreground/80 leading-relaxed">{n.text}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}

                {activeTab === "notes" && (
                  <div className="space-y-4 max-w-2xl mx-auto">
                    <h3 className="font-display font-bold text-sm text-foreground mb-1">Shared Study Notes</h3>
                    {activeProblem.notes.length === 0 ? (
                      <div className="p-8 text-center text-muted font-sans text-xs bg-surface border border-border rounded-2xl">
                        No notes saved for this challenge.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeProblem.notes.map((note: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-2xl bg-surface border border-border font-sans text-xs text-foreground/90 leading-relaxed flex items-start gap-2.5 shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            <span>{typeof note === "string" ? note : note.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "history" && (() => {
                  const stages = ["3d", "7d", "15d", "30d"];
                  let currentStageIdx = 0;

                  if (activeProblem.interval.includes("7d")) {
                    currentStageIdx = 1;
                  } else if (activeProblem.interval.includes("15d")) {
                    currentStageIdx = 2;
                  } else if (activeProblem.interval.includes("30d")) {
                    currentStageIdx = 3;
                  } else if (activeProblem.interval === "Recall Stage 1" || activeProblem.status === "Unsolved") {
                    currentStageIdx = -1;
                  }

                  const historyList = stages.map((stage, idx) => {
                    let status = "Upcoming";
                    if (currentStageIdx === -1) {
                      status = "Pending";
                    } else if (idx < currentStageIdx) {
                      status = "Done";
                    } else if (idx === currentStageIdx) {
                      status = activeProblem.status === "Solved" ? "Done" : "Pending";
                    }
                    
                    const updatedDate = new Date(activeProblem.updatedAt);
                    let daysOffset = 0;
                    if (stage === "3d") daysOffset = 3;
                    else if (stage === "7d") daysOffset = 7;
                    else if (stage === "15d") daysOffset = 15;
                    else if (stage === "30d") daysOffset = 30;

                    const dateObj = new Date(updatedDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);
                    const dateFormatted = formatISTDate(dateObj);

                    return {
                      stage: `Stage ${idx + 1} (${stage})`,
                      status,
                      date: dateFormatted
                    };
                  });

                  return (
                    <div className="space-y-6 max-w-2xl mx-auto">
                      <h3 className="font-display font-bold text-sm text-foreground">Revisit History & Spacing Milestones</h3>
                      <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative">
                          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-border -translate-y-1/2 hidden sm:block z-0" />
                          
                          {historyList.map((step: any, idx: number) => (
                            <div key={idx} className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 z-10 w-full sm:w-auto bg-surface sm:px-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] font-sans border transition-all ${
                                step.status === "Done"
                                  ? "bg-primary border-primary text-white"
                                  : "bg-surface-2 border-border text-muted"
                              }`}>
                                {idx + 1}
                              </div>
                              <div className="text-left sm:text-center space-y-0.5 font-sans">
                                <span className="block font-display font-extrabold text-[10px] text-foreground">
                                  {step.stage}
                                </span>
                                <span className="block text-[9px] text-muted flex items-center justify-start sm:justify-center gap-1 font-semibold">
                                  <Calendar className="w-2.5 h-2.5 text-primary" />
                                  {step.date}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline Close Icon helper
function X(props: any) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth="2.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
