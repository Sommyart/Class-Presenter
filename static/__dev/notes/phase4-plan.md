# ClassPresenter — build status

## Product direction
Phase 3's SaaS billing/subscription plan was SCRAPPED per the user's Phase 4
instructions. There is no pricing, subscription, plan-tier or billing code.
Do NOT reintroduce it unless the user explicitly asks again.
(Note: static/__dev/system-prompt.md still contains the old Phase 3 prompt
text, which describes subscriptions/teams. It is stale — Phase 4 supersedes
it. Treat this file as the current source of truth.)

## Infrastructure actually in use
- Floot-managed Postgres (FLOOT_DATABASE_URL) + Floot email/password auth
  (JWT_SECRET). Both were already provisioned — do not add a second
  database, auth system or storage provider.
- Tables: users, userPasswords, sessions, loginAttempts, presentations,
  slides, userStorage. Quota default 1GB, FK cascades on delete.
- @floot/storage private area for all user files. File bytes NEVER transit
  an /_api endpoint — endpoints presign, the browser PUTs.

## Done and VERIFIED by test
- 1GB quota per user; seeded at registration via ensureUserStorage
  (idempotent, also backfills older accounts).
- reconcileUserStorage recomputes usedBytes by SUMMING real rows
  (presentations.fileSizeBytes + slides.thumbnailSizeBytes) instead of
  trusting an incrementing counter. Called after every mutation and on read.
- Pre-upload gate rejects oversized uploads with 413 BEFORE any bytes move
  (verified: 2GB upload rejected on a fresh account).
- Byte accounting exact (verified: file 43B + 2 thumbs @300B = 643B used).
- Delete removes cloud assets BEFORE db rows, then reconciles; storage
  returns to 0 and is immediately reusable (verified).
- Abandoned/failed uploads consume 0 bytes — the presentation row starts at
  fileSizeBytes 0 and only commits on upload_complete (verified).
- Cross-user isolation (verified): another user gets 404 on read, delete and
  timer-write of someone else's presentation; unauthenticated list gets 401.
  Ownership is always checked against getServerUserSession, never a
  client-supplied userId.
- Editor→Present shared state (verified): set slide 1 to 20min + autoAdvance
  in the editor, detail endpoint returns exactly that.
- Real rendering: PDF.js (every page) and pptx-viewer (every slide) rasterize
  to JPEG IN THE BROWSER — neither can run in Floot's no-DOM backend. These
  are the only two adapters marked implemented: true.

## Deliberately NOT implemented (do not fake these)
- Canva and Google Slides adapters: implemented: false. Both need real OAuth
  + export access and NO credentials are configured. Link import is disabled
  in the UI with a specific reason shown. Do not scrape share URLs.

## Not done yet
1. Pre-presentation check screen (Phase 4 part 22) — the summary shown
   before START PRESENTATION.
2. pages/settings.tsx is still visual-only local state — its timer display
   mode / style / position / warning settings are NOT persisted and NOT read
   by the present screen (which currently hardcodes top-right + its own
   look). Either persist them per-user or drop the ones that don't work.
3. Responsive pass on the present screen + editor (Phase 4 part 24 / test 7)
   has not been done.
4. Real PDF/PPTX upload has only been tested via synthetic bytes through the
   API. The browser rendering path (pdfjs worker resolution, pptx-viewer SVG
   rasterization) has NOT been exercised against a real file in a real
   browser — that needs a human to upload an actual deck.
5. No thumbnail caching/regeneration policy; re-uploading re-renders.
