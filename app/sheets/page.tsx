"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/shell/Sidebar";
import { Search, Bell, Library, Plus, Trash2, Edit, ExternalLink, Share2, Globe, Lock, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSheets, createSheet, updateSheet, deleteSheet, removeProblemFromSheet, getProblems, addProblemToSheet } from "@/lib/actions";

export default function SheetsPage() {
  const [loading, setLoading] = useState(true);
  const [sheetsList, setSheetsList] = useState<any[]>([]);
  const [activeSheet, setActiveSheet] = useState<any>(null);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);

  // Form states
  const [sheetName, setSheetName] = useState("");
  const [sheetDesc, setSheetDesc] = useState("");
  const [sheetPublic, setSheetPublic] = useState(false);

  // Add problem modal states
  const [isAddProblemModalOpen, setIsAddProblemModalOpen] = useState(false);
  const [allProblems, setAllProblems] = useState<any[]>([]);
  const [probSearchQuery, setProbSearchQuery] = useState("");

  const loadAllProblems = async () => {
    try {
      const data = await getProblems();
      setAllProblems(data);
    } catch (err) {
      console.error("Failed to load problems:", err);
    }
  };

  const loadSheets = async () => {
    try {
      const data = await getSheets();
      setSheetsList(data);
      if (activeSheet) {
        const updatedActive = data.find((s: any) => s.id === activeSheet.id);
        setActiveSheet(updatedActive || null);
      }
    } catch (err) {
      console.error("Failed to load sheets:", err);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadSheets();
      setLoading(false);
    }
    init();
  }, []);

  const handleSaveSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetName) return;

    try {
      if (editingSheetId) {
        await updateSheet(editingSheetId, sheetName, sheetDesc, sheetPublic);
      } else {
        await createSheet(sheetName, sheetDesc, sheetPublic);
      }
      await loadSheets();
      
      // Reset fields
      setIsAddSheetOpen(false);
      setSheetName("");
      setSheetDesc("");
      setSheetPublic(false);
      setEditingSheetId(null);
    } catch (err) {
      console.error("Error saving sheet:", err);
    }
  };

  const handleDeleteSheet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteSheet(id);
      await loadSheets();
      if (activeSheet && activeSheet.id === id) {
        setActiveSheet(null);
      }
    } catch (err) {
      console.error("Error deleting sheet:", err);
    }
  };

  const handleEditSheet = (sheet: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSheetId(sheet.id);
    setSheetName(sheet.name);
    setSheetDesc(sheet.description || "");
    setSheetPublic(sheet.isPublic);
    setIsAddSheetOpen(true);
  };

  const toggleShareSlug = async (sheet: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateSheet(sheet.id, sheet.name, sheet.description || "", !sheet.isPublic);
      await loadSheets();
    } catch (err) {
      console.error("Error toggling share status:", err);
    }
  };

  const activeProblemsCount = activeSheet?.problems?.length || 0;
  const activeSolvedCount = activeSheet?.problems?.filter((p: any) => p.problem.status === "Solved").length || 0;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="font-sans font-semibold text-xs text-muted">Retrieving practice sheets...</span>
          </div>
        </main>
      </div>
    );
  }

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
                  Progress: <span className="text-primary">{activeSolvedCount}</span> / {activeProblemsCount} Solved
                  <div className="w-full h-2 bg-surface-2 border border-border/40 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${activeProblemsCount > 0 ? (activeSolvedCount / activeProblemsCount) * 100 : 0}%` }}
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
              <div className="flex items-center justify-between mb-4 gap-4">
                <h3 className="font-display font-bold text-sm text-foreground">
                  Saved Challenges ({activeProblemsCount})
                </h3>
                <button
                  type="button"
                  onClick={async () => {
                    await loadAllProblems();
                    setIsAddProblemModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-sans font-bold text-[11px] cursor-pointer transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Problems
                </button>
              </div>
              
              {activeProblemsCount === 0 ? (
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
                      {activeSheet.problems?.map((prob: any, idx: number) => {
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
                              <button
                                onClick={async () => {
                                  await removeProblemFromSheet(activeSheet.id, p.id);
                                  await loadSheets();
                                }}
                                className="text-rose-500 hover:underline font-semibold font-sans cursor-pointer text-xs"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* GRID VIEW OF SHEETS */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sheetsList.map((sheet) => {
              const problemsCount = sheet.problems?.length || 0;
              const solvedCount = sheet.problems?.filter((p: any) => p.problem.status === "Solved").length || 0;

              return (
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
                      <span className="text-primary">{solvedCount} / {problemsCount} Solved</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-2 border border-border/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${problemsCount > 0 ? (solvedCount / problemsCount) * 100 : 0}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={(e) => toggleShareSlug(sheet, e)}
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
              );
            })}
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

        {/* ADD PROBLEMS TO SHEET MODAL */}
        {isAddProblemModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddProblemModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-lg bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Modal Header */}
              <div className="p-6 pb-4 border-b border-border/80 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-extrabold text-lg text-foreground">
                    Add Problems to Sheet
                  </h3>
                  <p className="font-sans text-[11px] text-muted mt-0.5">Select problems from your dashboard to add to {activeSheet?.name}</p>
                </div>
                <button
                  onClick={() => setIsAddProblemModalOpen(false)}
                  className="p-1 rounded-lg border border-border bg-surface-2 hover:bg-border/20 text-muted hover:text-foreground cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-border/40 bg-surface-2/20">
                <div className="relative font-sans text-xs">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by problem name or topic..."
                    value={probSearchQuery}
                    onChange={(e) => setProbSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-foreground font-semibold placeholder:text-muted/60"
                  />
                </div>
              </div>

              {/* Problems List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 min-h-[250px]">
                {(() => {
                  const alreadyAddedIds = new Set(activeSheet?.problems?.map((p: any) => p.problem.id) || []);
                  const filtered = allProblems.filter((p: any) => {
                    if (alreadyAddedIds.has(p.id)) return false;
                    if (probSearchQuery.trim()) {
                      const q = probSearchQuery.toLowerCase();
                      return p.name.toLowerCase().includes(q) || p.topic.toLowerCase().includes(q);
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-muted font-sans text-xs">
                        <Library className="w-10 h-10 text-muted/30 mb-2" />
                        <p className="font-semibold text-foreground/80">No problems available to add</p>
                        <p className="text-[10px] mt-0.5 text-muted/80">Either all problems are already in this sheet, or none match your search.</p>
                      </div>
                    );
                  }

                  return filtered.map((p: any) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-2xl border border-border/80 bg-surface-2/20 hover:border-primary/30 flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-extrabold text-foreground">
                            #{p.num} {p.name}
                          </span>
                          <span className={`font-display font-bold text-[9px] px-1.5 py-0.5 rounded ${
                            p.difficulty === "EASY" ? "text-emerald-500 bg-emerald-500/10" : p.difficulty === "HARD" ? "text-rose-500 bg-rose-500/10" : "text-amber-500 bg-amber-500/10"
                          }`}>
                            {p.difficulty}
                          </span>
                        </div>
                        <p className="font-sans text-[10px] text-muted">Topic: {p.topic}</p>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await addProblemToSheet(activeSheet.id, p.id);
                            await loadSheets();
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-sans font-bold text-[10px] cursor-pointer transition-colors shrink-0 shadow-sm"
                      >
                        Add
                      </button>
                    </div>
                  ));
                })()}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border bg-surface-2/40 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddProblemModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-surface hover:bg-surface-2 text-foreground font-bold text-xs cursor-pointer transition-colors"
                >
                  Done
                </button>
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
