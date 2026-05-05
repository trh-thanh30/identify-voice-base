import { useCallback, useEffect, useRef } from "react";

interface UseScrollOffsetOptions {
  behavior?: ScrollBehavior;
  enabled?: boolean;
  offsetY?: number;
  scrollKey?: unknown;
}

export function useScrollOffset<T extends HTMLElement = HTMLElement>({
  behavior = "smooth",
  enabled = true,
  offsetY = 0,
  scrollKey,
}: UseScrollOffsetOptions = {}) {
  const targetRef = useRef<T | null>(null);

  const scrollToOffset = useCallback(() => {
    const target = targetRef.current;
    if (!target) return;

    const targetTop =
      target.getBoundingClientRect().top + window.scrollY - offsetY;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior,
    });
  }, [behavior, offsetY]);

  useEffect(() => {
    if (!enabled || scrollKey == null) return;

    const frameId = window.requestAnimationFrame(scrollToOffset);

    return () => window.cancelAnimationFrame(frameId);
  }, [enabled, scrollKey, scrollToOffset]);

  return {
    targetRef,
    scrollToOffset,
  };
}
