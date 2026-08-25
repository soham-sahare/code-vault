"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/shell/Sidebar";
import { Search, Bell, Library, Plus, Trash2, Edit, ExternalLink, Share2, Globe, Lock, ArrowLeft, Sun, Moon, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import Link from "next/link";
import { getSheets, createSheet, updateSheet, deleteSheet, removeProblemFromSheet, getUserProblemSummaries, addProblemToSheet, addProblemsToSheet, getUserProfile } from "@/lib/actions";
import NotificationBell from "@/components/notifications/NotificationBell";
import { getInitials } from "@/lib/utils/formatters";


export default function SheetsPage() {
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "info" | "error" }[]>([]);
  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };
  const [sheetsList, setSheetsList] = useState<any[]>([]);
  const [activeSheet, setActiveSheet] = useState<any>(null);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [sheetSearchQuery, setSheetSearchQuery] = useState("");
  const [confirmDeleteSheet, setConfirmDeleteSheet] = useState<any | null>(null);

  // Form states
  const [sheetName, setSheetName] = useState("");
  const [sheetDesc, setSheetDesc] = useState("");
  const [sheetPublic, setSheetPublic] = useState(false);

  // Topbar states
  const { resolvedTheme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isBellDropdownOpen, setIsBellDropdownOpen] = useState(false);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  useEffect(() => {
    async function fetchUser() {
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    }
    fetchUser();
  }, []);

  const [isAddProblemModalOpen, setIsAddProblemModalOpen] = useState(false);
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
  const [allProblems, setAllProblems] = useState<any[]>([]);
  const [probSearchQuery, setProbSearchQuery] = useState("");

  const loadAllProblems = async () => {
    try {
      const data = await getUserProblemSummaries();
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
      } else {
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const sheetIdParam = params.get("s");
          if (sheetIdParam) {
            const matched = data.find((s: any) => s.id === sheetIdParam);
            if (matched) {
              setActiveSheet(matched);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to load sheets:", err);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (activeSheet) {
        if (params.get("s") !== activeSheet.id) {
          params.set("s", activeSheet.id);
          window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
        }
      } else {
        if (params.has("s")) {
          params.delete("s");
          const search = params.toString();
          const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
          window.history.replaceState({}, "", newUrl);
        }
      }
    }
  }, [activeSheet]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadSheets(), loadAllProblems()]);
      setLoading(false);
    }
    init();
  }, []);

  const handleSaveSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetName.trim()) return;

    const name = sheetName.trim();
    const desc = sheetDesc.trim();
    const isPub = sheetPublic;
    const editingId = editingSheetId;

    // Reset modal state immediately
    setIsAddSheetOpen(false);
    setSheetName("");
    setSheetDesc("");
    setSheetPublic(false);
    setEditingSheetId(null);
    showToast(editingId ? "Sheet updated successfully!" : "Sheet created successfully!", "success");

    try {
      if (editingId) {
        await updateSheet(editingId, name, desc, isPub);
      } else {
        await createSheet(name, desc, isPub);
      }
      await loadSheets();
    } catch (err) {
      console.error("Error saving sheet:", err);
      showToast("Failed to save sheet", "error");
      await loadSheets();
    }
  };

  const handleDeleteSheet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic UI update
    setSheetsList((prev) => prev.filter((s) => s.id !== id));
    if (activeSheet && activeSheet.id === id) {
      setActiveSheet(null);
    }
    showToast("Sheet deleted", "success");

    try {
      await deleteSheet(id);
    } catch (err) {
      console.error("Error deleting sheet:", err);
      showToast("Failed to delete sheet", "error");
      await loadSheets();
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
    const nextPub = !sheet.isPublic;
    // Optimistic update
    setSheetsList((prev) => prev.map((s) => s.id === sheet.id ? { ...s, isPublic: nextPub } : s));
    if (activeSheet && activeSheet.id === sheet.id) {
      setActiveSheet({ ...activeSheet, isPublic: nextPub });
    }
    showToast(nextPub ? "Public sharing enabled" : "Public sharing disabled", "info");

    try {
      await updateSheet(sheet.id, sheet.name, sheet.description || "", nextPub);
      await loadSheets();
    } catch (err) {
      console.error("Error toggling share status:", err);
      showToast("Failed to update sharing", "error");
      await loadSheets();
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

  const filteredSheets = sheetsList.filter((sheet) => {
    if (!sheetSearchQuery.trim()) return true;
    const q = sheetSearchQuery.toLowerCase();
    return (
      sheet.name.toLowerCase().includes(q) ||
      (sheet.description && sheet.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">

      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 overflow-y-auto max-w-7xl mx-auto w-full">

        {/* Top Header Bar */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground flex items-center gap-2.5">
                <Library className="w-8 h-8 text-primary" />
                Practice Sheets
              </h1>
              <p className="font-sans text-xs text-muted mt-1">Organize and track curated sets of coding challenges</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle Icon */}
              {themeMounted && (
                <button
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title={resolvedTheme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
                >
                  {resolvedTheme === "dark" ? <Sun className="w-4.5 h-4.5 text-accent" /> : <Moon className="w-4.5 h-4.5 text-primary" />}
                </button>
              )}

              {/* Notification Bell */}
              <NotificationBell />

              {/* User Avatar Circle with Initials & Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-extrabold text-xs text-primary hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm select-none"
                >
                  {getInitials(userProfile)}
                </button>

                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2.5 w-48 bg-surface border border-border rounded-2xl shadow-2xl z-50 p-2 font-sans text-xs flex flex-col gap-1"
                      >
                        <span className="px-3 py-2 text-muted font-bold text-[10px] uppercase tracking-wide border-b border-border/40 mb-1">
                          Options
                        </span>
                        <Link
                          href="/settings"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="px-3 py-2.5 rounded-xl hover:bg-surface-2 text-foreground font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          Profile Settings
                        </Link>
                        <Link
                          href="/login"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="px-3 py-2.5 rounded-xl hover:bg-rose-500/10 text-rose-500 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          Log out
                        </Link>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Search bar & New Sheet row below the main header */}
          {!activeSheet && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search sheets..."
                  value={sheetSearchQuery}
                  onChange={(e) => setSheetSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none font-sans text-xs text-foreground placeholder:text-muted/65 transition-all"
                />
                {sheetSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSheetSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-border/20 transition-all cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setEditingSheetId(null);
                  setSheetName("");
                  setSheetDesc("");
                  setSheetPublic(false);
                  setIsAddSheetOpen(true);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-sans font-bold text-xs cursor-pointer transition-colors shadow-md shadow-primary/10 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                New Sheet
              </motion.button>
            </div>
          )}
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

              {/* Problems Count and Share widget */}
              <div className="flex flex-col items-end gap-3 min-w-[200px]">
                <div className="w-full text-right font-sans text-xs font-bold text-muted">
                  Problems: <span className="text-primary">{activeProblemsCount}</span>
                </div>

                {activeSheet.isPublic && activeSheet.shareSlug && (
                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/sheet/${activeSheet.shareSlug}`;
                      navigator.clipboard.writeText(shareUrl);
                      showToast("Shared sheet link copied to clipboard!");
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
                    setSelectedProblemIds([]);
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
                  No problems added to this sheet yet.
                </div>
              ) : (
                <div className="overflow-x-auto mt-4">
                  <table className="min-w-[600px] w-full border-collapse text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-border/80 text-muted font-bold tracking-wider uppercase text-[9px]">
                        <th className="pb-3.5 pl-2">Problem Name</th>
                        <th className="pb-3.5">Difficulty</th>
                        <th className="pb-3.5">Status</th>
                        <th className="pb-3.5 text-right pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {activeSheet.problems.map((prob: any, idx: number) => {
                        const p = prob.problem;
                        return (
                          <tr 
                            key={idx} 
                            className="hover:bg-surface-2/30 transition-all duration-150"
                          >
                            <td className="py-3.5 pl-2 font-display font-bold text-foreground">
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
                            <td className="py-3.5 text-right pr-2">
                              <div className="flex items-center justify-end gap-2">
                                <a
                                  href={p.url || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-8 h-8 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-center justify-center text-amber-500 hover:bg-amber-500/10 transition-all cursor-pointer"
                                  title="View Problem Source"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await removeProblemFromSheet(activeSheet.id, p.id);
                                      await loadSheets();
                                      showToast("Problem removed from sheet", "success");
                                    } catch (err) {
                                      console.error("Error removing problem:", err);
                                      showToast("Failed to remove problem", "error");
                                    }
                                  }}
                                  className="w-8 h-8 rounded-lg bg-rose-500/5 border border-rose-500/20 flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                                  title="Remove from Sheet"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
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
            {filteredSheets.map((sheet) => {
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteSheet(sheet);
                          }}
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
                        className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-all ${sheet.isPublic
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

              {/* Search Bar & Bulk Actions */}
              <div className="p-4 border-b border-border/40 bg-surface-2/20 space-y-3">
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

                  if (filtered.length === 0) return null;

                  const selectedSet = new Set(selectedProblemIds);
                  const isAllSelected = filtered.length > 0 && filtered.every((p: any) => selectedSet.has(p.id));

                  return (
                    <div className="flex items-center justify-between font-sans text-[11px] font-bold text-muted px-1.5 select-none">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={() => {
                            if (isAllSelected) {
                              const filteredSet = new Set(filtered.map((p: any) => p.id));
                              setSelectedProblemIds(prev => prev.filter(id => !filteredSet.has(id)));
                            } else {
                              setSelectedProblemIds(prev => {
                                const union = new Set([...prev, ...filtered.map((p: any) => p.id)]);
                                return Array.from(union);
                              });
                            }
                          }}
                          className="w-3.5 h-3.5 accent-primary cursor-pointer rounded"
                        />
                        <span>Select All ({filtered.length} shown)</span>
                      </label>
                      {selectedProblemIds.length > 0 && (
                        <span>{selectedProblemIds.length} selected</span>
                      )}
                    </div>
                  );
                })()}
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

                  return filtered.map((p: any) => {
                    const isChecked = selectedProblemIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl border border-border/80 bg-surface-2/20 hover:border-primary/30 flex items-center justify-between gap-4 transition-all"
                      >
                        <div className="flex items-center gap-3 text-xs">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedProblemIds(prev => prev.filter(id => id !== p.id));
                              } else {
                                setSelectedProblemIds(prev => [...prev, p.id]);
                              }
                            }}
                            className="w-4 h-4 accent-primary cursor-pointer rounded shrink-0"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display font-extrabold text-foreground">
                                {p.name}
                              </span>
                              <span className={`font-display font-bold text-[9px] px-1.5 py-0.5 rounded ${p.difficulty === "EASY" ? "text-emerald-500 bg-emerald-500/10" : p.difficulty === "HARD" ? "text-rose-500 bg-rose-500/10" : "text-amber-500 bg-amber-500/10"
                                }`}>
                                {p.difficulty}
                              </span>
                            </div>
                            <p className="font-sans text-[10px] text-muted">Topic: {p.topic}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await addProblemToSheet(activeSheet.id, p.id);
                              await loadSheets();
                              const updatedSheets = await getSheets();
                              const currentSheet = updatedSheets.find((s: any) => s.id === activeSheet.id);
                              if (currentSheet) setActiveSheet(currentSheet);
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white font-sans font-bold text-[10px] cursor-pointer transition-colors shrink-0 shadow-sm"
                        >
                          Quick Add
                        </button>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border bg-surface-2/40 flex justify-between items-center">
                <div>
                  {selectedProblemIds.length > 0 && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await addProblemsToSheet(activeSheet.id, selectedProblemIds);
                          setSelectedProblemIds([]);
                          await loadSheets();
                          const updatedSheets = await getSheets();
                          const currentSheet = updatedSheets.find((s: any) => s.id === activeSheet.id);
                          if (currentSheet) setActiveSheet(currentSheet);
                          showToast("Problems added to sheet!", "success");
                        } catch (err) {
                          console.error("Bulk add error:", err);
                          showToast("Failed to add problems", "error");
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/95 text-white font-sans font-bold text-xs cursor-pointer transition-colors shadow-md shadow-primary/10"
                    >
                      Add Selected ({selectedProblemIds.length})
                    </button>
                  )}
                </div>
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

        {confirmDeleteSheet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-surface border border-border shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-foreground">Delete Sheet?</h3>
                  <p className="font-sans text-xs text-muted mt-0.5">Are you sure you want to delete <span className="font-bold text-foreground">{confirmDeleteSheet.name}</span>? This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteSheet(null)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-surface-2 text-foreground font-bold font-sans text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = confirmDeleteSheet.id;
                    setConfirmDeleteSheet(null);
                    try {
                      await deleteSheet(id);
                      await loadSheets();
                      if (activeSheet && activeSheet.id === id) {
                        setActiveSheet(null);
                      }
                      showToast("Practice sheet deleted successfully!", "success");
                    } catch (err: any) {
                      console.error("Error deleting sheet:", err);
                      showToast(err.message || "Failed to delete sheet", "error");
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-500/90 text-white font-bold font-sans text-xs cursor-pointer transition-all shadow-md shadow-rose-500/10"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== PREMIUM TOAST NOTIFICATION CONTAINER ===== */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.15 } }}
              className={`p-4 rounded-xl shadow-xl flex items-center gap-3 border pointer-events-auto ${toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : toast.type === "error"
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  : "bg-surface border-border text-foreground"
                }`}
            >
              {toast.type === "success" && <Check className="w-4 h-4 shrink-0 text-emerald-400" />}
              {toast.type === "error" && <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
              <span className="font-sans font-bold text-xs">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
