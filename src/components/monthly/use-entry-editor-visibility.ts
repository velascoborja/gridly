"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

const EDITOR_VIEWPORT_MARGIN = 16;
const HEIGHT_TRANSITION_CHECK_MS = 232;
const KEYBOARD_SETTLE_CHECKS_MS = [450, 700] as const;

export interface ViewportBounds {
  top: number;
  bottom: number;
}

interface VisualViewportMeasurement {
  offsetTop?: number;
  height?: number;
}

interface EditorRect {
  top: number;
  bottom: number;
}

export function getVisibleViewportBounds(
  visualViewport: VisualViewportMeasurement | null | undefined,
  layoutViewportHeight: number
): ViewportBounds | null {
  if (
    visualViewport
    && Number.isFinite(visualViewport.offsetTop)
    && Number.isFinite(visualViewport.height)
    && visualViewport.height! > 0
  ) {
    const top = visualViewport.offsetTop!;
    return { top, bottom: top + visualViewport.height! };
  }

  if (Number.isFinite(layoutViewportHeight) && layoutViewportHeight > 0) {
    return { top: 0, bottom: layoutViewportHeight };
  }

  return null;
}

export function getEditorScrollDelta(
  editorRect: EditorRect,
  viewport: ViewportBounds,
  margin = EDITOR_VIEWPORT_MARGIN
): number {
  const visibleTop = viewport.top + margin;
  const visibleBottom = viewport.bottom - margin;

  if (editorRect.top < visibleTop) return editorRect.top - visibleTop;
  if (editorRect.bottom > visibleBottom) return editorRect.bottom - visibleBottom;
  return 0;
}

export function shouldAdjustEditorVisibility(
  container: Pick<HTMLElement, "contains">,
  activeElement: Element | null
): boolean {
  return activeElement !== null && container.contains(activeElement);
}

export function useEntryEditorVisibility(
  editedEntryId: number | null
): RefObject<HTMLDivElement | null> {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const keepEditorVisible = useCallback(() => {
    const container = editorContainerRef.current;
    if (!container || !shouldAdjustEditorVisibility(container, document.activeElement)) return;

    const viewport = getVisibleViewportBounds(window.visualViewport, window.innerHeight);
    if (!viewport) {
      container.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
      return;
    }

    const delta = getEditorScrollDelta(container.getBoundingClientRect(), viewport);
    if (delta !== 0) window.scrollBy({ top: delta, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (editedEntryId === null) return;

    const timers: number[] = [];
    const scheduleCheck = () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = window.requestAnimationFrame(() => {
        animationFrameRef.current = null;
        keepEditorVisible();
      });
    };

    scheduleCheck();
    for (const delay of [HEIGHT_TRANSITION_CHECK_MS, ...KEYBOARD_SETTLE_CHECKS_MS]) {
      timers.push(window.setTimeout(scheduleCheck, delay));
    }

    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener("resize", scheduleCheck);
    visualViewport?.addEventListener("scroll", scheduleCheck);
    window.addEventListener("resize", scheduleCheck);

    return () => {
      visualViewport?.removeEventListener("resize", scheduleCheck);
      visualViewport?.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
      for (const timer of timers) window.clearTimeout(timer);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [editedEntryId, keepEditorVisible]);

  return editorContainerRef;
}
