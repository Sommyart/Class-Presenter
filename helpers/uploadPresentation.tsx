import { postPresentationUploadInit } from "../endpoints/presentations/upload_init_POST.schema";
import { postSlideThumbnailsPresign } from "../endpoints/presentations/thumbnails_presign_POST.schema";
import { postPresentationUploadComplete } from "../endpoints/presentations/upload_complete_POST.schema";
import { postDeletePresentation } from "../endpoints/presentations/delete_POST.schema";
import { renderThumbnails, type RenderedSlide } from "./renderSlideThumbnails";
import { createUploadQueue } from "./uploadQueue";

export type UploadStage =
  | "checking"
  | "uploading"
  | "rendering"
  | "storing-thumbnails"
  | "finishing"
  | "done";

export interface UploadProgress {
  stage: UploadStage;
  done?: number;
  total?: number;
}

const MIME_BY_SOURCE: Record<"pdf" | "pptx", string> = {
  pdf: "application/pdf",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

// How many uploads run at once. Browsers allow about 6 connections per host,
// so this stays just under that (the original file holds one slot).
const UPLOAD_CONCURRENCY = 5;

async function putBytes(
  presignedUrl: string,
  body: Blob,
  contentType: string,
  signal?: AbortSignal,
) {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    body,
    headers: { "Content-Type": contentType },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Upload failed (${response.status}).`);
  }
}

// Marks an error that came from the upload queue, so it isn't mistaken for a
// problem reading the slides.
class QueueFailure extends Error {
  constructor(public readonly cause: unknown) {
    super("upload queue failed");
  }
}

type Job = { kind: "original" } | { kind: "thumb"; slide: RenderedSlide };

/**
 * Full upload pipeline:
 *   quota check, then in parallel:
 *     - the original file goes to cloud storage
 *     - slides are rendered in the browser, and each one is uploaded the
 *       moment it is ready, several at a time
 *   then commit metadata + reconcile.
 *
 * Rendering and uploading used to run strictly one after the other, with
 * thumbnails sent one at a time. Overlapping them means the slow part
 * (usually the connection) runs while the CPU is busy drawing the next page.
 *
 * If anything fails after the presentation row is created, in-flight requests
 * are aborted and waited on, and then the row and any assets are deleted, so
 * a failed upload doesn't permanently consume quota or leave files behind.
 */
export async function uploadPresentation(
  file: File,
  sourceType: "pdf" | "pptx",
  onProgress?: (progress: UploadProgress) => void,
): Promise<{ presentationId: string; slideCount: number }> {
  const t0 = performance.now();
  const timings: Record<string, number> = {};
  const since = (from: number) => Math.round(performance.now() - from);

  onProgress?.({ stage: "checking" });

  // One canonical content type, used for BOTH signing and the PUT. Browsers
  // often report an empty file.type for .pptx; if the signed type and the
  // sent type disagree the presigned PUT is rejected with 403.
  const contentType = MIME_BY_SOURCE[sourceType];

  // Server rejects here if the quota can't fit the file — before any bytes move.
  const initStart = performance.now();
  const init = await postPresentationUploadInit({
    title: file.name.replace(/\.(pptx|pdf)$/i, ""),
    originalFileName: file.name,
    sourceType,
    fileSizeBytes: file.size,
    contentType,
  });
  timings.initMs = since(initStart);

  const uploaded: Array<{ slideIndex: number; thumbnailPath: string; thumbnailSizeBytes: number }> =
    [];
  let thumbBytes = 0;
  let totalSlides = 0;
  let renderFinished = false;

  // After rendering is done, tell the user what is still outstanding.
  const reportTail = () => {
    if (!renderFinished) return;
    if (uploaded.length < totalSlides) {
      onProgress?.({ stage: "storing-thumbnails", done: uploaded.length, total: totalSlides });
    } else {
      onProgress?.({ stage: "uploading" });
    }
  };

  const queue = createUploadQueue<Job>({
    concurrency: UPLOAD_CONCURRENCY,
    worker: async (job, signal) => {
      if (job.kind === "original") {
        const start = performance.now();
        await putBytes(init.presignedUrl, file, contentType, signal);
        timings.originalUploadMs = since(start);
        return;
      }

      const { slide } = job;
      // Each thumbnail is signed with its exact byte length (the signature
      // pins Content-Length), so it is signed once it has been rendered.
      const presign = await postSlideThumbnailsPresign(
        {
          presentationId: init.presentationId,
          slides: [
            {
              slideIndex: slide.slideIndex,
              contentType: slide.contentType,
              extension: slide.extension,
              sizeBytes: slide.blob.size,
            },
          ],
        },
        { signal },
      );
      const target = presign.targets[0];
      if (!target) {
        throw new Error(`Couldn't prepare slide ${slide.slideIndex + 1} for upload.`);
      }
      await putBytes(target.presignedUrl, slide.blob, slide.contentType, signal);

      uploaded.push({
        slideIndex: slide.slideIndex,
        thumbnailPath: target.thumbnailPath,
        thumbnailSizeBytes: slide.blob.size,
      });
      thumbBytes += slide.blob.size;
      reportTail();
    },
  });

  try {
    // Start the original file going straight away, alongside rendering.
    await queue.push({ kind: "original" });
    onProgress?.({ stage: "rendering", done: 0 });

    const renderStart = performance.now();
    let blockedMs = 0;
    let slideCount: number;
    try {
      slideCount = await renderThumbnails(file, sourceType, async (slide, done, total) => {
        totalSlides = total;
        onProgress?.({ stage: "rendering", done, total });
        const pushStart = performance.now();
        try {
          await queue.push({ kind: "thumb", slide });
        } catch (error) {
          throw new QueueFailure(error);
        }
        // Time spent waiting because uploads couldn't keep up with rendering.
        blockedMs += performance.now() - pushStart;
      });
    } catch (renderError) {
      if (renderError instanceof QueueFailure) throw renderError.cause;
      // Name the renderer and the failure so a rendering bug is diagnosable
      // rather than surfacing as a bare browser exception.
      const detail = renderError instanceof Error ? renderError.message : String(renderError);
      throw new Error(
        `Couldn't read the slides from this ${sourceType.toUpperCase()} file (${detail}). The file was not added.`,
      );
    }
    timings.renderLoopMs = since(renderStart);
    timings.renderBlockedOnUploadMs = Math.round(blockedMs);

    if (slideCount === 0) {
      throw new Error("No slides could be read from this file.");
    }

    // Rendering is finished; wait for whatever is still uploading.
    renderFinished = true;
    reportTail();
    const tailStart = performance.now();
    await queue.finish();
    timings.waitAfterRenderMs = since(tailStart);

    if (uploaded.length !== slideCount) {
      throw new Error(
        `Only ${uploaded.length} of ${slideCount} slides were saved. Please try again.`,
      );
    }

    onProgress?.({ stage: "finishing" });
    const completeStart = performance.now();
    const complete = await postPresentationUploadComplete({
      presentationId: init.presentationId,
      fileSizeBytes: file.size,
      slides: [...uploaded].sort((a, b) => a.slideIndex - b.slideIndex),
    });
    timings.completeMs = since(completeStart);

    onProgress?.({ stage: "done" });

    // Where the time went, so a slow upload can be diagnosed from real
    // numbers rather than guessed at.
    console.info("[upload] finished", {
      type: sourceType,
      fileMB: +(file.size / 1048576).toFixed(2),
      slides: slideCount,
      thumbsTotalMB: +(thumbBytes / 1048576).toFixed(2),
      thumbAvgKB: Math.round(thumbBytes / slideCount / 1024),
      ...timings,
      totalMs: since(t0),
    });

    return { presentationId: complete.presentationId, slideCount: complete.slideCount };
  } catch (error) {
    console.warn("[upload] failed", {
      type: sourceType,
      fileMB: +(file.size / 1048576).toFixed(2),
      ...timings,
      totalMs: since(t0),
      error: error instanceof Error ? error.message : String(error),
    });

    // Roll back. In-flight requests are aborted and awaited first: deleting
    // while one is still running could let it land afterwards and leave an
    // orphaned file behind.
    await queue.cancel();
    try {
      await postDeletePresentation({ presentationId: init.presentationId });
    } catch {
      // Surface the original failure rather than the cleanup failure.
    }
    throw error;
  }
}
