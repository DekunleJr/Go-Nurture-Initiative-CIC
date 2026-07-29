"use client";

import { useSyncExternalStore, useRef } from "react";

/**
 * Read a value from localStorage in a hydration-safe way.
 *
 * Uses useSyncExternalStore so that:
 * - Server render: returns null (no hydration mismatch)
 * - Client hydration: returns null (matches server)
 * - After hydration: returns the actual value from localStorage
 *
 * The parsed value is cached by key to avoid infinite loops
 * (getSnapshot must return a referentially stable value).
 */
export function useLocalStorage<T>(key: string): T | null {
  const cachedKeyRef = useRef<string | null>(null);
  const cachedValueRef = useRef<T | null>(null);

  const subscribe = (callback: () => void) => {
    if (typeof window === "undefined") return () => {};
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
  };

  const getSnapshot = (): T | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(key);

    // If the raw string hasn't changed, return the cached parsed value
    if (cachedKeyRef.current === raw) {
      return cachedValueRef.current;
    }

    // Update cache
    cachedKeyRef.current = raw;
    cachedValueRef.current = raw ? (JSON.parse(raw) as T) : null;
    return cachedValueRef.current;
  };

  const getServerSnapshot = (): T | null => null;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}