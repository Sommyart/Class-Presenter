import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Play,
  Clock3,
  CheckSquare,
  Square,
  X,
  AlertCircle,
  Music,
  Upload,
  Bell,
} from "lucide-react";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Switch } from "../components/Switch";
import { Skeleton } from "../components/Skeleton";
import { Spinner } from "../components/Spinner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "../components/Sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/Dialog";
import {
  usePresentationDetail,
  useUpdateTimers,
  useSetSlideAudio,
  useSetPresentationAudio,
} from "../helpers/usePresentationQueries";
import { presentationAdapters } from "../helpers/presentationAdapters";
import type { SlideDetail } from "../endpoints/presentations/detail_GET.schema";
import { MAX_GLOBAL_COUNTDOWN_SECONDS } from "../endpoints/presentations/update_timers_POST.schema";
import { playAlertPreview } from "../helpers/alertSounds";
import styles from "./presentations.$presentationId.edit.module.css";

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function EditPresentationPage() {
  const { presentationId } = useParams<{ presentationId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = usePresentationDetail(presentationId);
  const updateTimers = useUpdateTimers(presentationId);

  // Local working copy, seeded from the server and written back on save.
  const [slides, setSlides] = useState<SlideDetail[]>([]);
  const [autoAdvance, setAutoAdvance] = useState(false);

  // Whole-presentation timer: count up from zero, count down from a set time, or off.
  const [gMode, setGMode] = useState<"elapsed" | "countdown" | "off">("elapsed");
  const [gH, setGH] = useState("0");
  const [gM, setGM] = useState("0");
  const [gS, setGS] = useState("0");

  useEffect(() => {
    if (data) {
      setSlides(data.slides);
      setAutoAdvance(data.autoAdvance);
      setGMode(data.globalTimerMode);
      setGH(String(Math.floor(data.globalCountdownSeconds / 3600)));
      setGM(String(Math.floor((data.globalCountdownSeconds % 3600) / 60)));
      setGS(String(data.globalCountdownSeconds % 60));
    }
  }, [data]);

  const [openSlideIndex, setOpenSlideIndex] = useState<number | null>(null);
  const audioInputRef = React.useRef<HTMLInputElement | null>(null);
  const audioMutation = useSetSlideAudio(presentationId);
  const deckAudioInputRef = React.useRef<HTMLInputElement | null>(null);
  const deckAudioMutation = useSetPresentationAudio(presentationId);
  const openSlide =
    openSlideIndex === null ? undefined : slides.find((s) => s.slideIndex === openSlideIndex);
  const [draftEnabled, setDraftEnabled] = useState(false);
  const [draftH, setDraftH] = useState("0");
  const [draftM, setDraftM] = useState("0");
  const [draftS, setDraftS] = useState("0");

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkM, setBulkM] = useState("2");
  const [confirmBulk, setConfirmBulk] = useState<{ scope: "selected" | "all"; seconds: number } | null>(null);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Skeleton style={{ height: "3rem", width: "40%" }} />
        <div className={styles.grid}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} style={{ height: "9rem", borderRadius: "var(--radius-md)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles.notFound}>
        <AlertCircle className={styles.errorIcon} />
        <p>{error instanceof Error ? error.message : "That presentation couldn't be found."}</p>
        <Button variant="primary" onClick={() => navigate("/presentations")}>
          Back to Presentations
        </Button>
      </div>
    );
  }

  const adapter = presentationAdapters[data.sourceType];

  const toWholeNumber = (value: string) => Math.max(0, Math.floor(Number(value) || 0));
  const gSeconds = toWholeNumber(gH) * 3600 + toWholeNumber(gM) * 60 + toWholeNumber(gS);
  const globalTimerDirty =
    gMode !== data.globalTimerMode ||
    (gMode === "countdown" && gSeconds !== data.globalCountdownSeconds);

  const saveGlobalTimer = () => {
    if (gMode === "countdown") {
      if (gSeconds <= 0) {
        toast.error("Set a countdown duration first.");
        return;
      }
      if (gSeconds > MAX_GLOBAL_COUNTDOWN_SECONDS) {
        toast.error("The longest countdown is 24 hours.");
        return;
      }
    }
    updateTimers.mutate(
      {
        presentationId: data.id,
        globalTimerMode: gMode,
        // Switching back to count-up leaves the saved countdown length alone,
        // so flipping between the two doesn't lose it.
        ...(gMode === "countdown" ? { globalCountdownSeconds: gSeconds } : {}),
      },
      {
        onSuccess: () =>
          toast.success(
            gMode === "countdown"
              ? `Countdown set to ${formatDuration(gSeconds)}`
              : gMode === "off"
                ? "Presentation timer turned off. Slide timers still run."
                : "Presentation timer will count up",
          ),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Couldn't save the presentation timer."),
      },
    );
  };

  const persist = (nextSlides: SlideDetail[], nextAutoAdvance: boolean, message: string) => {
    updateTimers.mutate(
      {
        presentationId: data.id,
        autoAdvance: nextAutoAdvance,
        slides: nextSlides.map((s) => ({
          slideIndex: s.slideIndex,
          timerEnabled: s.timerEnabled,
          durationSeconds: s.durationSeconds,
        })),
      },
      {
        onSuccess: () => toast.success(message),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Couldn't save your timer settings."),
      },
    );
  };

  const handleOpenSlide = (slideIndex: number) => {
    const slide = slides.find((s) => s.slideIndex === slideIndex);
    if (!slide) return;
    setDraftEnabled(slide.timerEnabled);
    setDraftH(String(Math.floor(slide.durationSeconds / 3600)));
    setDraftM(String(Math.floor((slide.durationSeconds % 3600) / 60)));
    setDraftS(String(slide.durationSeconds % 60));
    setOpenSlideIndex(slideIndex);
  };

  const saveSlide = () => {
    if (openSlideIndex === null) return;
    const seconds = (Number(draftH) || 0) * 3600 + (Number(draftM) || 0) * 60 + (Number(draftS) || 0);
    const next = slides.map((s) =>
      s.slideIndex === openSlideIndex
        ? { ...s, timerEnabled: draftEnabled, durationSeconds: seconds }
        : s,
    );
    setSlides(next);
    persist(next, autoAdvance, `Slide ${openSlideIndex + 1} updated`);
    setOpenSlideIndex(null);
  };

  const clearSlideTimer = () => {
    if (openSlideIndex === null) return;
    const next = slides.map((s) =>
      s.slideIndex === openSlideIndex ? { ...s, timerEnabled: false } : s,
    );
    setSlides(next);
    persist(next, autoAdvance, `Timer cleared for slide ${openSlideIndex + 1}`);
    setOpenSlideIndex(null);
  };

  const handleAutoAdvance = (value: boolean) => {
    setAutoAdvance(value);
    persist(slides, value, value ? "Auto Advance on" : "Auto Advance off");
  };

  const toggleSelected = (slideIndex: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slideIndex)) next.delete(slideIndex);
      else next.add(slideIndex);
      return next;
    });
  };

  const requestBulkApply = (scope: "selected" | "all") => {
    const seconds = (Number(bulkM) || 0) * 60;
    if (seconds <= 0) {
      toast.error("Set a duration first.");
      return;
    }
    const targets = scope === "selected" ? Array.from(selected) : slides.map((s) => s.slideIndex);
    const hasExisting = slides.some((s) => targets.includes(s.slideIndex) && s.timerEnabled);
    if (hasExisting) setConfirmBulk({ scope, seconds });
    else applyBulk(scope, seconds);
  };

  const applyBulk = (scope: "selected" | "all", seconds: number) => {
    const targets = new Set(
      scope === "selected" ? Array.from(selected) : slides.map((s) => s.slideIndex),
    );
    const next = slides.map((s) =>
      targets.has(s.slideIndex) ? { ...s, timerEnabled: true, durationSeconds: seconds } : s,
    );
    setSlides(next);
    persist(next, autoAdvance, `Applied ${formatDuration(seconds)} to ${targets.size} slides`);
    setConfirmBulk(null);
    setSelected(new Set());
    setSelectMode(false);
  };

  const timedCount = slides.filter((s) => s.timerEnabled).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link to="/presentations" className={styles.backLink}>
            <ArrowLeft className={styles.backIcon} />
            Presentations
          </Link>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{data.title}</h1>
            <Badge variant="secondary">{adapter.label}</Badge>
            {updateTimers.isPending && <Spinner size="sm" />}
          </div>
          <p className={styles.subtitle}>
            {slides.length} slides · {timedCount} with a timer configured
          </p>
        </div>
        <Button asChild variant="primary" size="lg">
          <Link to={`/present/${data.id}`}>
            <Play className={styles.headerIcon} />
            Present
          </Link>
        </Button>
      </div>

      <div className={styles.globalTimer}>
        <div className={styles.globalTimerHead}>
          <Clock3 className={styles.globalTimerIcon} />
          <div className={styles.globalTimerText}>
            <span className={styles.globalTimerTitle}>Presentation timer</span>
            <span className={styles.globalTimerHint}>
              {gMode === "countdown"
                ? "Rings a bell with a glowing alarm clock at 10 minutes left, and sounds again at zero. Slide timers run separately."
                : gMode === "off"
                  ? "No presentation timer is shown while you present. Your slide timers still work."
                  : "Shown on screen while you present. Slide timers run separately."}
            </span>
          </div>
        </div>

        <div className={styles.globalTimerControls}>
          <div className={styles.segmented} role="radiogroup" aria-label="Presentation timer type">
            <button
              type="button"
              role="radio"
              aria-checked={gMode === "elapsed"}
              className={`${styles.segment} ${gMode === "elapsed" ? styles.segmentActive : ""}`}
              onClick={() => setGMode("elapsed")}
            >
              Count up
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={gMode === "countdown"}
              className={`${styles.segment} ${gMode === "countdown" ? styles.segmentActive : ""}`}
              onClick={() => setGMode("countdown")}
            >
              Countdown
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={gMode === "off"}
              className={`${styles.segment} ${gMode === "off" ? styles.segmentActive : ""}`}
              onClick={() => setGMode("off")}
            >
              Off
            </button>
          </div>

          {gMode === "countdown" && (
            <div className={styles.globalDuration}>
              <label className={styles.globalDurationField}>
                <input
                  type="number"
                  min={0}
                  max={24}
                  value={gH}
                  onChange={(e) => setGH(e.target.value)}
                  className={styles.globalDurationInput}
                  aria-label="Hours"
                />
                <span>h</span>
              </label>
              <label className={styles.globalDurationField}>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={gM}
                  onChange={(e) => setGM(e.target.value)}
                  className={styles.globalDurationInput}
                  aria-label="Minutes"
                />
                <span>m</span>
              </label>
              <label className={styles.globalDurationField}>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={gS}
                  onChange={(e) => setGS(e.target.value)}
                  className={styles.globalDurationInput}
                  aria-label="Seconds"
                />
                <span>s</span>
              </label>
            </div>
          )}

          {gMode === "countdown" && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const played = await playAlertPreview();
                if (played) {
                  toast("Playing the 10 minute bell, then the time's up alarm");
                } else {
                  toast.error("Your browser is blocking sound. Click anywhere on the page and try again.");
                }
              }}
            >
              <Bell className={styles.toolbarIcon} />
              Test sounds
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            disabled={!globalTimerDirty || updateTimers.isPending}
            onClick={saveGlobalTimer}
          >
            {updateTimers.isPending ? <Spinner size="sm" /> : null}
            Save
          </Button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.autoAdvance}>
          <Switch checked={autoAdvance} onCheckedChange={handleAutoAdvance} id="auto-advance" />
          <label htmlFor="auto-advance" className={styles.autoAdvanceLabel}>
            Auto Advance
            <span className={styles.autoAdvanceHint}>
              Move to the next slide when its timer hits zero
            </span>
          </label>
        </div>

        <div className={styles.deckMusic}>
          <input
            ref={deckAudioInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3,.mp3"
            className={styles.hiddenInput}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              deckAudioMutation.mutate(file, {
                onSuccess: () => toast.success(`"${file.name}" will play through the presentation`),
                onError: (err) =>
                  toast.error(err instanceof Error ? err.message : "Upload failed."),
              });
            }}
          />
          {data.audioName ? (
            <div className={styles.audioCurrent}>
              <Music className={styles.audioIcon} />
              <span className={styles.audioName} title={data.audioName}>{data.audioName}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remove presentation music"
                disabled={deckAudioMutation.isPending}
                onClick={() =>
                  deckAudioMutation.mutate(null, {
                    onSuccess: () => toast.success("Presentation music removed"),
                    onError: (err) =>
                      toast.error(err instanceof Error ? err.message : "Couldn't remove it."),
                  })
                }
              >
                <X className={styles.audioIcon} />
              </Button>
            </div>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            disabled={deckAudioMutation.isPending}
            onClick={() => deckAudioInputRef.current?.click()}
          >
            {deckAudioMutation.isPending ? (
              <Spinner size="sm" />
            ) : (
              <Music className={styles.toolbarIcon} />
            )}
            {data.audioName ? "Replace music" : "Music for whole presentation"}
          </Button>
        </div>

        {!selectMode ? (
          <Button variant="outline" size="sm" onClick={() => setSelectMode(true)}>
            <CheckSquare className={styles.toolbarIcon} />
            Apply Timer to multiple slides
          </Button>
        ) : (
          <div className={styles.bulkBar}>
            <span className={styles.bulkCount}>{selected.size} selected</span>
            <div className={styles.bulkDuration}>
              <input
                type="number"
                min={0}
                value={bulkM}
                onChange={(e) => setBulkM(e.target.value)}
                className={styles.bulkInput}
                aria-label="Minutes"
              />
              <span className={styles.bulkUnit}>min</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => requestBulkApply("selected")}
              disabled={selected.size === 0}
            >
              Apply to selected
            </Button>
            <Button variant="outline" size="sm" onClick={() => requestBulkApply("all")}>
              Apply to all
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setSelectMode(false);
                setSelected(new Set());
              }}
              aria-label="Cancel selection"
            >
              <X className={styles.toolbarIcon} />
            </Button>
          </div>
        )}
      </div>

      <div className={styles.grid}>
        {slides.map((slide) => {
          const isSelected = selected.has(slide.slideIndex);
          return (
            <button
              key={slide.id}
              type="button"
              className={`${styles.thumb} ${isSelected ? styles.thumbSelected : ""}`}
              onClick={() =>
                selectMode ? toggleSelected(slide.slideIndex) : handleOpenSlide(slide.slideIndex)
              }
            >
              {selectMode && (
                <span className={styles.thumbCheck}>
                  {isSelected ? (
                    <CheckSquare className={styles.checkIcon} />
                  ) : (
                    <Square className={styles.checkIcon} />
                  )}
                </span>
              )}
              <div className={styles.thumbPreview}>
                {slide.thumbnailUrl ? (
                  <img
                    src={slide.thumbnailUrl}
                    alt={`Slide ${slide.slideIndex + 1}`}
                    className={styles.thumbImage}
                    loading="lazy"
                  />
                ) : (
                  <span className={styles.thumbNumber}>{slide.slideIndex + 1}</span>
                )}
              </div>
              <div className={styles.thumbFooter}>
                <span className={styles.thumbTitle}>Slide {slide.slideIndex + 1}</span>
                {slide.timerEnabled ? (
                  <span className={styles.thumbTimer}>
                    <Clock3 className={styles.thumbTimerIcon} />
                    {formatDuration(slide.durationSeconds)}
                  </span>
                ) : (
                  <span className={styles.thumbNoTimer}>No timer</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <Sheet
        open={openSlideIndex !== null}
        onOpenChange={(open) => !open && setOpenSlideIndex(null)}
      >
        <SheetContent side="right" className={styles.sheet}>
          <SheetHeader>
            <SheetTitle>Slide {openSlideIndex !== null ? openSlideIndex + 1 : ""}</SheetTitle>
            <SheetDescription>Configure this slide's own timer.</SheetDescription>
          </SheetHeader>

          <div className={styles.sheetBody}>
            <div className={styles.sheetRow}>
              <span className={styles.sheetRowLabel}>Enable Slide Timer</span>
              <Switch checked={draftEnabled} onCheckedChange={setDraftEnabled} />
            </div>

            {draftEnabled && (
              <div className={styles.durationRow}>
                <label className={styles.durationField}>
                  <span>Hours</span>
                  <input
                    type="number"
                    min={0}
                    value={draftH}
                    onChange={(e) => setDraftH(e.target.value)}
                    className={styles.durationInput}
                  />
                </label>
                <label className={styles.durationField}>
                  <span>Minutes</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={draftM}
                    onChange={(e) => setDraftM(e.target.value)}
                    className={styles.durationInput}
                  />
                </label>
                <label className={styles.durationField}>
                  <span>Seconds</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={draftS}
                    onChange={(e) => setDraftS(e.target.value)}
                    className={styles.durationInput}
                  />
                </label>
              </div>
            )}

            <div className={styles.audioSection}>
              <div className={styles.sheetRow}>
                <span className={styles.sheetRowLabel}>Background music</span>
                {audioMutation.isPending && <Spinner size="sm" />}
              </div>

              {openSlide?.audioName ? (
                <div className={styles.audioCurrent}>
                  <Music className={styles.audioIcon} />
                  <span className={styles.audioName} title={openSlide.audioName}>
                    {openSlide.audioName}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove music"
                    disabled={audioMutation.isPending}
                    onClick={() =>
                      openSlideIndex !== null &&
                      audioMutation.mutate(
                        { slideIndex: openSlideIndex, file: null },
                        {
                          onSuccess: () => toast.success("Music removed"),
                          onError: (err) =>
                            toast.error(err instanceof Error ? err.message : "Couldn't remove it."),
                        },
                      )
                    }
                  >
                    <X className={styles.audioIcon} />
                  </Button>
                </div>
              ) : (
                <p className={styles.audioHint}>
                  Add an MP3 that plays while this slide is on screen. Up to 20MB.
                </p>
              )}

              <input
                ref={audioInputRef}
                type="file"
                accept="audio/mpeg,audio/mp3,.mp3"
                className={styles.hiddenInput}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file || openSlideIndex === null) return;
                  audioMutation.mutate(
                    { slideIndex: openSlideIndex, file },
                    {
                      onSuccess: () => toast.success(`"${file.name}" attached`),
                      onError: (err) =>
                        toast.error(err instanceof Error ? err.message : "Upload failed."),
                    },
                  );
                }}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={audioMutation.isPending}
                onClick={() => audioInputRef.current?.click()}
              >
                <Upload className={styles.audioIcon} />
                {openSlide?.audioName ? "Replace music" : "Upload MP3"}
              </Button>
            </div>
          </div>

          <SheetFooter className={styles.sheetFooter}>
            <Button variant="ghost" onClick={clearSlideTimer}>Clear Timer</Button>
            <Button variant="primary" onClick={saveSlide}>Save</Button>
          </SheetFooter>        </SheetContent>
      </Sheet>

      <Dialog open={confirmBulk !== null} onOpenChange={(open) => !open && setConfirmBulk(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Overwrite existing timers?</DialogTitle>
            <DialogDescription>
              Some of the {confirmBulk?.scope === "all" ? "slides" : "selected slides"} already have
              a timer set. Applying {confirmBulk ? formatDuration(confirmBulk.seconds) : ""} will
              replace it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBulk(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => confirmBulk && applyBulk(confirmBulk.scope, confirmBulk.seconds)}
            >
              Overwrite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
