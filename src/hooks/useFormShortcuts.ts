import { useEffect } from "react";

const KEY_ENTER = "Enter";
const KEY_ARROW_RIGHT = "ArrowRight";
const KEY_ARROW_LEFT = "ArrowLeft";

export interface FormShortcutsOptions {
  onNext?: () => void;
  onPrev?: () => void;
  onSubmit?: () => void;
  enabled?: boolean;
}

/**
 * Attaches lightweight keyboard shortcuts for form navigation and submission:
 * - Ctrl/Cmd + Enter: Trigger form submission
 * - Alt + ArrowRight: Advance to next step
 * - Alt + ArrowLeft: Return to previous step
 */
export function useFormShortcuts({
  onNext,
  onPrev,
  onSubmit,
  enabled = true,
}: FormShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === KEY_ENTER && onSubmit) {
        e.preventDefault();
        onSubmit();
        return;
      }

      if (e.altKey && e.key === KEY_ARROW_RIGHT && onNext) {
        e.preventDefault();
        onNext();
      } else if (e.altKey && e.key === KEY_ARROW_LEFT && onPrev) {
        e.preventDefault();
        onPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onNext, onPrev, onSubmit]);
}

