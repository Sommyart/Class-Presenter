import crypto from "crypto";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { assertStorageAvailable, InsufficientStorageError } from "../../helpers/userStorage";
import { getUrl, putObject } from "../../helpers/storage";
import {
  CanvaApiError,
  exportDesignAsPdf,
  getAccessToken,
  getDesignTitle,
  resolveDesignId,
} from "../../helpers/canva";
import { schema, OutputType } from "./import_POST.schema";

const json = (body: unknown, status = 200) =>
  new Response(superjson.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// Exports a Canva design to PDF and stages it in storage. The browser then
// downloads it and runs the normal PDF pipeline (thumbnails, quota, record).
export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const input = schema.parse(superjson.parse(await request.text()));

    const designId = await resolveDesignId(input.url);
    if (!designId) {
      return json({ error: "That doesn't look like a Canva design link. Paste the link from Canva's Share menu." }, 400);
    }

    const token = await getAccessToken(user.id);
    if (!token) {
      return json({ error: "Your Canva account isn't connected. Connect it and try again." }, 409);
    }

    const title = (await getDesignTitle(token, designId)) ?? "Canva design";
    const urls = await exportDesignAsPdf(token, designId);
    if (urls.length !== 1) {
      return json(
        { error: `Canva returned ${urls.length} files for this design instead of one PDF, which isn't supported yet.` },
        400,
      );
    }

    const download = await fetch(urls[0]);
    if (!download.ok) return json({ error: "Could not download the exported PDF from Canva." }, 502);
    const bytes = new Uint8Array(await download.arrayBuffer());

    // Same quota gate as a normal upload, before anything is stored.
    await assertStorageAvailable(user.id, bytes.byteLength);

    const tempPath = `imports/${user.id}/${crypto.randomUUID()}.pdf`;
    await putObject({ filename: tempPath, body: bytes, contentType: "application/pdf" });
    const signed = await getUrl({ visibility: "private", filename: tempPath, expiresInSeconds: 900 });
    if (!signed.ok) return json({ error: "Could not prepare the exported PDF." }, 500);

    return json({ tempPath, title, sizeBytes: bytes.byteLength, downloadUrl: signed.url } satisfies OutputType);
  } catch (error) {
    if (error instanceof InsufficientStorageError) return json({ error: error.message }, 413);
    if (error instanceof CanvaApiError) {
      if (error.status === 401 || error.status === 403) {
        return json({ error: `Canva refused access (${error.message}). Reconnect Canva and make sure you can open this design.` }, 403);
      }
      if (error.status === 404) return json({ error: "Canva could not find that design. Check the link and your access." }, 404);
      if (error.status === 429) return json({ error: "Canva is rate limiting exports. Wait a minute and try again." }, 429);
      return json({ error: `Canva error: ${error.message}` }, 502);
    }
    const message = error instanceof Error ? error.message : "Canva import failed";
    const status = message.toLowerCase().includes("not authenticated") ? 401 : 400;
    return json({ error: message }, status);
  }
}
