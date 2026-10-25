import superjson from "superjson";
import { getUrl } from "../../helpers/storage";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { reconcileUserStorage } from "../../helpers/userStorage";
import { OutputType, PresentationListItem } from "./list_GET.schema";

function toNum(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return 0;
}

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);

    // Scoped to the session user — a client cannot ask for anyone else's rows.
    const rows = await db
      .selectFrom("presentations")
      .select([
        "id",
        "title",
        "sourceType",
        "originalFileName",
        "fileSizeBytes",
        "slideCount",
        "autoAdvance",
        "lastPresentedAt",
        "createdAt",
        "updatedAt",
      ])
      .where("userId", "=", user.id)
      .orderBy("updatedAt", "desc")
      .execute();

    const ids = rows.map((r) => r.id);

    // Per-presentation timer counts and a cover thumbnail, in two queries
    // rather than N.
    const timerCounts = new Map<string, number>();
    const coverPaths = new Map<string, string>();

    if (ids.length > 0) {
      const slideRows = await db
        .selectFrom("slides")
        .select(["presentationId", "slideIndex", "thumbnailPath", "timerEnabled"])
        .where("presentationId", "in", ids)
        .execute();

      for (const slide of slideRows) {
        const key = String(slide.presentationId);
        if (slide.timerEnabled) {
          timerCounts.set(key, (timerCounts.get(key) ?? 0) + 1);
        }
        if (slide.slideIndex === 0 && slide.thumbnailPath) {
          coverPaths.set(key, slide.thumbnailPath);
        }
      }
    }

    const presentations: PresentationListItem[] = await Promise.all(
      rows.map(async (row) => {
        const key = String(row.id);
        const coverPath = coverPaths.get(key);
        let thumbnailUrl: string | null = null;
        if (coverPath) {
          // Private asset: a short-lived presigned read URL, not a
          // guessable public path.
          const signed = await getUrl({
            visibility: "private",
            filename: coverPath,
            expiresInSeconds: 3600,
          });
          thumbnailUrl = signed.ok ? signed.url : null;
        }
        return {
          id: key,
          title: row.title,
          sourceType: row.sourceType,
          originalFileName: row.originalFileName,
          fileSizeBytes: toNum(row.fileSizeBytes),
          slideCount: row.slideCount,
          slideTimersConfigured: timerCounts.get(key) ?? 0,
          autoAdvance: row.autoAdvance,
          lastPresentedAt: row.lastPresentedAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          thumbnailUrl,
        };
      }),
    );

    const usage = await reconcileUserStorage(user.id);

    return new Response(superjson.stringify({ presentations, usage } satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load presentations";
    const status = message.toLowerCase().includes("not authenticated") ? 401 : 400;
    return new Response(superjson.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
