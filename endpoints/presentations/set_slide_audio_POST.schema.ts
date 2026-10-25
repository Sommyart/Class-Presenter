import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  presentationId: z.string().min(1),
  slideIndex: z.number().int().min(0),
  // null clears the slide's music.
  audioPath: z.string().min(1).nullable(),
  audioName: z.string().min(1).max(300).nullable(),
  audioSizeBytes: z.number().int().nonnegative(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  updated: true;
  usage: { quotaBytes: number; usedBytes: number; remainingBytes: number };
};

export const postSetSlideAudio = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/presentations/set_slide_audio`, {
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
