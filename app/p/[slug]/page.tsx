"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Star, Globe, ArrowLeft, ExternalLink, Calendar, Copy, Check, AlertCircle, AlertTriangle, CheckCircle2, FileText, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/themes/prism-tomorrow.css";

function highlightCode(code: string, lang: string) {
  if (!code) return "";
  
  const normalizedLang = lang.toLowerCase();
  let prismLang = Prism.languages.python;
  
  if (normalizedLang === "python") {
    prismLang = Prism.languages.python;
  } else if (normalizedLang === "c++" || normalizedLang === "cpp") {
    prismLang = Prism.languages.cpp;
  } else if (normalizedLang === "java") {
    prismLang = Prism.languages.java;
  } else if (normalizedLang === "javascript" || normalizedLang === "js") {
    prismLang = Prism.languages.javascript;
  } else if (normalizedLang === "typescript" || normalizedLang === "ts") {
    prismLang = Prism.languages.typescript;
  } else if (normalizedLang === "go") {
    prismLang = Prism.languages.go;
  } else if (normalizedLang === "rust") {
    prismLang = Prism.languages.rust;
  }
  
  return Prism.highlight(code, prismLang, lang);
}

export default function SharedProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [problem, setProblem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selSolIdx, setSelSolIdx] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<"solutions" | "notes" | "history">("solutions");

  useEffect(() => {
    let list = [];
    const stored = localStorage.getItem("codevault_problems");
    if (stored) {
      try {
        list = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    
    // Fallback default list if local storage is empty
    if (list.length === 0) {
      list = [
        {
          num: 15,
          name: "3Sum",
          difficulty: "MED",
          diffColor: "text-amber-500 bg-amber-500/10",
          topic: "Array, Two Pointers",
          status: "Solved",
          interval: "Due in 3d",
          url: "https://leetcode.com/problems/3sum/",
          isFavorite: true,
          isPublic: true,
          solutions: [
            {
              name: "Optimal Two Pointers",
              lang: "Python",
              intuition: "Sort array first to easily avoid duplicate triplets using two pointers from outer loops.",
              approach: "Sort array. Iterate through array with pointer i. For each i, run standard two-pointer check on remaining subarray (i+1 to len-1). Skip duplicate values.",
              time: "O(N²)",
              space: "O(1)",
              code: `class Solution:\n    def threeSum(self, nums: List[int]) -> List[List[int]]:\n        nums.sort()\n        res = []\n        for i in range(len(nums) - 2):\n            if i > 0 and nums[i] == nums[i-1]:\n                continue\n            l, r = i + 1, len(nums) - 1\n            while l < r:\n                s = nums[i] + nums[l] + nums[r]\n                if s < 0:\n                    l += 1\n                elif s > 0:\n                    r -= 1\n                else:\n                    res.append([nums[i], nums[l], nums[r]])\n                    while l < r and nums[l] == nums[l+1]: l += 1\n                    while l < r and nums[r] == nums[r-1]: r -= 1\n                    l += 1\n                    r -= 1\n        return res`,
              notes: [
                { type: "mistake", text: "Forgetting to skip duplicates inside the while loop." },
                { type: "warning", text: "Index underflow if nums size is less than 3." }
              ]
            }
          ],
          notes: [
            "Sorting array is key for duplicate checks.",
            "Check negative boundary conditions at initialization."
          ],
          history: [
            { stage: "Day 0 - Initial", date: "01-Jun-2026", status: "Done" },
            { stage: "Day 3 - Stage 1", date: "04-Jun-2026", status: "Done" }
          ]
        }
      ];
    }

    const getSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const found = list.find((p: any) => getSlug(p.name) === slug);
    if (found && found.isPublic) {
      setProblem(found);
    }
    setLoading(false);
  }, [slug]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-t-primary border-border/40 rounded-full animate-spin" />
          <span className="font-bold text-muted uppercase tracking-wider text-[10px]">Loading Recall Vault…</span>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 dots-pattern">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-surface border border-border shadow-xl text-center space-y-6"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-extrabold text-lg text-foreground">Access Restricted or Private</h2>
            <p className="font-sans text-xs text-muted leading-relaxed">
              This coding challenge does not exist, or the owner has disabled public link sharing.
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

  const selectedSol = problem.solutions[selSolIdx];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans text-xs p-6 md:p-12 transition-colors duration-300 dots-pattern">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to CodeVault Home
        </Link>

        {/* Problem Header Card */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h1 className="font-display font-extrabold text-xl sm:text-2xl text-foreground">
                  {problem.name}
                </h1>
                {problem.isFavorite && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-sans">
                  <Globe className="w-2.5 h-2.5" />
                  Public Shared Problem
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-1">
                <span className={`font-display font-bold text-[9px] px-2 py-0.5 rounded ${
                  problem.difficulty === "EASY" ? "text-emerald-500 bg-emerald-500/10" : problem.difficulty === "HARD" ? "text-rose-500 bg-rose-500/10" : "text-amber-500 bg-amber-500/10"
                }`}>
                  {problem.difficulty === "MED" ? "MEDIUM" : problem.difficulty}
                </span>
                {problem.topic.split(",").map((t: string, idx: number) => (
                  <span key={idx} className="bg-surface-2 border border-border px-2 py-0.5 rounded text-[9px] font-bold text-muted">
                    {t.trim()}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={problem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-2 hover:bg-border/20 text-muted hover:text-foreground font-sans font-bold text-[11px] cursor-pointer transition-colors"
              >
                LeetCode
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
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
                        <p className="mt-1.5 text-foreground/80 leading-relaxed font-medium">
                          {selectedSol.intuition}
                        </p>
                      </div>
                      <div className="border-t border-border/40 pt-4">
                        <span className="font-semibold text-primary tracking-wider uppercase text-[9px] block">
                          Approach
                        </span>
                        <p className="mt-1.5 text-foreground/80 leading-relaxed font-medium">
                          {selectedSol.approach}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dynamic Code Box & Complexities */}
                  <div className="lg:col-span-8 space-y-4">
                    {/* Complexity Pills */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-surface border border-border rounded-2xl flex flex-col justify-center">
                        <span className="text-[9px] text-muted font-bold uppercase tracking-wider">Time Complexity</span>
                        <span className="text-sm font-display font-extrabold text-foreground mt-0.5">
                          {selectedSol.time}
                        </span>
                      </div>
                      <div className="p-3 bg-surface border border-border rounded-2xl flex flex-col justify-center">
                        <span className="text-[9px] text-muted font-bold uppercase tracking-wider">Space Complexity</span>
                        <span className="text-sm font-display font-extrabold text-foreground mt-0.5">
                          {selectedSol.space}
                        </span>
                      </div>
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

                      <pre className="p-5 overflow-x-auto font-mono text-[11px] leading-relaxed text-slate-300">
                        <code dangerouslySetInnerHTML={{ __html: highlightCode(selectedSol.code, selectedSol.lang) }} />
                      </pre>
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
                  {problem.notes.map((note: string, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl bg-surface border border-border font-sans text-xs text-foreground/90 leading-relaxed flex items-start gap-2.5 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <h3 className="font-display font-bold text-sm text-foreground">Revisit History & Spacing Milestones</h3>
              {problem.history.length === 0 ? (
                <div className="p-8 text-center text-muted font-sans text-xs bg-surface border border-border rounded-2xl">
                  No revision log history found.
                </div>
              ) : (
                <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm">
                  {/* Horizontal steps timeline progress */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative">
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-border -translate-y-1/2 hidden sm:block z-0" />
                    
                    {problem.history.map((step: any, idx: number) => (
                      <div key={idx} className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 z-10 w-full sm:w-auto bg-surface sm:px-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] font-sans border transition-all ${
                          step.status === "Done"
                            ? "bg-primary border-primary text-white"
                            : "bg-surface-2 border-border text-muted"
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="text-left sm:text-center space-y-0.5">
                          <span className="block font-display font-extrabold text-[10px] text-foreground">
                            {step.stage}
                          </span>
                          <span className="block text-[9px] text-muted flex items-center justify-start sm:justify-center gap-1">
                            <Calendar className="w-2.5 h-2.5 text-primary" />
                            {step.date}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
