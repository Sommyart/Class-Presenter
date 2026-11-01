import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({ presentationId: z.string().min(1) });
export type InputType = z.infer<typeof schema>;

export type OutputType = {
  url: string;
  sourceType: "pdf" | "pptx";
  originalFileName: string | null;
  slideCount: number;
};

export const getPresentationOriginalUrl = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validated = schema.parse(body);
  const result = await fetch(
    `/_api/presentations/original_url?presentationId=${encodeURIComponent(validated.presentationId)}`,
    { method: "GET", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } },
  );
  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};
