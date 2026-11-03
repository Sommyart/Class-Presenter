import React from "react";
import { CheckCircle2, Clock3, Eye, RotateCcw, ArrowLeft, Hourglass } from "lucide-react";
import { Button } from "./Button";
import styles from "./SessionSummary.module.css";

export type SummarySlide = {
  index: number;
  viewed: boolean;
  /** Time this slide was on screen (excluding paused time), in ms. */
  dwellMs: number;
  /** Planned slide timer in seconds, or null when the slide has no timer. */
  plannedSeconds: number | null;
};

export type SessionSummaryData = {
  title: string;
  reason: "timeUp" | "manual";
  durationMs: number;
  /** The global countdown length in ms, or null when there was none. */
  countdownMs: number | null;
  slides: SummarySlide[];
};

/** 00:42, 12:05 or 1:02:09. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** "1 hr 12 min", "42 min 10 sec", "35 sec". */
export function formatSpoken(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
  if (m > 0) return s > 0 ? `${m} min ${s} sec` : `${m} min`;
  return `${s} sec`;
}

export const SessionSummary = ({
  data,
  onBack,
  onPresentAgain,
}: {
  data: SessionSummaryData;
  onBack: () => void;
  onPresentAgain: () => void;
}) => {
  const total = data.slides.length;
  const viewed = data.slides.filter((s) => s.viewed).length;
  const pct = total > 0 ? Math.round((viewed / total) * 100) : 0;
  const timeUp = data.reason === "timeUp";
  const longestDwell = Math.max(1, ...data.slides.map((s) => s.dwellMs));

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Session summary">
      <div className={styles.card}>
        <div className={`${styles.badge} ${timeUp ? styles.badgeTimeUp : ""}`}>
          {timeUp ? <Hourglass className={styles.badgeIcon} /> : <CheckCircle2 className={styles.badgeIcon} />}
          {timeUp ? "Time is up" : "Session ended"}
        </div>
        <h1 className={styles.title}>{data.title}</h1>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <Clock3 className={styles.statIcon} />
            <span className={styles.statValue}>{formatSpoken(data.durationMs)}</span>
            <span className={styles.statLabel}>
              Session length ({formatClock(data.durationMs)})
              {data.countdownMs !== null && <> of {formatClock(data.countdownMs)} planned</>}
            </span>
          </div>
          <div className={styles.stat}>
            <Eye className={styles.statIcon} />
            <span className={styles.statValue}>
              {viewed} of {total}
            </span>
            <span className={styles.statLabel}>Slides viewed ({pct}%)</span>
          </div>
        </div>

        <div className={styles.progress} aria-hidden="true">
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>

        <div className={styles.listHeader}>Time on each slide</div>
        <ul className={styles.list}>
          {data.slides.map((s) => (
            <li key={s.index} className={`${styles.row} ${s.viewed ? "" : styles.rowSkipped}`}>
              <span className={styles.rowNum}>{s.index + 1}</span>
              <span className={styles.rowBarWrap}>
                <span
                  className={styles.rowBar}
                  style={{ width: s.viewed ? `${Math.max(3, (s.dwellMs / longestDwell) * 100)}%` : "0%" }}
                />
              </span>
              <span className={styles.rowTime}>
                {s.viewed ? formatClock(s.dwellMs) : "Not viewed"}
                {s.viewed && s.plannedSeconds !== null && (
                  <span className={styles.rowPlanned}> / {formatClock(s.plannedSeconds * 1000)}</span>
                )}
              </span>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <Button variant="outline" onClick={onPresentAgain}>
            <RotateCcw className={styles.actionIcon} />
            Present again
          </Button>
          <Button variant="primary" onClick={onBack}>
            <ArrowLeft className={styles.actionIcon} />
            Back to presentations
          </Button>
        </div>
      </div>
    </div>
  );
};
