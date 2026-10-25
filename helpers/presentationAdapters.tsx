import type { PresentationSourceType } from "./schema";

export interface PresentationAdapter {
  source: PresentationSourceType;
  label: string;
  /** true ONLY when the adapter genuinely renders real slides end to end. */
  implemented: boolean;
  /** Accepted for direct file upload. */
  acceptsUpload: boolean;
  unavailableReason?: string;
}

// One adapter per source, all feeding the same viewer/editor.
//
// PPTX and PDF are genuinely implemented: the file goes to cloud storage,
// the browser renders every slide/page with pptx-viewer or PDF.js, and the
// resulting JPEGs are stored and shown as real thumbnails.
//
// Canva and Google Slides are NOT implemented. Both need an authenticated
// API integration (OAuth + an export/render permission) that has not been
// configured for this project — there is no credential for either service.
// Scraping a pasted share URL is deliberately not done: it is unreliable,
// breaks on private links, and would amount to faking an import. These stay
// `implemented: false` until real credentials exist.
export const presentationAdapters: Record<PresentationSourceType, PresentationAdapter> = {
  pptx: {
    source: "pptx",
    label: "PPTX",
    implemented: true,
    acceptsUpload: true,
  },
  pdf: {
    source: "pdf",
    label: "PDF",
    implemented: true,
    acceptsUpload: true,
  },
  canva: {
    source: "canva",
    label: "Canva",
    implemented: false,
    acceptsUpload: false,
    unavailableReason:
      "Canva import needs a connected Canva account (OAuth plus export access). No Canva credentials are configured for this app yet, so links can't be imported.",
  },
  google_slides: {
    source: "google_slides",
    label: "Google Slides",
    implemented: false,
    acceptsUpload: false,
    unavailableReason:
      "Google Slides import needs a connected Google account (OAuth plus Slides/Drive export access). No Google credentials are configured for this app yet, so links can't be imported.",
  },
};
