"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Star, Globe, ArrowLeft, ExternalLink, Calendar, Copy, Check, AlertCircle, AlertTriangle, CheckCircle2, FileText, Lock, Library, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatISTDate } from "@/lib/timestamps/ist";
import { getPublicProblemBySlug, getHighlightedHtml, updateProblem } from "@/lib/actions";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SharedProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [problem, setProblem] = useState<any | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [resultStatus, setResultStatus] = useState<"FOUND" | "PRIVATE" | "NOT_FOUND">("NOT_FOUND");
  const [privateProblemName, setPrivateProblemName] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isUpdatingPublic, setIsUpdatingPublic] = useState(false);
  const [selSolIdx, setSelSolIdx] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<"solutions" | "notes" | "history">("solutions");
  const [highlightedSolHtml, setHighlightedSolHtml] = useState("");

  const { resolvedTheme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  useEffect(() => {
    setThemeMounted(true);
  }, []);

  const selectedSol = problem?.solutions?.[selSolIdx];

  useEffect(() => {
    if (selectedSol) {
      getHighlightedHtml(selectedSol.code, selectedSol.lang, resolvedTheme === "light" ? "light" : "dark").then((html) => {
        setHighlightedSolHtml(html);
      });
    } else {
      setHighlightedSolHtml("");
    }
  }, [selectedSol, resolvedTheme]);

  useEffect(() => {
    async function load() {
      try {
        const res = await getPublicProblemBySlug(slug);
        setResultStatus(res.status);
        if (res.status === "FOUND" && res.problem) {
          setProblem(res.problem);
          setIsOwner(res.isOwner);
        } else if (res.status === "PRIVATE") {
          setPrivateProblemName(res.problemName);
        }
      } catch (err) {
        console.error("Failed to load shared problem from database:", err);
        setResultStatus("NOT_FOUND");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleMakePublic = async () => {
    if (!problem) return;
    try {
      setIsUpdatingPublic(true);
      const companyNames = problem.companies
        ? problem.companies.map((c: any) => c.company?.name || c.name).filter(Boolean)
        : undefined;
      const patternNames = problem.patterns
        ? problem.patterns.map((p: any) => p.pattern?.name || p.name).filter(Boolean)
        : undefined;

      await updateProblem(problem.id, {
        name: problem.name,
        difficulty: problem.difficulty,
        topic: problem.topic,
        url: problem.url,
        isPublic: true,
        companyNames,
        patternNames,
      });
      setProblem((prev: any) => ({ ...prev, isPublic: true }));
    } catch (err) {
      console.error("Failed to make problem public:", err);
    } finally {
      setIsUpdatingPublic(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        {/* Navigation Skeleton */}
        <header className="h-16 border-b border-border/80 bg-surface/50 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-xl" />
            <Skeleton className="h-5 w-28 rounded-lg" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
        </header>

        {/* Content Skeleton */}
        <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-10 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-6 w-56 rounded-lg" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
            </div>
            <Skeleton className="w-9 h-9 rounded-xl" />
          </div>

          <div className="h-10 border-b border-border flex gap-4">
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-28 rounded-xl" />
              <Skeleton className="h-8 w-28 rounded-xl" />
            </div>
            <div className="p-6 space-y-3 rounded-xl bg-surface-2/40">
              <Skeleton className="h-4 w-1/4 rounded" />
              <Skeleton className="h-4 w-3/5 rounded" />
              <Skeleton className="h-4 w-2/5 rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
              <Skeleton className="h-4 w-1/3 rounded" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // State: Problem exists in CodeVault but owner has not enabled public link sharing
  if (resultStatus === "PRIVATE" || (!problem && privateProblemName)) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 dots-pattern">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-surface border border-border shadow-2xl text-center space-y-6"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500">
              Private Problem
            </span>
            <h2 className="font-display font-extrabold text-xl text-foreground">
              {privateProblemName ? `"${privateProblemName}" is not shared yet` : "This problem is not publicly shared"}
            </h2>
            <p className="font-sans text-xs text-muted leading-relaxed max-w-sm mx-auto">
              The author has saved this challenge in their private CodeVault, but has not enabled public link sharing.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-2/40 border border-border/60 text-left space-y-1.5 text-xs">
            <p className="font-bold text-foreground">
              Are you the author of this challenge?
            </p>
            <p className="text-muted text-[11px] leading-relaxed">
              Sign in to your account to preview this problem or toggle public link sharing from your dashboard.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 font-sans font-bold text-xs bg-primary hover:bg-primary/90 text-white px-5 py-3 rounded-xl shadow-md shadow-primary/20 transition-all flex-1"
            >
              Sign In to CodeVault
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 font-sans font-bold text-xs bg-surface-2 hover:bg-border/30 border border-border text-foreground px-5 py-3 rounded-xl transition-all flex-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // State: Problem not found anywhere
  if (!problem) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 dots-pattern">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-surface border border-border shadow-xl text-center space-y-6"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-extrabold text-lg text-foreground">Problem Not Found</h2>
            <p className="font-sans text-xs text-muted leading-relaxed">
              We couldn't find a coding challenge matching this link. It may have been deleted or the URL might be incorrect.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 font-sans font-bold text-xs bg-primary hover:bg-primary/90 text-white px-5 py-3 rounded-xl shadow-md shadow-primary/20 transition-all w-full"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Go to CodeVault Homepage
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans text-xs p-6 md:p-12 transition-colors duration-300 dots-pattern">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation back link */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to CodeVault Home
          </Link>
          <div className="flex items-center gap-3">
            {isOwner && (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 font-bold text-muted hover:text-foreground text-xs"
              >
                Open in Dashboard
              </Link>
            )}
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-2 transition-all cursor-pointer shadow-sm"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {themeMounted && resolvedTheme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-muted" />
              )}
            </button>
          </div>
        </div>

        {/* Private Owner Preview Banner */}
        {!problem.isPublic && isOwner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-500"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Lock className="w-4.5 h-4.5 text-amber-500" />
              </div>
              <div>
                <p className="font-display font-bold text-xs text-foreground">Private Owner Preview</p>
                <p className="text-[11px] text-muted">This problem is currently private in your vault. Only you can view this page until public sharing is enabled.</p>
              </div>
            </div>
            <button
              onClick={handleMakePublic}
              disabled={isUpdatingPublic}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isUpdatingPublic ? "Enabling..." : "Enable Public Sharing"}</span>
            </button>
          </motion.div>
        )}

        {/* Problem Header Card */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h1 className="font-display font-extrabold text-xl sm:text-2xl text-foreground">
                  {problem.name}
                </h1>
                {problem.isFavorite && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                {problem.isPublic ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-sans">
                    <Globe className="w-2.5 h-2.5" />
                    Public Shared Problem
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500 font-sans">
                    <Lock className="w-2.5 h-2.5" />
                    Private Preview
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className={`font-display font-bold text-[9px] px-2 py-0.5 rounded whitespace-nowrap shrink-0 ${
                  problem.difficulty === "EASY" ? "text-emerald-500 bg-emerald-500/10" : problem.difficulty === "HARD" ? "text-rose-500 bg-rose-500/10" : "text-amber-500 bg-amber-500/10"
                }`}>
                  {problem.difficulty === "MED" ? "MEDIUM" : problem.difficulty}
                </span>

                {/* All Topics */}
                {problem.topic &&
                  problem.topic.split(",").map((topic: string, i: number) => {
                    const trimmed = topic.trim();
                    if (!trimmed) return null;
                    return (
                      <span
                        key={`t-${i}`}
                        className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-[9px] font-sans whitespace-nowrap shadow-sm"
                      >
                        {trimmed}
                      </span>
                    );
                  })}

                {/* All Companies */}
                {problem.companies &&
                  problem.companies.map((c: any, i: number) => {
                    const name = c.company?.name || c.name;
                    if (!name) return null;
                    return (
                      <span
                        key={`c-${i}`}
                        className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-500 font-bold text-[9px] font-sans whitespace-nowrap shadow-sm"
                      >
                        {name}
                      </span>
                    );
                  })}

                {/* All Algorithmic Patterns */}
                {problem.patterns &&
                  problem.patterns.map((p: any, i: number) => {
                    const name = p.pattern?.name || p.name;
                    if (!name) return null;
                    return (
                      <span
                        key={`p-${i}`}
                        className="px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-500 font-bold text-[9px] font-sans whitespace-nowrap shadow-sm"
                      >
                        {name}
                      </span>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Custom tabs selector for reading solution details, notes, and milestones */}
        <div className="flex border-b border-border/80 gap-6">
          {(["solutions", "notes", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 font-display font-extrabold text-xs tracking-wider uppercase border-b-2 cursor-pointer transition-all ${
                activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab contents */}
        <div className="space-y-6">
          
          {/* SOLUTIONS TAB */}
          {activeTab === "solutions" && (
            <div className="space-y-6">
              {problem.solutions.length === 0 ? (
                <div className="p-12 text-center text-muted font-sans text-xs bg-surface border border-border rounded-3xl">
                  No solutions shared for this challenge yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Solution Selector & text explanations */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="bg-surface border border-border rounded-3xl p-4 space-y-2">
                      <span className="font-semibold text-muted tracking-wider uppercase text-[9px] px-1 block mb-2">
                        Approach Playlists
                      </span>
                      {problem.solutions.map((sol: any, idx: number) => (
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

                    {/* Intuition & Approach texts */}
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

                  {/* Right Column: Dynamic Code Box & Complexities */}
                  <div className="lg:col-span-8 space-y-4">
                    {/* Complexities bar */}
                    <div className="flex gap-6 p-4 rounded-xl bg-surface border border-border/40 font-sans text-xs font-bold text-muted justify-start items-center">
                      <span className="text-[10px] tracking-wider uppercase text-muted/80">Complexities:</span>
                      <span className="flex items-center gap-1">Time: <span className="text-primary font-extrabold">{selectedSol.time}</span></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-border" />
                      <span className="flex items-center gap-1">Space: <span className="text-accent font-extrabold">{selectedSol.space}</span></span>
                    </div>

                    {/* Code Editor Mock */}
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
              )}
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === "notes" && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <h3 className="font-display font-bold text-sm text-foreground mb-1">Shared Study Notes</h3>
              {problem.notes.length === 0 ? (
                <div className="p-8 text-center text-muted font-sans text-xs bg-surface border border-border rounded-2xl">
                  No notes saved for this challenge.
                </div>
              ) : (
                <div className="space-y-3">
                  {problem.notes.map((note: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl bg-surface border border-border font-sans text-xs text-foreground/90 leading-relaxed flex items-start gap-2.5 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <span>{typeof note === "string" ? note : note.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (() => {
            const stages = ["3d", "7d", "15d", "30d"];
            let currentStageIdx = 0;

            if (problem.interval.includes("7d")) {
              currentStageIdx = 1;
            } else if (problem.interval.includes("15d")) {
              currentStageIdx = 2;
            } else if (problem.interval.includes("30d")) {
              currentStageIdx = 3;
            } else if (problem.interval === "Recall Stage 1" || problem.status === "Unsolved") {
              currentStageIdx = -1;
            }

            const historyList = stages.map((stage, idx) => {
              let status = "Upcoming";
              if (currentStageIdx === -1) {
                status = "Pending";
              } else if (idx < currentStageIdx) {
                status = "Done";
              } else if (idx === currentStageIdx) {
                status = problem.status === "Solved" ? "Done" : "Pending";
              }
              
              const updatedDate = new Date(problem.updatedAt);
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
                  {/* Horizontal steps timeline progress */}
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

        {/* Creator's Public Sheets */}
        {problem.user?.sheets && problem.user.sheets.length > 0 && (
          <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm space-y-4">
            <h3 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
              <Library className="w-5 h-5 text-primary" />
              Creator's Public Sheets
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {problem.user.sheets.map((sheet: any) => (
                <Link
                  key={sheet.id}
                  href={`/sheet/${sheet.shareSlug}`}
                  className="p-4 rounded-2xl border border-border bg-surface-2/20 hover:bg-surface-2 hover:border-primary/45 transition-all block group"
                >
                  <div className="font-display font-extrabold text-foreground group-hover:text-primary transition-colors text-[12px]">
                    {sheet.name}
                  </div>
                  {sheet.description && (
                    <p className="text-muted text-[11px] mt-1 line-clamp-2 leading-relaxed">
                      {sheet.description}
                    </p>
                  )}
                  <div className="text-[10px] text-primary/80 font-bold mt-2">
                    {sheet.problems?.length || 0} Challenges
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
