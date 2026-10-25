import { z } from "zod";
import superjson from "superjson";

// Keep a sane ceiling so one track can't swallow a whole quota.
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

export const schema = z.object({
  presentationId: z.string().min(1),
  // null = one track for the whole presentation, rather than a single slide.
  slideIndex: z.number().int().min(0).nullable(),
  fileName: z.string().min(1).max(300),
  contentType: z.string().min(1).max(100),
  // Exact byte length. The presigned URL pins Content-Length to this, so it
  // must match the bytes actually PUT or storage rejects the upload.
  sizeBytes: z.number().int().positive().max(MAX_AUDIO_BYTES),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  audioPath: string;
  presignedUrl: string;
};

export const postSlideAudioPresign = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/presentations/audio_presign`, {
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
