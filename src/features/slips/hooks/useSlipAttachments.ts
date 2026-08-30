import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { slipService, GetSlipAttachmentDownload } from "../services";
import { QUERY_KEYS } from "@/config/queryKeys";
import { CACHE_TIMING } from "@/config/constants";

/**
 * Hook to fetch metadata for all attachments of a specific slip.
 */
export function useGetSlipAttachments(slipId?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.slips.attachments(slipId || "")],
    queryFn: () => (slipId ? slipService.GetSlipAttachments(slipId) : []),
    enabled: !!slipId,
    staleTime: CACHE_TIMING.MEDIUM.staleTime,
    gcTime: CACHE_TIMING.MEDIUM.gcTime,
    refetchOnWindowFocus: false,
  });
}

const readBlobError = async (blob: Blob) => {
  try {
    const text = await blob.text();
    if (!text) return null;

    try {
      const parsed = JSON.parse(text);
      return parsed?.error || parsed?.message || text;
    } catch {
      return text;
    }
  } catch {
    return null;
  }
};

/**
 * Hook to handle downloading admission slip attachments.
 */
export function useDownloadAttachment() {
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<
    string | null
  >(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const downloadAttachment = async (
    slipId: string,
    attachmentId: string,
    fileName?: string,
  ) => {
    setDownloadingAttachmentId(attachmentId);
    setError(null);
    setDownloadProgress(0);

    let progressInterval: NodeJS.Timeout | undefined;

    try {
      progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.floor(Math.random() * 10) + 5;
        });
      }, 300);

      const blob = await GetSlipAttachmentDownload(slipId, attachmentId, {
        handlerName: "useDownloadAttachment",
        stepName: "Download Attachment",
      });

      if (!blob) {
        throw new Error("Download failed. No file was returned by the server.");
      }

      if (blob.type.includes("application/json")) {
        const message = await readBlobError(blob);
        throw new Error(message || "Download failed.");
      }

      if (blob.size === 0) {
        const message = await readBlobError(blob);
        throw new Error(message || "Download failed. Empty file received.");
      }

      setDownloadProgress(100);

      setTimeout(() => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName || `attachment-${attachmentId}`;
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        setDownloadingAttachmentId(null);
      }, 400);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to download this attachment. Please try again.",
      );
      setDownloadingAttachmentId(null);
    } finally {
      if (progressInterval) clearInterval(progressInterval);
    }
  };

  return {
    downloadAttachment,
    downloadingAttachmentId,
    isDownloading: downloadingAttachmentId !== null,
    downloadProgress,
    error,
    clearError,
  };
}

/**
 * Hook to fetch an authorized object URL for previewing an attachment.
 * It only runs when both IDs are provided, so file cards do not auto-download.
 */
export function useGetAttachmentPreview(
  slipId?: string,
  attachmentId?: string,
) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let nextPreviewUrl: string | null = null;
    let isMounted = true;

    if (!slipId || !attachmentId) {
      setPreviewUrl(null);
      setError(null);
      setIsLoading(false);
      return undefined;
    }

    const fetchPreview = async () => {
      setIsLoading(true);
      setError(null);
      setPreviewUrl(null);

      try {
        const blob = await GetSlipAttachmentDownload(slipId, attachmentId, {
          handlerName: "useGetAttachmentPreview",
          stepName: "Preview Attachment",
        });

        if (!blob) {
          throw new Error("Preview failed. No file was returned by the server.");
        }

        if (blob.type.includes("application/json")) {
          const message = await readBlobError(blob);
          throw new Error(message || "Preview failed.");
        }

        if (blob.size === 0) {
          const message = await readBlobError(blob);
          throw new Error(message || "Preview failed. Empty file received.");
        }

        nextPreviewUrl = window.URL.createObjectURL(blob);
        if (isMounted) setPreviewUrl(nextPreviewUrl);
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load attachment preview.",
          );
          setPreviewUrl(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
      if (nextPreviewUrl) window.URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [slipId, attachmentId]);

  return { previewUrl, isLoading, error };
}
