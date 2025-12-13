"use client";

import { getProblemDetails, addSolution, reviewProblem, deleteSolution, updateSolution, deleteProblem } from "@/actions/problem";
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/themes/prism-tomorrow.css';
import { useState, useEffect } from "react";
import { X, Loader2, Link as LinkIcon, Calendar, Code as CodeIcon, Plus, CheckCircle, RotateCw, Clock, Trash2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CreatableSelect } from "./ui/SelectUtils";
import { toast } from "sonner";
import ConfirmationModal from "./ConfirmationModal";
import { getDifficultyColor, formatDate } from "@/lib/utils";

import { LANGUAGES, TIME_COMPLEXITY, SPACE_COMPLEXITY } from "@/lib/constants";

export default function ViewProblemModal({ problemId, onClose }: { problemId: string, onClose: () => void }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddSolution, setShowAddSolution] = useState(false);
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [editingSolutionId, setEditingSolutionId] = useState<string | null>(null);
  
  const [confirmModal, setConfirmModal] = useState<{ 
      isOpen: boolean; 
      type: 'solution' | 'problem' | null; 
      id: string | null; 
  }>({ isOpen: false, type: null, id: null });

  const [newSolLang, setNewSolLang] = useState("javascript");
  const [newSolTime, setNewSolTime] = useState("O(n)");
  const [newSolSpace, setNewSolSpace] = useState("O(n)");
  const [newSolCode, setNewSolCode] = useState("");

  useEffect(() => {
    getProblemDetails(problemId).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [problemId]);

  const handleAddSolution = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSolutionLoading(true);
    const formData = new FormData(e.currentTarget);
    const solutionData = {
        problemId,
        title: formData.get("title"),
        language: newSolLang,
        code: newSolCode,
        approach: formData.get("approach"),
        timeComplexity: newSolTime,
        spaceComplexity: newSolSpace,
    };

    let res;
    if (editingSolutionId) {
        res = await updateSolution(editingSolutionId, solutionData);
    } else {
        res = await addSolution(solutionData);
    }

    if (res.error) {
        toast.error(res.error);
    } else {
        toast.success(editingSolutionId ? "Solution updated!" : "Solution added!");
        const freshData = await getProblemDetails(problemId);
        setData(freshData);
        setShowAddSolution(false);
        setEditingSolutionId(null);
        setNewSolCode("");
    }
    setSolutionLoading(false);
  };

  const handleEditClick = (sol: any) => {
    setEditingSolutionId(sol._id);
    setNewSolLang(sol.language);
    setNewSolTime(sol.timeComplexity);
    setNewSolSpace(sol.spaceComplexity);
    setNewSolCode(sol.code);
    setShowAddSolution(true);
  };

  const handleDeleteSolutionClick = (id: string) => {
      setConfirmModal({ isOpen: true, type: 'solution', id });
  };

  const handleDeleteProblemClick = () => {
      setConfirmModal({ isOpen: true, type: 'problem', id: problemId });
  };

  const handleConfirmDelete = async () => {
      if (!confirmModal.type) return;

      if (confirmModal.type === 'solution' && confirmModal.id) {
        const res = await deleteSolution(confirmModal.id);
        if ('error' in res) {
             toast.error(res.error || "Failed to delete");
        } else {
             toast.success("Solution deleted");
             const freshData = await getProblemDetails(problemId);
             setData(freshData);
        }
      } else if (confirmModal.type === 'problem') {
        const res = await deleteProblem(problemId);
        if ('error' in res) {
             toast.error(res.error || "Failed to delete problem");
        } else {
             toast.success("Problem deleted");
             onClose();
             router.refresh();
        }
      }
      setConfirmModal({ isOpen: false, type: null, id: null });
  };

  const handleReview = async () => {
    await reviewProblem(problemId);
    toast.success("Marked as reviewed! Next review scheduled.");
    const res = await getProblemDetails(problemId);
    setData(res);
    router.refresh();
    window.dispatchEvent(new Event("problemReviewed"));
  };

  if (loading) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Loader2 className="animate-spin text-white" size={32} />
        </div>
    )
  }

  if (!data || !data.problem) return null;

  const { problem, solutions } = data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-8">

      <div className="glass-modal w-full h-full max-w-5xl rounded-2xl flex flex-col animate-in fade-in zoom-in duration-300 overflow-hidden">
        
        <div className="p-6 border-b border-white/10 bg-black/20 space-y-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">{problem.title}</h2>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getDifficultyColor(problem.difficulty)}`}>{problem.difficulty}</span>
                    <a href={problem.link} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 transition">
                        <LinkIcon size={16} />
                    </a>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleDeleteProblemClick}
                        className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition"
                        title="Delete Problem"
                    >
                        <Trash2 size={20} />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
                        <X size={24} className="text-gray-400 hover:text-white" />
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
                 <div className="flex items-center gap-2 text-gray-400">
                    <span className="font-medium text-gray-500">Topics:</span>
                    <span className="text-gray-300">{problem.topic.join(", ")}</span>
                 </div>
                 <div className="h-4 w-[1px] bg-white/10 hidden sm:block"></div>
                 <div className="flex items-center gap-2">
                    {problem.tags.length > 0 && problem.tags.map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs">
                            {tag}
                        </span>
                    ))}
                 </div>

                 {problem.status === "Solved" && (
                    <div className="ml-auto">
                        <button 
                            onClick={handleReview}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 rounded-lg text-xs font-medium transition"
                        >
                            <RotateCw size={14} /> Mark as Reviewed
                        </button>
                    </div>
                 )}
            </div>

            <div className="flex flex-wrap gap-6 text-xs text-gray-500 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-600" />
                    <span>Submitted on <span className="text-gray-400">{formatDate(problem.createdAt)}</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-gray-600" />
                    <span>Solved <span className="text-gray-400">{Math.floor((Date.now() - new Date(problem.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago</span></span>
                </div>
                {problem.status === "Solved" && (
                    <div className="flex items-center gap-2">
                        <RotateCw size={14} className={new Date(problem.nextReviewDate) <= new Date() ? "text-yellow-500" : "text-gray-600"} />
                        <span>Next Review: <span className={new Date(problem.nextReviewDate) <= new Date() ? "text-yellow-400 font-medium" : "text-gray-400"}>
                            {formatDate(problem.nextReviewDate)}
                        </span></span>
                    </div>
                )}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 space-y-8">
            
            {problem.intuition && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                        Intuition
                     </h3>
                     <p className="text-gray-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10 text-sm md:text-base">
                         {problem.intuition}
                     </p>
                </div>
            )}

            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                        Solutions ({solutions.length})
                    </h3>
                    <button 
                        onClick={() => setShowAddSolution(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={16} /> Add Solution
                    </button>
                </div>

                    {showAddSolution && (
                        <div className="glass p-6 rounded-xl border border-blue-500/30 mb-6 animate-in fade-in zoom-in duration-300">
                            <h4 className="text-white font-medium mb-4">{editingSolutionId ? "Edit Solution" : "New Solution"}</h4>
                            <form key={editingSolutionId || 'new'} onSubmit={handleAddSolution} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input 
                                        name="title" 
                                        required 
                                        placeholder="Solution Title (e.g. Brute Force)" 
                                        className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" 
                                        defaultValue={editingSolutionId && solutions.find((s:any) => s._id === editingSolutionId)?.title}
                                    />
                                    <div>
                                       <CreatableSelect 
                                         options={LANGUAGES}
                                         value={newSolLang}
                                         onChange={setNewSolLang}
                                         placeholder="Select Language"
                                       />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                       <CreatableSelect 
                                         options={TIME_COMPLEXITY}
                                         value={newSolTime}
                                         onChange={setNewSolTime}
                                         placeholder="Time Complexity"
                                       />
                                    </div>
                                    <div>
                                       <CreatableSelect 
                                         options={SPACE_COMPLEXITY}
                                         value={newSolSpace}
                                         onChange={setNewSolSpace}
                                         placeholder="Space Complexity"
                                       />
                                    </div>
                                </div>
                                <div>
                                     <textarea 
                                        name="approach" 
                                        rows={3} 
                                        placeholder="Explain your approach..." 
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50 mb-2"
                                        defaultValue={editingSolutionId && solutions.find((s:any) => s._id === editingSolutionId)?.approach}
                                     />
                                </div>
                                <div className="border border-white/10 rounded-lg overflow-hidden bg-black/20 focus-within:ring-1 focus-within:ring-blue-500/50">
                                    <Editor
                                        value={newSolCode}
                                        onValueChange={code => setNewSolCode(code)}
                                        highlight={code => {
                                            const langKey = newSolLang === 'cpp' ? 'cpp' : 
                                                            newSolLang === 'python' ? 'python' : 
                                                            newSolLang === 'java' ? 'java' : 
                                                            newSolLang === 'go' ? 'go' : 
                                                            newSolLang === 'rust' ? 'rust' :
                                                            newSolLang === 'typescript' ? 'typescript' : 'javascript';
                                            return highlight(code, languages[langKey] || languages.javascript, langKey);
                                        }}
                                        padding={15}
                                        style={{
                                            fontFamily: '"Fira code", "Fira Mono", monospace',
                                            fontSize: 14,
                                            backgroundColor: 'transparent',
                                            color: '#f8f8f2',
                                            minHeight: '150px',
                                        }}
                                        className="w-full text-sm font-mono focus:outline-none"
                                        placeholder="Paste your code here..."
                                        textareaId="code"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => { setShowAddSolution(false); setEditingSolutionId(null); setNewSolCode(""); }} className="px-3 py-1.5 text-gray-400 hover:text-white text-sm">Cancel</button>
                                    <button type="submit" disabled={solutionLoading} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm">
                                        {editingSolutionId ? "Update Solution" : "Save Solution"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                <div className="space-y-6">
                    {solutions.map((sol: any) => (
                        <div key={sol._id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden group hover:border-white/20 transition">
                            <div className="p-4 border-b border-white/5 bg-white/5 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-medium text-white text-lg">{sol.title}</h4>
                                        <div className="flex gap-3 text-xs text-gray-400 mt-1">
                                            <span className="flex items-center gap-1"><Clock size={12}/> {sol.timeComplexity}</span>
                                            <span className="flex items-center gap-1"><CodeIcon size={12}/> {sol.spaceComplexity}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="uppercase text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded border border-blue-400/20">{sol.language}</span>
                                        <button 
                                            onClick={() => handleEditClick(sol)}
                                            className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-blue-400 rounded transition"
                                            title="Edit Solution"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteSolutionClick(sol._id)}
                                            className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-red-400 rounded transition"
                                            title="Delete Solution"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                {sol.approach && (
                                    <div className="text-sm text-gray-300 mt-1 leading-relaxed">
                                        <span className="text-gray-500 font-medium block text-xs uppercase tracking-wider mb-1">Approach</span>
                                        {sol.approach}
                                    </div>
                                )}
                            </div>
                            <div className="bg-[#1e1e1e] overflow-x-auto text-sm relative">
                                <SyntaxHighlighter 
                                  language={sol.language.toLowerCase()} 
                                  style={vscDarkPlus}
                                  customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent' }}
                                >
                                    {sol.code}
                                </SyntaxHighlighter>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
      
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title={confirmModal.type === 'problem' ? "Delete Problem" : "Delete Solution"}
        message={confirmModal.type === 'problem' 
            ? "Are you sure you want to delete this ENTIRE problem? This action cannot be undone." 
            : "Are you sure you want to delete this solution?"}
        confirmText="Delete"
        isDangerous={true}
      />
    </div>
  );
}
