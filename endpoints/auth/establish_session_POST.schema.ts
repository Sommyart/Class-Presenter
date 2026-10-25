import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  tempToken: z.string().min(1, "Temporary token is required"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType =
  | {
      user: {
        id: number;
        email: string;
        displayName: string;
        avatarUrl: string | null;
        role: "admin" | "user";
      };
      success: boolean;
    }
  | {
      error: string;
    };

export const postEstablishSession = async (
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/auth/establish_session`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  return superjson.parse<OutputType>(await result.text());
};
