import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { deleteConnection } from "../../helpers/canva";
import { OutputType } from "./disconnect_POST.schema";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    await deleteConnection(user.id);
    return new Response(superjson.stringify({ disconnected: true } satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not disconnect Canva";
    const status = message.toLowerCase().includes("not authenticated") ? 401 : 400;
    return new Response(superjson.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
