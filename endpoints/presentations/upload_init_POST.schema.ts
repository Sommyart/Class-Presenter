import { z } from "zod";
import superjson from "superjson";

// Only the two formats we can actually process client-side today.
export const uploadSourceTypes = ["pptx", "pdf"] as const;

export const schema = z.object({
  title: z.string().min(1).max(300),
  originalFileName: z.string().min(1).max(300),
  sourceType: z.enum(uploadSourceTypes),
  fileSizeBytes: z.number().int().positive(),
  contentType: z.string().min(1).max(200),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  presentationId: string;
  storagePath: string;
  presignedUrl: string;
  usage: { quotaBytes: number; usedBytes: number; remainingBytes: number };
};

export const postPresentationUploadInit = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/presentations/upload_init`, {
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
