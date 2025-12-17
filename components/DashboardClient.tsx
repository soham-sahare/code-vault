"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Plus, Clock, CheckCircle, Trash2, Pencil, ArrowRight, RotateCcw } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import AddProblemModal from "./AddProblemModal";
import ViewProblemModal from "./ViewProblemModal";
import { deleteProblem } from "@/actions/problem";
import { toast } from "sonner";
import { Select } from "./ui/SelectUtils";
import ConfirmationModal from "./ConfirmationModal";
import { getDifficultyColor, formatDate } from "@/lib/utils";
import { FILTER_DIFFICULTY_OPTIONS } from "@/lib/constants";

interface Problem {
  _id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string[];
  tags: string[];
  status: "Solved" | "Unsolved" | "Todo";
  lastPracticed: string;
  nextReviewDate: string;
  intuition?: string; 
  link?: string;
}

interface Stats {
  total: number;
  solved: number;
  byDifficulty: { _id: string; count: number }[];
  byTopic: { _id: string; count: number }[];
  byTag: { _id: string; count: number }[];
  distinctTopics: string[];
  distinctTags: string[];
  byTimeComplexity?: { _id: string; count: number }[];
  bySpaceComplexity?: { _id: string; count: number }[];
  activityTimeline?: { _id: string; count: number }[];
}

export default function DashboardClient({ initialProblems, stats }: { initialProblems: Problem[]; stats: Stats }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  
  useEffect(() => {
    const viewProblemId = searchParams.get("viewProblem");
    if (viewProblemId) {
       const problem = initialProblems.find(p => p._id === viewProblemId);
       setSelectedProblemId(viewProblemId);
       setSelectedProblem(problem || null);
    }
  }, [searchParams, initialProblems]);

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) params.set("search", term);
    else params.delete("search");
    startTransition(() => {
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    });
  }, 300);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`, { scroll: false });
    });
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmModal({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.id) return;
    
    const res = await deleteProblem(confirmModal.id);
    if ('error' in res) {
        toast.error(res.error || "Failed to delete problem");
    } else {
        toast.success("Problem deleted");
    }
    setConfirmModal({ isOpen: false, id: null });
  };

  const handleEdit = (e: React.MouseEvent, problem: Problem) => {
    e.stopPropagation();
    setEditingProblem(problem);
    setShowAddModal(true);
  };

  const handleRowClick = (problem: Problem) => {
    setSelectedProblem(problem);
    setSelectedProblemId(problem._id);
  };

  const topicOptions = [
      { label: "All Topics", value: "" },
      ...stats.distinctTopics.map(t => ({ label: t, value: t }))
  ];

  const tagOptions = [
      { label: "All Tags", value: "" },
      ...stats.distinctTags.map(t => ({ label: t, value: t }))
  ];

  // Client-side filtering for instant feedback
  const filteredProblems = useMemo(() => {
    const term = (searchParams.get("search") || "").toLowerCase();
    const difficulty = searchParams.get("difficulty");
    const topic = searchParams.get("topic");
    const tags = searchParams.get("tags");
    const status = searchParams.get("status");

    return initialProblems.filter(p => {
        if (term && !p.title.toLowerCase().includes(term)) return false;
        if (difficulty && p.difficulty !== difficulty) return false;
        if (topic && !p.topic.includes(topic)) return false;
        if (tags && !p.tags.includes(tags)) return false;
        if (status) {
            if (status === "Unsolved" && p.status === "Solved") return false;
            if (status === "Solved" && p.status !== "Solved") return false;
        }
        return true;
    });
  }, [initialProblems, searchParams]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.07] transition-colors">
              <div>
                  <p className="text-sm text-gray-400">Total Solved</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.solved}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <CheckCircle size={20} />
              </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:col-span-2 flex items-center justify-around gap-4 hover:bg-white/[0.07] transition-colors">
              <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">Easy</p>
                  <span className="text-lg font-bold text-green-400">
                      {stats.byDifficulty.find(d => d._id === "Easy")?.count || 0}
                  </span>
              </div>
              <div className="h-8 w-px bg-white/10"></div>
              <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">Medium</p>
                  <span className="text-lg font-bold text-yellow-400">
                      {stats.byDifficulty.find(d => d._id === "Medium")?.count || 0}
                  </span>
              </div>
              <div className="h-8 w-px bg-white/10"></div>
              <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">Hard</p>
                  <span className="text-lg font-bold text-red-400">
                      {stats.byDifficulty.find(d => d._id === "Hard")?.count || 0}
                  </span>
              </div>
          </div>

          <Link 
            href="/stats"
            className="group bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 hover:border-blue-600/30 rounded-xl p-4 flex items-center justify-between transition"
          >
              <div>
                  <p className="text-sm font-medium text-blue-400 group-hover:text-blue-300">Detailed Stats</p>
                  <p className="text-xs text-blue-500/60 mt-0.5">View analytics</p>
              </div>
              <ArrowRight size={18} className="text-blue-500 group-hover:translate-x-1 transition-transform" />
          </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search problems..." 
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            defaultValue={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              handleSearch(e.target.value);
            }}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-40">
              <Select 
                  options={FILTER_DIFFICULTY_OPTIONS}
                  value={searchParams.get("difficulty") || ""}
                  onChange={(val) => updateFilter("difficulty", val)}
                  placeholder="All Difficulties"
              />
            </div>

            <div className="w-full sm:w-40">
              <Select 
                  options={topicOptions}
                  value={searchParams.get("topic") || ""}
                  onChange={(val) => updateFilter("topic", val)}
                  placeholder="All Topics"
              />
            </div>

            <div className="w-full sm:w-40">
              <Select 
                  options={tagOptions}
                  value={searchParams.get("tags") || ""}
                  onChange={(val) => updateFilter("tags", val)}
                  placeholder="Filter by Tag"
              />
            </div>
            
            {(searchParams.toString().length > 0) && (
                <button 
                    onClick={() => startTransition(() => router.push("/dashboard"))}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center sm:w-auto"
                    title="Reset Filters"
                >
                    <RotateCcw size={20} />
                </button>
            )}

            <button 
                onClick={() => { setEditingProblem(null); setShowAddModal(true); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-blue-500/20"
            >
                <Plus size={20} /> 
                <span className="hidden sm:inline">Add Problem</span>
                <span className="sm:hidden">Add</span>
            </button>
        </div>
      </div>

      {/* Problems Table */}
      <div className="glass rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b border-white/10 bg-white/5 text-gray-400 text-sm">
                <th className="p-4 font-medium w-1/3 min-w-[200px]">Title</th>
                <th className="p-4 font-medium w-[120px]">Difficulty</th>
                <th className="p-4 font-medium hidden md:table-cell">Topic</th>
                <th className="p-4 font-medium hidden lg:table-cell">Tags</th>
                <th className="p-4 font-medium text-center w-[120px]">Status</th>
                <th className="p-4 font-medium text-right w-[100px]">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
                {filteredProblems.length === 0 ? (
                <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                    {isPending ? "Loading..." : "No problems found matching filters."}
                    </td>
                </tr>
                ) : (
                filteredProblems.map((problem) => (
                    <tr 
                    key={problem._id} 
                    onClick={() => handleRowClick(problem)}
                    className="group hover:bg-white/5 transition cursor-pointer"
                    >
                    <td className="p-4">
                        <div className="font-medium text-white group-hover:text-blue-400 transition flex items-center gap-2">
                            {problem.title} 
                            {problem.link && <a href={problem.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-gray-500 hover:text-white"><ArrowRight size={14} className="-rotate-45" /></a>}
                        </div>
                    </td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                        </span>
                    </td>
                    <td className="p-4 text-gray-300 hidden md:table-cell py-4">
                       <div className="flex flex-wrap gap-1">
                          {problem.topic.slice(0, 2).map(t => (
                              <span key={t} className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 text-xs">{t}</span>
                          ))}
                          {problem.topic.length > 2 && <span className="text-xs text-gray-500">+{problem.topic.length - 2}</span>}
                       </div>
                    </td>
                    <td className="p-4 text-gray-300 hidden lg:table-cell py-4">
                       <div className="flex flex-wrap gap-1">
                          {problem.tags.slice(0, 2).map(t => (
                              <span key={t} className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 text-xs">{t}</span>
                          ))}
                          {problem.tags.length > 2 && <span className="text-xs text-gray-500">+{problem.tags.length - 2}</span>}
                       </div>
                    </td>
                    <td className="p-4 text-center">
                        {problem.status === "Solved" ? (
                        <div className="inline-flex items-center gap-1.5 text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20 text-xs">
                            <CheckCircle size={12} /> Solved
                        </div>
                        ) : (
                        <div className="inline-flex items-center gap-1.5 text-gray-500 bg-gray-500/10 px-2 py-1 rounded border border-gray-500/20 text-xs font-medium">
                            <Clock size={12} /> Unsolved
                        </div>
                        )}
                    </td>
                    <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <button 
                                onClick={(e) => handleEdit(e, problem)}
                                className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition"
                                title="Edit"
                            >
                                <Pencil size={16} />
                            </button>
                            <button 
                                onClick={(e) => handleDeleteClick(e, problem._id)}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition"
                                title="Delete"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        </div>
      </div>
      
      {showAddModal && <AddProblemModal onClose={() => { setShowAddModal(false); setEditingProblem(null); }} initialData={editingProblem} />}
      {selectedProblemId && (
        <ViewProblemModal 
          problemId={selectedProblemId} 
          onClose={() => { setSelectedProblemId(null); setSelectedProblem(null); }} 
          initialProblem={selectedProblem}
        />
      )}
      
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Problem"
        message="Are you sure you want to delete this problem? This action cannot be undone and will permanently remove the problem and all its solutions."
        confirmText="Delete Problem"
        isDangerous={true}
      />
    </div>
  );
}
