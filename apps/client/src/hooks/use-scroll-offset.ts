import { useCallback, useEffect, useRef } from "react";

interface UseScrollOffsetOptions {
  behavior?: ScrollBehavior;
  enabled?: boolean;
  offsetY?: number;
  scrollElement?: boolean;
  scrollKey?: unknown;
}

function getScrollableParent(element: HTMLElement) {
  let parent = element.parentElement;

  while (parent) {
    const { overflowY } = window.getComputedStyle(parent);
    const canScroll = /(auto|scroll|overlay)/.test(overflowY);

    if (canScroll && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
}

export function useScrollOffset<T extends HTMLElement = HTMLElement>({
  behavior = "smooth",
  enabled = true,
  offsetY = 0,
  scrollElement = false,
  scrollKey,
}: UseScrollOffsetOptions = {}) {
  const targetRef = useRef<T | null>(null);

  const scrollToOffset = useCallback(() => {
    const target = targetRef.current;
    if (!target) return;

    if (scrollElement) {
      target.scrollTo({
        top: 0,
        behavior,
      });
    }

    const scrollParent = getScrollableParent(target);

    if (scrollParent) {
      const targetTop =
        target.getBoundingClientRect().top -
        scrollParent.getBoundingClientRect().top +
        scrollParent.scrollTop -
        offsetY;

      scrollParent.scrollTo({
        top: Math.max(0, targetTop),
        behavior,
      });

      return;
    }

    const targetTop =
      target.getBoundingClientRect().top + window.scrollY - offsetY;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior,
    });
  }, [behavior, offsetY, scrollElement]);

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
