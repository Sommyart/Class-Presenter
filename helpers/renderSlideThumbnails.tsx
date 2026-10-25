// Real client-side slide rendering. Both renderers run in the browser
// because neither PDF.js nor the PPTX renderer can run in Floot's
// serverless (no-DOM) backend — so the browser produces the image bytes and
// only those are uploaded to cloud storage.

// Rendered wide enough to look sharp when a slide fills a large display,
// not just as a small library thumbnail. The editor scales the same asset
// down via CSS.
const THUMBNAIL_WIDTH = 1600;
const JPEG_QUALITY = 0.82;

export interface RenderedSlide {
  slideIndex: number;
  blob: Blob;
  contentType: "image/jpeg" | "image/svg+xml";
  extension: "jpg" | "svg";
}

/**
 * Called once per slide as soon as it has been rendered, so the caller can
 * start uploading it while the next slides are still being drawn. It may
 * return a promise to apply backpressure; rendering waits for it.
 */
export type SlideSink = (slide: RenderedSlide, done: number, total: number) => Promise<void>;

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the slide image."))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

/** Releases a canvas's pixel buffer right away rather than waiting for GC. */
function releaseCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 0;
  canvas.height = 0;
}

/**
 * Renders every page of a PDF to a JPEG using PDF.js, handing each page to
 * `onSlide` as soon as it is ready. Returns the page count.
 * PDF.js paints raw pixels into the canvas, so no tainting occurs here.
 */
export async function renderPdfThumbnails(file: File, onSlide: SlideSink): Promise<number> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).href;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const total = doc.numPages;

  try {
    for (let pageNumber = 1; pageNumber <= total; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = THUMBNAIL_WIDTH / baseViewport.width;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not get a canvas context for rendering.");

      // White background so transparent PDFs don't render as black JPEGs.
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const blob = await canvasToJpegBlob(canvas);
      releaseCanvas(canvas);
      page.cleanup();

      await onSlide(
        { slideIndex: pageNumber - 1, blob, contentType: "image/jpeg", extension: "jpg" },
        pageNumber,
        total,
      );
    }
  } finally {
    doc.cleanup();
  }

  return total;
}

/**
 * Converts any externally-referenced image inside an SVG into an inline
 * data URI.
 *
 * Two reasons this is necessary:
 *  1. The PPTX renderer points <image> elements at blob:/object URLs that
 *     are revoked when the viewer is destroyed — a stored SVG referencing
 *     them would render blank later.
 *  2. Those same external references are what taint a canvas, which is the
 *     "Tainted canvases may not be exported" failure. Inlining removes the
 *     external dependency entirely.
 */
async function inlineSvgImages(svg: SVGElement): Promise<void> {
  const XLINK = "http://www.w3.org/1999/xlink";
  const imageEls = Array.from(svg.querySelectorAll("image"));

  await Promise.all(
    imageEls.map(async (el) => {
      const href = el.getAttribute("href") ?? el.getAttributeNS(XLINK, "href");
      if (!href || href.startsWith("data:")) return;
      try {
        const response = await fetch(href);
        const blob = await response.blob();
        const dataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Could not inline an embedded image."));
          reader.readAsDataURL(blob);
        });
        el.setAttribute("href", dataUri);
        el.removeAttributeNS(XLINK, "href");
      } catch {
        // A single unreadable image shouldn't fail the whole slide — drop
        // the reference so the rest of the slide still renders.
        el.removeAttribute("href");
        el.removeAttributeNS(XLINK, "href");
      }
    }),
  );
}

/**
 * Applies PowerPoint's own autofit values to a text body.
 *
 * PowerPoint stores a `normAutofit` fontScale / lnSpcReduction on text
 * boxes whose content was shrunk to fit ("Shrink text on overflow").
 * pptx-viewer parses these into `autofit` but does not apply them when
 * rendering, so the text draws at full size and spills outside its box —
 * that's the overflowing/clipped paragraph seen on text-heavy slides.
 *
 * This does not change any content. It only applies the scale factors the
 * deck itself already specifies, so the slide renders the way PowerPoint
 * displays it.
 */
function applyAutofit(textBody: any): void {
  const autofit = textBody?.autofit;
  if (!autofit || autofit.type === "none") return;

  const fontScale = typeof autofit.fontScale === "number" ? autofit.fontScale : 1;
  const lineReduction =
    typeof autofit.lineSpacingReduction === "number" ? autofit.lineSpacingReduction : 0;

  if (fontScale === 1 && lineReduction === 0) return;

  for (const paragraph of textBody.paragraphs ?? []) {
    if (fontScale !== 1) {
      for (const run of paragraph.runs ?? []) {
        if (typeof run.fontSize === "number") {
          run.fontSize = run.fontSize * fontScale;
        }
      }
      // Fixed spacing is in pixels, so it has to scale with the text.
      if (typeof paragraph.spaceBefore === "number") paragraph.spaceBefore *= fontScale;
      if (typeof paragraph.spaceAfter === "number") paragraph.spaceAfter *= fontScale;
    }
    if (lineReduction > 0) {
      const current = typeof paragraph.lineSpacing === "number" ? paragraph.lineSpacing : 1;
      paragraph.lineSpacing = Math.max(0.5, current - lineReduction);
    }
  }
}

/** Walks every element on a slide, including groups and table cells. */
function applyAutofitToElements(elements: any[]): void {
  for (const element of elements ?? []) {
    if (element?.text?.paragraphs) applyAutofit(element.text);
    if (Array.isArray(element?.elements)) applyAutofitToElements(element.elements);
    for (const row of element?.rows ?? []) {
      for (const cell of row?.cells ?? []) {
        if (cell?.text?.paragraphs) applyAutofit(cell.text);
      }
    }
  }
}

/**
 * Renders every slide of a PPTX to a JPEG thumbnail.
 *
 * Uses the parser + renderer directly (rather than the bundled viewer) so
 * the parsed presentation can be corrected for autofit before rendering.
 *
 * The taint problem: drawing the renderer's SVG onto a canvas fails with
 * "Tainted canvases may not be exported" because the SVG points at
 * externally-referenced (blob:) images. The fix is to inline every embedded
 * image as a data URI first and then load the SVG itself from a data URI —
 * a fully self-contained, same-origin image doesn't taint the canvas.
 *
 * JPEG is used rather than storing the SVG directly because Floot's storage
 * rejects image/svg+xml uploads (verified: presigned PUT returns 403).
 */
export async function renderPptxThumbnails(file: File, onSlide: SlideSink): Promise<number> {
  const { loadPresentation, renderSlideToElement } = await import("pptx-viewer");

  const loaded: any = await loadPresentation(file);
  const presentation: any = loaded?.presentation ?? loaded;
  const total: number = presentation?.slides?.length ?? 0;
  if (total === 0) throw new Error("No slides were found in this file.");

  // Apply each deck's own autofit values so shrunk-to-fit text renders at
  // the size PowerPoint intends instead of overflowing its container.
  for (const slide of presentation.slides) {
    applyAutofitToElements(slide.elements);
  }

  const slideWidth: number = presentation?.slideSize?.width || 960;
  const slideHeight: number = presentation?.slideSize?.height || 540;
  const ratio = slideHeight / slideWidth;

  // Offscreen render surface — the user never sees this.
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${slideWidth}px;height:${slideHeight}px;`;
  document.body.appendChild(host);

  try {
    // Text lays out at the wrong size (and visibly overlaps) if a slide is
    // serialized before webfonts finish loading.
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    for (let index = 0; index < total; index++) {
      host.innerHTML = "";
      renderSlideToElement(presentation, index, host, {
        width: slideWidth,
        height: slideHeight,
      });

      // Let the renderer paint and settle before reading the DOM back.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const live = host.querySelector("svg");
      if (!live) throw new Error(`Slide ${index + 1} could not be rendered.`);

      const clone = live.cloneNode(true) as SVGElement;
      if (!clone.getAttribute("xmlns")) {
        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      }
      // Pin explicit pixel dimensions; some SVGs rasterize at a default
      // 150x150 otherwise.
      clone.setAttribute("width", String(slideWidth));
      clone.setAttribute("height", String(slideHeight));

      await inlineSvgImages(clone);

      const svgText = new XMLSerializer().serializeToString(clone);
      // data: URI (not blob:) — this is what keeps the canvas untainted.
      const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;

      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error(`Slide ${index + 1} could not be rasterized.`));
        image.src = dataUri;
      });

      const canvas = document.createElement("canvas");
      canvas.width = THUMBNAIL_WIDTH;
      canvas.height = Math.round(THUMBNAIL_WIDTH * ratio);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not get a canvas context for rendering.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const blob = await canvasToJpegBlob(canvas);
      releaseCanvas(canvas);

      await onSlide(
        { slideIndex: index, blob, contentType: "image/jpeg", extension: "jpg" },
        index + 1,
        total,
      );
    }
  } finally {
    host.remove();
  }

  return total;
}

/** Renders a file's slides, streaming each to `onSlide`. Returns the slide count. */
export async function renderThumbnails(
  file: File,
  sourceType: "pdf" | "pptx",
  onSlide: SlideSink,
): Promise<number> {
  return sourceType === "pdf"
    ? renderPdfThumbnails(file, onSlide)
    : renderPptxThumbnails(file, onSlide);
}
