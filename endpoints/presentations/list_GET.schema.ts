import { z } from "zod";
import superjson from "superjson";
import type { PresentationSourceType } from "../../helpers/schema";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type PresentationListItem = {
  id: string;
  title: string;
  sourceType: PresentationSourceType;
  originalFileName: string | null;
  fileSizeBytes: number;
  slideCount: number;
  slideTimersConfigured: number;
  autoAdvance: boolean;
  lastPresentedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  thumbnailUrl: string | null;
};

export type OutputType = {
  presentations: PresentationListItem[];
  usage: { quotaBytes: number; usedBytes: number; remainingBytes: number };
};

export const getPresentations = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/presentations/list`, {
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
