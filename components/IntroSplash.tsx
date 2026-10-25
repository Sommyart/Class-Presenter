import React, { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import styles from "./IntroSplash.module.css";

// Shown once per app open (per browser tab session), not on every route
// change — sessionStorage is the right scope for that: it clears when the
// tab closes, so reopening the app replays it, but navigating around
// inside the app does not.
const SESSION_KEY = "classpresenter:intro-played";

const TOTAL_MS = 2600;

export const IntroSplash = () => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let alreadyPlayed = false;
    try {
      alreadyPlayed = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // Private mode / storage disabled — just don't repeat within this mount.
      alreadyPlayed = false;
    }

    // Respect a reduced-motion preference by skipping the animation entirely.
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (alreadyPlayed || prefersReducedMotion) {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      return;
    }

    setVisible(true);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }

    const leaveTimer = setTimeout(() => setLeaving(true), TOTAL_MS - 500);
    const doneTimer = setTimeout(() => setVisible(false), TOTAL_MS);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`${styles.overlay} ${leaving ? styles.overlayLeaving : ""}`}
      role="presentation"
      aria-hidden="true"
      // Let an impatient user skip straight past it.
      onClick={() => setLeaving(true)}
    >
      <div className={styles.inner}>
        <div className={styles.markWrap}>
          <span className={styles.ring} />
          <Clock3 className={styles.mark} />
        </div>

        <h1 className={styles.title}>
          <span className={styles.word}>Class</span>
          <span className={`${styles.word} ${styles.wordAccent}`}>Presenter</span>
        </h1>

        <div className={styles.rule} />

        <p className={styles.credit}>
          <span className={styles.creditLabel}>Developed by</span>
          <span className={styles.creditName}>Sommyart Imagery</span>
        </p>
      </div>
    </div>
  );
};
