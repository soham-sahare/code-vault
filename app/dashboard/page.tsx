"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/shell/Sidebar";
import { Search, Bell, Star, AlertCircle, AlertTriangle, Clock, CheckCircle2, ChevronRight, Filter, X, ExternalLink, Share2, Plus, Code, PlusCircle, Check, Copy, Sun, Moon, Pencil, Trash2, FileText, Globe, Lock, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
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
import { getProblems, createProblem, updateProblem, deleteProblem, toggleFavorite, addSolution, deleteSolution, updateSolution, addNote, updateNote, deleteNote, markRevisited, getUserProfile, addSolutionNote, deleteSolutionNote, updateSolutionNote } from "@/lib/actions";

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

function getCodePlaceholder(lang: string): string {
  const l = lang.toLowerCase();
  if (l === "python") return `class Solution:\n    def solve(self, nums: List[int]) -> int:\n        # your logic here\n        pass`;
  if (l === "c++") return `class Solution {\npublic:\n    int solve(vector<int>& nums) {\n        // your logic here\n        return 0;\n    }\n};`;
  if (l === "java") return `class Solution {\n    public int solve(int[] nums) {\n        // your logic here\n        return 0;\n    }\n}`;
  if (l === "javascript" || l === "js") return `var solve = function(nums) {\n    // your logic here\n    return 0;\n};`;
  if (l === "typescript" || l === "ts") return `function solve(nums: number[]): number {\n    // your logic here\n    return 0;\n}`;
  if (l === "go") return `func solve(nums []int) int {\n    // your logic here\n    return 0\n}`;
  if (l === "rust") return `impl Solution {\n    pub fn solve(nums: Vec<i32>) -> i32 {\n        // your logic here\n        0\n    }\n}`;
  return `// Write your ${lang} solution here`;
}

interface Problem {
  id: string;
  userId: string;
  num: number;
  name: string;
  difficulty: string;
  diffColor: string;
  topic: string;
  status: string;
  statusColor: string;
  interval: string;
  url: string;
  isFavorite: boolean;
  isPublic?: boolean;
  solutions: any[];
  notes: any[];
  history?: any[];
}

export default function DashboardPage() {
  // State for problems so they are mutable locally
  const [problemsList, setProblemsList] = useState<Problem[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isBellDropdownOpen, setIsBellDropdownOpen] = useState(false);
  const [showRevisitDaysPopup, setShowRevisitDaysPopup] = useState(false);
  const [customRevisitDays, setCustomRevisitDays] = useState("3");

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

  const getInitials = () => {
    const name = userProfile?.name || userProfile?.username || userProfile?.email || "User";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (name.length >= 2) {
      return name.substring(0, 2).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Modal State Hooks
  const [activeProblem, setActiveProblem] = useState<null | any>(null);
  const [isAddProblemOpen, setIsAddProblemOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"solutions" | "notes" | "history">("solutions");

  // Custom states inside modals
  const [selSolIdx, setSelSolIdx] = useState(0);
  const [newNoteText, setNewNoteText] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "info" | "error" }[]>([]);
  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Note editing states
  const [editingNoteIdx, setEditingNoteIdx] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [editingSolNoteIdx, setEditingSolNoteIdx] = useState<number | null>(null);
  const [editingSolNoteText, setEditingSolNoteText] = useState("");
  const [editingSolNoteSolIdx, setEditingSolNoteSolIdx] = useState<number | null>(null);

  // States for search and filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDiff, setFilterDiff] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [filterPresets, setFilterPresets] = useState([
    { name: "All Problems", diff: "ALL", status: "ALL" },
    { name: "Due for Revisit", diff: "ALL", status: "Due Today" },
    { name: "Overdue Challenges", diff: "ALL", status: "Overdue" },
    { name: "Hard DSA Problems", diff: "HARD", status: "ALL" }
  ]);
  const [isPresetsDropdownOpen, setIsPresetsDropdownOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterDiff, filterStatus, rowsPerPage]);

  // Form input hooks for simulated problem adding
  const [addName, setAddName] = useState("");
  const [addNum, setAddNum] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addDiff, setAddDiff] = useState("EASY");
  const [addIsPublic, setAddIsPublic] = useState(false);

  // Custom dropdown & pill tags selector states
  const [isDiffDropdownOpen, setIsDiffDropdownOpen] = useState(false);
  const [predefinedTopics, setPredefinedTopics] = useState([
    "Array", "Two Pointers", "Hash Table", "Stack", "Sliding Window", "Dynamic Programming", "Trees", "Graphs"
  ]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopicInput, setCustomTopicInput] = useState("");

  // States for adding a new solution dynamically
  const [isAddingSol, setIsAddingSol] = useState(false);
  const [newSolName, setNewSolName] = useState("");
  const [newSolLang, setNewSolLang] = useState("Python");
  const [newSolIntuition, setNewSolIntuition] = useState("");
  const [newSolApproach, setNewSolApproach] = useState("");
  const [newSolTime, setNewSolTime] = useState("O(N)");
  const [newSolSpace, setNewSolSpace] = useState("O(1)");
  const [newSolCode, setNewSolCode] = useState("");
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isSpaceDropdownOpen, setIsSpaceDropdownOpen] = useState(false);
  const [editingSolIdx, setEditingSolIdx] = useState<number | null>(null);
  // Solution-level note input states
  const [newSolNoteText, setNewSolNoteText] = useState("");
  const [newSolNoteType, setNewSolNoteType] = useState<"mistake" | "warning" | "success" | "note">("note");
  // Onboarding default language prompt states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [defaultLanguage, setDefaultLanguage] = useState("Python");
  const [isDefaultLangDropdownOpen, setIsDefaultLangDropdownOpen] = useState(false);
  const [editingProblemNum, setEditingProblemNum] = useState<number | null>(null);

  // Confirm delete modals
  const [confirmDeleteProblemNum, setConfirmDeleteProblemNum] = useState<number | null>(null);
  const [confirmDeleteSolIdx, setConfirmDeleteSolIdx] = useState<number | null>(null);

  // Theme
  const { setTheme, resolvedTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  useEffect(() => { setThemeMounted(true); }, []);

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem("hasCompletedOnboarding") === "true";
    if (!onboardingCompleted) {
      setShowOnboarding(true);
    } else {
      const storedLang = localStorage.getItem("defaultLanguage") || "Python";
      setDefaultLanguage(storedLang);
      setNewSolLang(storedLang);
    }
  }, []);

  const [loading, setLoading] = useState(true);

  const loadProblems = async () => {
    try {
      const data = await getProblems();
      setProblemsList(data);
      if (activeProblem) {
        const updatedActive = data.find((p: any) => p.id === activeProblem.id);
        setActiveProblem(updatedActive || null);
      }
    } catch (err) {
      console.error("Failed to load problems:", err);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadProblems();
      setLoading(false);
    }
    init();
  }, [activeProblem?.id]);

  const handleSaveOnboarding = () => {
    localStorage.setItem("hasCompletedOnboarding", "true");
    localStorage.setItem("defaultLanguage", defaultLanguage);
    setNewSolLang(defaultLanguage);
    setShowOnboarding(false);
    showToast("Default language saved!", "success");
  };



  const handleSaveSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSolName || !newSolCode) return;

    try {
      if (editingSolIdx !== null) {
        const sol = activeProblem.solutions[editingSolIdx];
        await updateSolution(sol.id, {
          name: newSolName,
          lang: newSolLang,
          intuition: newSolIntuition || "Optimal approach.",
          approach: newSolApproach || "Standard implementation.",
          time: newSolTime,
          space: newSolSpace,
          code: newSolCode,
          tags: []
        });
      } else {
        await addSolution(activeProblem.id, {
          name: newSolName,
          lang: newSolLang,
          intuition: newSolIntuition || "Optimal approach.",
          approach: newSolApproach || "Standard implementation.",
          time: newSolTime,
          space: newSolSpace,
          code: newSolCode,
          tags: [],
          notes: []
        });
      }

      await loadProblems();

      showToast(editingSolIdx !== null ? "Solution updated successfully!" : "Solution added successfully!", "success");

      // Reset inputs
      setIsAddingSol(false);
      setEditingSolIdx(null);
      setNewSolName("");
      setNewSolLang(defaultLanguage);
      setNewSolIntuition("");
      setNewSolApproach("");
      setNewSolCode("");
      setNewSolTime("O(N)");
      setNewSolSpace("O(1)");
    } catch (err) {
      console.error(err);
      showToast("Error saving solution", "error");
    }
  };

  // Handler for simulated revisited
  const handleMarkRevisited = async (num: number, customDays?: number) => {
    if (activeProblem?.interval?.includes("30d") && customDays === undefined && !showRevisitDaysPopup) {
      setShowRevisitDaysPopup(true);
      return;
    }

    try {
      await markRevisited(num, customDays);
      await loadProblems();
      setActiveProblem(null);
      setShowRevisitDaysPopup(false);
      showToast("Problem marked as revisited!", "success");
    } catch (err) {
      console.error(err);
      showToast("Error marking revisit", "error");
    }
  };

  // Handler for adding/editing problem simulated
  const handleAddProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName) return;

    const finalTopic = selectedTopics.length > 0 ? selectedTopics.join(", ") : "General DSA";

    try {
      if (editingProblemNum !== null) {
        await updateProblem(editingProblemNum, {
          name: addName,
          difficulty: addDiff,
          topic: finalTopic,
          url: addUrl || "#",
          isPublic: addIsPublic
        });
        showToast("Problem updated successfully!", "success");
      } else {
        await createProblem({
          name: addName,
          difficulty: addDiff,
          topic: finalTopic,
          url: addUrl || "#",
          isPublic: addIsPublic
        });
        showToast("Problem created successfully!", "success");
      }

      await loadProblems();
      setEditingProblemNum(null);
      setIsAddProblemOpen(false);

      // Reset inputs
      setAddName("");
      setAddNum("");
      setAddUrl("");
      setSelectedTopics([]);
      setAddDiff("EASY");
      setAddIsPublic(false);
    } catch (err) {
      console.error(err);
      showToast("Error saving problem", "error");
    }
  };
  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    showToast("Code copied to clipboard!", "success");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredProblems = problemsList.filter((prob) => {
    const matchesSearch =
      prob.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prob.num.toString().includes(searchQuery) ||
      prob.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff = filterDiff === "ALL" || prob.difficulty === filterDiff;
    const matchesStatus = filterStatus === "ALL" || prob.status === filterStatus;
    return matchesSearch && matchesDiff && matchesStatus;
  });

  const totalProblemsCount = filteredProblems.length;
  const totalPages = Math.ceil(totalProblemsCount / rowsPerPage);
  const paginatedProblems = filteredProblems.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">

      {/* Sidebar Menu */}
      <Sidebar />

      {/* Main content body */}
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 overflow-y-auto max-w-7xl mx-auto w-full">

        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground">
              Overview
            </h1>
            <p className="font-sans text-xs text-muted mt-1">Welcome to your dashboard</p>
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
            <div className="relative">
              <button 
                onClick={() => setIsBellDropdownOpen(!isBellDropdownOpen)}
                className="relative w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {problemsList.some((p) => p.status === "Due Today" || p.status === "Overdue") && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-surface" />
                )}
              </button>

              <AnimatePresence>
                {isBellDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsBellDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2.5 w-80 bg-surface border border-border rounded-2xl shadow-2xl z-50 p-4 font-sans text-xs space-y-3.5 max-h-[400px] overflow-y-auto"
                    >
                      <h4 className="font-display font-extrabold text-sm text-foreground pb-2 border-b border-border/80 flex items-center justify-between">
                        <span>Revisit Reminders</span>
                        <span className="text-[10px] font-sans font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {problemsList.filter((p) => p.status === "Due Today" || p.status === "Overdue").length} Due
                        </span>
                      </h4>

                      <div className="space-y-2">
                        {(() => {
                          const dueList = problemsList.filter((p) => p.status === "Due Today" || p.status === "Overdue");
                          if (dueList.length === 0) {
                            return (
                              <p className="text-center font-sans text-xs text-muted py-6">All caught up! No reminders for today.</p>
                            );
                          }
                          return dueList.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setActiveProblem(p);
                                setIsBellDropdownOpen(false);
                              }}
                              className="w-full text-left p-2.5 rounded-xl border border-border/60 bg-surface-2/30 hover:bg-surface-2 transition-all flex items-start gap-2.5 cursor-pointer"
                            >
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${p.status === "Overdue" ? "bg-rose-500" : "bg-amber-500"}`} />
                              <div className="space-y-0.5 flex-1 min-w-0">
                                <h5 className="font-display font-bold text-foreground truncate">#{p.num} {p.name}</h5>
                                <div className="flex items-center gap-2 text-[10px] text-muted font-semibold">
                                  <span className={p.difficulty === "EASY" ? "text-emerald-500" : p.difficulty === "MED" ? "text-amber-500" : "text-rose-500"}>{p.difficulty}</span>
                                  <span>•</span>
                                  <span>{p.topic}</span>
                                </div>
                              </div>
                            </button>
                          ));
                        })()}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* User Avatar Circle with Initials & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-extrabold text-xs text-primary hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm select-none"
              >
                {getInitials()}
              </button>

              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 mt-2 z-50 w-44 bg-surface border border-border rounded-xl shadow-xl overflow-hidden font-semibold font-sans text-xs"
                    >
                      <div className="px-4 py-2.5 border-b border-border bg-surface-2/40 text-muted/80 text-[10px] uppercase tracking-wider truncate">
                        {userProfile?.name || userProfile?.username || "Account"}
                      </div>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-4 py-2.5 text-foreground hover:bg-surface-2 hover:text-primary transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        Profile Settings
                      </Link>
                      <Link
                        href="/login"
                        className="flex items-center gap-2 px-4 py-2.5 text-rose-500 hover:bg-rose-500/5 transition-colors border-t border-border"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        Logout
                      </Link>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 3. PROBLEMS TABLE (Spectra Invoices table Mockup) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="p-6 rounded-3xl bg-surface border border-border shadow-sm"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 relative z-30">
            {/* Search Bar on the left */}
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none font-sans text-xs text-foreground placeholder:text-muted/60 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">

              {/* Filter Dropdown Toggle */}
              <div className="relative">
                <button
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-sans font-bold text-xs cursor-pointer transition-all shadow-sm ${isFilterDropdownOpen || filterDiff !== "ALL" || filterStatus !== "ALL"
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-surface-2 border-border hover:bg-border/20 text-foreground"
                    }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter</span>
                  {(filterDiff !== "ALL" || filterStatus !== "ALL") && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>

                <AnimatePresence>
                  {isFilterDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsFilterDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 mt-2 z-20 w-56 bg-surface border border-border rounded-xl shadow-xl p-4 font-sans text-xs space-y-3"
                      >
                        <div>
                          <span className="block font-semibold text-muted mb-1.5 uppercase tracking-wide text-[9px]">Difficulty</span>
                          <div className="flex flex-wrap gap-1.5">
                            {["ALL", "EASY", "MED", "HARD"].map((diff) => (
                              <button
                                key={diff}
                                onClick={() => setFilterDiff(diff)}
                                className={`px-2 py-1 rounded-lg border font-bold text-[9px] cursor-pointer transition-all ${filterDiff === diff
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "bg-surface-2 border-border text-muted hover:text-foreground"
                                  }`}
                              >
                                {diff}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-border/40">
                          <span className="block font-semibold text-muted mb-1.5 uppercase tracking-wide text-[9px]">Status</span>
                          <div className="flex flex-wrap gap-1.5">
                            {["ALL", "Solved", "Due Today", "Overdue"].map((status) => (
                              <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-2 py-1 rounded-lg border font-bold text-[9px] cursor-pointer transition-all ${filterStatus === status
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "bg-surface-2 border-border text-muted hover:text-foreground"
                                  }`}
                              >
                                {status === "ALL" ? "ALL" : status}
                              </button>
                            ))}
                          </div>
                        </div>

                        {(filterDiff !== "ALL" || filterStatus !== "ALL" || searchQuery !== "") && (
                          <div className="pt-2 border-t border-border/40 flex justify-end">
                            <button
                              onClick={() => {
                                setFilterDiff("ALL");
                                setFilterStatus("ALL");
                                setSearchQuery("");
                              }}
                              className="text-[9px] font-bold text-rose-500 hover:underline cursor-pointer"
                            >
                              Reset filters
                            </button>
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Presets Dropdown Toggle */}
              <div className="relative">
                <button
                  onClick={() => setIsPresetsDropdownOpen(!isPresetsDropdownOpen)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-sans font-bold text-xs cursor-pointer transition-all shadow-sm ${isPresetsDropdownOpen
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-surface-2 border-border hover:bg-border/20 text-foreground"
                    }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Presets</span>
                </button>

                <AnimatePresence>
                  {isPresetsDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsPresetsDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 mt-2 z-20 w-60 bg-surface border border-border rounded-xl shadow-xl p-4 font-sans text-xs space-y-3"
                      >
                        <span className="block font-semibold text-muted uppercase tracking-wide text-[9px]">Select Preset</span>
                        <div className="space-y-1">
                          {filterPresets.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                setFilterDiff(preset.diff);
                                setFilterStatus(preset.status);
                                setIsPresetsDropdownOpen(false);
                                showToast(`Preset "${preset.name}" applied!`, "success");
                              }}
                              className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-surface-2 text-foreground font-semibold flex items-center justify-between cursor-pointer transition-colors"
                            >
                              <span>{preset.name}</span>
                              <span className="text-[9px] text-muted font-normal">
                                {preset.diff !== "ALL" ? preset.diff : ""} {preset.status !== "ALL" ? preset.status : ""}
                              </span>
                            </button>
                          ))}
                        </div>

                        <div className="pt-2.5 border-t border-border/40 space-y-2">
                          <span className="block font-semibold text-muted uppercase tracking-wide text-[9px]">Save Current Filter</span>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="Preset name..."
                              value={newPresetName}
                              onChange={(e) => setNewPresetName(e.target.value)}
                              className="flex-1 px-2.5 py-1.5 rounded-xl bg-surface-2 border border-border text-[10px] text-foreground focus:outline-none placeholder:text-muted/55"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!newPresetName.trim()) return;
                                const newP = {
                                  name: newPresetName.trim(),
                                  diff: filterDiff,
                                  status: filterStatus
                                };
                                setFilterPresets([...filterPresets, newP]);
                                setNewPresetName("");
                                showToast("Filter preset saved successfully!", "success");
                              }}
                              className="px-2.5 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold text-[9px] cursor-pointer transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Add Problem Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsAddProblemOpen(true)}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/95 text-white font-sans font-bold text-xs cursor-pointer transition-colors shadow-md shadow-primary/10"
              >
                <Plus className="w-4 h-4" />
                Add Problem
              </motion.button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] border-collapse text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-border/80 text-muted font-bold tracking-wider uppercase text-[9px]">
                  <th className="pb-3.5 pl-2">Difficulty</th>
                  <th className="pb-3.5">Problem</th>
                  <th className="pb-3.5">Topic</th>
                  <th className="pb-3.5">Status</th>
                  <th className="pb-3.5 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {paginatedProblems.map((prob, idx) => (
                  <tr
                    key={idx}
                    onClick={() => {
                      setActiveProblem(prob);
                      setActiveTab("solutions");
                      setSelSolIdx(0);
                    }}
                    className="hover:bg-surface-2/35 transition-colors duration-150 group cursor-pointer"
                  >
                    {/* Difficulty */}
                    <td className="py-4 pl-2">
                      <span className={`font-display font-bold text-[9px] px-2 py-0.5 rounded shrink-0 ${prob.diffColor}`}>
                        {prob.difficulty === "MED" ? "MEDIUM" : prob.difficulty}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                          {prob.name}
                        </span>
                      </div>
                    </td>

                    {/* Topic */}
                    <td className="py-4 text-muted text-xs font-sans">
                      {prob.topic}
                    </td>

                    {/* Status badge */}
                    <td className="py-4">
                      <span className={`inline-flex items-center gap-1 font-sans font-bold text-[10px] border px-2 py-0.5 rounded-full ${prob.statusColor}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {prob.status}
                      </span>
                    </td>

                    {/* Action buttons — icon only */}
                    <td className="py-4 text-right pr-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Problem */}
                        <button
                          onClick={() => {
                            setEditingProblemNum(prob.num);
                            setAddName(prob.name);
                            setAddUrl(prob.url === "#" ? "" : prob.url);
                            setAddDiff(prob.difficulty);
                            setSelectedTopics(prob.topic.split(",").map((t) => t.trim()));
                            setAddIsPublic(!!prob.isPublic);
                            setIsAddProblemOpen(true);
                          }}
                          className="w-8 h-8 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-center justify-center text-amber-500 hover:bg-amber-500/10 transition-all cursor-pointer"
                          title="Edit Problem"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Problem — triggers confirm modal */}
                        <button
                          onClick={() => setConfirmDeleteProblemNum(prob.num)}
                          className="w-8 h-8 rounded-lg bg-rose-500/5 border border-rose-500/20 flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                          title="Delete Problem"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination & Rows-Per-Page Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-border/40 font-sans text-xs">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Summary */}
                <span className="text-muted font-medium">
                  Showing <span className="text-foreground font-bold">{Math.min((currentPage - 1) * rowsPerPage + 1, totalProblemsCount)}</span> to{" "}
                  <span className="text-foreground font-bold">{Math.min(currentPage * rowsPerPage, totalProblemsCount)}</span> of{" "}
                  <span className="text-foreground font-bold">{totalProblemsCount}</span> problems
                </span>

                {/* Page Navigation list buttons */}
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="px-2.5 py-1.5 rounded-lg border border-border bg-surface-2/65 text-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all font-bold"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? "bg-primary border-primary text-white"
                            : "border-border bg-surface-2/65 text-muted hover:text-foreground"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className="px-2.5 py-1.5 rounded-lg border border-border bg-surface-2/65 text-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all font-bold"
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* Rows Per Page — custom dropdown */}
              <div className="flex items-center justify-end gap-2 text-muted font-medium pt-2 border-t border-border/20">
                <span className="text-xs">Rows per page:</span>
                <div className="relative">
                  <button
                    onClick={() => setIsRowsDropdownOpen((o) => !o)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs cursor-pointer transition-all shadow-sm ${
                      isRowsDropdownOpen
                        ? "bg-primary/20 border-primary/60 text-primary"
                        : "bg-surface-2 border-border text-foreground hover:border-primary/40 hover:bg-primary/10"
                    }`}
                  >
                    {rowsPerPage}
                    <svg
                      className={`w-3 h-3 transition-transform duration-200 ${isRowsDropdownOpen ? "rotate-180" : ""}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    >
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {isRowsDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full right-0 mb-2 z-50 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden min-w-[80px]"
                      >
                        {[20, 30, 50, 75, 100].map((size) => (
                          <button
                            key={size}
                            onClick={() => {
                              setRowsPerPage(size);
                              setCurrentPage(1);
                              setIsRowsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${
                              rowsPerPage === size
                                ? "bg-primary/20 text-primary"
                                : "text-foreground hover:bg-primary/10 hover:text-primary"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}
        </motion.div>

      </main>

      {/* ========================================================================= */}
      {/* 4. HIGH-FIDELITY PROBLEM DETAIL MODAL (Spectra overlay UI)                */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeProblem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[85vh] rounded-3xl bg-surface border border-border shadow-2xl overflow-y-auto flex flex-col justify-between"
            >

              {/* Modal Header */}
              <div className="p-6 border-b border-border/80 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-extrabold text-xl text-foreground">
                      {activeProblem.name}
                    </span>
                    <a
                      href={activeProblem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-muted hover:text-foreground transition-colors"
                      title="Open LeetCode URL"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Meta tag row */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 font-sans text-xs text-muted">
                    <span className={`font-display font-extrabold text-[9px] px-1.5 py-0.5 rounded ${activeProblem.diffColor}`}>
                      {activeProblem.difficulty === "MED" ? "MEDIUM" : activeProblem.difficulty}
                    </span>

                    {activeProblem.topic.split(",").map((topic: string, i: number) => {
                      const trimmed = topic.trim();
                      if (!trimmed) return null;
                      return (
                        <span key={i} className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-[9px] font-sans">
                          {trimmed}
                        </span>
                      );
                    })}

                    <span>•</span>
                    <span className="italic">{activeProblem.interval}</span>
                  </div>
                  {activeProblem.isPublic && (
                    <div className="flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-[10px] text-emerald-400 font-sans font-bold w-fit">
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span>Public Link:</span>
                      <span className="text-foreground/75 font-mono select-all underline decoration-emerald-500/30">
                        {typeof window !== "undefined" ? `${window.location.origin}/p/${activeProblem.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}` : ""}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Public Sharing Toggle */}
                  <button
                    onClick={async () => {
                      try {
                        const updated = await updateProblem(activeProblem.num, {
                          name: activeProblem.name,
                          difficulty: activeProblem.difficulty,
                          topic: activeProblem.topic,
                          url: activeProblem.url,
                          isPublic: !activeProblem.isPublic
                        });
                        await loadProblems();
                        showToast(updated.isPublic ? "Public sharing enabled!" : "Public sharing disabled", "success");
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
                      activeProblem.isPublic 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                        : "bg-surface-2 border-border text-muted hover:text-foreground"
                    }`}
                    title={activeProblem.isPublic ? "Public Sharing Enabled" : "Enable Public Sharing"}
                  >
                    {activeProblem.isPublic ? <Globe className="w-4.5 h-4.5" /> : <Lock className="w-4.5 h-4.5" />}
                  </button>

                  {/* Favorite Toggle */}
                  <button
                    onClick={async () => {
                      try {
                        await toggleFavorite(activeProblem.num);
                        await loadProblems();
                        showToast(!activeProblem.isFavorite ? "Added to favorites!" : "Removed from favorites!", "success");
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-muted hover:text-foreground active:scale-95 transition-all cursor-pointer"
                  >
                    <Star className={`w-5 h-5 ${activeProblem.isFavorite ? "text-accent fill-accent" : "text-muted"}`} />
                  </button>

                  {/* Share button */}
                  <button
                    onClick={async () => {
                      if (!activeProblem.isPublic) {
                        try {
                          await updateProblem(activeProblem.num, {
                            name: activeProblem.name,
                            difficulty: activeProblem.difficulty,
                            topic: activeProblem.topic,
                            url: activeProblem.url,
                            isPublic: true
                          });
                          await loadProblems();
                        } catch (err) {
                          console.error(err);
                        }
                      }
                      const slug = activeProblem.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                      const shareUrl = `${window.location.origin}/p/${slug}`;
                      navigator.clipboard.writeText(shareUrl);
                      showToast("Public shareable link copied!", "success");
                    }}
                    className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-muted hover:text-foreground active:scale-95 transition-all cursor-pointer"
                    title="Copy Public Share Link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  {/* Close button */}
                  <button
                    onClick={() => setActiveProblem(null)}
                    className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-muted hover:text-rose-500 active:scale-95 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Tabs Selector */}
              <div className="px-6 border-b border-border/40 bg-surface-2/40 flex font-sans font-bold text-xs tracking-wider uppercase text-muted">
                {[
                  { id: "solutions", label: "Solutions" },
                  { id: "notes", label: "Notes" },
                  { id: "history", label: "History" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-3.5 border-b-2 font-sans font-bold transition-all cursor-pointer ${activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent hover:text-foreground"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Modal Content Panels */}
              <div className="p-6 flex-1 overflow-y-auto min-h-[300px]">

                {/* 1. SOLUTIONS TAB */}
                {activeTab === "solutions" && (
                  <div className="space-y-6">
                    {/* EXISTING SOLUTIONS VIEW */}
                    {activeProblem.solutions.length === 0 ? (
                      <div className="text-center py-10">
                        <Code className="w-12 h-12 text-muted/50 mx-auto mb-3" />
                        <p className="font-sans text-xs text-muted">No solutions added to this problem yet</p>
                        <button
                          onClick={() => {
                            setEditingSolIdx(null);
                            setNewSolName("");
                            setNewSolLang(defaultLanguage);
                            setNewSolIntuition("");
                            setNewSolApproach("");
                            setNewSolCode("");
                            setIsAddingSol(true);
                          }}
                          className="mt-4 inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-surface-2 border border-border hover:bg-border/20 font-sans font-bold text-xs text-foreground cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Log first solution
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6 w-full">

                        {/* Inline Language Selector Tabs (Replacing Sidebar) */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
                          <div className="flex items-center gap-2">
                            {activeProblem.solutions.map((sol: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => setSelSolIdx(idx)}
                                className={`px-4 py-2 rounded-xl border font-sans font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${selSolIdx === idx
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "border-border bg-surface-2/40 text-muted hover:bg-surface-2 hover:text-foreground"
                                  }`}
                              >
                                <span>{sol.name || sol.lang}</span>
                                <span className="text-[9px] bg-primary/10 px-1.5 py-0.5 rounded-md font-mono">{sol.time}</span>
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Edit selected solution — icon only */}
                            <button
                              onClick={() => {
                                const currentSol = activeProblem.solutions[selSolIdx];
                                setNewSolName(currentSol.name);
                                setNewSolLang(currentSol.lang);
                                setNewSolIntuition(currentSol.intuition);
                                setNewSolApproach(currentSol.approach);
                                setNewSolTime(currentSol.time);
                                setNewSolSpace(currentSol.space);
                                setNewSolCode(currentSol.code);
                                setEditingSolIdx(selSolIdx);
                                setIsAddingSol(true);
                              }}
                              className="w-8 h-8 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-center justify-center text-amber-500 hover:bg-amber-500/10 transition-all cursor-pointer"
                              title="Edit selected solution"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete selected solution — triggers confirm modal */}
                            <button
                              onClick={() => setConfirmDeleteSolIdx(selSolIdx)}
                              className="w-8 h-8 rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 flex items-center justify-center text-rose-500 transition-all cursor-pointer"
                              title="Delete selected solution"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setEditingSolIdx(null);
                                setNewSolName("");
                                setNewSolLang(defaultLanguage);
                                setNewSolIntuition("");
                                setNewSolApproach("");
                                setNewSolCode("");
                                setNewSolTime("O(N)");
                                setNewSolSpace("O(1)");
                                setIsAddingSol(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-dashed border-primary/50 bg-primary/5 text-primary rounded-xl font-sans font-bold text-xs transition-all cursor-pointer hover:bg-primary/10 hover:border-primary"
                            >
                              <Plus className="w-3.5 h-3.5 text-primary" />
                              Add solution
                            </button>
                          </div>
                        </div>

                        {/* Unified Full-Width solutions details panel */}
                        <div className="space-y-6">

                          {/* Intuition & approach details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-5 rounded-2xl bg-surface-2 border border-border/40 font-sans text-xs">
                              <span className="font-semibold text-muted tracking-wider uppercase text-[9px] block mb-1">Intuition</span>
                              <p className="text-foreground/80 leading-relaxed">
                                {activeProblem.solutions[selSolIdx].intuition}
                              </p>
                            </div>
                            <div className="p-5 rounded-2xl bg-surface-2 border border-border/40 font-sans text-xs">
                              <span className="font-semibold text-muted tracking-wider uppercase text-[9px] block mb-1">Approach</span>
                              <p className="text-foreground/80 leading-relaxed">
                                {activeProblem.solutions[selSolIdx].approach}
                              </p>
                            </div>
                          </div>

                          {/* Complexities bar */}
                          <div className="flex gap-6 p-4 rounded-xl bg-surface-2/65 border border-border/40 font-sans text-xs font-bold text-muted justify-start items-center">
                            <span className="text-[10px] tracking-wider uppercase text-muted/80">Complexities:</span>
                            <span className="flex items-center gap-1">Time: <span className="text-primary font-extrabold">{activeProblem.solutions[selSolIdx].time}</span></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-border" />
                            <span className="flex items-center gap-1">Space: <span className="text-accent font-extrabold">{activeProblem.solutions[selSolIdx].space}</span></span>
                          </div>

                          {/* Code Block - Premium Syntax highlighting */}
                          <div className="rounded-2xl border border-border bg-[#1A1A1F] overflow-hidden relative group">

                            {/* Editor Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-surface/5">
                              <span className="font-mono text-[10px] text-muted font-bold uppercase tracking-wider">
                                {activeProblem.solutions[selSolIdx].lang} Source
                              </span>

                              {/* Copy button */}
                              <button
                                onClick={() => handleCopyCode(activeProblem.solutions[selSolIdx].code)}
                                className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-muted hover:text-foreground active:scale-95 transition-all cursor-pointer"
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

                            {/* Simulated Monaco code */}
                            <pre className="p-5 overflow-x-auto font-mono text-[11px] leading-relaxed text-slate-300">
                              <code dangerouslySetInnerHTML={{ __html: highlightCode(activeProblem.solutions[selSolIdx].code, activeProblem.solutions[selSolIdx].lang) }} />
                            </pre>

                          </div>

                          {/* ── Solution Notes ── */}
                          <div className="space-y-3">
                            <h4 className="font-sans font-bold text-[10px] uppercase tracking-wider text-muted">Solution Notes</h4>

                            {/* Existing solution notes */}
                            {(activeProblem.solutions[selSolIdx].notes || []).length > 0 && (
                              <div className="space-y-2">
                                {(activeProblem.solutions[selSolIdx].notes || []).map((n: any, ni: number) => {
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
                                  const isEditing = editingSolNoteIdx === ni && editingSolNoteSolIdx === selSolIdx;
                                  return (
                                    <div 
                                      key={ni} 
                                      className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.border} ${cfg.bg} font-sans text-xs group`}
                                      style={isWarning ? { borderColor: "rgba(245, 158, 11, 0.3)", backgroundColor: "rgba(245, 158, 11, 0.05)" } : {}}
                                    >
                                      <span 
                                        className={`mt-0.5 shrink-0 ${cfg.text}`}
                                        style={isWarning ? { color: "#fbbf24" } : {}}
                                      >
                                        {Icon}
                                      </span>
                                      {isEditing ? (
                                        <div className="flex-1 flex gap-2 items-center">
                                          <input
                                            type="text"
                                            value={editingSolNoteText}
                                            onChange={(e) => setEditingSolNoteText(e.target.value)}
                                            className="flex-1 px-3 py-1.5 rounded-lg bg-surface border border-primary/50 focus:outline-none font-sans text-xs text-foreground"
                                            onKeyDown={async (e) => {
                                              if (e.key === "Enter" && editingSolNoteText.trim()) {
                                                try {
                                                  await updateSolutionNote(n.id, editingSolNoteText.trim());
                                                  await loadProblems();
                                                  setEditingSolNoteIdx(null);
                                                  setEditingSolNoteSolIdx(null);
                                                  setEditingSolNoteText("");
                                                  showToast("Solution note updated", "success");
                                                } catch (err) {
                                                  console.error(err);
                                                }
                                              }
                                            }}
                                          />
                                          <button
                                            onClick={async () => {
                                              if (!editingSolNoteText.trim()) return;
                                              try {
                                                await updateSolutionNote(n.id, editingSolNoteText.trim());
                                                await loadProblems();
                                                setEditingSolNoteIdx(null);
                                                setEditingSolNoteSolIdx(null);
                                                setEditingSolNoteText("");
                                                showToast("Solution note updated", "success");
                                              } catch (err) {
                                                console.error(err);
                                              }
                                            }}
                                            className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                                            title="Save Note"
                                          >
                                            <Check className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              setEditingSolNoteIdx(null);
                                              setEditingSolNoteSolIdx(null);
                                              setEditingSolNoteText("");
                                            }}
                                            className="p-1 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                                            title="Cancel"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex-1">
                                            <span 
                                              className={`font-bold text-[9px] uppercase tracking-wider ${cfg.text}`}
                                              style={isWarning ? { color: "#fbbf24" } : {}}
                                            >
                                              {cfg.label}
                                            </span>
                                            <p className="mt-0.5 text-foreground/80 leading-relaxed">{n.text}</p>
                                          </div>
                                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                              onClick={() => {
                                                setEditingSolNoteIdx(ni);
                                                setEditingSolNoteText(n.text);
                                                setEditingSolNoteSolIdx(selSolIdx);
                                              }}
                                              className="p-1 text-amber-500 hover:text-amber-400 transition-all cursor-pointer shrink-0"
                                              title="Edit note"
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={async () => {
                                                try {
                                                  await deleteSolutionNote(n.id);
                                                  await loadProblems();
                                                  showToast("Solution note deleted", "success");
                                                } catch (err) {
                                                  console.error(err);
                                                }
                                              }}
                                              className="p-1 text-rose-400 hover:text-rose-300 transition-all cursor-pointer shrink-0"
                                              title="Delete note"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Add note input */}
                            <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface-2/60 border border-border/40">
                              {/* Type picker pills */}
                              <div className="flex items-center gap-2">
                                {([ "mistake", "warning", "success", "note" ] as const).map((t) => {
                                  const pillMeta = {
                                    mistake: { Icon: AlertCircle,   label: "Mistake", active: "bg-rose-500/20 border-rose-500/50 text-rose-400",       idle: "border-border text-muted hover:border-rose-500/30 hover:text-rose-400" },
                                    warning: { Icon: AlertTriangle, label: "Warning", active: "bg-warning-active border-warning-active text-warning",   idle: "border-border text-muted hover-border-warning hover-text-warning" },
                                    success: { Icon: CheckCircle2,  label: "Success", active: "bg-emerald-500/20 border-emerald-500/50 text-emerald-400", idle: "border-border text-muted hover:border-emerald-500/30 hover:text-emerald-400" },
                                    note:    { Icon: FileText,      label: "Note",    active: "bg-primary/20 border-primary/50 text-primary",            idle: "border-border text-muted hover:border-primary/30 hover:text-primary" },
                                  }[t];
                                  const isWarningActive = t === "warning" && newSolNoteType === "warning";
                                  return (
                                    <button
                                      key={t}
                                      onClick={() => setNewSolNoteType(t)}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                        newSolNoteType === t ? pillMeta.active : pillMeta.idle
                                      }`}
                                      style={isWarningActive ? {
                                        backgroundColor: "rgba(245, 158, 11, 0.2)",
                                        borderColor: "rgba(245, 158, 11, 0.5)",
                                        color: "#fbbf24"
                                      } : {}}
                                    >
                                      <pillMeta.Icon className="w-3 h-3" /> {pillMeta.label}
                                    </button>
                                  );
                                })}
                              </div>
                              {/* Text + submit */}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder={`Add a ${newSolNoteType} for this solution…`}
                                  value={newSolNoteText}
                                  onChange={e => setNewSolNoteText(e.target.value)}
                                  onKeyDown={async (e) => {
                                    if (e.key === "Enter" && newSolNoteText.trim()) {
                                      try {
                                        const sol = activeProblem.solutions[selSolIdx];
                                        await addSolutionNote(sol.id, newSolNoteType, newSolNoteText.trim());
                                        await loadProblems();
                                        setNewSolNoteText("");
                                        showToast("Solution note added!", "success");
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border focus:border-primary/50 focus:outline-none font-sans text-xs text-foreground placeholder:text-muted/60 transition-all"
                                />
                                <button
                                  onClick={async () => {
                                    if (!newSolNoteText.trim()) return;
                                    try {
                                      const sol = activeProblem.solutions[selSolIdx];
                                      await addSolutionNote(sol.id, newSolNoteType, newSolNoteText.trim());
                                      await loadProblems();
                                      setNewSolNoteText("");
                                      showToast("Solution note added!", "success");
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  className="px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-sans font-bold text-xs transition-all cursor-pointer shrink-0"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>

                      </div>
                    )}
                  </div>
                )}

                {/* 2. NOTES TAB */}
                {activeTab === "notes" && (
                  <div className="space-y-6 max-w-2xl mx-auto">

                    {/* Add note field */}
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Write down a key mental loop or DP formula..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none font-sans text-xs text-foreground placeholder:text-muted/60 transition-all"
                      />
                      <button
                        onClick={async () => {
                          if (!newNoteText) return;
                          try {
                            await addNote(activeProblem.id, newNoteText);
                            await loadProblems();
                            setNewNoteText("");
                            showToast("Note added successfully!", "success");
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-sans font-bold text-xs shadow-md shadow-primary/10 cursor-pointer"
                      >
                        Add note
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activeProblem.notes.length === 0 ? (
                        <p className="text-center font-sans text-xs text-muted py-4">No custom notes written for this problem</p>
                      ) : (
                        activeProblem.notes.map((note: any, i: number) => (
                          <div key={note.id || i} className="p-4 rounded-xl bg-surface-2 border border-border/40 font-sans text-xs text-foreground/80 leading-relaxed flex items-center justify-between gap-4 group">
                            {editingNoteIdx === i ? (
                              <div className="flex-1 flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={editingNoteText}
                                  onChange={(e) => setEditingNoteText(e.target.value)}
                                  className="flex-1 px-3 py-1.5 rounded-lg bg-surface border border-primary/50 focus:outline-none font-sans text-xs text-foreground"
                                />
                                <button
                                  onClick={async () => {
                                    if (!editingNoteText) return;
                                    try {
                                      await updateNote(note.id, editingNoteText);
                                      await loadProblems();
                                      setEditingNoteIdx(null);
                                      setEditingNoteText("");
                                      showToast("Note updated successfully!", "success");
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                                  title="Save Note"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingNoteIdx(null);
                                    setEditingNoteText("");
                                  }}
                                  className="p-1 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="flex-1">{note.text}</span>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => {
                                      setEditingNoteIdx(i);
                                      setEditingNoteText(note.text);
                                    }}
                                    className="p-1 text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
                                    title="Edit Note"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        await deleteNote(note.id);
                                        await loadProblems();
                                        showToast("Note deleted successfully!", "success");
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }}
                                    className="p-1 text-rose-500 hover:text-rose-400 transition-colors cursor-pointer"
                                    title="Delete Note"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* ── Solution Notes (grouped by solution) ── */}
                    {activeProblem.solutions.some((s: any) => (s.notes || []).length > 0) && (
                      <div className="mt-8 pt-6 border-t border-border/40 space-y-4">
                        <h4 className="font-display font-extrabold text-xs text-foreground/70 tracking-wider uppercase flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> Solution Notes
                        </h4>
                        {activeProblem.solutions.map((sol: any, si: number) => {
                          const solNotes = sol.notes || [];
                          if (solNotes.length === 0) return null;
                          return (
                            <div key={si} className="space-y-2">
                              <p className="font-sans font-bold text-[10px] text-muted uppercase tracking-wider">
                                {sol.name || sol.lang}
                              </p>
                              {solNotes.map((n: any, ni: number) => {
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
                                const isEditing = editingSolNoteIdx === ni && editingSolNoteSolIdx === si;
                                return (
                                  <div 
                                    key={ni} 
                                    className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.border} ${cfg.bg} font-sans text-xs group`}
                                    style={isWarning ? { borderColor: "rgba(245, 158, 11, 0.3)", backgroundColor: "rgba(245, 158, 11, 0.05)" } : {}}
                                  >
                                    <span 
                                      className={`mt-0.5 shrink-0 ${cfg.text}`}
                                      style={isWarning ? { color: "#fbbf24" } : {}}
                                    >
                                      {Icon}
                                    </span>
                                    {isEditing ? (
                                      <div className="flex-1 flex gap-2 items-center">
                                        <input
                                          type="text"
                                          value={editingSolNoteText}
                                          onChange={(e) => setEditingSolNoteText(e.target.value)}
                                          className="flex-1 px-3 py-1.5 rounded-lg bg-surface border border-primary/50 focus:outline-none font-sans text-xs text-foreground"
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" && editingSolNoteText.trim()) {
                                              const updatedSols = activeProblem.solutions.map((s: any, idx: number) => {
                                                if (idx !== si) return s;
                                                const newNotes = [...(s.notes || [])];
                                                newNotes[ni] = { ...newNotes[ni], text: editingSolNoteText.trim() };
                                                return { ...s, notes: newNotes };
                                              });
                                              const up = { ...activeProblem, solutions: updatedSols };
                                              setProblemsList(prev => prev.map(p => p.num === activeProblem.num ? up : p));
                                              setActiveProblem(up);
                                              setEditingSolNoteIdx(null);
                                              setEditingSolNoteSolIdx(null);
                                              setEditingSolNoteText("");
                                              showToast("Solution note updated", "success");
                                            }
                                          }}
                                        />
                                        <button
                                          onClick={() => {
                                            if (!editingSolNoteText.trim()) return;
                                            const updatedSols = activeProblem.solutions.map((s: any, idx: number) => {
                                              if (idx !== si) return s;
                                              const newNotes = [...(s.notes || [])];
                                              newNotes[ni] = { ...newNotes[ni], text: editingSolNoteText.trim() };
                                              return { ...s, notes: newNotes };
                                            });
                                            const up = { ...activeProblem, solutions: updatedSols };
                                            setProblemsList(prev => prev.map(p => p.num === activeProblem.num ? up : p));
                                            setActiveProblem(up);
                                            setEditingSolNoteIdx(null);
                                            setEditingSolNoteSolIdx(null);
                                            setEditingSolNoteText("");
                                            showToast("Solution note updated", "success");
                                          }}
                                          className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                                          title="Save Note"
                                        >
                                          <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingSolNoteIdx(null);
                                            setEditingSolNoteSolIdx(null);
                                            setEditingSolNoteText("");
                                          }}
                                          className="p-1 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                                          title="Cancel"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex-1">
                                          <span 
                                            className={`font-bold text-[9px] uppercase tracking-wider ${cfg.text}`}
                                            style={isWarning ? { color: "#fbbf24" } : {}}
                                          >
                                            {cfg.label}
                                          </span>
                                          <p className="mt-0.5 text-foreground/80 leading-relaxed">{n.text}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => {
                                              setEditingSolNoteIdx(ni);
                                              setEditingSolNoteText(n.text);
                                              setEditingSolNoteSolIdx(si);
                                            }}
                                            className="p-1 text-amber-500 hover:text-amber-400 transition-all cursor-pointer shrink-0"
                                            title="Edit note"
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              const updatedSols = activeProblem.solutions.map((s: any, idx: number) =>
                                                idx !== si ? s : { ...s, notes: (s.notes || []).filter((_: any, fi: number) => fi !== ni) }
                                              );
                                              const up = { ...activeProblem, solutions: updatedSols };
                                              setProblemsList(prev => prev.map(p => p.num === activeProblem.num ? up : p));
                                              setActiveProblem(up);
                                              showToast("Solution note deleted", "success");
                                            }}
                                            className="p-1 text-rose-400 hover:text-rose-300 transition-all cursor-pointer shrink-0"
                                            title="Delete note"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                )}

                {/* 3. HISTORY TAB */}
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
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    const dateFormatted = `${String(dateObj.getDate()).padStart(2, '0')}-${months[dateObj.getMonth()]}-${dateObj.getFullYear()}`;

                    return {
                      stage: `Stage ${idx + 1} (${stage})`,
                      status,
                      date: dateFormatted,
                    };
                  });

                  return (
                    <div className="w-full py-8 px-4 relative">
                      {historyList.length === 0 ? (
                        <p className="text-center font-sans text-xs text-muted py-10">No spacing history logs found</p>
                      ) : (
                        <div className="relative">
                          {/* Connecting Line */}
                          <div className="absolute top-[20px] left-[10%] right-[10%] h-0.5 bg-border/40 rounded-full z-0" />

                          <div className="flex flex-row items-stretch justify-between relative z-10 w-full">
                            {historyList.map((hist: any, i: number) => {
                              const isDone = hist.status === "Done";
                              const isPending = hist.status === "Pending";
                              return (
                                <div key={i} className="flex flex-col items-center text-center flex-1 px-1 relative">
                                  {/* Node circle */}
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md border-[3px] border-surface z-10 mb-3.5 transition-transform hover:scale-115 ${
                                    isDone 
                                      ? "bg-emerald-500 text-white" 
                                      : isPending 
                                        ? "bg-amber-500/15 border-amber-500/40 text-amber-500" 
                                        : "bg-surface-2 border-border/80 text-muted/40"
                                  }`}>
                                    {isDone ? (
                                      <Check className="w-4.5 h-4.5" />
                                    ) : isPending ? (
                                      <Clock className="w-4 h-4 text-amber-500" />
                                    ) : (
                                      <Lock className="w-3.5 h-3.5" />
                                    )}
                                  </div>

                                  {/* Date Badge */}
                                  <span className="font-sans font-bold text-[9px] text-muted bg-surface-2 border border-border/80 px-2 py-0.5 rounded-md mb-2">
                                    {hist.date}
                                  </span>

                                  {/* Stage */}
                                  <h4 className="font-display font-bold text-xs text-foreground">
                                    {hist.stage}
                                  </h4>

                                  {/* Status */}
                                  <p className={`font-sans text-[10px] font-bold mt-1 ${
                                    isDone 
                                      ? "text-emerald-500" 
                                      : isPending 
                                        ? "text-amber-500" 
                                        : "text-muted/60"
                                  }`}>
                                    {hist.status}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-border/80 flex items-center justify-end gap-3.5 bg-surface-2/20">
                <button
                  onClick={() => setActiveProblem(null)}
                  className="px-4.5 py-2.5 rounded-xl border border-border hover:bg-surface-2 text-foreground font-sans font-bold text-xs cursor-pointer transition-colors"
                >
                  Close
                </button>
                {(activeProblem.status === "Due Today" || activeProblem.status === "Overdue") && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleMarkRevisited(activeProblem.num)}
                    className="px-4.5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-sans font-bold text-xs shadow-md shadow-primary/20 cursor-pointer"
                  >
                    Mark Revisited
                  </motion.button>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4.5. CUSTOM REVISIT DAYS SELECTION MODAL (Stage 4 Complete) */}
      <AnimatePresence>
        {showRevisitDaysPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden p-6 text-foreground font-sans space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base">Stage 4 Complete!</h3>
                  <p className="text-muted text-[11px] mt-0.5">Choose when you want to schedule the next practice cycle</p>
                </div>
              </div>

              <p className="text-foreground/80 text-xs leading-relaxed">
                You've successfully completed the entire 4-stage recall loop for <span className="font-bold text-primary">#{activeProblem?.num} {activeProblem?.name}</span>!
                In how many days should we remind you to practice this again?
              </p>

              <div className="grid grid-cols-4 gap-2 pt-2">
                {["3", "7", "15", "30"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setCustomRevisitDays(d)}
                    className={`py-2.5 rounded-xl font-bold text-xs cursor-pointer border transition-all text-center ${
                      customRevisitDays === d
                        ? "bg-primary border-primary text-white"
                        : "bg-surface-2 border-border hover:bg-border/20 text-muted"
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="block text-[10px] font-semibold text-muted uppercase tracking-wide">Or set custom number of days</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={customRevisitDays}
                  onChange={(e) => setCustomRevisitDays(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none font-semibold text-xs text-foreground"
                  placeholder="Enter custom days..."
                />
              </div>

              <div className="pt-4 border-t border-border/80 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRevisitDaysPopup(false)}
                  className="px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-2 text-foreground font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const days = parseInt(customRevisitDays, 10);
                    if (isNaN(days) || days <= 0) return;
                    handleMarkRevisited(activeProblem.num, days);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs cursor-pointer transition-all shadow-md shadow-primary/10"
                >
                  Confirm & Restart
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 5. ADD PROBLEM MODAL (Simulated form)                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddProblemOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-3xl bg-surface border border-border shadow-2xl overflow-visible"
            >
              <div className="p-6 border-b border-border/80 flex items-center justify-between">
                <h2 className="font-display font-extrabold text-lg text-foreground">
                  Add Coding Problem
                </h2>
                <button
                  onClick={() => setIsAddProblemOpen(false)}
                  className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-muted hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleAddProblem} className="p-6 space-y-4 font-sans text-xs">

                <div>
                  <label className="block font-semibold text-muted mb-2 uppercase tracking-wide">
                    Problem Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="3Sum"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-foreground font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-muted mb-2 uppercase tracking-wide">
                    LeetCode URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://leetcode.com/problems/..."
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-foreground"
                  />
                </div>

                {/* Custom tag select categories */}
                <div>
                  <label className="block font-semibold text-muted mb-2 uppercase tracking-wide">
                    Topic Categories (Select or Create)
                  </label>

                  {/* Select pill tag cloud */}
                  <div className="flex flex-wrap gap-2 mb-3 max-h-36 overflow-y-auto p-2 rounded-xl border border-border bg-surface-2/40">
                    {predefinedTopics.map((topic) => {
                      const isSelected = selectedTopics.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTopics(selectedTopics.filter((t) => t !== topic));
                            } else {
                              setSelectedTopics([...selectedTopics, topic]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl border font-sans font-bold text-[10px] transition-all cursor-pointer ${isSelected
                              ? "bg-primary/15 border-primary text-primary shadow-sm scale-[1.03]"
                              : "border-border bg-surface-2/30 text-muted hover:bg-border/20 hover:text-foreground"
                            }`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>

                  {/* Inline tag custom builder */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add custom category tag name..."
                      value={customTopicInput}
                      onChange={(e) => setCustomTopicInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (!customTopicInput.trim()) return;
                          const newTag = customTopicInput.trim();
                          if (!predefinedTopics.includes(newTag)) {
                            setPredefinedTopics([...predefinedTopics, newTag]);
                          }
                          if (!selectedTopics.includes(newTag)) {
                            setSelectedTopics([...selectedTopics, newTag]);
                          }
                          setCustomTopicInput("");
                        }
                      }}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-foreground placeholder:text-muted/60"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!customTopicInput.trim()) return;
                        const newTag = customTopicInput.trim();
                        if (!predefinedTopics.includes(newTag)) {
                          setPredefinedTopics([...predefinedTopics, newTag]);
                        }
                        if (!selectedTopics.includes(newTag)) {
                          setSelectedTopics([...selectedTopics, newTag]);
                        }
                        setCustomTopicInput("");
                      }}
                      className="px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold cursor-pointer transition-colors"
                    >
                      Create
                    </button>
                  </div>
                </div>

                {/* Custom dropdown matching dropdown select */}
                <div className="relative">
                  <label className="block font-semibold text-muted mb-2 uppercase tracking-wide">
                    Difficulty Level
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsDiffDropdownOpen(!isDiffDropdownOpen)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-foreground font-semibold flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${addDiff === "EASY" ? "bg-emerald-500" : addDiff === "MED" ? "bg-amber-500" : "bg-rose-500"
                        }`} />
                      {addDiff === "EASY" ? "EASY" : addDiff === "MED" ? "MEDIUM" : "HARD"}
                    </span>
                    <svg className={`w-4 h-4 text-muted transition-transform ${isDiffDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {isDiffDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsDiffDropdownOpen(false)} />

                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="absolute z-20 w-full mt-2 bg-surface border border-border rounded-xl shadow-xl overflow-hidden font-semibold"
                        >
                          {[
                            { value: "EASY", label: "EASY", color: "bg-emerald-500", text: "text-emerald-500" },
                            { value: "MED", label: "MEDIUM", color: "bg-amber-500", text: "text-amber-500" },
                            { value: "HARD", label: "HARD", color: "bg-rose-500", text: "text-rose-500" }
                          ].map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => {
                                setAddDiff(item.value);
                                setIsDiffDropdownOpen(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-surface-2 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                <span className={item.text}>{item.label}</span>
                              </span>
                              {addDiff === item.value && <Check className="w-4.5 h-4.5 text-primary" />}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Public Sharing Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-2/40">
                  <div className="flex flex-col gap-0.5 font-sans">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      Public Sharing
                    </span>
                    <span className="text-[10px] text-muted">
                      Anyone with the share link can view this problem and its solutions.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddIsPublic(!addIsPublic)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${
                      addIsPublic ? "bg-primary" : "bg-border"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        addIsPublic ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-4 border-t border-border/80 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddProblemOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border hover:bg-surface-2 text-foreground font-bold font-sans cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold font-sans cursor-pointer transition-all shadow-md shadow-primary/10"
                  >
                    Add Problem
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Onboarding Dialog Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md rounded-3xl bg-surface border border-border shadow-2xl p-6 text-center space-y-6 overflow-visible"
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-sm">
                  <Code className="w-6 h-6" />
                </div>
                <h2 className="font-display font-extrabold text-xl text-foreground">
                  Welcome to CodeVault
                </h2>
                <p className="font-sans text-xs text-muted mt-2 max-w-sm">
                  Let's personalize your spaced repetition companion. Choose your primary coding language for solution approaches.
                </p>
              </div>

              {/* Custom language selector dropdown */}
              <div className="relative text-left">
                <label className="block font-semibold text-muted mb-2 uppercase tracking-wide text-[10px] font-sans">
                  Default Language
                </label>

                <button
                  type="button"
                  onClick={() => setIsDefaultLangDropdownOpen(!isDefaultLangDropdownOpen)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-foreground font-semibold flex items-center justify-between cursor-pointer text-xs"
                >
                  <span className="font-sans font-bold text-xs">{defaultLanguage}</span>
                  <svg className={`w-4 h-4 text-muted transition-transform ${isDefaultLangDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {isDefaultLangDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsDefaultLangDropdownOpen(false)} />

                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute z-20 w-full mt-2 bg-surface border border-border rounded-xl shadow-xl overflow-hidden font-semibold max-h-48 overflow-y-auto"
                      >
                        {["Python", "C++", "Java", "JavaScript", "TypeScript", "Go", "Rust"].map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => {
                              setDefaultLanguage(lang);
                              setIsDefaultLangDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-surface-2 flex items-center justify-between transition-colors cursor-pointer text-xs"
                          >
                            <span>{lang}</span>
                            {defaultLanguage === lang && <Check className="w-4 h-4 text-primary" />}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveOnboarding}
                className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-sans font-bold text-xs shadow-md shadow-primary/10 cursor-pointer"
              >
                Complete Onboarding
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== CONFIRM DELETE PROBLEM MODAL ===== */}
      <AnimatePresence>
        {confirmDeleteProblemNum !== null && (() => {
          const prob = problemsList.find((p) => p.num === confirmDeleteProblemNum);
          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm">
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
                    <h3 className="font-display font-extrabold text-base text-foreground">Delete Problem?</h3>
                    <p className="font-sans text-xs text-muted mt-0.5">This will permanently remove <span className="font-bold text-foreground">{prob?.name}</span> and all its solutions.</p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
                  <button
                    onClick={() => setConfirmDeleteProblemNum(null)}
                    className="px-4 py-2 rounded-xl border border-border hover:bg-surface-2 text-foreground font-bold font-sans text-xs cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (confirmDeleteProblemNum !== null) {
                        try {
                          await deleteProblem(confirmDeleteProblemNum);
                          setProblemsList((prev) => prev.filter((p) => p.num !== confirmDeleteProblemNum));
                          setConfirmDeleteProblemNum(null);
                          showToast("Problem deleted successfully!", "success");
                        } catch (err) {
                          showToast("Failed to delete problem", "error");
                        }
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold font-sans text-xs cursor-pointer transition-colors"
                  >
                    Yes, Delete
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ===== CONFIRM DELETE SOLUTION MODAL ===== */}
      <AnimatePresence>
        {confirmDeleteSolIdx !== null && activeProblem && (() => {
          const sol = activeProblem.solutions[confirmDeleteSolIdx];
          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm">
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
                    <h3 className="font-display font-extrabold text-base text-foreground">Delete Solution?</h3>
                    <p className="font-sans text-xs text-muted mt-0.5">Remove solution <span className="font-bold text-foreground">{sol?.name}</span> ({sol?.lang}) from this problem?</p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
                  <button
                    onClick={() => setConfirmDeleteSolIdx(null)}
                    className="px-4 py-2 rounded-xl border border-border hover:bg-surface-2 text-foreground font-bold font-sans text-xs cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (confirmDeleteSolIdx !== null && activeProblem) {
                        const sol = activeProblem.solutions[confirmDeleteSolIdx];
                        try {
                          if (sol.id) {
                            await deleteSolution(sol.id);
                          }
                          const updatedSols = activeProblem.solutions.filter((_: any, i: number) => i !== confirmDeleteSolIdx);
                          setProblemsList((prev) =>
                            prev.map((p) => {
                              if (p.num === activeProblem.num) return { ...p, solutions: updatedSols };
                              return p;
                            })
                          );
                          setActiveProblem({ ...activeProblem, solutions: updatedSols });
                          setSelSolIdx(0);
                          setConfirmDeleteSolIdx(null);
                          showToast("Solution deleted successfully!", "success");
                        } catch (err) {
                          showToast("Failed to delete solution", "error");
                        }
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold font-sans text-xs cursor-pointer transition-colors"
                  >
                    Yes, Delete
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ===== GORGEOUS ADD/EDIT SOLUTION TOP MODAL ===== */}
      <AnimatePresence>
        {isAddingSol && activeProblem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-surface border border-border shadow-2xl overflow-y-auto p-6 space-y-5"
            >
              <form onSubmit={handleSaveSolution} className="space-y-5 font-sans text-xs">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <h3 className="font-display font-extrabold text-sm text-foreground">
                    {editingSolIdx !== null 
                      ? `Edit Solution Approach for ${activeProblem.name}` 
                      : `Create New Solution Approach for ${activeProblem.name}`}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingSol(false)}
                    className="text-muted hover:text-foreground font-bold font-sans text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block font-semibold text-muted mb-2 uppercase tracking-wide">
                      Solution Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. One-Pass Hash Map"
                      value={newSolName}
                      onChange={(e) => setNewSolName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-foreground font-semibold"
                    />
                  </div>

                  {/* Language */}
                  <div className="relative">
                    <label className="block font-semibold text-muted mb-2 uppercase tracking-wide">
                      Programming Language
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-foreground font-semibold flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-sans font-bold text-xs">{newSolLang}</span>
                      <svg className={`w-4 h-4 text-muted transition-transform ${isLangDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <AnimatePresence>
                      {isLangDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsLangDropdownOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="absolute z-20 w-full mt-2 bg-surface border border-border rounded-xl shadow-xl overflow-hidden font-semibold max-h-48 overflow-y-auto"
                          >
                            {["Python", "C++", "Java", "JavaScript", "TypeScript", "Go", "Rust"].map((lang) => (
                              <button
                                key={lang}
                                type="button"
                                onClick={() => {
                                  setNewSolLang(lang);
                                  setIsLangDropdownOpen(false);
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-surface-2 flex items-center justify-between transition-colors cursor-pointer text-xs"
                              >
                                <span>{lang}</span>
                                {newSolLang === lang && <Check className="w-4 h-4 text-primary" />}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Time Complexity */}
                  <div className="relative">
                    <label className="block font-semibold text-muted mb-2 uppercase tracking-wide">
                      Time Complexity
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-foreground font-semibold flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-mono text-xs text-primary">{newSolTime}</span>
                      <svg className={`w-4 h-4 text-muted transition-transform ${isTimeDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <AnimatePresence>
                      {isTimeDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsTimeDropdownOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="absolute z-20 w-full mt-2 bg-surface border border-border rounded-xl shadow-xl overflow-hidden font-semibold max-h-48 overflow-y-auto"
                          >
                            {[
                              { value: "O(1)", desc: "Constant" },
                              { value: "O(log N)", desc: "Logarithmic" },
                              { value: "O(N)", desc: "Linear" },
                              { value: "O(N log N)", desc: "Linearithmic" },
                              { value: "O(N^2)", desc: "Quadratic" },
                              { value: "O(2^N)", desc: "Exponential" }
                            ].map((item) => (
                              <button
                                key={item.value}
                                type="button"
                                onClick={() => {
                                  setNewSolTime(item.value);
                                  setIsTimeDropdownOpen(false);
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-surface-2 flex items-center justify-between transition-colors cursor-pointer text-xs"
                              >
                                <div className="flex flex-col">
                                  <span className="font-mono text-primary font-bold">{item.value}</span>
                                  <span className="text-[10px] text-muted">{item.desc}</span>
                                </div>
                                {newSolTime === item.value && <Check className="w-4 h-4 text-primary" />}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Space Complexity */}
                  <div className="relative">
                    <label className="block font-semibold text-muted mb-2 uppercase tracking-wide">
                      Space Complexity
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsSpaceDropdownOpen(!isSpaceDropdownOpen)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-foreground font-semibold flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-mono text-xs text-accent">{newSolSpace}</span>
                      <svg className={`w-4 h-4 text-muted transition-transform ${isSpaceDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <AnimatePresence>
                      {isSpaceDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsSpaceDropdownOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="absolute z-20 w-full mt-2 bg-surface border border-border rounded-xl shadow-xl overflow-hidden font-semibold max-h-48 overflow-y-auto"
                          >
                            {[
                              { value: "O(1)", desc: "Constant" },
                              { value: "O(log N)", desc: "Logarithmic" },
                              { value: "O(N)", desc: "Linear" },
                              { value: "O(N^2)", desc: "Quadratic" }
                            ].map((item) => (
                              <button
                                key={item.value}
                                type="button"
                                onClick={() => {
                                  setNewSolSpace(item.value);
                                  setIsSpaceDropdownOpen(false);
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-surface-2 flex items-center justify-between transition-colors cursor-pointer text-xs"
                              >
                                <div className="flex flex-col">
                                  <span className="font-mono text-accent font-bold">{item.value}</span>
                                  <span className="text-[10px] text-muted">{item.desc}</span>
                                </div>
                                {newSolSpace === item.value && <Check className="w-4 h-4 text-primary" />}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Intuition */}
                <div>
                  <label className="block font-semibold text-muted mb-2 uppercase tracking-wide">
                    Intuition
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe the initial thought process..."
                    value={newSolIntuition}
                    onChange={(e) => setNewSolIntuition(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-foreground resize-y overflow-x-hidden"
                  />
                </div>

                {/* Approach */}
                <div>
                  <label className="block font-semibold text-muted mb-2 uppercase tracking-wide">
                    Approach details
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Step by step details..."
                    value={newSolApproach}
                    onChange={(e) => setNewSolApproach(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-foreground resize-y overflow-x-hidden"
                  />
                </div>

                {/* Code */}
                <div>
                  <label className="block font-semibold text-muted mb-2 uppercase tracking-wide">
                    Source Code
                  </label>
                  <textarea
                    rows={8}
                    required
                    placeholder={getCodePlaceholder(newSolLang)}
                    value={newSolCode}
                    onChange={(e) => setNewSolCode(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#1A1A1F] border border-border focus:border-primary/50 focus:outline-none text-slate-200 font-mono text-[11px] placeholder:text-slate-600 resize-y overflow-x-hidden leading-relaxed"
                  />
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingSol(false)}
                    className="px-4 py-2 rounded-xl border border-border hover:bg-surface-2 text-foreground font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold cursor-pointer transition-colors shadow-md shadow-primary/10"
                  >
                    Save Solution
                  </button>
                </div>
              </form>
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
              className={`p-4 rounded-xl shadow-xl flex items-center gap-3 border pointer-events-auto ${
                toast.type === "success"
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
