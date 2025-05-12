import { useEffect, useRef } from "react";

interface UseAutoscrollOptions {
  /**
   * The dependency array for triggering auto-scroll
   * The scroll will happen when any of these values change
   */
  deps: any[];

  /**
   * Whether to enable auto-scrolling
   * @default true
   */
  enabled?: boolean;

  /**
   * Smooth scroll behavior
   * @default true
   */
  smooth?: boolean;
}

/**
 * A hook that automatically scrolls an element to the bottom when content changes
 *
 * @param options Configuration options for auto-scrolling
 * @returns A ref to attach to the scrollable element
 */
export function useAutoscroll<T extends HTMLElement = HTMLDivElement>({ deps, enabled = true, smooth = true }: UseAutoscrollOptions) {
  const scrollRef = useRef<T>(null);

  useEffect(() => {
    if (!enabled || !scrollRef.current) return;

    const scrollElement = scrollRef.current;

    // Scroll to bottom with appropriate behavior
    scrollElement.scrollTo({
      top: scrollElement.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, [enabled, smooth, ...deps]);

  return scrollRef;
}
