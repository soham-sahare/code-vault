"use client";

import { useState } from "react";
import Sidebar from "@/components/shell/Sidebar";
import { Search, Bell, Library, Plus, Trash2, Edit, ExternalLink, Share2, Globe, Lock, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SheetsPage() {
  const [sheetsList, setSheetsList] = useState([
    {
      id: "1",
      name: "Blind 75",
      description: "Standard 75 coding interview questions curated by Yangshun.",
      problemsCount: 75,
      solvedCount: 42,
      isPublic: true,
      shareSlug: "blind-75-curated",
      problems: [
        { num: 15, name: "3Sum", difficulty: "MEDIUM", status: "Solved" },
        { num: 1, name: "Two Sum", difficulty: "EASY", status: "Solved" },
        { num: 76, name: "Minimum Window Substring", difficulty: "HARD", status: "Due Today" }
      ]
    },
    {
      id: "2",
      name: "Neetcode 150",
      description: "A comprehensive list built on top of Blind 75.",
      problemsCount: 150,
      solvedCount: 28,
      isPublic: false,
      shareSlug: null,
      problems: [
        { num: 42, name: "Trapping Rain Water", difficulty: "HARD", status: "Solved" }
      ]
    },
    {
      id: "3",
      name: "DP Essentials",
      description: "Core Dynamic Programming problems for patterns.",
      problemsCount: 30,
      solvedCount: 5,
      isPublic: true,
      shareSlug: "dp-must-do",
      problems: []
    }
  ]);

  const [activeSheet, setActiveSheet] = useState<any>(null);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);

  // Form states
  const [sheetName, setSheetName] = useState("");
  const [sheetDesc, setSheetDesc] = useState("");
  const [sheetPublic, setSheetPublic] = useState(false);

  const handleSaveSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetName) return;

    if (editingSheetId) {
      setSheetsList((prev) =>
        prev.map((s) => {
          if (s.id === editingSheetId) {
            return {
              ...s,
              name: sheetName,
              description: sheetDesc,
              isPublic: sheetPublic,
              shareSlug: sheetPublic ? s.shareSlug || `${sheetName.toLowerCase().replace(/\s+/g, "-")}-${Math.floor(Math.random() * 1000)}` : null
            };
          }
          return s;
        })
      );
      setEditingSheetId(null);
    } else {
      const newSheet = {
        id: Math.random().toString(),
        name: sheetName,
        description: sheetDesc,
        problemsCount: 0,
        solvedCount: 0,
        isPublic: sheetPublic,
        shareSlug: sheetPublic ? `${sheetName.toLowerCase().replace(/\s+/g, "-")}-${Math.floor(Math.random() * 1000)}` : null,
        problems: []
      };
      setSheetsList((prev) => [...prev, newSheet]);
    }

    // Reset fields
    setIsAddSheetOpen(false);
    setSheetName("");
    setSheetDesc("");
    setSheetPublic(false);
  };

  const handleDeleteSheet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSheetsList((prev) => prev.filter((s) => s.id !== id));
    if (activeSheet && activeSheet.id === id) {
      setActiveSheet(null);
    }
  };

  const handleEditSheet = (sheet: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSheetId(sheet.id);
    setSheetName(sheet.name);
    setSheetDesc(sheet.description);
    setSheetPublic(sheet.isPublic);
    setIsAddSheetOpen(true);
  };

  const toggleShareSlug = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSheetsList((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextPublic = !s.isPublic;
          return {
            ...s,
            isPublic: nextPublic,
            shareSlug: nextPublic ? s.shareSlug || `${s.name.toLowerCase().replace(/\s+/g, "-")}-${Math.floor(Math.random() * 1000)}` : null
          };
        }
        return s;
      })
    );
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground flex items-center gap-2.5">
              <Library className="w-8 h-8 text-primary" />
              Practice Sheets
            </h1>
            <p className="font-sans text-xs text-muted mt-1">Organize and track curated sets of coding challenges</p>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditingSheetId(null);
                setSheetName("");
                setSheetDesc("");
                setSheetPublic(false);
                setIsAddSheetOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-sans font-bold text-xs cursor-pointer transition-colors shadow-md shadow-primary/10"
            >
              <Plus className="w-4 h-4" />
              New Sheet
            </motion.button>
          </div>
        </div>

        {activeSheet ? (
          /* SINGLE SHEET DETAIL MODE */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Sheet Banner */}
            <div className="p-6 rounded-3xl bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
              <div className="space-y-2">
                <button
                  onClick={() => setActiveSheet(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer font-sans"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sheets
                </button>
                <div className="flex items-center gap-2.5">
                  <h2 className="font-display font-extrabold text-xl text-foreground">
                    {activeSheet.name}
                  </h2>
                  {activeSheet.isPublic ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-sans">
                      <Globe className="w-2.5 h-2.5" />
                      Public
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-muted/10 border border-border/80 text-muted font-sans">
                      <Lock className="w-2.5 h-2.5" />
                      Private
                    </span>
                  )}
                </div>
                <p className="font-sans text-xs text-muted max-w-xl">
                  {activeSheet.description || "No description provided."}
                </p>
              </div>

              {/* Progress and Share widget */}
              <div className="flex flex-col items-end gap-3 min-w-[200px]">
                <div className="w-full text-right font-sans text-xs font-bold text-muted">
                  Progress: <span className="text-primary">{activeSheet.solvedCount}</span> / {activeSheet.problemsCount} Solved
                  <div className="w-full h-2 bg-surface-2 border border-border/40 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${activeSheet.problemsCount > 0 ? (activeSheet.solvedCount / activeSheet.problemsCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {activeSheet.isPublic && activeSheet.shareSlug && (
                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/s/${activeSheet.shareSlug}`;
                      navigator.clipboard.writeText(shareUrl);
                      alert("Shared sheet link copied to clipboard!");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-2 hover:bg-border/20 text-muted hover:text-foreground font-sans font-bold text-[11px] cursor-pointer transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Copy Share Link
                  </button>
                )}
              </div>
            </div>

            {/* Problems in Sheet Table list */}
            <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm">
              <h3 className="font-display font-bold text-sm text-foreground mb-4">
                Saved Challenges ({activeSheet.problems?.length || 0})
              </h3>
              
              {activeSheet.problems?.length === 0 ? (
                <div className="text-center py-12 text-muted font-sans text-xs">
                  <Library className="w-12 h-12 text-muted/40 mx-auto mb-3" />
                  No problems added to this sheet yet. Go to Dashboard to add.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-border/80 text-muted font-bold tracking-wider uppercase text-[9px]">
                        <th className="pb-3.5 pl-2">Problem Name</th>
                        <th className="pb-3.5">Difficulty</th>
                        <th className="pb-3.5">Status</th>
                        <th className="pb-3.5 text-right pr-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {activeSheet.problems?.map((prob: any, idx: number) => (
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
                            <button
                              onClick={() => {
                                const updatedProblems = activeSheet.problems.filter((_: any, pIdx: number) => pIdx !== idx);
                                setSheetsList((prev) =>
                                  prev.map((s) => {
                                    if (s.id === activeSheet.id) {
                                      return { ...s, problems: updatedProblems, problemsCount: updatedProblems.length };
                                    }
                                    return s;
                                  })
                                );
                                setActiveSheet({ ...activeSheet, problems: updatedProblems, problemsCount: updatedProblems.length });
                              }}
                              className="text-rose-500 hover:underline font-semibold font-sans cursor-pointer text-xs"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* GRID VIEW OF SHEETS */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sheetsList.map((sheet) => (
              <motion.div
                key={sheet.id}
                whileHover={{ y: -4 }}
                onClick={() => setActiveSheet(sheet)}
                className="p-6 rounded-3xl bg-surface border border-border shadow-sm flex flex-col justify-between aspect-video cursor-pointer hover:border-primary/50 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-display font-extrabold text-base text-foreground group-hover:text-primary transition-colors">
                      {sheet.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleEditSheet(sheet, e)}
                        className="w-7 h-7 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-muted hover:text-primary transition-colors cursor-pointer"
                        title="Edit Sheet Details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSheet(sheet.id, e)}
                        className="w-7 h-7 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-muted hover:text-rose-500 transition-colors cursor-pointer"
                        title="Delete Sheet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="font-sans text-xs text-muted line-clamp-2">
                    {sheet.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/40 mt-4 space-y-3">
                  <div className="flex justify-between font-sans text-[10px] font-bold text-muted uppercase">
                    <span>Progress</span>
                    <span className="text-primary">{sheet.solvedCount} / {sheet.problemsCount} Solved</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-2 border border-border/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${sheet.problemsCount > 0 ? (sheet.solvedCount / sheet.problemsCount) * 100 : 0}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={(e) => toggleShareSlug(sheet.id, e)}
                      className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-all ${
                        sheet.isPublic
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                          : "bg-surface-2 border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {sheet.isPublic ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                      <span>{sheet.isPublic ? "Public (Copy Link)" : "Private"}</span>
                    </button>

                    <span className="text-[10px] text-primary hover:underline font-bold font-sans">
                      Open Sheet &rarr;
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </main>

      {/* CREATE/EDIT SHEET FORM MODAL */}
      <AnimatePresence>
        {isAddSheetOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-surface border border-border shadow-2xl overflow-visible"
            >
              <div className="p-6 border-b border-border/80 flex items-center justify-between">
                <h2 className="font-display font-extrabold text-lg text-foreground">
                  {editingSheetId ? "Edit Practice Sheet" : "Create Practice Sheet"}
                </h2>
                <button
                  onClick={() => setIsAddSheetOpen(false)}
                  className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-muted hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleSaveSheet} className="p-6 space-y-4 font-sans text-xs">
                
                <div>
                  <label className="block font-semibold text-muted mb-2 uppercase tracking-wide">
                    Sheet Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Blind 75"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-foreground font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-muted mb-2 uppercase tracking-wide">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the topics covered in this sheet..."
                    value={sheetDesc}
                    onChange={(e) => setSheetDesc(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-foreground resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-2/40">
                  <div className="space-y-0.5">
                    <span className="block font-bold text-foreground">Make Sheet Public</span>
                    <span className="text-[10px] text-muted">Anyone with the link can view this sheet.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={sheetPublic}
                    onChange={(e) => setSheetPublic(e.target.checked)}
                    className="w-4.5 h-4.5 accent-primary cursor-pointer"
                  />
                </div>

                <div className="pt-4 border-t border-border/80 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddSheetOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border hover:bg-surface-2 text-foreground font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold cursor-pointer transition-all shadow-md shadow-primary/10"
                  >
                    {editingSheetId ? "Save Changes" : "Create Sheet"}
                  </button>
                </div>

              </form>
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
