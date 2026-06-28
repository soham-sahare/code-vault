"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Search, Home, BarChart3, User, Plus, X, FileText } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  problems?: Array<{
    _id: string;
    title: string;
    difficulty: string;
    solved: boolean;
  }>;
}

export function CommandPalette({ isOpen, onClose, problems = [] }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const navigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const filteredProblems = useMemo(() => {
    if (!search) return problems.slice(0, 5);
    return problems
      .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 5);
  }, [search, problems]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Command Palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 animate-in fade-in zoom-in-95 slide-in-from-top-4 px-4">
        <Command className="bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center border-b border-white/10 px-4">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <Command.Input
              autoFocus
              value={search}
              onValueChange={setSearch}
              placeholder="Search for problems, navigate pages..."
              className="w-full bg-transparent py-4 text-white placeholder-gray-500 outline-none text-sm"
            />
            <button
              onClick={onClose}
              className="ml-2 p-1 hover:bg-white/10 rounded transition"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">
              No results found.
            </Command.Empty>

            {/* Navigation */}
            <Command.Group heading="Navigate" className="text-xs text-gray-500 px-2 py-2 font-semibold">
              <Command.Item
                onSelect={() => navigate('/dashboard')}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-gray-300 transition mb-1 data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
                <span className="ml-auto text-xs text-gray-500">G → D</span>
              </Command.Item>
              <Command.Item
                onSelect={() => navigate('/stats')}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-gray-300 transition mb-1 data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Statistics</span>
                <span className="ml-auto text-xs text-gray-500">G → S</span>
              </Command.Item>
              <Command.Item
                onSelect={() => navigate('/profile')}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-gray-300 transition mb-1 data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
                <span className="ml-auto text-xs text-gray-500">G → P</span>
              </Command.Item>
            </Command.Group>

            {/* Problems */}
            {filteredProblems.length > 0 && (
              <Command.Group heading="Problems" className="text-xs text-gray-500 px-2 py-2 font-semibold mt-2">
                {filteredProblems.map((problem) => (
                  <Command.Item
                    key={problem._id}
                    onSelect={() => {
                      // You can add logic to open problem modal here
                      onClose();
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-gray-300 transition mb-1 data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="flex-1 truncate">{problem.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                      problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {problem.difficulty}
                    </span>
                    {problem.solved && (
                      <span className="text-xs text-green-400">✓</span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Actions */}
            <Command.Group heading="Actions" className="text-xs text-gray-500 px-2 py-2 font-semibold mt-2">
              <Command.Item
                onSelect={() => {
                  onClose();
                  // Navigate to dashboard with query param to open modal
                  router.push('/dashboard?addProblem=true');
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-gray-300 transition mb-1 data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Problem</span>
                <span className="ml-auto text-xs text-gray-500">N</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div className="border-t border-white/10 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Esc</kbd>
                Close
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">?</kbd>
              Help
            </span>
          </div>
        </Command>
      </div>
    </>
  );
}
