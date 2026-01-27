import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: () => void;
  description?: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const isKeyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const isCtrlMatch = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : true;
        const isShiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const isAltMatch = shortcut.altKey ? event.altKey : !event.altKey;

        if (isKeyMatch && isCtrlMatch && isShiftMatch && isAltMatch) {
          event.preventDefault();
          shortcut.callback();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Predefined shortcuts for common actions
export const SHORTCUT_KEYS = {
  SCORE: { key: ' ', description: 'Score (Space)' },
  UNDO: { key: 'z', ctrlKey: true, description: 'Undo (Ctrl+Z)' },
  NEXT_PHASE: { key: 'Enter', description: 'Next Phase (Enter)' },
  TOGGLE_DEFENSE: { key: 'd', description: 'Toggle Defense (D)' },
  QUICK_SAVE: { key: 's', ctrlKey: true, description: 'Save (Ctrl+S)' },
  OPEN_MENU: { key: 'Escape', description: 'Menu (Esc)' },
  INCREASE_VALUE: { key: 'ArrowUp', description: 'Increase (+)' },
  DECREASE_VALUE: { key: 'ArrowDown', description: 'Decrease (-)' }
};
