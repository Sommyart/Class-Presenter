import { routes } from "./_routes";

// vercel.json rewrites /_api/:path* -> /api/index?__path=:path*, so the browser
// keeps calling /_api/... exactly as the original app did.
export default {
  async fetch(request: Request): Promise<Response> {
    const incoming = new URL(request.url);
    const path = incoming.searchParams.get("__path") ?? "";
    incoming.searchParams.delete("__path");

    // Rebuild the public URL so handlers see the real origin and query string.
    const host = request.headers.get("x-forwarded-host") ?? incoming.host;
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    const publicUrl = new URL(`${proto}://${host}/_api/${path}${incoming.search}`);

    const route = routes[`${request.method} /${path.replace(/\/+$/, "")}`];
    if (!route) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const forwarded = new Request(publicUrl, {
      method: request.method,
      headers: request.headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
    });

    try {
      return await route.handle(forwarded);
    } catch (error) {
      console.error("Unhandled API error", path, error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
