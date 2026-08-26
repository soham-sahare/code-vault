"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Sidebar from "@/components/shell/Sidebar";
import NotificationBell from "@/components/notifications/NotificationBell";
import { Search, Star, AlertCircle, AlertTriangle, Clock, CheckCircle2, ChevronRight, Filter, X, ExternalLink, Share2, Plus, Code, PlusCircle, Check, Copy, Sun, Moon, Pencil, Trash2, FileText, Globe, Lock, Sparkles, MoreVertical, Building2, Briefcase, GitMerge, Layers, Network, Workflow, Boxes, Cpu, Zap, Compass, Hash, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { createProblem, updateProblem, deleteProblem, toggleFavorite, addSolution, deleteSolution, updateSolution, addNote, updateNote, deleteNote, markRevisited, getUserProfile, addSolutionNote, deleteSolutionNote, updateSolutionNote, saveOnboarding, getProblemDetails, getPaginatedProblems } from "@/lib/actions";
import { getInitials } from "@/lib/utils/formatters";
import { highlightClientCode } from "@/lib/utils/clientHighlight";
import { Skeleton } from "@/components/ui/Skeleton";


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
  notes?: any[];
  history?: any[];
}

export default function DashboardPage() {
  // State for problems so they are mutable locally
  const [problemsList, setProblemsList] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
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
  const [filterTopic, setFilterTopic] = useState("ALL");
  const [filterCompany, setFilterCompany] = useState("ALL");
  const [filterPattern, setFilterPattern] = useState("ALL");
  const [topicSearchQuery, setTopicSearchQuery] = useState("");
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [patternSearchQuery, setPatternSearchQuery] = useState("");
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
  const [totalProblemsCount, setTotalProblemsCount] = useState(0);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterDiff, filterStatus, filterTopic, filterCompany, filterPattern, rowsPerPage]);

  // Form input hooks for simulated problem adding
  const [addName, setAddName] = useState("");
  const [addNum, setAddNum] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addDiff, setAddDiff] = useState("EASY");
  const [addIsPublic, setAddIsPublic] = useState(false);

  // Custom dropdown & pill tags selector states
  const [isDiffDropdownOpen, setIsDiffDropdownOpen] = useState(false);
  const defaultTopics = [
    "array", "string", "dynamic programming", "stack", "queue", "recursion",
    "graphs", "trees", "tries", "linkedlist", "binary search", "heaps", "maths",
    "hashing", "sorting", "searching"
  ];
  const [customPredefinedTopics, setCustomPredefinedTopics] = useState<string[]>([]);

  const defaultCompanies = [
    "Google", "Meta", "Amazon", "Apple", "Microsoft",
    "Uber", "Netflix", "Bloomberg", "Adobe", "Stripe", "Goldman Sachs", "Oracle"
  ];
  const [customPredefinedCompanies, setCustomPredefinedCompanies] = useState<string[]>([]);

  const defaultPatterns = [
    "Two Pointers", "Sliding Window", "Fast & Slow Pointers", "Merge Intervals",
    "Monotonic Stack", "Tree BFS / Level Order", "Tree DFS / Postorder",
    "Top K Elements / Heap", "0/1 Knapsack & DP", "Topological Sort",
    "Binary Search On Answer", "Trie Prefix Search"
  ];
  const [customPredefinedPatterns, setCustomPredefinedPatterns] = useState<string[]>([]);

  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [customCompanyInput, setCustomCompanyInput] = useState("");
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [customPatternInput, setCustomPatternInput] = useState("");

  const getSelectableTopics = () => {
    const topicsSet = new Set(defaultTopics.map(t => t.toLowerCase()));
    customPredefinedTopics.forEach((t) => topicsSet.add(t.toLowerCase()));
    problemsList.forEach((p) => {
      if (p.topic) {
        p.topic.split(",").forEach((t: string) => {
          const trimmed = t.trim().toLowerCase();
          if (trimmed) {
            topicsSet.add(trimmed);
          }
        });
      }
    });
    return Array.from(topicsSet);
  };

  const getSelectableCompanies = () => {
    const map = new Map<string, string>();
    defaultCompanies.forEach((c) => map.set(c.toLowerCase(), c));
    customPredefinedCompanies.forEach((c) => map.set(c.toLowerCase(), c));
    problemsList.forEach((p) => {
      if (p.companies && Array.isArray(p.companies)) {
        p.companies.forEach((c: any) => {
          const name = c.company?.name || c.name;
          if (name && name.trim()) {
            map.set(name.trim().toLowerCase(), name.trim());
          }
        });
      }
    });
    return Array.from(map.values());
  };

  const getSelectablePatterns = () => {
    const map = new Map<string, string>();
    defaultPatterns.forEach((p) => map.set(p.toLowerCase(), p));
    customPredefinedPatterns.forEach((p) => map.set(p.toLowerCase(), p));
    problemsList.forEach((prob) => {
      if (prob.patterns && Array.isArray(prob.patterns)) {
        prob.patterns.forEach((pat: any) => {
          const name = pat.pattern?.name || pat.name;
          if (name && name.trim()) {
            map.set(name.trim().toLowerCase(), name.trim());
          }
        });
      }
    });
    return Array.from(map.values());
  };

  const predefinedTopics = getSelectableTopics();
  const predefinedCompanies = getSelectableCompanies();
  const predefinedPatterns = getSelectablePatterns();
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
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSavingSol, setIsSavingSol] = useState(false);
  const [isSavingProblem, setIsSavingProblem] = useState(false);

  // Confirm delete modals
  const [confirmDeleteProblemId, setConfirmDeleteProblemId] = useState<string | null>(null);
  const [confirmDeleteSolIdx, setConfirmDeleteSolIdx] = useState<number | null>(null);

  // Theme
  const { setTheme, resolvedTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  useEffect(() => { setThemeMounted(true); }, []);

  const [highlightedSolCode, setHighlightedSolCode] = useState("");
  const [isCodeLoading, setIsCodeLoading] = useState(false);

  useEffect(() => {
    if (activeProblem && activeProblem.solutions && activeProblem.solutions[selSolIdx]) {
      const sol = activeProblem.solutions[selSolIdx];
      setIsCodeLoading(true);
      try {
        const highlighted = highlightClientCode(sol.code, sol.lang);
        const wrapped = `<pre class="p-5 overflow-x-auto w-full language-${sol.lang.toLowerCase()}"><code>${highlighted}</code></pre>`;
        setHighlightedSolCode(wrapped);
      } catch (err) {
        console.error(err);
        setHighlightedSolCode(`<pre class="p-5 overflow-x-auto w-full"><code>${sol.code}</code></pre>`);
      }
      setIsCodeLoading(false);
    } else {
      setHighlightedSolCode("");
    }
  }, [activeProblem, selSolIdx]);

  useEffect(() => {
    if (userProfile) {
      if (!userProfile.hasCompletedOnboarding) {
        setShowOnboarding(true);
      } else {
        const storedLang = userProfile.defaultLanguage || "Python";
        setDefaultLanguage(storedLang);
        setNewSolLang(storedLang);
      }
    }
  }, [userProfile]);

  const [loading, setLoading] = useState(true);

  const handleSelectProblem = async (prob: any) => {
    if (!prob) {
      setActiveProblem(null);
      return;
    }
    setActiveProblem(prob);
    setActiveTab("solutions");
    setSelSolIdx(0);
    try {
      const fullDetails = await getProblemDetails(prob.id);
      setActiveProblem(fullDetails);
    } catch (err) {
      console.error("Failed to load problem details:", err);
    }
  };

  const loadProblems = async () => {
    try {
      const data = await getPaginatedProblems({
        page: currentPage,
        limit: rowsPerPage,
        q: searchQuery,
        difficulty: filterDiff,
        status: filterStatus,
        tag: filterTopic,
        company: filterCompany,
        pattern: filterPattern,
      });
      setProblemsList(data.items);
      setTotalProblemsCount(data.totalCount || 0);
      if (activeProblem) {
        const fullDetails = await getProblemDetails(activeProblem.id);
        setActiveProblem(fullDetails);
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
  }, [currentPage, rowsPerPage, searchQuery, filterDiff, filterStatus, filterTopic, filterCompany, filterPattern]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const problemIdParam = params.get("p");
      if (problemIdParam) {
        getProblemDetails(problemIdParam)
          .then((prob) => {
            if (prob) {
              setActiveProblem(prob);
              setActiveTab("solutions");
              setSelSolIdx(0);
            }
          })
          .catch(console.error);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleSaveOnboarding = async () => {
    try {
      await saveOnboarding(defaultLanguage);
      setUserProfile((prev: any) => ({
        ...prev,
        hasCompletedOnboarding: true,
        defaultLanguage,
      }));
      setNewSolLang(defaultLanguage);
      setShowOnboarding(false);
      showToast("Default language saved!", "success");
    } catch (err) {
      console.error("Failed to save onboarding:", err);
      showToast("Failed to save default language.", "error");
    }
  };

  const handleSaveSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSolName || !newSolCode) return;

    try {
      setIsSavingSol(true);
      const isEditing = editingSolIdx !== null;
      if (isEditing) {
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

      // Reset inputs & close modal immediately
      setIsAddingSol(false);
      setEditingSolIdx(null);
      setNewSolName("");
      setNewSolLang(defaultLanguage);
      setNewSolIntuition("");
      setNewSolApproach("");
      setNewSolCode("");
      setNewSolTime("O(N)");
      setNewSolSpace("O(1)");

      showToast(isEditing ? "Solution updated successfully!" : "Solution added successfully!", "success");

      // Parallel background refresh of problem list & active problem details
      await Promise.all([
        loadProblems(),
        activeProblem ? getProblemDetails(activeProblem.id).then(setActiveProblem).catch(console.error) : Promise.resolve(),
      ]);
    } catch (err) {
      console.error(err);
      showToast("Error saving solution", "error");
    } finally {
      setIsSavingSol(false);
    }
  };

  // Handler for simulated revisited
  const handleMarkRevisited = async (probId: string, customDays?: number) => {
    if (activeProblem?.interval?.includes("30d") && customDays === undefined && !showRevisitDaysPopup) {
      setShowRevisitDaysPopup(true);
      return;
    }

    try {
      await markRevisited(probId, customDays);
      await loadProblems();
      setActiveProblem(null);
    } catch (err) {
      console.error(err);
      showToast("Error marking revisit", "error");
    }
  };

  const handleToggleFavorite = async (probId: string) => {
    const targetProblem = activeProblem?.id === probId ? activeProblem : problemsList.find(p => p.id === probId);
    if (!targetProblem) return;
    const nextFav = !targetProblem.isFavorite;

    // Optimistic UI updates
    setProblemsList(prev => prev.map(p => p.id === probId ? { ...p, isFavorite: nextFav } : p));
    if (activeProblem && activeProblem.id === probId) {
      setActiveProblem((prev: any) => prev ? { ...prev, isFavorite: nextFav } : null);
    }
    showToast(nextFav ? "Added to favorites!" : "Removed from favorites!", "success");

    try {
      await toggleFavorite(probId);
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      // Revert on error
      setProblemsList(prev => prev.map(p => p.id === probId ? { ...p, isFavorite: !nextFav } : p));
      if (activeProblem && activeProblem.id === probId) {
        setActiveProblem((prev: any) => prev ? { ...prev, isFavorite: !nextFav } : null);
      }
      showToast("Failed to update favorite", "error");
    }
  };

  // Handler for adding/editing problem
  const handleAddProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName) return;

    const finalTopic = selectedTopics.length > 0 ? selectedTopics.join(", ") : "General DSA";

    try {
      setIsSavingProblem(true);
      const isEditing = editingProblemId !== null;
      if (isEditing) {
        await updateProblem(editingProblemId, {
          name: addName,
          difficulty: addDiff,
          topic: finalTopic,
          url: addUrl || "#",
          isPublic: addIsPublic,
          companyNames: selectedCompanies,
          patternNames: selectedPatterns,
        });
        showToast("Problem updated successfully!", "success");
      } else {
        await createProblem({
          name: addName,
          difficulty: addDiff,
          topic: finalTopic,
          url: addUrl || "#",
          isPublic: addIsPublic,
          companyNames: selectedCompanies,
          patternNames: selectedPatterns,
        });
        showToast("Problem created successfully!", "success");
      }

      // Close modal & reset inputs immediately
      setEditingProblemId(null);
      setIsAddProblemOpen(false);
      setAddName("");
      setAddNum("");
      setAddUrl("");
      setSelectedTopics([]);
      setSelectedCompanies([]);
      setSelectedPatterns([]);
      setAddDiff("EASY");
      setAddIsPublic(false);

      await loadProblems();
    } catch (err) {
      console.error(err);
      showToast("Error saving problem", "error");
    } finally {
      setIsSavingProblem(false);
    }
  };
  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    showToast("Code copied to clipboard!", "success");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredProblems = problemsList;
  const totalPages = Math.ceil(totalProblemsCount / rowsPerPage);
  const paginatedProblems = problemsList;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }
    return pages;
  };

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

            <NotificationBell onSelectProblem={(pid) => {
              const prob = problemsList.find(p => p.id === pid);
              if (prob) handleSelectProblem(prob);
            }} />

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
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          signOut({ callbackUrl: "/login" });
                        }}
                        className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-rose-500 hover:bg-rose-500/5 transition-colors border-t border-border cursor-pointer"
                      >
                        Logout
                      </button>
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
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none font-sans text-xs text-foreground placeholder:text-muted/60 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-border/20 transition-all cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">

              {/* Filter Dropdown Toggle */}
              <div className="relative">
                {(() => {
                  const isFilterActive =
                    filterDiff !== "ALL" ||
                    filterStatus !== "ALL" ||
                    filterTopic !== "ALL" ||
                    filterCompany !== "ALL" ||
                    filterPattern !== "ALL";
                  return (
                    <button
                      onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-sans font-bold text-xs cursor-pointer transition-all shadow-sm ${
                        isFilterDropdownOpen || isFilterActive
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-surface-2 border-border hover:bg-border/20 text-foreground"
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>Filter</span>
                      {isFilterActive && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })()}

                <AnimatePresence>
                  {isFilterDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsFilterDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 mt-2 z-20 w-64 bg-surface border border-border rounded-xl shadow-xl p-4 font-sans text-xs space-y-3"
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

                        <div className="pt-2.5 border-t border-border/40">
                          <span className="block font-semibold text-muted mb-1.5 uppercase tracking-wide text-[9px]">Tags</span>
                          <input
                            type="text"
                            placeholder="Search topics..."
                            value={topicSearchQuery}
                            onChange={(e) => setTopicSearchQuery(e.target.value)}
                            className="w-full px-2 py-1.5 mb-2 rounded bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-[10px] text-foreground placeholder:text-muted/65"
                          />
                          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                            <button
                              onClick={() => setFilterTopic("ALL")}
                              className={`px-2 py-1 rounded-lg border font-bold text-[9px] cursor-pointer transition-all ${filterTopic === "ALL"
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "bg-surface-2 border-border text-muted hover:text-foreground"
                                }`}
                            >
                              ALL
                            </button>
                            {predefinedTopics
                              .filter((topic) => topic.toLowerCase().includes(topicSearchQuery.toLowerCase()))
                              .map((topic) => (
                                <button
                                  key={topic}
                                  onClick={() => setFilterTopic(topic)}
                                  className={`px-2 py-1 rounded-lg border font-bold text-[9px] cursor-pointer transition-all ${filterTopic === topic
                                      ? "bg-primary/10 border-primary text-primary"
                                      : "bg-surface-2 border-border text-muted hover:text-foreground"
                                    }`}
                                >
                                  {topic}
                                </button>
                              ))}
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-border/40">
                          <span className="block font-semibold text-muted mb-1.5 uppercase tracking-wide text-[9px]">Company</span>
                          <input
                            type="text"
                            placeholder="Search companies..."
                            value={companySearchQuery}
                            onChange={(e) => setCompanySearchQuery(e.target.value)}
                            className="w-full px-2 py-1.5 mb-2 rounded bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-[10px] text-foreground placeholder:text-muted/65"
                          />
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                            <button
                              onClick={() => setFilterCompany("ALL")}
                              className={`px-2 py-1 rounded-lg border font-bold text-[9px] cursor-pointer transition-all ${filterCompany === "ALL"
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "bg-surface-2 border-border text-muted hover:text-foreground"
                                }`}
                            >
                              ALL
                            </button>
                            {predefinedCompanies
                              .filter((c) => c.toLowerCase().includes(companySearchQuery.toLowerCase()))
                              .map((comp) => (
                                <button
                                  key={comp}
                                  onClick={() => setFilterCompany(comp)}
                                  className={`px-2 py-1 rounded-lg border font-bold text-[9px] cursor-pointer transition-all ${filterCompany === comp
                                      ? "bg-amber-500/15 border-amber-500 text-amber-500 font-extrabold"
                                      : "bg-surface-2 border-border text-muted hover:text-foreground"
                                    }`}
                                >
                                  {comp}
                                </button>
                              ))}
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-border/40">
                          <span className="block font-semibold text-muted mb-1.5 uppercase tracking-wide text-[9px]">Pattern</span>
                          <input
                            type="text"
                            placeholder="Search patterns..."
                            value={patternSearchQuery}
                            onChange={(e) => setPatternSearchQuery(e.target.value)}
                            className="w-full px-2 py-1.5 mb-2 rounded bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-[10px] text-foreground placeholder:text-muted/65"
                          />
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                            <button
                              onClick={() => setFilterPattern("ALL")}
                              className={`px-2 py-1 rounded-lg border font-bold text-[9px] cursor-pointer transition-all ${filterPattern === "ALL"
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "bg-surface-2 border-border text-muted hover:text-foreground"
                                }`}
                            >
                              ALL
                            </button>
                            {predefinedPatterns
                              .filter((p) => p.toLowerCase().includes(patternSearchQuery.toLowerCase()))
                              .map((pat) => (
                                <button
                                  key={pat}
                                  onClick={() => setFilterPattern(pat)}
                                  className={`px-2 py-1 rounded-lg border font-bold text-[9px] cursor-pointer transition-all ${filterPattern === pat
                                      ? "bg-cyan-500/15 border-cyan-500 text-cyan-500 font-extrabold"
                                      : "bg-surface-2 border-border text-muted hover:text-foreground"
                                    }`}
                                >
                                  {pat}
                                </button>
                              ))}
                          </div>
                        </div>

                        {(filterDiff !== "ALL" || filterStatus !== "ALL" || filterTopic !== "ALL" || filterCompany !== "ALL" || filterPattern !== "ALL" || searchQuery !== "") && (
                          <div className="pt-2 border-t border-border/40 flex justify-end">
                            <button
                              onClick={() => {
                                setFilterDiff("ALL");
                                setFilterStatus("ALL");
                                setFilterTopic("ALL");
                                setFilterCompany("ALL");
                                setFilterPattern("ALL");
                                setSearchQuery("");
                                setTopicSearchQuery("");
                                setCompanySearchQuery("");
                                setPatternSearchQuery("");
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
                onClick={() => {
                  setEditingProblemId(null);
                  setAddName("");
                  setAddNum("");
                  setAddUrl("");
                  setSelectedTopics([]);
                  setSelectedCompanies([]);
                  setSelectedPatterns([]);
                  setAddDiff("EASY");
                  setAddIsPublic(false);
                  setIsAddProblemOpen(true);
                }}
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
                  <th className="pb-3.5 pl-2 w-20 min-w-[80px]">Difficulty</th>
                  <th className="pb-3.5 min-w-[180px]">Problem</th>
                  <th className="pb-3.5 min-w-[150px]">Tags</th>
                  <th className="pb-3.5 min-w-[100px]">Status</th>
                  <th className="pb-3.5 text-right pr-2 min-w-[90px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {loading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="border-b border-border/30">
                      <td className="py-4 pl-2">
                        <Skeleton className="h-5 w-14 rounded" />
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-44 rounded-lg" />
                          <Skeleton className="w-3.5 h-3.5 rounded" />
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1.5">
                          <Skeleton className="h-4 w-16 rounded-md" />
                          <Skeleton className="h-4 w-12 rounded-md" />
                        </div>
                      </td>
                      <td className="py-4">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </td>
                      <td className="py-4 text-right pr-2">
                        <div className="flex items-center justify-end gap-2">
                          <Skeleton className="w-8 h-8 rounded-lg" />
                          <Skeleton className="w-8 h-8 rounded-lg" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : paginatedProblems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-muted font-sans text-xs">
                      No problems found.
                    </td>
                  </tr>
                ) : (
                  paginatedProblems.map((prob, idx) => (
                    <tr
                      key={idx}
                      onClick={() => {
                        handleSelectProblem(prob);
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

                      {/* Tags */}
                      <td className="py-4 font-sans text-xs">
                        <div className="flex flex-wrap gap-1.5 max-w-xs sm:max-w-md">
                          {prob.topic.split(",").map((topic: string, i: number) => {
                            const trimmed = topic.trim();
                            if (!trimmed) return null;
                            return (
                              <span key={`t-${i}`} className="px-2 py-0.5 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 text-primary dark:text-primary-foreground font-bold text-[9px] font-sans whitespace-nowrap shadow-sm">
                                {trimmed}
                              </span>
                            );
                          })}
                          {prob.companies && prob.companies.map((c: any, i: number) => {
                            const name = c.company?.name || c.name;
                            if (!name) return null;
                            return (
                              <span key={`c-${i}`} className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-500 font-bold text-[9px] font-sans whitespace-nowrap shadow-sm">
                                {name}
                              </span>
                            );
                          })}
                          {prob.patterns && prob.patterns.map((p: any, i: number) => {
                            const name = p.pattern?.name || p.name;
                            if (!name) return null;
                            return (
                              <span key={`p-${i}`} className="px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-500 font-bold text-[9px] font-sans whitespace-nowrap shadow-sm">
                                {name}
                              </span>
                            );
                          })}
                        </div>
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
                              setEditingProblemId(prob.id);
                              setAddName(prob.name);
                              setAddUrl(prob.url === "#" ? "" : prob.url);
                              setAddDiff(prob.difficulty);
                              setSelectedTopics(prob.topic.split(",").map((t: string) => t.trim()));
                              setSelectedCompanies(prob.companies ? prob.companies.map((c: any) => c.company?.name || c.name || "").filter(Boolean) : []);
                              setSelectedPatterns(prob.patterns ? prob.patterns.map((p: any) => p.pattern?.name || p.name || "").filter(Boolean) : []);
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
                            onClick={() => setConfirmDeleteProblemId(prob.id)}
                            className="w-8 h-8 rounded-lg bg-rose-500/5 border border-rose-500/20 flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                            title="Delete Problem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
                  {getPageNumbers().map((pageNum, idx) => {
                    if (pageNum === "...") {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2.5 py-1.5 text-muted select-none font-bold">
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum as number)}
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
              className="w-full max-w-4xl max-h-[85vh] rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden flex flex-col justify-between"
            >

              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b border-border/80 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                    <span className="font-display font-extrabold text-xl text-foreground break-words min-w-0">
                      {activeProblem.name}
                    </span>
                    {(() => {
                      const slug =
                        activeProblem.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || activeProblem.id;
                      return (
                        <a
                          href={`/problem/${slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-muted hover:text-foreground transition-colors shrink-0"
                          title="Open View-Only Problem Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      );
                    })()}
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
                        <span key={`dt-${i}`} className="px-2 py-0.5 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 text-primary dark:text-primary-foreground font-bold text-[9px] font-sans whitespace-nowrap shadow-sm">
                          {trimmed}
                        </span>
                      );
                    })}

                    {activeProblem.companies && activeProblem.companies.map((c: any, i: number) => {
                      const name = c.company?.name || c.name;
                      if (!name) return null;
                      return (
                        <span key={`dc-${i}`} className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-500 font-bold text-[9px] font-sans whitespace-nowrap shadow-sm">
                          {name}
                        </span>
                      );
                    })}

                    {activeProblem.patterns && activeProblem.patterns.map((p: any, i: number) => {
                      const name = p.pattern?.name || p.name;
                      if (!name) return null;
                      return (
                        <span key={`dp-${i}`} className="px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-500 font-bold text-[9px] font-sans whitespace-nowrap shadow-sm">
                          {name}
                        </span>
                      );
                    })}

                    <span>•</span>
                    <span className="italic">{activeProblem.interval}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Desktop Actions (hidden on mobile) */}
                  <div className="hidden sm:flex items-center gap-2">
                    {/* Public Sharing Toggle */}
                    <button
                      onClick={async () => {
                        try {
                          const companyNames = activeProblem.companies
                            ? activeProblem.companies.map((c: any) => c.company?.name || c.name).filter(Boolean)
                            : undefined;
                          const patternNames = activeProblem.patterns
                            ? activeProblem.patterns.map((p: any) => p.pattern?.name || p.name).filter(Boolean)
                            : undefined;

                          const updated = await updateProblem(activeProblem.id, {
                            name: activeProblem.name,
                            difficulty: activeProblem.difficulty,
                            topic: activeProblem.topic,
                            url: activeProblem.url,
                            isPublic: !activeProblem.isPublic,
                            companyNames,
                            patternNames,
                          });
                          setActiveProblem((prev: any) => ({ ...prev, ...updated, isPublic: updated.isPublic }));
                          await loadProblems();
                          showToast(updated.isPublic ? "Public sharing enabled!" : "Public sharing disabled", "success");
                        } catch (err) {
                          console.error("Failed to toggle public visibility:", err);
                          showToast("Failed to update public visibility", "error");
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
                      onClick={() => handleToggleFavorite(activeProblem.id)}
                      className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-muted hover:text-foreground active:scale-95 transition-all cursor-pointer"
                    >
                      <Star className={`w-5 h-5 ${activeProblem.isFavorite ? "text-accent fill-accent" : "text-muted"}`} />
                    </button>

                    {/* Share button */}
                    {activeProblem.isPublic && (
                      <button
                        onClick={() => {
                          const slug = activeProblem.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                          const shareUrl = `${window.location.origin}/problem/${slug}`;
                          navigator.clipboard.writeText(shareUrl);
                          showToast("Public link copied to clipboard!", "success");
                        }}
                        className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-muted hover:text-foreground active:scale-95 transition-all cursor-pointer"
                        title="Copy Public Share Link"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Mobile Dropdown Trigger & Options */}
                  <div className="relative sm:hidden">
                    <button
                      onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center active:scale-95 transition-all cursor-pointer z-50 relative ${
                        isMoreMenuOpen 
                          ? "bg-surface-3 border-primary/30 text-primary" 
                          : "bg-surface-2 border-border text-muted hover:text-foreground"
                      }`}
                      title="More Options"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {isMoreMenuOpen && (
                      <div 
                        className="fixed inset-0 z-40 cursor-default" 
                        onClick={() => setIsMoreMenuOpen(false)} 
                      />
                    )}

                    <AnimatePresence>
                      {isMoreMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-border bg-surface-2 p-1.5 shadow-xl z-50 font-sans"
                        >
                          {/* Toggle Public Sharing */}
                          <button
                            onClick={async () => {
                              setIsMoreMenuOpen(false);
                              try {
                                const companyNames = activeProblem.companies
                                  ? activeProblem.companies.map((c: any) => c.company?.name || c.name).filter(Boolean)
                                  : undefined;
                                const patternNames = activeProblem.patterns
                                  ? activeProblem.patterns.map((p: any) => p.pattern?.name || p.name).filter(Boolean)
                                  : undefined;

                                const updated = await updateProblem(activeProblem.id, {
                                  name: activeProblem.name,
                                  difficulty: activeProblem.difficulty,
                                  topic: activeProblem.topic,
                                  url: activeProblem.url,
                                  isPublic: !activeProblem.isPublic,
                                  companyNames,
                                  patternNames,
                                });
                                setActiveProblem((prev: any) => ({ ...prev, ...updated, isPublic: updated.isPublic }));
                                await loadProblems();
                                showToast(updated.isPublic ? "Public sharing enabled!" : "Public sharing disabled", "success");
                              } catch (err) {
                                console.error("Failed to toggle public visibility:", err);
                                showToast("Failed to update public visibility", "error");
                              }
                            }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
                          >
                            {activeProblem.isPublic ? (
                              <>
                                <Lock className="w-4 h-4 text-muted shrink-0" />
                                <span>Make Private</span>
                              </>
                            ) : (
                              <>
                                <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>Make Public</span>
                              </>
                            )}
                          </button>

                          {/* Toggle Favorite */}
                          <button
                            onClick={() => {
                              setIsMoreMenuOpen(false);
                              handleToggleFavorite(activeProblem.id);
                            }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
                          >
                            <Star className={`w-4 h-4 shrink-0 ${activeProblem.isFavorite ? "text-accent fill-accent" : "text-muted"}`} />
                            <span>{activeProblem.isFavorite ? "Remove Favorite" : "Mark as Favorite"}</span>
                          </button>

                          {/* Copy Share Link */}
                          {activeProblem.isPublic && (
                            <button
                              onClick={() => {
                                setIsMoreMenuOpen(false);
                                const slug = activeProblem.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                                const shareUrl = `${window.location.origin}/problem/${slug}`;
                                navigator.clipboard.writeText(shareUrl);
                                showToast("Public link copied to clipboard!", "success");
                              }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
                            >
                              <Share2 className="w-4 h-4 shrink-0" />
                              <span>Copy Share Link</span>
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                   {/* Close button */}
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setActiveProblem(null);
                    }}
                    className="hidden sm:flex w-10 h-10 rounded-xl bg-surface-2 border border-border items-center justify-center text-muted hover:text-rose-500 active:scale-95 transition-all cursor-pointer z-10"
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
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4 w-full min-w-0">
                          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none max-w-full pb-2 -mb-2 shrink min-w-0">
                            {activeProblem.solutions.map((sol: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => setSelSolIdx(idx)}
                                className={`px-4 py-2 rounded-xl border font-sans font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 ${selSolIdx === idx
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "border-border bg-surface-2/40 text-muted hover:bg-surface-2 hover:text-foreground"
                                  }`}
                              >
                                <span>{sol.name || sol.lang}</span>
                                <span className="text-[9px] bg-primary/10 px-1.5 py-0.5 rounded-md font-mono">{sol.time}</span>
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-start sm:justify-end shrink-0">
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

                          {/* Simulated Monaco code */}
                          <div className="rounded-xl overflow-hidden font-mono text-[11px] leading-relaxed [&>pre]:p-5 [&>pre]:overflow-x-auto [&>pre]:w-full min-h-[150px] flex flex-col justify-center bg-surface dark:bg-[#1A1A1F] border border-border has-line-numbers">
                            {isCodeLoading || !highlightedSolCode ? (
                              <div className="p-6 space-y-3 w-full">
                                <Skeleton className="h-3.5 w-1/4 rounded" />
                                <Skeleton className="h-3.5 w-3/5 rounded" />
                                <Skeleton className="h-3.5 w-2/5 rounded" />
                                <Skeleton className="h-3.5 w-4/5 rounded" />
                                <Skeleton className="h-3.5 w-1/3 rounded" />
                              </div>
                            ) : (
                              <div 
                                className="w-full"
                                dangerouslySetInnerHTML={{ __html: highlightedSolCode }} 
                              />
                            )}
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
                                                const text = editingSolNoteText.trim();
                                                if (n.id) {
                                                  updateSolutionNote(n.id, text).catch(console.error);
                                                }
                                                const updatedSols = activeProblem.solutions.map((s: any, idx: number) => {
                                                  if (idx !== selSolIdx) return s;
                                                  const newNotes = [...(s.notes || [])];
                                                  newNotes[ni] = { ...newNotes[ni], text };
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
                                            onClick={async () => {
                                              if (!editingSolNoteText.trim()) return;
                                              const text = editingSolNoteText.trim();
                                              if (n.id) {
                                                updateSolutionNote(n.id, text).catch(console.error);
                                              }
                                              const updatedSols = activeProblem.solutions.map((s: any, idx: number) => {
                                                if (idx !== selSolIdx) return s;
                                                const newNotes = [...(s.notes || [])];
                                                newNotes[ni] = { ...newNotes[ni], text };
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
                                                setEditingSolNoteSolIdx(selSolIdx);
                                              }}
                                              className="p-1 text-amber-500 hover:text-amber-400 transition-all cursor-pointer shrink-0"
                                              title="Edit note"
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => {
                                                if (n.id) {
                                                  deleteSolutionNote(n.id).catch(console.error);
                                                }
                                                const updatedSols = activeProblem.solutions.map((s: any, idx: number) =>
                                                  idx !== selSolIdx ? s : { ...s, notes: (s.notes || []).filter((_: any, fi: number) => fi !== ni) }
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
                                      const text = newSolNoteText.trim();
                                      const sol = activeProblem.solutions[selSolIdx];
                                      if (!sol?.id) return;
                                      setNewSolNoteText("");
                                      try {
                                        const created = await addSolutionNote(sol.id, newSolNoteType, text);
                                        const updatedSols = activeProblem.solutions.map((s: any, idx: number) => {
                                          if (idx !== selSolIdx) return s;
                                          return { ...s, notes: [...(s.notes || []), created] };
                                        });
                                        const up = { ...activeProblem, solutions: updatedSols };
                                        setProblemsList(prev => prev.map(p => p.num === activeProblem.num ? up : p));
                                        setActiveProblem(up);
                                        showToast("Solution note added!", "success");
                                      } catch (err) {
                                        console.error(err);
                                        showToast("Failed to add solution note", "error");
                                      }
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border focus:border-primary/50 focus:outline-none font-sans text-xs text-foreground placeholder:text-muted/60 transition-all"
                                />
                                <button
                                  onClick={async () => {
                                    if (!newSolNoteText.trim()) return;
                                    const text = newSolNoteText.trim();
                                    const sol = activeProblem.solutions[selSolIdx];
                                    if (!sol?.id) return;
                                    setNewSolNoteText("");
                                    try {
                                      const created = await addSolutionNote(sol.id, newSolNoteType, text);
                                      const updatedSols = activeProblem.solutions.map((s: any, idx: number) => {
                                        if (idx !== selSolIdx) return s;
                                        return { ...s, notes: [...(s.notes || []), created] };
                                      });
                                      const up = { ...activeProblem, solutions: updatedSols };
                                      setProblemsList(prev => prev.map(p => p.num === activeProblem.num ? up : p));
                                      setActiveProblem(up);
                                      showToast("Solution note added!", "success");
                                    } catch (err) {
                                      console.error(err);
                                      showToast("Failed to add solution note", "error");
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
                          if (!newNoteText.trim()) return;
                          const text = newNoteText.trim();
                          setNewNoteText("");
                          try {
                            const created = await addNote(activeProblem.id, text);
                            const updatedNotes = [...(activeProblem.notes || []), created];
                            setActiveProblem((prev: any) => prev ? { ...prev, notes: updatedNotes } : null);
                            showToast("Note added successfully!", "success");
                          } catch (err) {
                            console.error(err);
                            showToast("Failed to add note", "error");
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
                                    if (!editingNoteText.trim()) return;
                                    const text = editingNoteText.trim();
                                    try {
                                      await updateNote(note.id, text);
                                      const updatedNotes = (activeProblem.notes || []).map((n: any) => n.id === note.id ? { ...n, text } : n);
                                      setActiveProblem((prev: any) => prev ? { ...prev, notes: updatedNotes } : null);
                                      setEditingNoteIdx(null);
                                      setEditingNoteText("");
                                      showToast("Note updated successfully!", "success");
                                    } catch (err) {
                                      console.error(err);
                                      showToast("Failed to update note", "error");
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
                                        const updatedNotes = (activeProblem.notes || []).filter((n: any) => n.id !== note.id);
                                        setActiveProblem((prev: any) => prev ? { ...prev, notes: updatedNotes } : null);
                                        showToast("Note deleted successfully!", "success");
                                      } catch (err) {
                                        console.error(err);
                                        showToast("Failed to delete note", "error");
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
                    onClick={() => handleMarkRevisited(activeProblem.id)}
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
                    handleMarkRevisited(activeProblem.id, days);
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
      {/* 5. ADD / EDIT PROBLEM MODAL (Wide Responsive Layout with Custom Scroll)   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddProblemOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-4xl lg:max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden"
            >
              {/* Fixed Modal Header */}
              <div className="px-6 py-5 border-b border-border/80 flex items-center justify-between shrink-0 bg-surface">
                <div>
                  <h2 className="font-display font-extrabold text-lg sm:text-xl text-foreground flex items-center gap-2">
                    <Code className="w-5 h-5 text-primary" />
                    {editingProblemId !== null ? "Update Coding Problem" : "Add Coding Problem"}
                  </h2>
                  <p className="text-xs text-muted font-sans mt-0.5">
                    Catalog algorithmic challenges with targeted company tags and design patterns.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddProblemOpen(false)}
                  className="w-9 h-9 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleAddProblem} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 font-sans text-xs custom-scrollbar">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Left Column: Problem Details */}
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-surface-2/30 border border-border/60 space-y-4">
                        <span className="block font-bold text-foreground uppercase tracking-wider text-[10px]">
                          Problem Specifications
                        </span>

                        <div>
                          <label className="block font-semibold text-muted mb-1.5 uppercase tracking-wide text-[10px]">
                            Problem Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 3Sum, LRU Cache, Word Ladder"
                            value={addName}
                            onChange={(e) => setAddName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none text-foreground font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-muted mb-1.5 uppercase tracking-wide text-[10px]">
                            Problem URL
                          </label>
                          <input
                            type="url"
                            placeholder="https://leetcode.com/problems/... (or Codeforces, GFG)"
                            value={addUrl}
                            onChange={(e) => setAddUrl(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none text-foreground"
                          />
                        </div>

                        {/* Difficulty Dropdown */}
                        <div className="relative">
                          <label className="block font-semibold text-muted mb-1.5 uppercase tracking-wide text-[10px]">
                            Difficulty Level
                          </label>

                          <button
                            type="button"
                            onClick={() => setIsDiffDropdownOpen(!isDiffDropdownOpen)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary focus:outline-none text-foreground font-semibold flex items-center justify-between cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${addDiff === "EASY" ? "bg-emerald-500" : addDiff === "MED" ? "bg-amber-500" : "bg-rose-500"}`} />
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
                                      {addDiff === item.value && <Check className="w-4 h-4 text-primary" />}
                                    </button>
                                  ))}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Public Sharing Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface/50">
                          <div className="flex flex-col gap-0.5 font-sans">
                            <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                              <Globe className="w-3.5 h-3.5 text-emerald-400" />
                              Public Sharing
                            </span>
                            <span className="text-[10px] text-muted">
                              Share problem and solutions via public profile.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAddIsPublic(!addIsPublic)}
                            className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${addIsPublic ? "bg-primary" : "bg-border"}`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${addIsPublic ? "translate-x-5" : "translate-x-0"}`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Topic Categories */}
                      <div className="p-4 rounded-2xl bg-surface-2/30 border border-border/60 space-y-3">
                        <label className="block font-bold text-foreground uppercase tracking-wider text-[10px]">
                          Topic Categories (Select or Create)
                        </label>

                        {/* Select pill tag cloud */}
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl border border-border bg-surface/50 custom-scrollbar">
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
                                className={`px-2.5 py-1 rounded-lg border font-sans font-bold text-[10px] transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-primary/20 border-primary text-primary shadow-sm scale-[1.02]"
                                    : "border-border bg-surface-2/40 text-muted hover:bg-border/30 hover:text-foreground"
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
                            placeholder="Add custom topic category..."
                            value={customTopicInput}
                            onChange={(e) => setCustomTopicInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (!customTopicInput.trim()) return;
                                const newTag = customTopicInput.trim();
                                if (!predefinedTopics.includes(newTag)) {
                                  setCustomPredefinedTopics([...customPredefinedTopics, newTag]);
                                }
                                if (!selectedTopics.includes(newTag)) {
                                  setSelectedTopics([...selectedTopics, newTag]);
                                }
                                setCustomTopicInput("");
                              }
                            }}
                            className="flex-1 px-3 py-2 rounded-xl bg-surface-2 border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted/60 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!customTopicInput.trim()) return;
                              const newTag = customTopicInput.trim();
                              if (!predefinedTopics.includes(newTag)) {
                                setCustomPredefinedTopics([...customPredefinedTopics, newTag]);
                              }
                              if (!selectedTopics.includes(newTag)) {
                                setSelectedTopics([...selectedTopics, newTag]);
                              }
                              setCustomTopicInput("");
                            }}
                            className="px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold cursor-pointer transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Company Tags & Algorithmic Patterns */}
                    <div className="space-y-4">
                      {/* Target Companies (Asked By) */}
                      <div className="p-4 rounded-2xl bg-surface-2/30 border border-border/60 space-y-3">
                        <label className="block font-bold text-foreground uppercase tracking-wider text-[10px] flex items-center justify-between">
                          <span>Target Companies (Asked By)</span>
                          <span className="text-muted font-normal text-[9px]">{selectedCompanies.length} selected</span>
                        </label>

                        {/* Select pill tag cloud without icons */}
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 rounded-xl border border-border bg-surface/50 custom-scrollbar">
                          {predefinedCompanies.map((comp) => {
                            const isSelected = selectedCompanies.includes(comp);
                            return (
                              <button
                                key={comp}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedCompanies(selectedCompanies.filter((c) => c !== comp));
                                  } else {
                                    setSelectedCompanies([...selectedCompanies, comp]);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg border font-sans font-bold text-[10px] transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-500/20 border-amber-500 text-amber-500 shadow-sm scale-[1.02]"
                                    : "border-border bg-surface-2/40 text-muted hover:bg-border/30 hover:text-foreground"
                                }`}
                              >
                                {comp}
                              </button>
                            );
                          })}
                        </div>

                        {/* Inline company custom builder */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add company (e.g. Airbnb, ByteDance, Stripe)..."
                            value={customCompanyInput}
                            onChange={(e) => setCustomCompanyInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (!customCompanyInput.trim()) return;
                                const newComp = customCompanyInput.trim();
                                if (!customPredefinedCompanies.some(c => c.toLowerCase() === newComp.toLowerCase())) {
                                  setCustomPredefinedCompanies((prev) => [...prev, newComp]);
                                }
                                if (!selectedCompanies.some(c => c.toLowerCase() === newComp.toLowerCase())) {
                                  setSelectedCompanies((prev) => [...prev, newComp]);
                                }
                                setCustomCompanyInput("");
                              }
                            }}
                            className="flex-1 px-3 py-2 rounded-xl bg-surface-2 border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted/60 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!customCompanyInput.trim()) return;
                              const newComp = customCompanyInput.trim();
                              if (!customPredefinedCompanies.some(c => c.toLowerCase() === newComp.toLowerCase())) {
                                setCustomPredefinedCompanies((prev) => [...prev, newComp]);
                              }
                              if (!selectedCompanies.some(c => c.toLowerCase() === newComp.toLowerCase())) {
                                setSelectedCompanies((prev) => [...prev, newComp]);
                              }
                              setCustomCompanyInput("");
                            }}
                            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 font-bold cursor-pointer transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Algorithmic Patterns */}
                      <div className="p-4 rounded-2xl bg-surface-2/30 border border-border/60 space-y-3">
                        <label className="block font-bold text-foreground uppercase tracking-wider text-[10px] flex items-center justify-between">
                          <span>Algorithmic Patterns</span>
                          <span className="text-muted font-normal text-[9px]">{selectedPatterns.length} selected</span>
                        </label>

                        {/* Select pill tag cloud without icons */}
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 rounded-xl border border-border bg-surface/50 custom-scrollbar">
                          {predefinedPatterns.map((pattern) => {
                            const isSelected = selectedPatterns.includes(pattern);
                            return (
                              <button
                                key={pattern}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedPatterns(selectedPatterns.filter((p) => p !== pattern));
                                  } else {
                                    setSelectedPatterns([...selectedPatterns, pattern]);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg border font-sans font-bold text-[10px] transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-500 shadow-sm scale-[1.02]"
                                    : "border-border bg-surface-2/40 text-muted hover:bg-border/30 hover:text-foreground"
                                }`}
                              >
                                {pattern}
                              </button>
                            );
                          })}
                        </div>

                        {/* Inline pattern custom builder */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add pattern (e.g. Union Find, Line Sweep)..."
                            value={customPatternInput}
                            onChange={(e) => setCustomPatternInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (!customPatternInput.trim()) return;
                                const newPat = customPatternInput.trim();
                                if (!customPredefinedPatterns.some(p => p.toLowerCase() === newPat.toLowerCase())) {
                                  setCustomPredefinedPatterns((prev) => [...prev, newPat]);
                                }
                                if (!selectedPatterns.some(p => p.toLowerCase() === newPat.toLowerCase())) {
                                  setSelectedPatterns((prev) => [...prev, newPat]);
                                }
                                setCustomPatternInput("");
                              }
                            }}
                            className="flex-1 px-3 py-2 rounded-xl bg-surface-2 border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted/60 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!customPatternInput.trim()) return;
                              const newPat = customPatternInput.trim();
                              if (!customPredefinedPatterns.some(p => p.toLowerCase() === newPat.toLowerCase())) {
                                setCustomPredefinedPatterns((prev) => [...prev, newPat]);
                              }
                              if (!selectedPatterns.some(p => p.toLowerCase() === newPat.toLowerCase())) {
                                setSelectedPatterns((prev) => [...prev, newPat]);
                              }
                              setCustomPatternInput("");
                            }}
                            className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 border border-cyan-500/20 font-bold cursor-pointer transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fixed Modal Footer */}
                <div className="px-6 py-4 border-t border-border/80 flex items-center justify-end gap-3 shrink-0 bg-surface">
                  <button
                    type="button"
                    onClick={() => setIsAddProblemOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-border hover:bg-surface-2 text-foreground font-bold font-sans cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProblem}
                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold font-sans cursor-pointer transition-all shadow-md shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSavingProblem ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{editingProblemId !== null ? "Updating Problem..." : "Adding Problem..."}</span>
                      </>
                    ) : (
                      <span>{editingProblemId !== null ? "Update Problem" : "Add Problem"}</span>
                    )}
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
        {confirmDeleteProblemId !== null && (() => {
          const prob = problemsList.find((p) => p.id === confirmDeleteProblemId);
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
                    onClick={() => setConfirmDeleteProblemId(null)}
                    className="px-4 py-2 rounded-xl border border-border hover:bg-surface-2 text-foreground font-bold font-sans text-xs cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (confirmDeleteProblemId !== null) {
                        try {
                          await deleteProblem(confirmDeleteProblemId);
                          setProblemsList((prev) => prev.filter((p) => p.id !== confirmDeleteProblemId));
                          if (activeProblem?.id === confirmDeleteProblemId) {
                            setActiveProblem(null);
                          }
                          setConfirmDeleteProblemId(null);
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
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-2 dark:bg-[#1A1A1F] border border-border focus:border-primary/50 focus:outline-none text-foreground dark:text-slate-200 font-mono text-[11px] placeholder:text-muted/50 resize-y overflow-x-hidden leading-relaxed"
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
                    disabled={isSavingSol}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold cursor-pointer transition-colors shadow-md shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSavingSol ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Solution</span>
                    )}
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
