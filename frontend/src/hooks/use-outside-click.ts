import { useEffect, type RefObject } from "react";

/**
 * Hook that alerts clicks outside of the passed ref
 * @param ref - The React ref to the element to watch
 * @param handler - The callback function to execute on outside click
 * @param enabled - Whether the hook is active
 */
export function useOutsideClick<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      // Do nothing if clicking ref's element or descendent elements
      const target = event.target as Node;
      if (!ref.current || ref.current.contains(target)) {
        return;
      }

      const targetEl = target instanceof Element ? target : target.parentElement;
      if (
        targetEl?.closest(
          "[data-slot='dropdown-menu-content'], [data-radix-popper-content-wrapper], [role='menu'], [role='dialog']"
        )
      ) {
        return;
      }

      handler();
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler, enabled]);
}
