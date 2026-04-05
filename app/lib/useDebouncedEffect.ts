// app/lib/useDebouncedEffect.ts
// DEBOUNCED EFFECT HELPER
// PURPOSE:
// This reusable hook delays execution of an effect
// until changes stop for a short time.
//
// WHAT THIS FILE DOES:
// - waits before running an effect
// - prevents repeated rapid execution
// - skips first render
// - supports async and sync effects
//
// USED BY:
// 1. DeclarationWizard.tsx autosave
// 2. Future form autosave logic
//
// IMPORTANT:
// This hook helps reduce unnecessary writes to Firestore
// and API calls while users are typing.

import { useEffect, useRef } from "react";

export function useDebouncedEffect(
  effect: () => void | Promise<void>,
  deps: any[],
  delayMs: number
) {
  const firstRun = useRef(true);

  useEffect(() => {
    // Skip first render
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      if (cancelled) return;

      try {
        await effect();
      } catch (error) {
        console.error("Debounced effect failed:", error);
      }
    }, delayMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}