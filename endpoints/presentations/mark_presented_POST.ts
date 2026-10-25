import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./mark_presented_POST.schema";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const now = new Date();
    const result = await db
      .updateTable("presentations")
      .set({ lastPresentedAt: now })
      .where("id", "=", input.presentationId)
      .where("userId", "=", user.id) // ownership in the predicate
      .executeTakeFirst();

    if (Number(result.numUpdatedRows ?? 0) === 0) {
      return new Response(superjson.stringify({ error: "Presentation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      superjson.stringify({ recorded: true, lastPresentedAt: now } satisfies OutputType),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not record the session";
    const status = message.toLowerCase().includes("not authenticated") ? 401 : 400;
    return new Response(superjson.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
