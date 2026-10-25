import { z } from "zod";

export const schema = z.object({
  code: z.string().optional(),
  state: z.string().min(1, "State parameter is required"),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = never; // This endpoint returns HTML for popup flows

export const getAuthOauthCallback = async (
  params: Record<string, string>,
  init?: RequestInit
): Promise<Response> => {
  const validatedInput = schema.parse(params);
  const searchParams = new URLSearchParams();

  Object.entries(validatedInput).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value);
    }
  });

  const result = await fetch(
    `/_api/auth/oauth_callback?${searchParams.toString()}`,
    {
      method: "GET",
      redirect: "manual", // Handle redirects manually
      ...init,
    }
  );

  return result;
};
