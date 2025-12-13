"use client";

import { createProblem, updateProblem } from "@/actions/problem";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { CreatableMultiSelect, Select } from "./ui/SelectUtils";
import { toast } from "sonner";

import { TOPIC_OPTIONS, TAG_OPTIONS, DIFFICULTY_OPTIONS } from "@/lib/constants";

interface AddProblemModalProps {
    onClose: () => void;
    initialData?: any; 
}

export default function AddProblemModal({ onClose, initialData }: AddProblemModalProps) {
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<string[]>(initialData?.topic || []);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [difficulty, setDifficulty] = useState<string>(initialData?.difficulty || "Easy");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      link: formData.get("link"),
      difficulty: difficulty,
      topic: topics,
      tags: tags,
      intuition: formData.get("intuition"),
    };

    let result;
    if (initialData) {
        result = await updateProblem(initialData._id, data);
    } else {
        result = await createProblem(data);
    }

    if ('error' in result) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success(initialData ? "Problem updated successfully!" : "Problem added successfully!");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="glass-modal w-full max-w-lg mx-4 sm:mx-0 rounded-2xl p-6 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{initialData ? "Edit Problem" : "Add New Problem"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
            <X size={20} className="text-gray-400 hover:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
            <input 
                name="title" 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
                placeholder="Two Sum"
                defaultValue={initialData?.title}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Link</label>
            <input 
                name="link" 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
                placeholder="https://leetcode.com/problems/..." 
                defaultValue={initialData?.link}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Difficulty</label>
              <Select 
                options={DIFFICULTY_OPTIONS}
                value={difficulty}
                onChange={setDifficulty}
                placeholder="Select Difficulty"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Topics</label>
              <CreatableMultiSelect 
                options={TOPIC_OPTIONS} 
                value={topics} 
                onChange={setTopics} 
                placeholder="Select topics..." 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Intuition</label>
            <textarea 
                name="intuition" 
                rows={4} 
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
                placeholder="Briefly describe your initial thought process..."
                defaultValue={initialData?.intuition}
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-400 mb-1">Tags</label>
             <CreatableMultiSelect 
                options={TAG_OPTIONS} 
                value={tags} 
                onChange={setTags} 
                placeholder="Select tags..." 
              />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition flex items-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {initialData ? "Update Problem" : "Save Problem"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
