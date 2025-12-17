"use client";

import { X } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  {
    category: 'General',
    items: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close modals/dialogs' },
    ]
  },
  {
    category: 'Navigation',
    items: [
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'S'], description: 'Go to Statistics' },
      { keys: ['G', 'P'], description: 'Go to Profile' },
    ]
  },
  {
    category: 'Actions',
    items: [
      { keys: ['N'], description: 'Add new problem' },
      { keys: ['J'], description: 'Next problem in list' },
      { keys: ['K'], description: 'Previous problem in list' },
    ]
  }
];

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50 animate-in fade-in zoom-in-95 px-4">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[600px] overflow-y-auto">
            <div className="space-y-6">
              {shortcuts.map((section) => (
                <div key={section.category}>
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">
                    {section.category}
                  </h3>
                  <div className="space-y-2">
                    {section.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition"
                      >
                        <span className="text-gray-300">{item.description}</span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((key, keyIndex) => (
                            <span key={keyIndex} className="flex items-center gap-1">
                              <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white font-mono">
                                {key}
                              </kbd>
                              {keyIndex < item.keys.length - 1 && (
                                <span className="text-gray-500 text-xs">then</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 px-6 py-4 bg-white/5">
            <p className="text-xs text-gray-500 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Esc</kbd> to close
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
