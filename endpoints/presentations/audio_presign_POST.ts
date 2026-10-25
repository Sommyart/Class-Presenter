import superjson from "superjson";
import { upload } from "../../helpers/storage";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import {
  assertStorageAvailable,
  InsufficientStorageError,
} from "../../helpers/userStorage";
import { schema, OutputType } from "./audio_presign_POST.schema";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // Ownership comes from the session, never from the client.
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

    // Quota gate before any bytes move.
    await assertStorageAvailable(user.id, input.sizeBytes);

    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const scope = input.slideIndex === null ? "all" : String(input.slideIndex);
    const audioPath = `presentations/${user.id}/${input.presentationId}/audio-${scope}-${Date.now()}-${safeName}`;

    const uploaded = await upload({
      visibility: "private",
      filename: audioPath,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
    });

    if (!uploaded.ok) {
      return new Response(
        superjson.stringify({ error: uploaded.error.message ?? "Could not start the upload." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      superjson.stringify({ audioPath, presignedUrl: uploaded.presignedUrl } satisfies OutputType),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    if (error instanceof InsufficientStorageError) {
      return new Response(superjson.stringify({ error: error.message }), {
        status: 413,
        headers: { "Content-Type": "application/json" },
      });
    }
    const message = error instanceof Error ? error.message : "Could not prepare the upload";
    const status = message.toLowerCase().includes("not authenticated") ? 401 : 400;
    return new Response(superjson.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
