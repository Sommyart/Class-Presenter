import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  presentationId: z.string().min(1),
  slides: z
    .array(z.object({ slideIndex: z.number().int().min(0), thumbnailSizeBytes: z.number().int().positive() }))
    .min(1)
    .max(500),
});
export type InputType = z.infer<typeof schema>;
export type OutputType = { updated: number };

export const postRebuildComplete = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validated = schema.parse(body);
  const result = await fetch(`/_api/presentations/rebuild_complete`, {
    method: "POST",
    body: superjson.stringify(validated),
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};
