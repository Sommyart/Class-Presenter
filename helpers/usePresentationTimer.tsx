import { useCallback, useEffect, useRef, useState } from "react";

// usePresentationTimer — timestamp-anchored global + slide timer.
//
// This ports the approach proven out in the standalone ClassPresenter build
// (Phases 1-2): elapsed time is computed fresh each tick from a timestamp
// anchor plus a banked "accumulated" offset, never by summing per-tick
// increments. That's what keeps both timers accurate through slide
// changes, fullscreen transitions, tab throttling, and temporary lag —
// resuming after a stall just means the next tick computes a big jump,
// not a drifted one.
//
// The global timer runs continuously for the whole session once started.
// The slide timer is re-anchored every time the current slide index
// changes: the outgoing slide's remaining time is banked (paused, not
// discarded) so revisiting it later resumes rather than restarts.

export interface SlideTimerConfig {
  index: number;
  timerEnabled: boolean;
  durationSeconds: number;
}

interface SlideRuntime {
  accumulatedMs: number; // banked elapsed time for this slide
  completed: boolean;
}

export interface PresentationTimerState {
  isRunning: boolean;
  isPaused: boolean;
  globalElapsedMs: number;
  currentSlideIndex: number;
  slideElapsedMs: number;
  slideRemainingMs: number | null; // null when the slide has no timer
  slideCompleted: boolean;
}

export function usePresentationTimer(slides: SlideTimerConfig[]) {
  const [state, setState] = useState<PresentationTimerState>({
    isRunning: false,
    isPaused: false,
    globalElapsedMs: 0,
    currentSlideIndex: 0,
    slideElapsedMs: 0,
    slideRemainingMs: slides[0]?.timerEnabled ? slides[0].durationSeconds * 1000 : null,
    slideCompleted: false,
  });

  const rafRef = useRef<number | null>(null);
  const globalAnchorRef = useRef(0);
  const globalAccumulatedRef = useRef(0);
  const slideAnchorRef = useRef(0);
  const slideRuntimesRef = useRef<Map<number, SlideRuntime>>(new Map());
  const currentSlideRef = useRef(0);
  const runningRef = useRef(false);
  const pausedRef = useRef(false);

  const getSlideConfig = useCallback(
    (index: number) => slides.find((s) => s.index === index),
    [slides],
  );

  const getSlideRuntime = useCallback((index: number): SlideRuntime => {
    let rt = slideRuntimesRef.current.get(index);
    if (!rt) {
      rt = { accumulatedMs: 0, completed: false };
      slideRuntimesRef.current.set(index, rt);
    }
    return rt;
  }, []);

  const tick = useCallback(() => {
    rafRef.current = requestAnimationFrame(() => {
      if (!runningRef.current || pausedRef.current) return;

      const now = performance.now();
      const globalElapsedMs = globalAccumulatedRef.current + (now - globalAnchorRef.current);

      const slideIndex = currentSlideRef.current;
      const config = getSlideConfig(slideIndex);
      const runtime = getSlideRuntime(slideIndex);
      let slideElapsedMs = runtime.accumulatedMs + (now - slideAnchorRef.current);
      let slideRemainingMs: number | null = null;
      let slideCompleted = runtime.completed;

      if (config?.timerEnabled) {
        const durationMs = config.durationSeconds * 1000;
        slideRemainingMs = Math.max(0, durationMs - slideElapsedMs);
        if (slideRemainingMs <= 0 && !runtime.completed) {
          runtime.completed = true;
          slideCompleted = true;
        }
      }

      setState((prev) => ({
        ...prev,
        globalElapsedMs,
        slideElapsedMs,
        slideRemainingMs,
        slideCompleted,
      }));

      tick();
    });
  }, [getSlideConfig, getSlideRuntime]);

  const start = useCallback(() => {
    const now = performance.now();
    globalAnchorRef.current = now;
    globalAccumulatedRef.current = 0;
    slideAnchorRef.current = now;
    slideRuntimesRef.current = new Map();
    currentSlideRef.current = 0;
    runningRef.current = true;
    pausedRef.current = false;
    setState((prev) => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      globalElapsedMs: 0,
      currentSlideIndex: 0,
      slideElapsedMs: 0,
      slideCompleted: false,
    }));
    tick();
  }, [tick]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    runningRef.current = false;
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const pause = useCallback(() => {
    if (!runningRef.current || pausedRef.current) return;
    const now = performance.now();
    globalAccumulatedRef.current += now - globalAnchorRef.current;
    const runtime = getSlideRuntime(currentSlideRef.current);
    runtime.accumulatedMs += now - slideAnchorRef.current;
    pausedRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setState((prev) => ({ ...prev, isPaused: true }));
  }, [getSlideRuntime]);

  const resume = useCallback(() => {
    if (!runningRef.current || !pausedRef.current) return;
    const now = performance.now();
    globalAnchorRef.current = now;
    slideAnchorRef.current = now;
    pausedRef.current = false;
    setState((prev) => ({ ...prev, isPaused: false }));
    tick();
  }, [tick]);

  // Moving to another slide: bank the outgoing slide's elapsed time (so
  // revisiting it resumes rather than restarts), then re-anchor for the
  // incoming slide. The global timer's anchor is untouched — it keeps
  // running straight through the slide change.
  const goToSlide = useCallback(
    (index: number) => {
      const now = performance.now();
      if (runningRef.current && !pausedRef.current) {
        const outgoing = getSlideRuntime(currentSlideRef.current);
        outgoing.accumulatedMs += now - slideAnchorRef.current;
      }
      currentSlideRef.current = index;
      slideAnchorRef.current = now;

      const config = getSlideConfig(index);
      const runtime = getSlideRuntime(index);
      const slideElapsedMs = runtime.accumulatedMs;
      const slideRemainingMs = config?.timerEnabled
        ? Math.max(0, config.durationSeconds * 1000 - slideElapsedMs)
        : null;

      setState((prev) => ({
        ...prev,
        currentSlideIndex: index,
        slideElapsedMs,
        slideRemainingMs,
        slideCompleted: runtime.completed,
      }));
    },
    [getSlideConfig, getSlideRuntime],
  );

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const now = performance.now();
    globalAnchorRef.current = now;
    globalAccumulatedRef.current = 0;
    slideAnchorRef.current = now;
    slideRuntimesRef.current = new Map();
    pausedRef.current = false;
    setState((prev) => ({
      ...prev,
      globalElapsedMs: 0,
      slideElapsedMs: 0,
      slideCompleted: false,
      isPaused: false,
    }));
    if (runningRef.current) tick();
  }, [tick]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { state, start, stop, pause, resume, goToSlide, reset };
}
