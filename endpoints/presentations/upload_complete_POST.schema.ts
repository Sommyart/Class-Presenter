import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  presentationId: z.string().min(1),
  fileSizeBytes: z.number().int().nonnegative(),
  slides: z
    .array(
      z.object({
        slideIndex: z.number().int().min(0),
        thumbnailPath: z.string().min(1).nullable(),
        thumbnailSizeBytes: z.number().int().nonnegative(),
      }),
    )
    .min(1)
    .max(500),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  presentationId: string;
  slideCount: number;
  usage: { quotaBytes: number; usedBytes: number; remainingBytes: number };
};

export const postPresentationUploadComplete = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/presentations/upload_complete`, {
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
