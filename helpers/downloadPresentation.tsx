import { PDFDocument } from "pdf-lib";
import { getPresentationOriginalUrl } from "../endpoints/presentations/original_url_GET.schema";
import { getPresentationDetail } from "../endpoints/presentations/detail_GET.schema";

/** Makes a string safe to use as a file name on Windows, macOS, Android and iOS. */
function safeFileName(name: string, fallback: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return cleaned || fallback;
}

function saveBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before releasing the file.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
}

/**
 * Downloads the exact PDF or PPTX file that was uploaded. The file is fetched
 * into the browser first (a plain link would ignore the file name because the
 * storage address is on another domain).
 */
export async function downloadOriginalFile(presentationId: string, title: string): Promise<void> {
  const original = await getPresentationOriginalUrl({ presentationId });
  const res = await fetch(original.url);
  if (!res.ok) throw new Error("Couldn't download the original file.");
  const blob = await res.blob();
  const ext = original.sourceType;
  let name = original.originalFileName ? safeFileName(original.originalFileName, title) : safeFileName(title, "presentation");
  if (!name.toLowerCase().endsWith(`.${ext}`)) name = `${name}.${ext}`;
  saveBlob(blob, name);
}

const PAGE_WIDTH = 960; // PDF points; height follows each slide's own shape.

/**
 * Builds one PDF from the stored slide images, in slide order. Works for every
 * presentation, including ones that have no original file.
 */
export async function downloadSlidesAsPdf(
  presentationId: string,
  title: string,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const detail = await getPresentationDetail({ presentationId });
  const slides = [...detail.slides].sort((a, b) => a.slideIndex - b.slideIndex);
  const withImages = slides.filter((s) => !!s.thumbnailUrl);
  if (withImages.length === 0) throw new Error("This presentation has no slide images to put in a PDF.");

  const pdf = await PDFDocument.create();
  pdf.setTitle(detail.title || title);
  pdf.setCreator("ClassPresenter");

  for (let i = 0; i < withImages.length; i++) {
    const res = await fetch(withImages[i].thumbnailUrl!);
    if (!res.ok) throw new Error(`Couldn't load slide ${withImages[i].slideIndex + 1}.`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const image = isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    const height = (PAGE_WIDTH * image.height) / image.width;
    const page = pdf.addPage([PAGE_WIDTH, height]);
    page.drawImage(image, { x: 0, y: 0, width: PAGE_WIDTH, height });
    onProgress?.(i + 1, withImages.length);
  }

  const out = await pdf.save();
  // Copy into a plain ArrayBuffer so Blob accepts it in every TypeScript/browser setup.
  const buffer = out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
  saveBlob(new Blob([buffer], { type: "application/pdf" }), `${safeFileName(detail.title || title, "presentation")}.pdf`);
}
