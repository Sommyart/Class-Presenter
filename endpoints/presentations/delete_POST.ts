import superjson from "superjson";
import { remove } from "../../helpers/storage";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { reconcileUserStorage } from "../../helpers/userStorage";
import { schema, OutputType } from "./delete_POST.schema";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // Ownership is checked against the session user, not a client-supplied id.
    const presentation = await db
      .selectFrom("presentations")
      .select(["id", "userId", "storagePath", "audioPath"])
      .where("id", "=", input.presentationId)
      .executeTakeFirst();

    if (!presentation || presentation.userId !== user.id) {
      return new Response(superjson.stringify({ error: "Presentation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const slideRows = await db
      .selectFrom("slides")
      .select(["thumbnailPath", "audioPath"])
      .where("presentationId", "=", input.presentationId)
      .execute();

    // Assets first, database second: if we dropped the rows first and then
    // failed here, the files would be orphaned with nothing left pointing
    // at them.
    const paths = [
      presentation.storagePath,
      presentation.audioPath,
      ...slideRows.map((s) => s.thumbnailPath),
      ...slideRows.map((s) => s.audioPath),
    ].filter((p): p is string => !!p);

    let assetsRemoved = 0;
    let assetsFailed = 0;
    for (const path of paths) {
      try {
        const result = await remove({ visibility: "private", filename: path });
        if (result.ok) assetsRemoved += 1;
        else assetsFailed += 1;
      } catch {
        assetsFailed += 1;
      }
    }

    // If nothing could be removed, stop and say so rather than reporting a
    // clean delete that didn't happen.
    if (assetsFailed > 0 && assetsRemoved === 0 && paths.length > 0) {
      return new Response(
        superjson.stringify({
          error:
            "The presentation's files could not be deleted from storage, so nothing was removed. Please try again.",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    // slides rows go with it via ON DELETE CASCADE.
    await db.deleteFrom("presentations").where("id", "=", input.presentationId).execute();

    // Recomputed from what actually remains, so the freed space is
    // immediately usable for the next upload.
    const usage = await reconcileUserStorage(user.id);

    return new Response(
      superjson.stringify({ deleted: true, assetsRemoved, assetsFailed, usage } satisfies OutputType),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete the presentation";
    const status = message.toLowerCase().includes("not authenticated") ? 401 : 400;
    return new Response(superjson.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
