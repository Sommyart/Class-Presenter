import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { reconcileUserStorage } from "../../helpers/userStorage";
import { schema, OutputType } from "./rebuild_complete_POST.schema";

// Records the new image sizes after slides were re-rendered in place. Unlike
// upload_complete this keeps every slide's timer settings and audio.
export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const input = schema.parse(superjson.parse(await request.text()));

    const p = await db
      .selectFrom("presentations")
      .select(["id", "userId"])
      .where("id", "=", input.presentationId)
      .executeTakeFirst();
    if (!p || p.userId !== user.id) {
      return new Response(superjson.stringify({ error: "Presentation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    let updated = 0;
    await db.transaction().execute(async (trx) => {
      for (const s of input.slides) {
        const r = await trx
          .updateTable("slides")
          .set({ thumbnailSizeBytes: s.thumbnailSizeBytes, updatedAt: new Date() })
          .where("presentationId", "=", input.presentationId)
          .where("slideIndex", "=", s.slideIndex)
          .executeTakeFirst();
        updated += Number(r.numUpdatedRows ?? 0);
      }
    });
    await reconcileUserStorage(user.id);

    return new Response(superjson.stringify({ updated } satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return new Response(superjson.stringify({ error: message }), {
      status: message.toLowerCase().includes("not authenticated") ? 401 : 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
