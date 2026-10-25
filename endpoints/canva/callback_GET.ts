import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { canvaConfigured, exchangeCodeForTokens, saveConnection } from "../../helpers/canva";

function redirect(location: string) {
  return new Response("Redirecting...", {
    status: 302,
    headers: {
      Location: location,
      "Cache-Control": "no-store",
      // The state cookie has done its job.
      "Set-Cookie": "canva_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
    },
  });
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("error")) return redirect("/dashboard?canva=denied");

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state || !canvaConfigured()) return redirect("/dashboard?canva=error");

    // CSRF: the state must match both the cookie and a live row we created.
    if (readCookie(request, "canva_state") !== state) return redirect("/dashboard?canva=error");

    let userId: number;
    try {
      userId = (await getServerUserSession(request)).user.id;
    } catch {
      return redirect("/login");
    }

    const row = await db
      .selectFrom("oauthStates")
      .selectAll()
      .where("state", "=", state)
      .where("provider", "=", "canva")
      .executeTakeFirst();
    if (!row || new Date(row.expiresAt).getTime() < Date.now()) {
      return redirect("/dashboard?canva=error");
    }
    await db.deleteFrom("oauthStates").where("state", "=", state).execute();

    const tokens = await exchangeCodeForTokens(code, row.codeVerifier, row.redirectUrl);
    await saveConnection(userId, tokens);
    return redirect("/dashboard?canva=connected");
  } catch (error) {
    console.error("Canva callback failed", error);
    return redirect("/dashboard?canva=error");
  }
}
