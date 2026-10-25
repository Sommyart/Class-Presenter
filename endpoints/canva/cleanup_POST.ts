import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { remove } from "../../helpers/storage";
import { schema, OutputType } from "./cleanup_POST.schema";

// Deletes a staged Canva export once the browser has downloaded it.
export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const input = schema.parse(superjson.parse(await request.text()));

    // Only the caller's own staging folder can be touched.
    const prefix = `imports/${user.id}/`;
    if (!input.tempPath.startsWith(prefix) || input.tempPath.includes("..")) {
      return new Response(superjson.stringify({ error: "Invalid path" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    await remove({ visibility: "private", filename: input.tempPath });
    return new Response(superjson.stringify({ removed: true } satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cleanup failed";
    const status = message.toLowerCase().includes("not authenticated") ? 401 : 400;
    return new Response(superjson.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
