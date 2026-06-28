"use client";

import { useState, createContext, useContext } from 'react';
import { CommandPalette } from './CommandPalette';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface CommandPaletteContextType {
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  triggerAddProblem?: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType>({
  openCommandPalette: () => {},
  closeCommandPalette: () => {},
});

export const useCommandPalette = () => useContext(CommandPaletteContext);

export function GlobalKeyboardHandler({ children }: { children: React.ReactNode }) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const openCommandPalette = () => setIsCommandPaletteOpen(true);
  const closeCommandPalette = () => setIsCommandPaletteOpen(false);

  useKeyboardShortcuts(
    openCommandPalette,
    () => setIsHelpOpen(true)
  );

  return (
    <CommandPaletteContext.Provider value={{ openCommandPalette, closeCommandPalette }}>
      {children}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={closeCommandPalette}
      />
      <KeyboardShortcutsHelp
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </CommandPaletteContext.Provider>
  );
}
