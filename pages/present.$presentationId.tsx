import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Maximize,
  Minimize,
  X,
  Clock3,
  AlertCircle,
  Volume2,
  VolumeX,
  Sparkles,
} from "lucide-react";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import {
  usePresentationDetail,
  useMarkPresented,
} from "../helpers/usePresentationQueries";
import { usePresentationTimer } from "../helpers/usePresentationTimer";
import { getCountdownAlertState } from "../helpers/countdownAlerts";
import { playFinalAlarm, playWarningBell, unlockAlertAudio } from "../helpers/alertSounds";
import { AlarmClockWarning } from "../components/AlarmClockWarning";
import styles from "./present.$presentationId.module.css";

function formatMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// A countdown shows time REMAINING, so it rounds up: with 0.4s left it still
// reads 00:01 and only reaches 00:00 when time has genuinely run out.
function formatCountdownMs(ms: number): string {
  return formatMs(Math.ceil(Math.max(0, ms) / 1000) * 1000);
}


// --- Slide transitions -----------------------------------------------------
type TransitionStyle = "slide" | "fade" | "zoom" | "flip" | "rise";
type TransitionChoice = "mix" | TransitionStyle | "none";

const TRANSITION_CHOICES: TransitionChoice[] = ["mix", "slide", "fade", "zoom", "flip", "rise", "none"];
const TRANSITION_LABELS: Record<TransitionChoice, string> = {
  mix: "Mix",
  slide: "Slide",
  fade: "Fade",
  zoom: "Zoom",
  flip: "Flip",
  rise: "Rise",
  none: "None",
};
const MIX_POOL: TransitionStyle[] = ["slide", "fade", "zoom", "flip", "rise"];
// Keep in step with the 0.6s animations in the stylesheet.
const TRANSITION_MS = 650;
const TRANSITION_STORAGE_KEY = "classpresenter:transition";

function readStoredTransition(): TransitionChoice {
  try {
    const value = window.localStorage.getItem(TRANSITION_STORAGE_KEY);
    if (value && (TRANSITION_CHOICES as string[]).includes(value)) return value as TransitionChoice;
  } catch {
    // Storage can be unavailable (private windows); fall back to the default.
  }
  return "mix";
}

function pickTransition(choice: TransitionChoice, previous: TransitionStyle | null): TransitionStyle | null {
  if (choice === "none") return null;
  if (choice !== "mix") return choice;
  const pool = MIX_POOL.filter((style) => style !== previous);
  return pool[Math.floor(Math.random() * pool.length)];
}

type SlideAnimation = {
  slideId: string | null;
  fromUrl: string | null;
  style: TransitionStyle | null;
  dir: "forward" | "backward";
};

const CONTROLS_HIDE_DELAY_MS = 3000;
// Ignore tiny cursor jitter so the controls don't flash back in.
const MOUSE_MOVE_THRESHOLD_PX = 12;
// Slide timer turns amber under a minute remaining.
const WARNING_THRESHOLD_MS = 60_000;

export default function PresentPage() {
  const { presentationId } = useParams<{ presentationId: string }>();
  const navigate = useNavigate();

  // Same query key the editor writes to, so edited timers are what loads here.
  const { data, isLoading, isError, error } = usePresentationDetail(presentationId);
  const markPresented = useMarkPresented();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const startedRef = useRef(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Which way the last move went, so the slide animates in from that side.
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  // Throttles trackpad/wheel momentum so one gesture moves one slide.
  const wheelLockRef = useRef(false);

  const slideConfigs = useMemo(
    () =>
      (data?.slides ?? []).map((s) => ({
        index: s.slideIndex,
        timerEnabled: s.timerEnabled,
        durationSeconds: s.durationSeconds,
      })),
    [data],
  );

  const { state, start, pause, resume, goToSlide, reset } = usePresentationTimer(slideConfigs);

  // Presentation-wide countdown. It is derived from the same elapsed clock the
  // count-up timer uses, so pausing, resetting and slide changes affect both
  // identically and the slide timers stay completely independent of it.
  const globalTimerOff = data?.globalTimerMode === "off";
  const globalCountdownMs =
    data?.globalTimerMode === "countdown" && data.globalCountdownSeconds > 0
      ? data.globalCountdownSeconds * 1000
      : null;
  const alarm =
    globalCountdownMs === null ? null : getCountdownAlertState(globalCountdownMs, state.globalElapsedMs);
  const globalRemainingMs = alarm ? alarm.remainingMs : null;
  const globalTimeUp = alarm?.timeUp ?? false;
  const inAlertWindow = alarm?.inWindow ?? false;
  const opensWithBell = alarm?.opensWithBell ?? false;

  // Browsers only allow sound after the presenter has interacted with the page.
  // Unlock audio on the first click or key press so the alerts can be heard.
  useEffect(() => {
    unlockAlertAudio();
    window.addEventListener("pointerdown", unlockAlertAudio, { once: true });
    window.addEventListener("keydown", unlockAlertAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAlertAudio);
      window.removeEventListener("keydown", unlockAlertAudio);
    };
  }, []);

  // Ten minutes left: ring the bell and make the alarm clock ring. Each of
  // these happens once per run, and resetting the timers re-arms them.
  const [alarmRinging, setAlarmRinging] = useState(false);
  const warningDoneRef = useRef(false);
  useEffect(() => {
    if (!inAlertWindow) {
      warningDoneRef.current = false;
      return;
    }
    if (warningDoneRef.current) return;
    warningDoneRef.current = true;
    // A countdown that started at or under ten minutes is already inside the
    // window, so there is nothing to announce. The clock simply shows.
    if (!opensWithBell) return;

    void playWarningBell();
    toast("10 minutes remaining");
    setAlarmRinging(true);
    const stopRinging = setTimeout(() => setAlarmRinging(false), 2800);
    return () => {
      clearTimeout(stopRinging);
      setAlarmRinging(false);
    };
  }, [inAlertWindow, opensWithBell]);

  // Zero: a second, different alarm, and the clock rings red for a few seconds.
  const [finalFlash, setFinalFlash] = useState(false);
  const finalDoneRef = useRef(false);
  useEffect(() => {
    if (!globalTimeUp) {
      finalDoneRef.current = false;
      setFinalFlash(false);
      return;
    }
    if (finalDoneRef.current) return;
    finalDoneRef.current = true;

    void playFinalAlarm();
    toast("Presentation time is up");
    setFinalFlash(true);
    const hide = setTimeout(() => setFinalFlash(false), 7000);
    return () => clearTimeout(hide);
  }, [globalTimeUp]);

  const alarmVisible = alarm !== null && ((alarm.inWindow && !alarm.timeUp) || finalFlash);

  // Start once, when the presentation's data is actually available.
  useEffect(() => {
    if (data && !startedRef.current) {
      startedRef.current = true;
      start();
      if (presentationId) markPresented.mutate({ presentationId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

  const wakeControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_DELAY_MS);
  }, []);

  useEffect(() => {
    wakeControls();
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [wakeControls]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const totalSlides = data?.slides.length ?? 0;

  const goNext = useCallback(() => {
    const next = Math.min(state.currentSlideIndex + 1, totalSlides - 1);
    if (next !== state.currentSlideIndex) {
      setDirection("forward");
      goToSlide(next);
    }
  }, [state.currentSlideIndex, totalSlides, goToSlide]);

  const goPrev = useCallback(() => {
    const prev = Math.max(state.currentSlideIndex - 1, 0);
    if (prev !== state.currentSlideIndex) {
      setDirection("backward");
      goToSlide(prev);
    }
  }, [state.currentSlideIndex, goToSlide]);

  // Mouse wheel / trackpad scrolling moves between slides. Locked briefly
  // after each move so one flick doesn't skip several slides.
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) < 8) return;
      if (wheelLockRef.current) return;
      wheelLockRef.current = true;
      setTimeout(() => {
        wheelLockRef.current = false;
      }, 420);
      if (delta > 0) goNext();
      else goPrev();
      wakeControls();
    },
    [goNext, goPrev, wakeControls],
  );

  // Auto Advance: only when the presentation has it switched on, and only
  // once the current slide's own timer has actually completed.
  // Auto Advance: when a slide's own timer reaches zero, move to the next
  // slide. Only active when the presentation has Auto Advance switched on.
  useEffect(() => {
    if (!data?.autoAdvance) return;
    if (!state.slideCompleted) return;
    const nextIndex = state.currentSlideIndex + 1;
    if (nextIndex >= totalSlides) return;
    setDirection("forward");
    goToSlide(nextIndex);
  }, [data?.autoAdvance, state.slideCompleted, state.currentSlideIndex, totalSlides, goToSlide]);

  // Preload the neighbouring slides so moving between them doesn't flash
  // blank while the image downloads.
  useEffect(() => {
    if (!data) return;
    for (const offset of [1, -1, 2]) {
      const neighbour = data.slides[state.currentSlideIndex + offset];
      if (neighbour?.thumbnailUrl) {
        const img = new Image();
        img.src = neighbour.thumbnailUrl;
      }
    }
  }, [data, state.currentSlideIndex]);


  // --- Slide transitions ---------------------------------------------------
  // When the slide changes, keep the previous image on screen while it animates
  // out and the new one animates in. State is derived during render (guarded by
  // the slide id) so the very first frame of the new slide already animates.
  const [transitionChoice, setTransitionChoice] = useState<TransitionChoice>(readStoredTransition);
  const [slideAnim, setSlideAnim] = useState<SlideAnimation>({
    slideId: null,
    fromUrl: null,
    style: null,
    dir: "forward",
  });
  const [shownSlide, setShownSlide] = useState<{ id: string; url: string | null } | null>(null);
  const liveSlide = data?.slides[state.currentSlideIndex];
  if (liveSlide && shownSlide?.id !== liveSlide.id) {
    setShownSlide({ id: liveSlide.id, url: liveSlide.thumbnailUrl ?? null });
    setSlideAnim({
      slideId: liveSlide.id,
      fromUrl: shownSlide?.url ?? null,
      // The first slide shown (opening the presentation) does not animate.
      style: shownSlide ? pickTransition(transitionChoice, slideAnim.style) : null,
      dir: direction,
    });
  }
  useEffect(() => {
    if (!slideAnim.fromUrl) return;
    const timer = setTimeout(() => setSlideAnim((a) => ({ ...a, fromUrl: null })), TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [slideAnim.slideId, slideAnim.fromUrl]);
  const cycleTransition = useCallback(() => {
    setTransitionChoice((current) => {
      const next = TRANSITION_CHOICES[(TRANSITION_CHOICES.indexOf(current) + 1) % TRANSITION_CHOICES.length];
      try {
        window.localStorage.setItem(TRANSITION_STORAGE_KEY, next);
      } catch {
        // Not persisted; still applies for this session.
      }
      return next;
    });
  }, []);

  // --- Background music ----------------------------------------------------
  // Two sources: one track for the whole presentation, and optionally a
  // track on an individual slide. A slide's own music takes precedence while
  // that slide is on screen; the presentation track pauses and then resumes
  // from where it left off, rather than restarting.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const deckAudioRef = useRef<HTMLAudioElement | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [showVolume, setShowVolume] = useState(false);

  const slideAudioUrl = data?.slides[state.currentSlideIndex]?.audioUrl ?? null;
  const deckAudioUrl = data?.audioUrl ?? null;
  // What the control bar acts on right now.
  const currentAudioUrl = slideAudioUrl ?? deckAudioUrl;

  // Load the deck-wide track once. It is deliberately NOT keyed to the slide
  // index, so changing slides never restarts or reloads it.
  useEffect(() => {
    const deck = deckAudioRef.current;
    if (!deck) return;
    if (!deckAudioUrl) {
      deck.pause();
      deck.removeAttribute("src");
      deck.load();
      return;
    }
    deck.src = deckAudioUrl;
    deck.loop = true;
    deck.volume = volume;
    deck.play().catch(() => {
      // Autoplay blocked until the presenter interacts.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckAudioUrl]);

  // Slide-specific music, swapped as slides change.
  useEffect(() => {
    const audio = audioRef.current;
    const deck = deckAudioRef.current;
    if (!audio) return;

    if (!slideAudioUrl) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      // Nothing overriding it now, so let the deck track carry on.
      if (deck && deckAudioUrl && !state.isPaused) {
        deck.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false));
      } else {
        setMusicPlaying(false);
      }
      return;
    }

    // Duck the deck track while this slide has its own music.
    if (deck) deck.pause();

    audio.src = slideAudioUrl;
    audio.loop = true;
    audio.volume = volume;
    audio
      .play()
      .then(() => setMusicPlaying(true))
      .catch(() => setMusicPlaying(false));
    // volume intentionally excluded: changing it shouldn't restart the track.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideAudioUrl, deckAudioUrl]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (deckAudioRef.current) deckAudioRef.current.volume = volume;
  }, [volume]);

  // Pausing the presentation pauses its music too.
  useEffect(() => {
    if (!state.isPaused) return;
    audioRef.current?.pause();
    deckAudioRef.current?.pause();
    setMusicPlaying(false);
  }, [state.isPaused]);

  // Whichever track is active right now is the one the button controls.
  const activeAudioEl = useCallback(() => {
    return slideAudioUrl ? audioRef.current : deckAudioRef.current;
  }, [slideAudioUrl]);

  const toggleMusic = useCallback(() => {
    const audio = activeAudioEl();
    if (!audio || !currentAudioUrl) return;
    if (audio.paused) {
      audio.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false));
    } else {
      audio.pause();
      setMusicPlaying(false);
    }
  }, [activeAudioEl, currentAudioUrl]);

  const toggleFullscreen = useCallback(async () => {
    if (!rootRef.current) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await rootRef.current.requestFullscreen();
    } catch {
      toast.error("Full screen isn't available in this browser.");
    }
  }, []);

  const handleExit = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
    }
    toast(globalTimerOff ? "Session ended" : `Session ended — ${formatMs(state.globalElapsedMs)} elapsed`);
    navigate("/presentations");
  }, [navigate, state.globalElapsedMs, globalTimerOff]);

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", " "].includes(e.key)) {
        e.preventDefault();
        goNext();
        wakeControls();
      } else if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        goPrev();
        wakeControls();
      } else if (e.key === "Escape") {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
        else handleExit();
      } else if (e.key === "p" || e.key === "P") {
        state.isPaused ? resume() : pause();
        wakeControls();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, [goNext, goPrev, handleExit, pause, resume, state.isPaused, toggleFullscreen, wakeControls]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const last = lastPointerRef.current;
      const moved =
        !last ||
        Math.abs(e.clientX - last.x) > MOUSE_MOVE_THRESHOLD_PX ||
        Math.abs(e.clientY - last.y) > MOUSE_MOVE_THRESHOLD_PX;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      if (moved) wakeControls();
    },
    [wakeControls],
  );

  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <Spinner size="lg" />
        <p>Loading presentation…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles.notFound}>
        <AlertCircle className={styles.notFoundIcon} />
        <p>{error instanceof Error ? error.message : "That presentation couldn't be found."}</p>
        <Button variant="primary" onClick={() => navigate("/presentations")}>
          Back to Presentations
        </Button>
      </div>
    );
  }

  const currentSlide = data.slides[state.currentSlideIndex];
  const slideHasTimer = !!currentSlide?.timerEnabled;
  const inWarning =
    slideHasTimer &&
    !state.slideCompleted &&
    state.slideRemainingMs !== null &&
    state.slideRemainingMs <= WARNING_THRESHOLD_MS;

  return (
    <div
      ref={rootRef}
      className={styles.root}
      onMouseMove={handleMouseMove}
      onClick={wakeControls}
      onWheel={handleWheel}
    >
      <audio ref={audioRef} preload="auto" />
      <audio ref={deckAudioRef} preload="auto" />

      <div className={styles.slideArea}>
        {currentSlide?.thumbnailUrl ? (
          <div className={styles.stage} style={{ "--dir": direction === "forward" ? 1 : -1 } as React.CSSProperties}>
            {slideAnim.fromUrl && slideAnim.style && (
              <img
                key={`leave-${slideAnim.slideId}`}
                src={slideAnim.fromUrl}
                alt=""
                aria-hidden="true"
                className={`${styles.slideImage} ${styles.leaving} ${styles[`leave_${slideAnim.style}`]}`}
                style={{ "--dir": slideAnim.dir === "forward" ? 1 : -1 } as React.CSSProperties}
              />
            )}
            <img
              // Keying on the slide id restarts the enter animation each move.
              key={currentSlide.id}
              src={currentSlide.thumbnailUrl}
              alt={`Slide ${state.currentSlideIndex + 1}`}
              className={`${styles.slideImage} ${
                slideAnim.style && slideAnim.slideId === currentSlide.id
                  ? styles[`enter_${slideAnim.style}`]
                  : ""
              }`}
              style={{ "--dir": slideAnim.dir === "forward" ? 1 : -1 } as React.CSSProperties}
            />
          </div>
        ) : (
          <div className={styles.slideCard}>
            <span className={styles.slideNumber}>
              Slide {state.currentSlideIndex + 1} of {totalSlides}
            </span>
            <h1 className={styles.slideTitle}>{data.title}</h1>
          </div>
        )}
      </div>

      <div className={styles.timerCluster}>
        {!globalTimerOff && (
          <div
            className={`${styles.timerBadge} ${styles.timerGlobal} ${
              globalTimeUp
                ? styles.timerComplete
                : globalRemainingMs !== null && globalRemainingMs <= WARNING_THRESHOLD_MS
                  ? styles.timerWarning
                  : ""
            }`}
          >
            <span className={styles.timerLabel}>
              {globalRemainingMs === null ? "Global" : "Time left"}
            </span>
            <span className={styles.timerValue}>
              {globalRemainingMs === null
                ? formatMs(state.globalElapsedMs)
                : formatCountdownMs(globalRemainingMs)}
            </span>
          </div>
        )}
        {alarm && alarmVisible && (
          <AlarmClockWarning
            fraction={alarm.fraction}
            ringing={alarmRinging || finalFlash}
            urgent={alarm.urgent}
            expired={alarm.timeUp}
          />
        )}
        {slideHasTimer && (
          <div
            className={`${styles.timerBadge} ${styles.timerSlide} ${
              state.slideCompleted ? styles.timerComplete : ""
            } ${inWarning ? styles.timerWarning : ""}`}
          >
            <span className={styles.timerLabel}>
              <Clock3 className={styles.timerIcon} />
              Slide
            </span>
            <span className={styles.timerValue}>{formatMs(state.slideRemainingMs ?? 0)}</span>
          </div>
        )}
      </div>

      <div className={`${styles.controlsLayer} ${controlsVisible ? "" : styles.controlsHidden}`}>
        <div className={styles.controlBar}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={goPrev}
            aria-label="Previous slide"
            className={styles.controlBtn}
          >
            <ChevronLeft className={styles.controlIcon} />
          </Button>
          <span className={styles.slideCounter}>
            {state.currentSlideIndex + 1} / {totalSlides}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={goNext}
            aria-label="Next slide"
            className={styles.controlBtn}
          >
            <ChevronRight className={styles.controlIcon} />
          </Button>

          <div className={styles.divider} />

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => (state.isPaused ? resume() : pause())}
            aria-label={state.isPaused ? "Resume" : "Pause"}
            className={styles.controlBtn}
          >
            {state.isPaused ? (
              <Play className={styles.controlIcon} />
            ) : (
              <Pause className={styles.controlIcon} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={reset}
            aria-label="Reset timers"
            className={styles.controlBtn}
          >
            <Clock3 className={styles.controlIcon} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              cycleTransition();
              // Don't leave focus here, or Space/Enter would cycle it again.
              e.currentTarget.blur();
            }}
            aria-label={`Slide transition: ${TRANSITION_LABELS[transitionChoice]}. Click to change.`}
            title="Slide transition (click to change)"
            className={styles.transitionBtn}
          >
            <Sparkles className={styles.controlIcon} />
            <span>{TRANSITION_LABELS[transitionChoice]}</span>
          </Button>
          <div className={styles.divider} />

          {currentAudioUrl && (
            <div
              className={styles.musicGroup}
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
            >
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleMusic}
                aria-label={musicPlaying ? "Pause music" : "Play music"}
                className={styles.controlBtn}
              >
                {musicPlaying ? (
                  <Volume2 className={styles.controlIcon} />
                ) : (
                  <VolumeX className={styles.controlIcon} />
                )}
              </Button>
              {showVolume && (
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className={styles.volumeSlider}
                  aria-label="Music volume"
                />
              )}
            </div>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleFullscreen}
            aria-label="Toggle full screen"
            className={styles.controlBtn}
          >
            {isFullscreen ? (
              <Minimize className={styles.controlIcon} />
            ) : (
              <Maximize className={styles.controlIcon} />
            )}
          </Button>

          <div className={styles.divider} />

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleExit}
            aria-label="Exit presentation"
            className={styles.controlBtnExit}
          >
            <X className={styles.controlIcon} />
          </Button>
        </div>
      </div>
    </div>
  );
}
