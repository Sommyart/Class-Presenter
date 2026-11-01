import { getPresentationOriginalUrl } from "../endpoints/presentations/original_url_GET.schema";
import { postSlideThumbnailsPresign } from "../endpoints/presentations/thumbnails_presign_POST.schema";
import { postRebuildComplete } from "../endpoints/presentations/rebuild_complete_POST.schema";
import { renderThumbnails } from "./renderSlideThumbnails";

/**
 * Re-renders every slide of an existing presentation from its original file at
 * the current (high) quality and replaces the stored images in place. Timers,
 * music and slide order are untouched. Nothing is changed unless the original
 * renders to exactly the same number of slides.
 */
export async function rebuildSlides(
  presentationId: string,
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  const original = await getPresentationOriginalUrl({ presentationId });
  const res = await fetch(original.url);
  if (!res.ok) throw new Error("Couldn't download the original file.");
  const blob = await res.blob();
  const file = new File([blob], original.originalFileName ?? `original.${original.sourceType}`);

  // Render everything first so a failure can't leave a half-rebuilt deck.
  const rendered: Array<{ slideIndex: number; blob: Blob }> = [];
  const total = await renderThumbnails(file, original.sourceType, async (slide, done, count) => {
    rendered.push({ slideIndex: slide.slideIndex, blob: slide.blob });
    onProgress?.(done, count * 2);
  });
  if (total !== original.slideCount || rendered.length !== original.slideCount) {
    throw new Error(
      `The original has ${total} slides but this deck has ${original.slideCount}. Nothing was changed.`,
    );
  }

  const sizes: Array<{ slideIndex: number; thumbnailSizeBytes: number }> = [];
  for (let i = 0; i < rendered.length; i++) {
    const r = rendered[i];
    const presign = await postSlideThumbnailsPresign({
      presentationId,
      slides: [
        { slideIndex: r.slideIndex, contentType: "image/jpeg", extension: "jpg", sizeBytes: r.blob.size },
      ],
    });
    const target = presign.targets[0];
    if (!target) throw new Error(`Couldn't prepare slide ${r.slideIndex + 1}.`);
    const put = await fetch(target.presignedUrl, {
      method: "PUT",
      body: r.blob,
      headers: { "Content-Type": "image/jpeg" },
    });
    if (!put.ok) throw new Error(`Upload failed for slide ${r.slideIndex + 1} (${put.status}).`);
    sizes.push({ slideIndex: r.slideIndex, thumbnailSizeBytes: r.blob.size });
    onProgress?.(total + i + 1, total * 2);
  }

  await postRebuildComplete({ presentationId, slides: sizes });
  return total;
}
