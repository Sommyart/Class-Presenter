import superjson from "superjson";
import { remove } from "@floot/storage";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { reconcileUserStorage } from "../../helpers/userStorage";
import { schema, OutputType } from "./set_slide_audio_POST.schema";

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

    const slide = await db
      .selectFrom("slides")
      .select(["id", "audioPath"])
      .where("presentationId", "=", input.presentationId)
      .where("slideIndex", "=", input.slideIndex)
      .executeTakeFirst();

    if (!slide) {
      return new Response(superjson.stringify({ error: "Slide not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Replacing or clearing: delete the previous file so it doesn't linger
    // in storage consuming quota with nothing pointing at it.
    const previousPath = slide.audioPath;
    if (previousPath && previousPath !== input.audioPath) {
      try {
        await remove({ visibility: "private", filename: previousPath });
      } catch {
        // Non-fatal: the row still moves on, and reconciliation recomputes
        // usage from what the rows actually reference.
      }
    }

    await db
      .updateTable("slides")
      .set({
        audioPath: input.audioPath,
        audioName: input.audioName,
        audioSizeBytes: input.audioPath ? input.audioSizeBytes : 0,
        updatedAt: new Date(),
      })
      .where("id", "=", slide.id)
      .execute();

    const usage = await reconcileUserStorage(user.id);

    return new Response(superjson.stringify({ updated: true, usage } satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update the slide's music";
    const status = message.toLowerCase().includes("not authenticated") ? 401 : 400;
    return new Response(superjson.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
