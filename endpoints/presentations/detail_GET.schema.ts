import { z } from "zod";
import superjson from "superjson";
import type { PresentationSourceType } from "../../helpers/schema";

export const schema = z.object({
  presentationId: z.string().min(1),
});

export type InputType = z.infer<typeof schema>;

export type SlideDetail = {
  id: string;
  slideIndex: number;
  timerEnabled: boolean;
  durationSeconds: number;
  thumbnailUrl: string | null;
  audioUrl: string | null;
  audioName: string | null;
};

export type PresentationDetail = {
  id: string;
  title: string;
  sourceType: PresentationSourceType;
  originalFileName: string | null;
  slideCount: number;
  autoAdvance: boolean;
  /** "elapsed" counts up from zero; "countdown" counts down from globalCountdownSeconds. */
  globalTimerMode: "elapsed" | "countdown";
  globalCountdownSeconds: number;
  fileSizeBytes: number;
  /** One track played across the whole presentation, if set. */
  audioUrl: string | null;
  audioName: string | null;
  slides: SlideDetail[];
};

export type OutputType = PresentationDetail;

export const getPresentationDetail = async (
  query: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validated = schema.parse(query);
  const params = new URLSearchParams({ presentationId: validated.presentationId });
  const result = await fetch(`/_api/presentations/detail?${params.toString()}`, {
    method: "GET",
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
