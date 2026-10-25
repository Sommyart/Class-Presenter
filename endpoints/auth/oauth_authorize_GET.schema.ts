import { z } from "zod";
import { oauthProviders } from "../../helpers/OAuthProvider";

export const schema = z.object({
  provider: z.enum(oauthProviders, {
    errorMap: () => ({ message: "Invalid OAuth provider" }),
  }),
});

export type InputType = z.infer<typeof schema>;

// This endpoint redirects, so no JSON response
export type OutputType = void;

export const getAuthOauthAuthorize = async (
  params: { provider: string },
  init?: RequestInit
): Promise<void> => {
  const validatedInput = schema.parse(params);

  const url = new URL(`/_api/auth/oauth_authorize`);
  url.searchParams.set("provider", validatedInput.provider);

  const result = await fetch(url.toString(), {
    method: "GET",
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
  });

  // This endpoint redirects, so we don't return JSON
  if (!result.ok) {
    throw new Error(`OAuth authorization failed: ${result.statusText}`);
  }
};
