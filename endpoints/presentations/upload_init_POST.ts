import superjson from "superjson";
import { upload } from "../../helpers/storage";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import {
  assertStorageAvailable,
  InsufficientStorageError,
  reconcileUserStorage,
} from "../../helpers/userStorage";
import { schema, OutputType } from "./upload_init_POST.schema";

// Rough allowance for the thumbnails the client will generate after the
// original file lands. Counted in the pre-upload check so a user can't
// squeak the file in and then overflow the quota with previews.
const ESTIMATED_THUMBNAIL_BYTES_PER_FILE = 2 * 1024 * 1024;

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // Gate BEFORE any bytes move.
    await assertStorageAvailable(
      user.id,
      input.fileSizeBytes,
      ESTIMATED_THUMBNAIL_BYTES_PER_FILE,
    );

    // Private area, namespaced by user id. The path is derived server-side
    // from the session, so a client can never write into another user's
    // folder by supplying its own path.
    const safeName = input.originalFileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
    const storagePath = `presentations/${user.id}/${Date.now()}-${safeName}`;

    const uploaded = await upload({
      visibility: "private",
      filename: storagePath,
      contentType: input.contentType,
      sizeBytes: input.fileSizeBytes,
    });

    if (!uploaded.ok) {
      return new Response(
        superjson.stringify({ error: uploaded.error.message ?? "Could not start the upload." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // The row is created now but fileSizeBytes stays 0 until the client
    // confirms the bytes actually landed (upload_complete). That way a
    // failed or abandoned upload never permanently consumes quota — the
    // reconciler sums real rows, and an unconfirmed row contributes 0.
    const [presentation] = await db
      .insertInto("presentations")
      .values({
        userId: user.id,
        title: input.title,
        sourceType: input.sourceType,
        originalFileName: input.originalFileName,
        storagePath,
        fileSizeBytes: 0,
        slideCount: 0,
      })
      .returning(["id"])
      .execute();

    const usage = await reconcileUserStorage(user.id);

    return new Response(
      superjson.stringify({
        presentationId: String(presentation.id),
        storagePath,
        presignedUrl: uploaded.presignedUrl,
        usage,
      } satisfies OutputType),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    if (error instanceof InsufficientStorageError) {
      return new Response(superjson.stringify({ error: error.message }), {
        status: 413,
        headers: { "Content-Type": "application/json" },
      });
    }
    const message = error instanceof Error ? error.message : "Upload could not be started";
    const status = message.toLowerCase().includes("not authenticated") ? 401 : 400;
    return new Response(superjson.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
