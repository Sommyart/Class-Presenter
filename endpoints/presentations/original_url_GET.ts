import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { getUrl } from "../../helpers/storage";
import { schema, OutputType } from "./original_url_GET.schema";

// Short-lived download link for the caller's own original PDF/PPTX, used to
// re-render the slides at higher quality.
export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const url = new URL(request.url);
    const input = schema.parse({ presentationId: url.searchParams.get("presentationId") ?? "" });

    const p = await db
      .selectFrom("presentations")
      .select(["userId", "sourceType", "storagePath", "originalFileName", "slideCount"])
      .where("id", "=", input.presentationId)
      .executeTakeFirst();

    if (!p || p.userId !== user.id) {
      return new Response(superjson.stringify({ error: "Presentation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    if ((p.sourceType !== "pdf" && p.sourceType !== "pptx") || !p.storagePath) {
      return new Response(
        superjson.stringify({ error: "This presentation has no original file to rebuild from." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const signed = await getUrl({ visibility: "private", filename: p.storagePath, expiresInSeconds: 900 });
    if (!signed.ok) {
      return new Response(superjson.stringify({ error: "Couldn't open the original file." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(
      superjson.stringify({
        url: signed.url,
        sourceType: p.sourceType,
        originalFileName: p.originalFileName,
        slideCount: p.slideCount,
      } satisfies OutputType),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return new Response(superjson.stringify({ error: message }), {
      status: message.toLowerCase().includes("not authenticated") ? 401 : 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
