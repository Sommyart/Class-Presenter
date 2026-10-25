import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { reconcileUserStorage } from "../../helpers/userStorage";
import { OutputType } from "./usage_GET.schema";

export async function handle(request: Request) {
  try {
    // Identity comes from the session, never from the client.
    const { user } = await getServerUserSession(request);

    // Reconcile on read so the number the user sees is derived from actual
    // stored rows rather than a counter that may have drifted.
    const usage = await reconcileUserStorage(user.id);

    return new Response(superjson.stringify(usage satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load storage usage";
    const status = message.toLowerCase().includes("not authenticated") ? 401 : 400;
    return new Response(superjson.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
