// When the presentation countdown should warn the presenter, as plain
// functions of "how long is the countdown" and "how long has elapsed", so the
// rules can be tested without a screen.
//
// Two moments matter:
//  - the countdown enters its last ten minutes: a bell and a glowing alarm clock
//  - the countdown reaches zero: a second, different alarm

export const ALERT_WINDOW_MS = 10 * 60 * 1000;
export const FINAL_MINUTE_MS = 60 * 1000;

export interface CountdownAlertState {
  remainingMs: number;
  /** Inside the last ten minutes (or the whole countdown, if it is shorter). */
  inWindow: boolean;
  /** 1 when the window opens, falling to 0 at zero. Drives the draining ring. */
  fraction: number;
  /** The final minute: the clock pulses faster and turns red. */
  urgent: boolean;
  timeUp: boolean;
  /**
   * Whether entering the window should ring the bell. Only true when the
   * countdown starts ABOVE ten minutes and then crosses it. A shorter
   * countdown is already inside the window from the first second, so
   * announcing "10 minutes left" at the start would be wrong.
   */
  opensWithBell: boolean;
}

export function getCountdownAlertState(totalMs: number, elapsedMs: number): CountdownAlertState {
  const remainingMs = Math.max(0, totalMs - elapsedMs);
  // The ring drains over the window, or over the whole countdown if shorter.
  const windowMs = Math.min(totalMs, ALERT_WINDOW_MS);
  return {
    remainingMs,
    inWindow: remainingMs <= ALERT_WINDOW_MS,
    fraction: windowMs > 0 ? Math.min(1, remainingMs / windowMs) : 0,
    urgent: remainingMs > 0 && remainingMs <= FINAL_MINUTE_MS,
    timeUp: remainingMs <= 0,
    opensWithBell: totalMs > ALERT_WINDOW_MS,
  };
}
