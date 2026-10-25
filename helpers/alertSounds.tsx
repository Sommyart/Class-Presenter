// Alert sounds for the presentation countdown. They are synthesized with the
// Web Audio API, so there are no audio files to host, download or pay storage
// for, and they work offline.
//
// Two distinct sounds, so the presenter can tell them apart without looking:
//  - warning bell: three soft bell strikes, when ten minutes remain
//  - final alarm:  two rounds of urgent two-tone beeps, then a low bell, at zero

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (context) return context;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
}

/**
 * Returns a running audio context, or null if the browser won't let audio
 * start yet. Browsers block sound until the user has interacted with the page.
 *
 * resume() is raced against a short timeout on purpose: when audio is blocked
 * some browsers leave resume() pending until the next click. Waiting on it
 * would make an alert that was due now play late, at a random later moment.
 */
async function ready(): Promise<AudioContext | null> {
  const ctx = getContext();
  if (!ctx) return null;
  if (ctx.state === "suspended") {
    await Promise.race([
      ctx.resume().then(
        () => true,
        () => false,
      ),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 300)),
    ]);
  }
  return ctx.state === "running" ? ctx : null;
}

/** Call from a click or key press so later alerts are allowed to make sound. */
export function unlockAlertAudio(): void {
  void ready();
}

// A bell is a fundamental plus a few inharmonic overtones, all fading together.
const BELL_PARTIALS: Array<[ratio: number, level: number]> = [
  [1, 1],
  [2, 0.5],
  [2.76, 0.35],
  [5.4, 0.15],
];

function strikeBell(
  ctx: AudioContext,
  when: number,
  frequency: number,
  peak: number,
  decaySeconds: number,
) {
  // Normalised so the overtones together never exceed `peak`, which keeps
  // overlapping strikes well clear of distortion.
  const total = BELL_PARTIALS.reduce((sum, [, level]) => sum + level, 0);

  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, when);
  envelope.gain.exponentialRampToValueAtTime(peak, when + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, when + decaySeconds);
  envelope.connect(ctx.destination);

  for (const [ratio, level] of BELL_PARTIALS) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency * ratio, when);
    gain.gain.setValueAtTime(level / total, when);
    oscillator.connect(gain);
    gain.connect(envelope);
    oscillator.start(when);
    oscillator.stop(when + decaySeconds + 0.05);
  }
}

function beep(ctx: AudioContext, when: number, frequency: number, seconds: number, peak: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(peak, when + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + seconds);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(when);
  oscillator.stop(when + seconds + 0.02);
}

/** Three bell strikes. Returns the time (on the audio clock) the sound ends. */
function scheduleWarningBell(ctx: AudioContext, start: number): number {
  const spacing = 0.55;
  const decay = 1.8;
  for (let i = 0; i < 3; i++) {
    strikeBell(ctx, start + i * spacing, 880, 0.3, decay);
  }
  return start + 2 * spacing + decay;
}

/** Two rounds of urgent beeps, then a low bell. Returns the time it ends. */
function scheduleFinalAlarm(ctx: AudioContext, start: number): number {
  const tones = [988, 740];
  let t = start;
  for (let round = 0; round < 2; round++) {
    for (let i = 0; i < 4; i++) {
      beep(ctx, t, tones[i % 2], 0.16, 0.28);
      t += 0.22;
    }
    t += 0.25;
  }
  const decay = 2.2;
  strikeBell(ctx, t, 523, 0.32, decay);
  return t + decay;
}

/** Plays the ten-minute warning. Resolves true if it was able to make sound. */
export async function playWarningBell(): Promise<boolean> {
  const ctx = await ready();
  if (!ctx) return false;
  scheduleWarningBell(ctx, ctx.currentTime + 0.05);
  return true;
}

/** Plays the time's-up alarm. Resolves true if it was able to make sound. */
export async function playFinalAlarm(): Promise<boolean> {
  const ctx = await ready();
  if (!ctx) return false;
  scheduleFinalAlarm(ctx, ctx.currentTime + 0.05);
  return true;
}

/** Plays both sounds back to back, so a presenter can check them in advance. */
export async function playAlertPreview(): Promise<boolean> {
  const ctx = await ready();
  if (!ctx) return false;
  const warningEnds = scheduleWarningBell(ctx, ctx.currentTime + 0.05);
  scheduleFinalAlarm(ctx, warningEnds + 0.6);
  return true;
}
