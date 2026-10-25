// TEMPORARY one-time endpoint: copies users, presentations, slides and files from the old
// Floot app into this deployment. Protected by MIGRATION_TOKEN. Delete after use.
import { sql } from "kysely";
import { db } from "../../helpers/db";
import { putObject } from "../../helpers/storage";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

type Row = Record<string, any>;
type Export = {
  users: Row[];
  userPasswords: Row[];
  userStorage: Row[];
  oauthAccounts: Row[];
  presentations: Row[];
  slides: Row[];
  files: { key: string; url: string }[];
};

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

async function chunked<T>(rows: T[], size: number, fn: (part: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += size) await fn(rows.slice(i, i + size));
}

export async function handle(request: Request) {
  if (!process.env.MIGRATION_TOKEN || request.headers.get("x-migration-token") !== process.env.MIGRATION_TOKEN) {
    return json({ error: "Forbidden" }, 403);
  }
  try {
    const body = JSON.parse(await request.text()) as {
      step: "db" | "files" | "reconcile";
      exportUrl: string;
      offset?: number;
    };
    const res = await fetch(body.exportUrl);
    if (!res.ok) return json({ error: `Export fetch failed: ${res.status}` }, 502);
    const exp = (await res.json()) as Export;

    if (body.step === "files") {
      const started = Date.now();
      let i = body.offset ?? 0;
      const done: string[] = [];
      const failed: string[] = [];
      while (i < exp.files.length && Date.now() - started < 40_000) {
        const f = exp.files[i];
        try {
          const r = await fetch(f.url);
          if (!r.ok) throw new Error(`GET ${r.status}`);
          const buf = new Uint8Array(await r.arrayBuffer());
          const ext = f.key.split(".").pop()?.toLowerCase() ?? "";
          await putObject({
            filename: f.key,
            body: buf,
            contentType: MIME[ext] || r.headers.get("content-type") || "application/octet-stream",
          });
          done.push(`${f.key} ${buf.byteLength}`);
        } catch (e) {
          failed.push(`${f.key}: ${e instanceof Error ? e.message : e}`);
        }
        i++;
      }
      return json({ total: exp.files.length, next: i, finished: i >= exp.files.length, copied: done.length, failed });
    }

    if (body.step === "reconcile") {
      const { reconcileUserStorage } = await import("../../helpers/userStorage");
      const users = await db.selectFrom("users").select("id").execute();
      for (const u of users) await reconcileUserStorage(u.id);
      return json({ reconciled: users.length });
    }

    // ---- step: db ----
    const summary = await db.transaction().execute(async (trx) => {
      // 1. Keep everything created on the new site so far (to re-attach below, and as a backup).
      const held = {
        users: await trx.selectFrom("users").selectAll().execute(),
        passwords: await trx.selectFrom("userPasswords").selectAll().execute(),
        presentations: await trx.selectFrom("presentations").selectAll().execute(),
        slides: await trx.selectFrom("slides").selectAll().execute(),
      };
      await sql`create table if not exists _migration_backup (id serial primary key, created_at timestamptz default now(), data jsonb not null)`.execute(trx);
      await sql`insert into _migration_backup (data) values (${JSON.stringify(held)}::jsonb)`.execute(trx);

      // 2. Clear current rows (users cascade to passwords, presentations, slides, sessions, storage).
      await trx.deleteFrom("oauthAccounts").execute();
      await trx.deleteFrom("users").execute();

      // 3. Load the Floot data with its original ids.
      await chunked(exp.users, 50, (r) => trx.insertInto("users").values(r as any).execute());
      await chunked(exp.userPasswords, 50, (r) => trx.insertInto("userPasswords").values(r as any).execute());
      await chunked(exp.userStorage, 50, (r) => trx.insertInto("userStorage").values(r as any).execute());
      await chunked(exp.oauthAccounts, 50, (r) => trx.insertInto("oauthAccounts").values(r as any).execute());
      await chunked(exp.presentations, 25, (r) => trx.insertInto("presentations").values(r as any).execute());
      await chunked(exp.slides, 50, (r) => trx.insertInto("slides").values(r as any).execute());

      // 4. Move the id counters past the imported ids.
      for (const [seq, table] of [
        ["users_id_seq", "users"],
        ["user_passwords_id_seq", "user_passwords"],
        ["oauth_accounts_id_seq", "oauth_accounts"],
        ["presentations_id_seq", "presentations"],
        ["slides_id_seq", "slides"],
      ] as const) {
        await sql`select setval(${seq}, greatest((select coalesce(max(id), 0) from ${sql.table(table)}), 1))`.execute(trx);
      }

      // 5. Re-attach what was created on the new site, matching accounts by email.
      const byEmail = new Map(exp.users.map((u) => [String(u.email).toLowerCase(), u.id as number]));
      const idMap = new Map<number, number>();
      let mergedAccounts = 0;
      let newAccounts = 0;
      for (const u of held.users) {
        const existing = byEmail.get(String(u.email).toLowerCase());
        const hasFlootPassword = existing !== undefined && exp.userPasswords.some((p) => p.userId === existing);
        const pw = held.passwords.find((p) => p.userId === u.id);
        if (existing !== undefined) {
          idMap.set(u.id, existing);
          mergedAccounts++;
          if (!hasFlootPassword && pw) {
            await trx.insertInto("userPasswords").values({ userId: existing, passwordHash: pw.passwordHash }).execute();
          }
        } else {
          const { id: _old, ...rest } = u as any;
          const created = await trx.insertInto("users").values(rest).returning("id").executeTakeFirstOrThrow();
          idMap.set(u.id, created.id);
          newAccounts++;
          if (pw) await trx.insertInto("userPasswords").values({ userId: created.id, passwordHash: pw.passwordHash }).execute();
          await trx.insertInto("userStorage").values({ userId: created.id }).onConflict((oc) => oc.doNothing()).execute();
        }
      }
      const presMap = new Map<string, string>();
      for (const p of held.presentations) {
        const { id: oldId, ...rest } = p as any;
        const created = await trx
          .insertInto("presentations")
          .values({ ...rest, userId: idMap.get(p.userId) })
          .returning("id")
          .executeTakeFirstOrThrow();
        presMap.set(String(oldId), String(created.id));
      }
      for (const s of held.slides) {
        const { id: _sid, ...rest } = s as any;
        await trx
          .insertInto("slides")
          .values({ ...rest, presentationId: presMap.get(String(s.presentationId)) as any })
          .execute();
      }

      return {
        imported: {
          users: exp.users.length,
          presentations: exp.presentations.length,
          slides: exp.slides.length,
          files: exp.files.length,
        },
        reattached: {
          mergedAccounts,
          newAccounts,
          presentations: held.presentations.length,
          slides: held.slides.length,
        },
      };
    });
    return json(summary);
  } catch (error) {
    console.error("Migration failed", error);
    return json({ error: error instanceof Error ? error.message : "failed" }, 500);
  }
}
