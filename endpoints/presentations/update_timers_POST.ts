import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./update_timers_POST.schema";

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

    let slidesUpdated = 0;

    await db.transaction().execute(async (trx) => {
      if (typeof input.autoAdvance === "boolean") {
        await trx
          .updateTable("presentations")
          .set({ autoAdvance: input.autoAdvance, updatedAt: new Date() })
          .where("id", "=", input.presentationId)
          .execute();
      }

      // Whole-presentation timer: count up (elapsed) or count down.
      const globalPatch: { globalTimerMode?: string; globalCountdownSeconds?: number } = {};
      if (input.globalTimerMode) globalPatch.globalTimerMode = input.globalTimerMode;
      if (typeof input.globalCountdownSeconds === "number") {
        globalPatch.globalCountdownSeconds = input.globalCountdownSeconds;
      }
      if (Object.keys(globalPatch).length > 0) {
        await trx
          .updateTable("presentations")
          .set({ ...globalPatch, updatedAt: new Date() })
          .where("id", "=", input.presentationId)
          .execute();
      }

      for (const slide of input.slides ?? []) {
        const result = await trx
          .updateTable("slides")
          .set({
            timerEnabled: slide.timerEnabled,
            durationSeconds: slide.durationSeconds,
            updatedAt: new Date(),
          })
          .where("presentationId", "=", input.presentationId)
          .where("slideIndex", "=", slide.slideIndex)
          .executeTakeFirst();
        slidesUpdated += Number(result.numUpdatedRows ?? 0);
      }

      if (input.slides?.length) {
        await trx
          .updateTable("presentations")
          .set({ updatedAt: new Date() })
          .where("id", "=", input.presentationId)
          .execute();
      }
    });

    return new Response(
      superjson.stringify({ updated: true, slidesUpdated } satisfies OutputType),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save timer settings";
    const status = message.toLowerCase().includes("not authenticated") ? 401 : 400;
    return new Response(superjson.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
