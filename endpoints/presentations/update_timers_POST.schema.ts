import { z } from "zod";
import superjson from "superjson";

export const GLOBAL_TIMER_MODES = ["elapsed", "countdown", "off"] as const;
export type GlobalTimerMode = (typeof GLOBAL_TIMER_MODES)[number];

// A whole-presentation countdown can run up to 24 hours.
export const MAX_GLOBAL_COUNTDOWN_SECONDS = 24 * 60 * 60;

export const schema = z
  .object({
    presentationId: z.string().min(1),
    autoAdvance: z.boolean().optional(),
    // "elapsed" counts up from zero; "countdown" counts down from a set time; "off" hides the
    // presentation timer entirely (slide timers still run).
    globalTimerMode: z.enum(GLOBAL_TIMER_MODES).optional(),
    globalCountdownSeconds: z.number().int().min(0).max(MAX_GLOBAL_COUNTDOWN_SECONDS).optional(),
    slides: z
      .array(
        z.object({
          slideIndex: z.number().int().min(0),
          timerEnabled: z.boolean(),
          durationSeconds: z.number().int().min(0).max(24 * 60 * 60),
        }),
      )
      .max(500)
      .optional(),
  })
  .refine((v) => v.globalTimerMode !== "countdown" || (v.globalCountdownSeconds ?? 0) > 0, {
    message: "Set a countdown duration greater than zero.",
    path: ["globalCountdownSeconds"],
  });

export type InputType = z.infer<typeof schema>;

export type OutputType = { updated: true; slidesUpdated: number };

export const postUpdateTimers = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/presentations/update_timers`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};
