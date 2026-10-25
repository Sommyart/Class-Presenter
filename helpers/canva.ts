// Canva Connect (https://www.canva.dev/docs/connect/): OAuth 2.0 with PKCE,
// then the Exports API to turn a design into a PDF.
import crypto from "crypto";
import { db } from "./db";

export const CANVA_API = "https://api.canva.com/rest/v1";
export const CANVA_AUTHORIZE_URL = "https://www.canva.com/api/oauth/authorize";
export const CANVA_SCOPES = "design:content:read design:meta:read";

export function canvaConfigured(): boolean {
  return Boolean(process.env.CANVA_CLIENT_ID && process.env.CANVA_CLIENT_SECRET);
}

/** Must exactly match a redirect URL registered in the Canva developer portal. */
export function canvaRedirectUri(requestUrl: string): string {
  return process.env.CANVA_REDIRECT_URI || `${new URL(requestUrl).origin}/_api/canva/callback`;
}

// --- Token encryption at rest ---------------------------------------------
function key(): Buffer {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return crypto.createHash("sha256").update(`canva-tokens:${secret}`).digest();
}

function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

function decrypt(value: string): string {
  const [iv, tag, data] = value.split(".").map((p) => Buffer.from(p, "base64"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

// --- OAuth -----------------------------------------------------------------
type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
};

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  const basic = Buffer.from(
    `${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`,
  ).toString("base64");
  const res = await fetch(`${CANVA_API}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      `Canva sign-in failed (${res.status}): ${String(data.error_description ?? data.error ?? "unknown error")}`,
    );
  }
  return data as unknown as TokenResponse;
}

export function exchangeCodeForTokens(code: string, codeVerifier: string, redirectUri: string) {
  return tokenRequest({
    grant_type: "authorization_code",
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
  });
}

export async function saveConnection(userId: number, tokens: TokenResponse): Promise<void> {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  const values = {
    accessToken: encrypt(tokens.access_token),
    refreshToken: encrypt(tokens.refresh_token),
    expiresAt,
    scope: tokens.scope ?? null,
    updatedAt: new Date(),
  };
  await db
    .insertInto("canvaConnections")
    .values({ userId, ...values })
    .onConflict((oc) => oc.column("userId").doUpdateSet(values))
    .execute();
}

export async function hasConnection(userId: number): Promise<boolean> {
  const row = await db
    .selectFrom("canvaConnections")
    .select("userId")
    .where("userId", "=", userId)
    .executeTakeFirst();
  return Boolean(row);
}

export async function deleteConnection(userId: number): Promise<void> {
  await db.deleteFrom("canvaConnections").where("userId", "=", userId).execute();
}

/** A valid access token for the user, refreshing (and rotating the refresh token) when needed. */
export async function getAccessToken(userId: number): Promise<string | null> {
  const row = await db
    .selectFrom("canvaConnections")
    .selectAll()
    .where("userId", "=", userId)
    .executeTakeFirst();
  if (!row) return null;

  if (new Date(row.expiresAt).getTime() - Date.now() > 60_000) {
    return decrypt(row.accessToken);
  }

  try {
    const refreshed = await tokenRequest({
      grant_type: "refresh_token",
      refresh_token: decrypt(row.refreshToken),
    });
    await saveConnection(userId, refreshed);
    return refreshed.access_token;
  } catch (error) {
    // A rejected refresh token means the user must connect again.
    console.error("Canva token refresh failed", error);
    await deleteConnection(userId);
    return null;
  }
}

// --- Designs and exports ---------------------------------------------------
const DESIGN_URL = /canva\.com\/design\/([A-Za-z0-9_-]+)/i;

/** Accepts canva.com/design/<id>/... links, and resolves canva.link short links. */
export async function resolveDesignId(input: string): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  const direct = url.href.match(DESIGN_URL);
  if (direct) return direct[1];

  if (url.hostname === "canva.link") {
    let current = url.href;
    for (let hop = 0; hop < 5; hop++) {
      const res = await fetch(current, { redirect: "manual" });
      const next = res.headers.get("location");
      if (!next) return null;
      current = new URL(next, current).href;
      const found = current.match(DESIGN_URL);
      if (found) return found[1];
    }
  }
  return null;
}

async function canvaFetch(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`${CANVA_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    const message = data?.message ?? data?.error ?? `HTTP ${res.status}`;
    throw new CanvaApiError(res.status, String(message));
  }
  return data;
}

export class CanvaApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "CanvaApiError";
  }
}

export async function getDesignTitle(token: string, designId: string): Promise<string | null> {
  try {
    const data = await canvaFetch(token, `/designs/${designId}`);
    return data?.design?.title ?? null;
  } catch {
    return null;
  }
}

/** Starts a PDF export and waits for it. Returns the download URLs (valid 24h). */
export async function exportDesignAsPdf(token: string, designId: string): Promise<string[]> {
  const created = await canvaFetch(token, "/exports", {
    method: "POST",
    body: JSON.stringify({ design_id: designId, format: { type: "pdf" } }),
  });
  const jobId: string = created?.job?.id;
  if (!jobId) throw new Error("Canva did not start the export.");

  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const polled = await canvaFetch(token, `/exports/${jobId}`);
    const job = polled?.job;
    if (job?.status === "success") return job.urls ?? [];
    if (job?.status === "failed") {
      const code = job?.error?.code;
      if (code === "license_required") {
        throw new Error("Canva says this design needs a license (premium content) before it can be exported.");
      }
      if (code === "approval_required") {
        throw new Error("Canva says this design needs approval before it can be exported.");
      }
      throw new Error(job?.error?.message ?? "Canva could not export this design.");
    }
  }
  throw new Error("Canva took too long to export this design. Please try again.");
}
