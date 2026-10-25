import React from "react";
import { AlarmClock } from "lucide-react";
import styles from "./AlarmClockWarning.module.css";

interface AlarmClockWarningProps {
  /** 1 when the warning opens, draining to 0 at the last second. */
  fraction: number;
  /** The clock is physically ringing (shaking and rippling). */
  ringing: boolean;
  /** Final minute: faster pulse, red glow. */
  urgent: boolean;
  /** Time is up. */
  expired: boolean;
}

const RADIUS = 27;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * A glowing alarm clock inside a ring that drains as the countdown runs out.
 * It is shown for the last ten minutes of a presentation countdown.
 */
export const AlarmClockWarning = ({ fraction, ringing, urgent, expired }: AlarmClockWarningProps) => {
  const clamped = Math.min(1, Math.max(0, fraction));

  return (
    <div
      className={`${styles.wrap} ${urgent ? styles.urgent : ""} ${expired ? styles.expired : ""} ${
        ringing ? styles.ringing : ""
      }`}
      role="img"
      aria-label={expired ? "Time is up" : "Ten minutes or less remaining"}
    >
      <svg className={styles.ring} viewBox="0 0 64 64" aria-hidden="true">
        <circle className={styles.track} cx="32" cy="32" r={RADIUS} />
        <circle
          className={styles.progress}
          cx="32"
          cy="32"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - clamped)}
        />
      </svg>
      <AlarmClock className={styles.icon} />
    </div>
  );
};
