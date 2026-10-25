// Bundles server/index.ts (+ every endpoint and dependency) into one ESM file,
// api/index.mjs, which Vercel runs as the serverless function.
import { build } from "esbuild";

await build({
  entryPoints: ["server/index.ts"],
  outfile: "api/index.mjs",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  sourcemap: false,
  logLevel: "info",
  // Some bundled CommonJS dependencies call require() at runtime.
  banner: {
    js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);",
  },
});
