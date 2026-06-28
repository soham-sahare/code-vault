"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
  category: string;
}

export function useKeyboardShortcuts(
  onOpenCommandPalette?: () => void,
  onOpenHelp?: () => void
) {
  const router = useRouter();
  const lastKeyRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      metaKey: true,
      action: () => onOpenCommandPalette?.(),
      description: 'Open command palette',
      category: 'General'
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => onOpenCommandPalette?.(),
      description: 'Open command palette',
      category: 'General'
    },
    {
      key: '?',
      shiftKey: true,
      action: () => onOpenHelp?.(),
      description: 'Show keyboard shortcuts',
      category: 'General'
    }
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    const isInInput = 
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    // Exception: Allow Cmd+K even in inputs
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      onOpenCommandPalette?.();
      return;
    }

    if (isInInput) return;

    // Handle sequential keys (G then D/S/P)
    const key = event.key.toLowerCase();
    
    if (key === 'g') {
      lastKeyRef.current = 'g';
      // Clear after 1 second
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lastKeyRef.current = null;
      }, 1000);
      return;
    }

    // Check if previous key was 'g'
    if (lastKeyRef.current === 'g') {
      event.preventDefault();
      lastKeyRef.current = null;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      switch (key) {
        case 'd':
          router.push('/dashboard');
          break;
        case 's':
          router.push('/stats');
          break;
        case 'p':
          router.push('/profile');
          break;
      }
      return;
    }

    // Handle other shortcuts
    for (const shortcut of shortcuts) {
      const metaMatch = shortcut.metaKey ? event.metaKey : !event.metaKey;
      const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
      const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;

      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        metaMatch &&
        ctrlMatch &&
        shiftMatch
      ) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [onOpenCommandPalette, onOpenHelp, router]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [handleKeyDown]);

  return { shortcuts };
}
