import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onCorrect: () => void;
  onIncorrect: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSave: () => void;
  enabled: boolean;
}

export function useKeyboardShortcuts({
  onCorrect,
  onIncorrect,
  onNext,
  onPrevious,
  onSave,
  enabled
}: KeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'c':
          e.preventDefault();
          onCorrect();
          break;
        case 'i':
          e.preventDefault();
          onIncorrect();
          break;
        case 'arrowright':
          e.preventDefault();
          onNext();
          break;
        case 'arrowleft':
          e.preventDefault();
          onPrevious();
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onSave();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onCorrect, onIncorrect, onNext, onPrevious, onSave]);
}