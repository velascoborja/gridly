"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type TransitionEvent,
} from "react";

const HEIGHT_TRANSITION_MS = 200;
const HEIGHT_TRANSITION_FALLBACK_MS = HEIGHT_TRANSITION_MS + 80;

interface EntryHeightTransitionProps {
  stateKey: string;
  children: ReactNode;
}

export function EntryHeightTransition({
  stateKey,
  children,
}: EntryHeightTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const settledHeightRef = useRef<number | null>(null);
  const targetHeightRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);

  const clearScheduledWork = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const finishTransition = useCallback((container: HTMLDivElement) => {
    clearScheduledWork();
    container.style.height = "auto";
    container.style.overflow = "visible";
    settledHeightRef.current =
      targetHeightRef.current ?? contentRef.current?.getBoundingClientRect().height ?? null;
    targetHeightRef.current = null;
    isAnimatingRef.current = false;
  }, [clearScheduledWork]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const nextHeight = content.getBoundingClientRect().height;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const previousHeight = isAnimatingRef.current
      ? container.getBoundingClientRect().height
      : settledHeightRef.current;

    clearScheduledWork();

    if (
      previousHeight === null
      || prefersReducedMotion
      || Math.abs(previousHeight - nextHeight) < 0.5
    ) {
      container.style.height = "auto";
      container.style.overflow = "visible";
      settledHeightRef.current = nextHeight;
      targetHeightRef.current = null;
      isAnimatingRef.current = false;
      return;
    }

    isAnimatingRef.current = true;
    targetHeightRef.current = nextHeight;
    container.style.height = `${previousHeight}px`;
    container.style.overflow = "hidden";
    void container.offsetHeight;

    animationFrameRef.current = window.requestAnimationFrame(() => {
      container.style.height = `${nextHeight}px`;
      animationFrameRef.current = null;
    });
    fallbackTimerRef.current = window.setTimeout(
      () => finishTransition(container),
      HEIGHT_TRANSITION_FALLBACK_MS
    );

    return clearScheduledWork;
  }, [clearScheduledWork, finishTransition, stateKey]);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      if (!isAnimatingRef.current) {
        settledHeightRef.current = content.getBoundingClientRect().height;
      }
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [stateKey]);

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (
      event.target !== event.currentTarget
      || event.propertyName !== "height"
      || !isAnimatingRef.current
    ) return;

    finishTransition(event.currentTarget);
  };

  return (
    <div
      ref={containerRef}
      className="transition-[height] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
      onTransitionEnd={handleTransitionEnd}
    >
      <div
        key={stateKey}
        ref={contentRef}
        className="animate-in fade-in duration-150 motion-reduce:animate-none"
      >
        {children}
      </div>
    </div>
  );
}
