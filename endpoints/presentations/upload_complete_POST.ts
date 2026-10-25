import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { reconcileUserStorage } from "../../helpers/userStorage";
import { schema, OutputType } from "./upload_complete_POST.schema";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const presentation = await db
      .selectFrom("presentations")
      .select(["id", "userId"])
      .where("id", "=", input.presentationId)
      .executeTakeFirst();

    if (!presentation || presentation.userId !== user.id) {
      return new Response(superjson.stringify({ error: "Presentation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db.transaction().execute(async (trx) => {
      // Commit the real byte count now that the file actually landed.
      await trx
        .updateTable("presentations")
        .set({
          fileSizeBytes: input.fileSizeBytes,
          slideCount: input.slides.length,
          updatedAt: new Date(),
        })
        .where("id", "=", input.presentationId)
        .execute();

      // Re-processing an existing presentation replaces its slide rows.
      await trx.deleteFrom("slides").where("presentationId", "=", input.presentationId).execute();

      await trx
        .insertInto("slides")
        .values(
          input.slides.map((slide) => ({
            presentationId: input.presentationId,
            slideIndex: slide.slideIndex,
            thumbnailPath: slide.thumbnailPath,
            thumbnailSizeBytes: slide.thumbnailSizeBytes,
            timerEnabled: false,
            durationSeconds: 0,
          })),
        )
        .execute();
    });

    // Recompute from real rows rather than incrementing a counter.
    const usage = await reconcileUserStorage(user.id);

    return new Response(
      superjson.stringify({
        presentationId: input.presentationId,
        slideCount: input.slides.length,
        usage,
      } satisfies OutputType),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not finish processing";
    const status = message.toLowerCase().includes("not authenticated") ? 401 : 400;
    return new Response(superjson.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
