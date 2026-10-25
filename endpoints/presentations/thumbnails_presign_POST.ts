import superjson from "superjson";
import { upload } from "../../helpers/storage";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./thumbnails_presign_POST.schema";

// The presigned URL pins Content-Length to the size given at signing time,
// so each thumbnail is signed with its own exact byte length.
export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // Ownership check: the presentation must belong to the session user.
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

    // Sign every slide at once. This used to be a sequential loop, which made
    // signing time grow linearly with page count (roughly 85ms per slide).
    const signed = await Promise.all(
      input.slides.map(async (slide) => {
        // Path derived server-side from the session user + presentation.
        const thumbnailPath = `presentations/${user.id}/${input.presentationId}/thumb-${slide.slideIndex}.${slide.extension}`;
        const uploaded = await upload({
          visibility: "private",
          filename: thumbnailPath,
          contentType: slide.contentType,
          sizeBytes: slide.sizeBytes,
        });
        return { slide, thumbnailPath, uploaded };
      }),
    );

    for (const { uploaded } of signed) {
      if (!uploaded.ok) {
        return new Response(
          superjson.stringify({ error: uploaded.error.message ?? "Could not prepare thumbnail upload." }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // Record each path now, with size 0. If the upload is abandoned or fails
    // halfway, delete can still find and remove these files instead of leaving
    // untracked objects behind. Size stays 0 until upload_complete confirms
    // the bytes landed, so an unfinished upload still costs no quota.
    await db
      .insertInto("slides")
      .values(
        signed.map(({ slide, thumbnailPath }) => ({
          presentationId: input.presentationId,
          slideIndex: slide.slideIndex,
          thumbnailPath,
          thumbnailSizeBytes: 0,
          timerEnabled: false,
          durationSeconds: 0,
        })),
      )
      .onConflict((oc) =>
        oc.columns(["presentationId", "slideIndex"]).doUpdateSet((eb) => ({
          thumbnailPath: eb.ref("excluded.thumbnailPath"),
        })),
      )
      .execute();

    const targets: OutputType["targets"] = [];
    for (const { slide, thumbnailPath, uploaded } of signed) {
      if (uploaded.ok) {
        targets.push({
          slideIndex: slide.slideIndex,
          thumbnailPath,
          presignedUrl: uploaded.presignedUrl,
        });
      }
    }

    return new Response(superjson.stringify({ targets } satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare thumbnail uploads";
    const status = message.toLowerCase().includes("not authenticated") ? 401 : 400;
    return new Response(superjson.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
