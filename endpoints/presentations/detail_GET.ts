import superjson from "superjson";
import { getUrl } from "../../helpers/storage";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType, SlideDetail } from "./detail_GET.schema";

function toNum(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return 0;
}

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const url = new URL(request.url);
    const input = schema.parse({ presentationId: url.searchParams.get("presentationId") ?? "" });

    const presentation = await db
      .selectFrom("presentations")
      .select([
        "id",
        "userId",
        "title",
        "sourceType",
        "originalFileName",
        "slideCount",
        "autoAdvance",
        "globalTimerMode",
        "globalCountdownSeconds",
        "fileSizeBytes",
        "audioPath",
        "audioName",
      ])
      .where("id", "=", input.presentationId)
      .executeTakeFirst();

    // Ownership enforced server-side.
    if (!presentation || presentation.userId !== user.id) {
      return new Response(superjson.stringify({ error: "Presentation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const slideRows = await db
      .selectFrom("slides")
      .select(["id", "slideIndex", "timerEnabled", "durationSeconds", "thumbnailPath", "audioPath", "audioName"])
      .where("presentationId", "=", input.presentationId)
      .orderBy("slideIndex", "asc")
      .execute();

    const slides: SlideDetail[] = await Promise.all(
      slideRows.map(async (row) => {
        let thumbnailUrl: string | null = null;
        if (row.thumbnailPath) {
          // Private assets get a short-lived signed URL, never a public path.
          const signed = await getUrl({
            visibility: "private",
            filename: row.thumbnailPath,
            expiresInSeconds: 3600,
          });
          thumbnailUrl = signed.ok ? signed.url : null;
        }
        let audioUrl: string | null = null;
        if (row.audioPath) {
          const signed = await getUrl({
            visibility: "private",
            filename: row.audioPath,
            expiresInSeconds: 3600,
          });
          audioUrl = signed.ok ? signed.url : null;
        }
        return {
          id: String(row.id),
          slideIndex: row.slideIndex,
          timerEnabled: row.timerEnabled,
          durationSeconds: row.durationSeconds,
          thumbnailUrl,
          audioUrl,
          audioName: row.audioName,
        };
      }),
    );

    let presentationAudioUrl: string | null = null;
    if (presentation.audioPath) {
      const signed = await getUrl({
        visibility: "private",
        filename: presentation.audioPath,
        expiresInSeconds: 3600,
      });
      presentationAudioUrl = signed.ok ? signed.url : null;
    }

    return new Response(
      superjson.stringify({
        id: String(presentation.id),
        title: presentation.title,
        sourceType: presentation.sourceType,
        originalFileName: presentation.originalFileName,
        slideCount: presentation.slideCount,
        autoAdvance: presentation.autoAdvance,
        // The column is constrained to these two values in the database.
        globalTimerMode: presentation.globalTimerMode === "countdown" ? "countdown" : "elapsed",
        globalCountdownSeconds: presentation.globalCountdownSeconds,
        fileSizeBytes: toNum(presentation.fileSizeBytes),
        audioUrl: presentationAudioUrl,
        audioName: presentation.audioName,
        slides,
      } satisfies OutputType),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load the presentation";
    const status = message.toLowerCase().includes("not authenticated") ? 401 : 400;
    return new Response(superjson.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
