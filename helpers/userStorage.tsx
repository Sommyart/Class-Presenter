import { db } from "./db";
import { STORAGE_QUOTA_BYTES } from "./storageConfig";

// Server-side storage accounting. Everything here runs in endpoints only —
// never trust a userId from the client; callers pass the id resolved from
// getServerUserSession.

export interface StorageUsage {
  quotaBytes: number;
  usedBytes: number;
  remainingBytes: number;
}

// bigint columns come back from postgres-js as strings; normalize once here
// so the rest of the app works in plain numbers (a 1GB quota is far inside
// Number.MAX_SAFE_INTEGER, so this is lossless at these magnitudes).
function toNum(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return 0;
}

/**
 * Guarantees a user_storage row exists for this user and returns it.
 * Idempotent, so it doubles as a backfill for accounts created before the
 * quota system existed (registration also calls it for new signups).
 */
export async function ensureUserStorage(userId: number): Promise<StorageUsage> {
  await db
    .insertInto("userStorage")
    .values({ userId, quotaBytes: STORAGE_QUOTA_BYTES, usedBytes: 0 })
    .onConflict((oc) => oc.column("userId").doNothing())
    .execute();

  const row = await db
    .selectFrom("userStorage")
    .select(["quotaBytes", "usedBytes"])
    .where("userId", "=", userId)
    .executeTakeFirst();

  const quotaBytes = row ? toNum(row.quotaBytes) : STORAGE_QUOTA_BYTES;
  const usedBytes = row ? toNum(row.usedBytes) : 0;

  return {
    quotaBytes,
    usedBytes,
    remainingBytes: Math.max(0, quotaBytes - usedBytes),
  };
}

/**
 * Recomputes usedBytes from the actual stored rows rather than trusting an
 * incrementally-maintained counter. This is the reconciliation mechanism:
 * it repairs drift from failed uploads, interrupted processing, orphaned
 * rows or double-counting. Cheap enough to run after every mutation.
 */
export async function reconcileUserStorage(userId: number): Promise<StorageUsage> {
  await ensureUserStorage(userId);

  const presentationTotal = await db
    .selectFrom("presentations")
    .select((eb) => eb.fn.sum<string>("fileSizeBytes").as("total"))
    .where("userId", "=", userId)
    .executeTakeFirst();

  // Presentation-wide background music.
  const presentationAudioTotal = await db
    .selectFrom("presentations")
    .select((eb) => eb.fn.sum<string>("audioSizeBytes").as("total"))
    .where("userId", "=", userId)
    .executeTakeFirst();

  const thumbnailTotal = await db
    .selectFrom("slides")
    .innerJoin("presentations", "slides.presentationId", "presentations.id")
    .select((eb) => eb.fn.sum<string>("slides.thumbnailSizeBytes").as("total"))
    .where("presentations.userId", "=", userId)
    .executeTakeFirst();

  // Per-slide background music counts toward the quota like any other
  // persistent asset.
  const audioTotal = await db
    .selectFrom("slides")
    .innerJoin("presentations", "slides.presentationId", "presentations.id")
    .select((eb) => eb.fn.sum<string>("slides.audioSizeBytes").as("total"))
    .where("presentations.userId", "=", userId)
    .executeTakeFirst();

  const usedBytes =
    toNum(presentationTotal?.total) +
    toNum(presentationAudioTotal?.total) +
    toNum(thumbnailTotal?.total) +
    toNum(audioTotal?.total);

  const updated = await db
    .updateTable("userStorage")
    .set({ usedBytes, updatedAt: new Date() })
    .where("userId", "=", userId)
    .returning(["quotaBytes", "usedBytes"])
    .executeTakeFirst();

  const quotaBytes = updated ? toNum(updated.quotaBytes) : STORAGE_QUOTA_BYTES;

  return {
    quotaBytes,
    usedBytes,
    remainingBytes: Math.max(0, quotaBytes - usedBytes),
  };
}

export class InsufficientStorageError extends Error {
  constructor(public readonly usage: StorageUsage, public readonly requiredBytes: number) {
    super(
      "You don't have enough storage space for this presentation. Delete an older presentation from History to free up space.",
    );
    this.name = "InsufficientStorageError";
  }
}

/**
 * Pre-upload gate. Called BEFORE any bytes are transferred so an oversized
 * upload is rejected up front rather than part-way through.
 *
 * estimatedAssetBytes covers the thumbnails the client will generate and
 * upload after the original file lands — counting them here keeps a user
 * from slipping just under the quota with the file alone and then blowing
 * past it with previews.
 */
export async function assertStorageAvailable(
  userId: number,
  incomingBytes: number,
  estimatedAssetBytes = 0,
): Promise<StorageUsage> {
  const usage = await reconcileUserStorage(userId);
  const required = incomingBytes + estimatedAssetBytes;
  if (usage.usedBytes + required > usage.quotaBytes) {
    throw new InsufficientStorageError(usage, required);
  }
  return usage;
}
