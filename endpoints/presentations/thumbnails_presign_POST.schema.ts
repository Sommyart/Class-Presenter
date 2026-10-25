import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  presentationId: z.string().min(1),
  slides: z
    .array(
      z.object({
        slideIndex: z.number().int().min(0),
        contentType: z.enum(["image/jpeg", "image/svg+xml"]),
        extension: z.enum(["jpg", "svg"]),
        // Exact byte length of the rendered thumbnail. The presigned URL
        // pins Content-Length to this value, so it must match the bytes the
        // client actually PUTs or S3 rejects it with SignatureDoesNotMatch.
        sizeBytes: z.number().int().positive().max(5 * 1024 * 1024),
      }),
    )
    .min(1)
    .max(500),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  targets: Array<{ slideIndex: number; thumbnailPath: string; presignedUrl: string }>;
};

export const postSlideThumbnailsPresign = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/presentations/thumbnails_presign`, {
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
