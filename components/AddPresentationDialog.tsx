import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, AlertCircle, Link2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./Dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";
import { FileDropzone } from "./FileDropzone";
import { Input } from "./Input";
import { Progress } from "./Progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { Button } from "./Button";
import { useUploadPresentation } from "../helpers/usePresentationQueries";
import { presentationAdapters } from "../helpers/presentationAdapters";
import type { UploadProgress } from "../helpers/uploadPresentation";
import { getCanvaStatus } from "../endpoints/canva/status_GET.schema";
import { postCanvaImport } from "../endpoints/canva/import_POST.schema";
import { postCanvaCleanup } from "../endpoints/canva/cleanup_POST.schema";
import { postCanvaDisconnect } from "../endpoints/canva/disconnect_POST.schema";
import styles from "./AddPresentationDialog.module.css";

interface AddPresentationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which tab to show when the dialog opens (e.g. "link" after connecting Canva). */
  defaultTab?: "upload" | "link";
}

const STAGE_LABEL: Record<UploadProgress["stage"], string> = {
  checking: "Checking your storage…",
  uploading: "Uploading file…",
  rendering: "Rendering slides…",
  "storing-thumbnails": "Saving thumbnails…",
  finishing: "Finishing up…",
  done: "Done",
};

export const AddPresentationDialog = ({ open, onOpenChange, defaultTab = "upload" }: AddPresentationDialogProps) => {
  const [linkSource, setLinkSource] = useState<"canva" | "google_slides">("canva");
  const [linkUrl, setLinkUrl] = useState("");
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const upload = useUploadPresentation(setProgress);
  const queryClient = useQueryClient();
  const [canvaBusy, setCanvaBusy] = useState(false);

  const canvaStatus = useQuery({
    queryKey: ["canva-status"],
    queryFn: () => getCanvaStatus(),
    enabled: open && linkSource === "canva",
    staleTime: 30_000,
  });

  const handleFiles = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    const sourceType = lower.endsWith(".pdf") ? "pdf" : lower.endsWith(".pptx") ? "pptx" : null;
    if (!sourceType) {
      toast.error("Unsupported file. Please choose a .pptx or .pdf file.");
      return;
    }

    upload.mutate(
      { file, sourceType },
      {
        onSuccess: (result) => {
          toast.success(`Added "${file.name}" — ${result.slideCount} slides processed.`);
          setProgress(null);
          onOpenChange(false);
        },
        onError: (error) => {
          setProgress(null);
          toast.error(error instanceof Error ? error.message : "The upload failed.");
        },
      },
    );
  };

  const adapter = presentationAdapters[linkSource];
  const isUploading = upload.isPending || canvaBusy;

  const handleCanvaImport = async () => {
    setCanvaBusy(true);
    let tempPath: string | null = null;
    try {
      const staged = await postCanvaImport({ url: linkUrl });
      tempPath = staged.tempPath;
      const response = await fetch(staged.downloadUrl);
      if (!response.ok) throw new Error("Could not download the exported PDF.");
      const blob = await response.blob();
      const safeTitle = staged.title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "Canva design";
      const file = new File([blob], `${safeTitle}.pdf`, { type: "application/pdf" });
      setLinkUrl("");
      handleFiles([file]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Canva import failed.");
    } finally {
      setCanvaBusy(false);
      if (tempPath) postCanvaCleanup({ tempPath }).catch(() => {});
    }
  };

  const handleCanvaDisconnect = async () => {
    try {
      await postCanvaDisconnect({});
      await queryClient.invalidateQueries({ queryKey: ["canva-status"] });
      toast.success("Canva disconnected.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not disconnect Canva.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Don't let the dialog close mid-upload and orphan the flow.
        if (isUploading) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className={styles.content}>
        <DialogHeader>
          <DialogTitle>Add Presentation</DialogTitle>
          <DialogDescription>Upload a file, or import from a link.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className={styles.tabs}>
          <TabsList>
            <TabsTrigger value="upload" disabled={isUploading}>Upload File</TabsTrigger>
            <TabsTrigger value="link" disabled={isUploading}>Import from Link</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className={styles.tabPanel}>
            {isUploading && progress ? (
              <div className={styles.progressBox}>
                <p className={styles.progressLabel}>{STAGE_LABEL[progress.stage]}</p>
                {progress.total ? (
                  <>
                    <Progress
                      value={Math.round(((progress.done ?? 0) / progress.total) * 100)}
                      className={styles.progressBar}
                    />
                    <p className={styles.progressCount}>
                      {progress.done ?? 0} of {progress.total} slides
                    </p>
                  </>
                ) : (
                  <Progress value={null} className={styles.progressBar} />
                )}
              </div>
            ) : (
              <FileDropzone
                accept=".pptx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                maxFiles={1}
                onFilesSelected={handleFiles}
                icon={<Upload size={32} />}
                title="Click to upload or drag and drop"
                subtitle="PPTX or PDF"
              />
            )}
          </TabsContent>

          <TabsContent value="link" className={styles.tabPanel}>
            <div className={styles.linkForm}>
              <label className={styles.fieldLabel}>Source</label>
              <Select
                value={linkSource}
                onValueChange={(v) => setLinkSource(v as "canva" | "google_slides")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="canva">Canva presentation</SelectItem>
                  <SelectItem value="google_slides">Google Slides presentation</SelectItem>
                </SelectContent>
              </Select>

              <label className={styles.fieldLabel}>Presentation URL</label>
              <Input
                placeholder={
                  linkSource === "canva"
                    ? "https://www.canva.com/design/..."
                    : "https://docs.google.com/presentation/d/..."
                }
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />

              {linkSource === "canva" && canvaStatus.data?.configured ? (
                canvaStatus.data.connected ? (
                  <>
                    <Button
                      className={styles.linkSubmit}
                      disabled={!linkUrl.trim() || canvaBusy}
                      onClick={handleCanvaImport}
                    >
                      {canvaBusy ? (
                        <>
                          <Loader2 size={16} className={styles.spin} /> Exporting from Canva…
                        </>
                      ) : (
                        "Import from Canva"
                      )}
                    </Button>
                    <button type="button" className={styles.textLink} onClick={handleCanvaDisconnect} disabled={canvaBusy}>
                      Disconnect Canva
                    </button>
                  </>
                ) : (
                  <>
                    <div className={styles.notice}>
                      <Link2 className={styles.noticeIcon} />
                      <p>Connect your Canva account once so ClassPresenter can export your designs as PDF.</p>
                    </div>
                    <Button
                      className={styles.linkSubmit}
                      onClick={() => {
                        window.location.href = "/_api/canva/connect";
                      }}
                    >
                      Connect Canva
                    </Button>
                  </>
                )
              ) : (
                <>
                  <div className={styles.notice}>
                    <AlertCircle className={styles.noticeIcon} />
                    <p>
                      {linkSource === "canva" && canvaStatus.isLoading
                        ? "Checking Canva…"
                        : linkSource === "canva" && canvaStatus.isError
                          ? "Could not check the Canva connection. Make sure you are signed in and try again."
                          : adapter.unavailableReason}
                    </p>
                  </div>
                  <p className={styles.helpText}>
                    Meanwhile you can download the {linkSource === "canva" ? "design from Canva" : "deck from Google Slides"} as a PDF
                    ({linkSource === "canva" ? "Share, Download, PDF" : "File, Download, PDF"}) and add it from the Upload File tab.
                  </p>
                  <Button variant="secondary" disabled className={styles.linkSubmit}>
                    Import unavailable
                  </Button>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
