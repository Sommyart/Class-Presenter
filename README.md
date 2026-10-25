# ClassPresenter

A presentation tool for teachers and presenters, with a global timer (count up or countdown), per-slide timers, auto-advance, background music, and a 10-minute warning bell with a glowing alarm clock.

Built by Sommyart Imagery. The live app runs at https://class-presenter.floot.app.

## What this repo is

A source export of the project as it exists on Floot (project id `6bf287ac-b2ce-4652-993c-bd9d840e5efe`), with the same folder structure:

| Folder | Contents |
| --- | --- |
| `pages/` | File-based routes (`_index`, `dashboard`, `login`, `register`, `presentations`, `presentations.$presentationId.edit`, `present.$presentationId`, `settings`) |
| `components/` | App components plus Floot's seeded UI kit (`*.example.tsx` files are demo files from that kit) |
| `endpoints/` | Serverless endpoints, one folder per area (`auth`, `presentations`, `storage`), each with a `.schema.ts` |
| `helpers/` | Timer engine, upload queue, thumbnail rendering, storage quota, auth and OAuth helpers |
| `static/__dev/` | Floot notes, dependency list and native manifests |
| `base.css` | Design tokens (violet theme, Sora / Inter / JetBrains Mono) |

## Important: this repo does not run on its own yet

Only the files that Floot shows in the project tree were exported. These pieces are generated or provided by Floot and are not in this repo:

- `package.json`, Vite and TypeScript config, the HTML entry and the router bootstrap
- The server entry that maps `endpoints/**/*_GET.ts` and `*_POST.ts` to `/_api/...`
- The `@floot/storage` package (used in 8 endpoints for private presigned uploads)
- The managed Postgres database, the `FLOOT_DATABASE_URL` connection, and the generated `helpers/schema.tsx` types
- Floot sign-in (OAuth broker) and the `JWT_SECRET` used for sessions

Moving the code to GitHub does not by itself remove Floot's limits. File storage, the database and sign-in are Floot services. To run this elsewhere you would need to replace them, for example:

1. Storage: swap `@floot/storage` for S3, Cloudflare R2 or Supabase Storage presigned uploads. The presigned URL must pin the exact `Content-Length`, so the client sends exact byte sizes (see `helpers/uploadPresentation.tsx`).
2. Database: any Postgres works. The tables are `users`, `user_passwords`, `sessions`, `login_attempts`, `oauth_accounts`, `oauth_states`, `user_storage`, `presentations` and `slides` (see `helpers/schema.tsx`).
3. Auth: email and password uses `bcryptjs` and `jose` and is portable. Google sign-in goes through `helpers/FlootOAuthProvider.tsx` and would need your own Google OAuth client.
4. Add your own `package.json`, bundler and a small server that routes `/_api/*` to the endpoint handlers.

## Environment variable names used

See `.env.example`. These names are read in `helpers/db.tsx`, `helpers/getSetServerSession.tsx`, `helpers/FlootOAuthProvider.tsx` and `helpers/oauthPopupMessage.tsx`. No secret values are stored in this repo.

## Dependencies

Pinned app dependencies (full list in `static/__dev/dependencies.json`): `bcryptjs@3.0.3`, `jose@6.2.12`, `jszip@3.10.2`, `kysely@0.26.3`, `kysely-postgres-js@5.0.0`, `nanoid@6.0.1`, `pdfjs-dist@6.3.289`, `postgres@3.4.9`, `pptx-viewer@0.2.2`, `superjson@2.2.2`, plus React 19, react-router-dom, @tanstack/react-query, Radix UI and zod.

## Known limits

- PPTX slides are rendered in the browser with `pptx-viewer`, which rebuilds slides rather than reproducing PowerPoint exactly. Exact fidelity needs server-side conversion (LibreOffice or a conversion API) or exporting to PDF first.
- Canva and Google Slides link import are not implemented (the adapters in `helpers/presentationAdapters.tsx` are marked `implemented: false`).
- `static/__dev/system-prompt.md` is an older Phase 3 brief and is out of date.
