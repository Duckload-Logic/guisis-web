import { useEffect, useState, useCallback, useRef } from "react";

/**
 * Persists lightweight form state in sessionStorage so in-progress requests
 * survive accidental page refreshes without leaving data behind after logout.
 */
export function useLocalDraft<T>(
  storageKey: string,
  initialValue: T,
  enabled = true,
) {
  const initialRef = useRef(initialValue);

  const [draft, setDraft] = useState<T>(() => {
    if (!enabled) return initialValue;
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    if (!enabled) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(draft));
    } catch {
      // Ignore storage quota errors
    }
  }, [storageKey, draft, enabled]);

  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore storage errors
    }
    setDraft(initialRef.current);
  }, [storageKey]);

  return { draft, setDraft, clearDraft };
}

