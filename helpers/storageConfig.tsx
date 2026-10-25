// Single source of truth for the storage quota, in bytes (not an approximate
// decimal string). 1 GB here means the binary gigabyte (1024^3), which is
// what most OS-level storage indicators use.
export const STORAGE_QUOTA_BYTES = 1024 * 1024 * 1024; // 1,073,741,824 bytes

export const STORAGE_WARNING_RATIO = 0.85; // "running low"
export const STORAGE_CRITICAL_RATIO = 0.95; // "almost full"

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  if (mb >= 1) return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export type StorageState = "normal" | "warning" | "critical" | "full";

export function getStorageState(usedBytes: number, quotaBytes: number): StorageState {
  if (usedBytes >= quotaBytes) return "full";
  const ratio = usedBytes / quotaBytes;
  if (ratio >= STORAGE_CRITICAL_RATIO) return "critical";
  if (ratio >= STORAGE_WARNING_RATIO) return "warning";
  return "normal";
}

export function getStorageMessage(state: StorageState): string | null {
  switch (state) {
    case "warning":
      return "You're running low on storage.";
    case "critical":
      return "Storage is almost full. Consider deleting older presentations.";
    case "full":
      return "Storage is full. Delete a presentation from History to upload another.";
    default:
      return null;
  }
}
