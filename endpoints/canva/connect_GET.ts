import crypto from "crypto";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import {
  CANVA_AUTHORIZE_URL,
  CANVA_SCOPES,
  canvaConfigured,
  canvaRedirectUri,
} from "../../helpers/canva";

function redirect(location: string, extraHeaders: Record<string, string> = {}) {
  return new Response("Redirecting...", {
    status: 302,
    headers: { Location: location, "Cache-Control": "no-store", ...extraHeaders },
  });
}

// Starts the Canva connection for the signed-in user (full-page redirect).
export async function handle(request: Request) {
  try {
    try {
      await getServerUserSession(request);
    } catch {
      return redirect("/login");
    }
    if (!canvaConfigured()) return redirect("/dashboard?canva=not_configured");

    const redirectUri = canvaRedirectUri(request.url);
    const state = crypto.randomBytes(32).toString("hex");
    const codeVerifier = crypto.randomBytes(48).toString("base64url"); // 64 chars
    const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

    try {
      await db.deleteFrom("oauthStates").where("expiresAt", "<", new Date()).execute();
    } catch {
      // Cleanup is best effort.
    }
    await db
      .insertInto("oauthStates")
      .values({
        state,
        provider: "canva",
        redirectUrl: redirectUri,
        codeVerifier,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        createdAt: new Date(),
      })
      .execute();

    const query = [
      ["response_type", "code"],
      ["client_id", process.env.CANVA_CLIENT_ID as string],
      ["redirect_uri", redirectUri],
      ["scope", CANVA_SCOPES],
      ["state", state],
      ["code_challenge", codeChallenge],
      ["code_challenge_method", "S256"],
    ]
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");

    return redirect(`${CANVA_AUTHORIZE_URL}?${query}`, {
      "Set-Cookie": `canva_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
    });
  } catch (error) {
    console.error("Canva connect failed", error);
    return redirect("/dashboard?canva=error");
  }
}
