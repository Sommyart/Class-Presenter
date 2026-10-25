import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPresentations } from "../endpoints/presentations/list_GET.schema";
import { getPresentationDetail } from "../endpoints/presentations/detail_GET.schema";
import { postUpdateTimers } from "../endpoints/presentations/update_timers_POST.schema";
import { postMarkPresented } from "../endpoints/presentations/mark_presented_POST.schema";
import {
  postSlideAudioPresign,
  MAX_AUDIO_BYTES,
} from "../endpoints/presentations/audio_presign_POST.schema";
import { postSetSlideAudio } from "../endpoints/presentations/set_slide_audio_POST.schema";
import { postSetPresentationAudio } from "../endpoints/presentations/set_presentation_audio_POST.schema";
import { getStorageUsage } from "../endpoints/storage/usage_GET.schema";
import { postDeletePresentation } from "../endpoints/presentations/delete_POST.schema";
import { uploadPresentation, type UploadProgress } from "./uploadPresentation";

export const PRESENTATIONS_QUERY_KEY = ["presentations"] as const;
export const STORAGE_QUERY_KEY = ["storage", "usage"] as const;
export const presentationDetailKey = (id: string) => ["presentations", "detail", id] as const;

/**
 * The single source of truth for one presentation. Both the editor and the
 * present screen read through this key, so timer edits saved in the editor
 * are what Present loads — no separate copies of the state.
 */
export function usePresentationDetail(presentationId: string | undefined) {
  return useQuery({
    queryKey: presentationDetailKey(presentationId ?? ""),
    queryFn: () => getPresentationDetail({ presentationId: presentationId! }),
    enabled: !!presentationId,
  });
}

export function useUpdateTimers(presentationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof postUpdateTimers>[0]) => postUpdateTimers(body),
    onSuccess: () => {
      if (presentationId) {
        queryClient.invalidateQueries({ queryKey: presentationDetailKey(presentationId) });
      }
      queryClient.invalidateQueries({ queryKey: PRESENTATIONS_QUERY_KEY });
    },
  });
}

export function useMarkPresented() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof postMarkPresented>[0]) => postMarkPresented(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRESENTATIONS_QUERY_KEY });
    },
  });
}

/**
 * Uploads an audio file straight to cloud storage via a presigned URL and
 * returns its stored path. Shared by the per-slide and whole-presentation
 * music flows.
 */
async function uploadAudioFile(
  presentationId: string,
  slideIndex: number | null,
  file: File,
): Promise<{ audioPath: string }> {
  if (file.size > MAX_AUDIO_BYTES) {
    throw new Error(
      `That file is ${(file.size / (1024 * 1024)).toFixed(1)}MB. The limit for background music is 20MB.`,
    );
  }
  const contentType = file.type || "audio/mpeg";
  const presign = await postSlideAudioPresign({
    presentationId,
    slideIndex,
    fileName: file.name,
    contentType,
    sizeBytes: file.size,
  });
  const put = await fetch(presign.presignedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  });
  if (!put.ok) throw new Error(`Upload failed (${put.status}).`);
  return { audioPath: presign.audioPath };
}

/**
 * Attaches (or clears) one track played across the whole presentation.
 */
export function useSetPresentationAudio(presentationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File | null) => {
      if (!presentationId) throw new Error("No presentation.");
      if (!file) {
        return postSetPresentationAudio({
          presentationId,
          audioPath: null,
          audioName: null,
          audioSizeBytes: 0,
        });
      }
      const { audioPath } = await uploadAudioFile(presentationId, null, file);
      return postSetPresentationAudio({
        presentationId,
        audioPath,
        audioName: file.name,
        audioSizeBytes: file.size,
      });
    },
    onSuccess: () => {
      if (presentationId) {
        queryClient.invalidateQueries({ queryKey: presentationDetailKey(presentationId) });
      }
      queryClient.invalidateQueries({ queryKey: STORAGE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PRESENTATIONS_QUERY_KEY });
    },
  });
}

/**
 * Attaches (or clears) a slide's background music. Uploads the file
 * straight to cloud storage via a presigned URL, then commits the path.
 */
export function useSetSlideAudio(presentationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { slideIndex: number; file: File | null }) => {
      if (!presentationId) throw new Error("No presentation.");

      if (!input.file) {
        return postSetSlideAudio({
          presentationId,
          slideIndex: input.slideIndex,
          audioPath: null,
          audioName: null,
          audioSizeBytes: 0,
        });
      }

      const file = input.file;
      const { audioPath } = await uploadAudioFile(presentationId, input.slideIndex, file);

      return postSetSlideAudio({
        presentationId,
        slideIndex: input.slideIndex,
        audioPath,
        audioName: file.name,
        audioSizeBytes: file.size,
      });
    },
    onSuccess: () => {
      if (presentationId) {
        queryClient.invalidateQueries({ queryKey: presentationDetailKey(presentationId) });
      }
      queryClient.invalidateQueries({ queryKey: STORAGE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PRESENTATIONS_QUERY_KEY });
    },
  });
}

export function usePresentations() {
  return useQuery({
    queryKey: PRESENTATIONS_QUERY_KEY,
    queryFn: () => getPresentations(),
  });
}

export function useStorageUsage() {
  return useQuery({
    queryKey: STORAGE_QUERY_KEY,
    queryFn: () => getStorageUsage(),
  });
}

/**
 * Both keys are invalidated after any mutation so the storage indicator
 * updates on its own — no page refresh needed.
 */
function useInvalidateStorageAndList() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: PRESENTATIONS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: STORAGE_QUERY_KEY });
  };
}

export function useUploadPresentation(
  onProgress?: (progress: UploadProgress) => void,
) {
  const invalidate = useInvalidateStorageAndList();
  return useMutation({
    mutationFn: ({ file, sourceType }: { file: File; sourceType: "pdf" | "pptx" }) =>
      uploadPresentation(file, sourceType, onProgress),
    onSettled: invalidate,
  });
}

export function useDeletePresentation() {
  const invalidate = useInvalidateStorageAndList();
  return useMutation({
    mutationFn: (presentationId: string) => postDeletePresentation({ presentationId }),
    onSettled: invalidate,
  });
}
