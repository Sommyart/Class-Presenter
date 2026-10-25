import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { canvaConfigured, hasConnection } from "../../helpers/canva";
import { OutputType } from "./status_GET.schema";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const configured = canvaConfigured();
    const connected = configured ? await hasConnection(user.id) : false;
    return new Response(superjson.stringify({ configured, connected } satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not check Canva";
    const status = message.toLowerCase().includes("not authenticated") ? 401 : 400;
    return new Response(superjson.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
