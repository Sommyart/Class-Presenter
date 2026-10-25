import { db } from "../../helpers/db";
import crypto from "crypto";
import { getOAuthRedirectUri } from "../../helpers/getOAuthRedirectUri";
import { getOAuthProvider } from "../../helpers/getOAuthProvider";
import { schema } from "./oauth_authorize_GET.schema";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider");

    // Validate provider using schema
    let validatedProvider;
    try {
      validatedProvider = schema.parse({ provider }).provider;
    } catch (validationError) {
      console.error("Provider validation error:", validationError);
      return Response.json(
        { error: "Invalid OAuth provider" },
        { status: 400 }
      );
    }

    // Get provider instance using the helper
    let oauthProvider;
    try {
      const redirectUri = getOAuthRedirectUri(request.url);
      oauthProvider = getOAuthProvider(validatedProvider, redirectUri);
    } catch (configError) {
      console.error("Provider configuration error:", configError);
      if (configError instanceof Error) {
        return Response.json({ error: configError.message }, { status: 400 });
      }
      return Response.json(
        { error: "Invalid provider configuration" },
        { status: 400 }
      );
    }

    const state = crypto.randomBytes(32).toString("hex");

    const { url: authUrl, codeVerifier } =
      oauthProvider.generateAuthorizationUrl(state);

    // Clean up expired OAuth states before creating new ones to prevent database bloat
    try {
      await db
        .deleteFrom("oauthStates")
        .where("expiresAt", "<", new Date())
        .execute();
    } catch {
      // Fail silently if cleanup fails
    }

    // Store state in database with exact redirect URI and provider info (10 minutes expiration)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    try {
      const now = new Date();
      await db
        .insertInto("oauthStates")
        .values({
          state,
          provider: validatedProvider,
          redirectUrl: oauthProvider.redirectUri,
          codeVerifier: codeVerifier || "", // Provide empty string if no code_verifier
          expiresAt,
          createdAt: now,
        })
        .execute();
    } catch (dbError) {
      console.error("Failed to store OAuth state:", dbError);
      return Response.json(
        { error: "Failed to initialize OAuth flow" },
        { status: 500 }
      );
    }

    // Set secure state cookie as additional CSRF protection
    const cookieValue = [
      `oauth_state=${state}`,
      "HttpOnly",
      "Secure",
      "SameSite=Lax",
      "Path=/",
      `Max-Age=600`, // 10 minutes
    ].join("; ");
    // Create response with redirect and secure state cookie
    // The response should be non-empty beacuse Floot backend runs on streaming lambda and will hang otherwise.
    const response = new Response("Redirecting...", {
      status: 302,
      headers: {
        Location: authUrl,
        "Cache-Control": "no-store",
        "Set-Cookie": cookieValue,
      },
    });

    return response;
  } catch (error) {
    console.error("Error in OAuth authorization:", error);

    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
