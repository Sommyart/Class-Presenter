import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({ url: z.string().min(1).max(2000) });

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  tempPath: string;
  title: string;
  sizeBytes: number;
  downloadUrl: string;
};

export const postCanvaImport = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/canva/import`, {
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
