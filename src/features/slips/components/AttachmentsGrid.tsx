import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
} from "lucide-react";
import { SlipAttachment } from "../types";
import { useDownloadAttachment, useGetAttachmentPreview } from "../hooks";
import { cn } from "@/lib/utils";

interface AttachmentsGridProps {
  slipId: string;
  files: SlipAttachment[];
}

type AttachmentKind = "image" | "pdf" | "document";

const getFileExtension = (value?: string) => {
  if (!value) return "file";

  const cleanValue = value.split("?")[0].split("#")[0];
  const dotIndex = cleanValue.lastIndexOf(".");

  if (dotIndex === -1 || dotIndex === cleanValue.length - 1) return "file";
  return cleanValue.slice(dotIndex + 1).toLowerCase();
};

const getFileName = (file: SlipAttachment) => {
  const source = file.fileName || file.fileUrl || "attachment";
  const parts = source.split(/[\\/]/);
  const rawName = parts[parts.length - 1] || "attachment";

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
};

const getFileKind = (file: SlipAttachment): AttachmentKind => {
  const mimeType = file.mimeType?.toLowerCase() || "";
  const extension = getFileExtension(file.fileName || file.fileUrl);

  if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
    return "image";
  }

  if (mimeType === "application/pdf" || extension === "pdf") {
    return "pdf";
  }

  return "document";
};

const formatFileSize = (size?: number) => {
  if (!size || size <= 0) return "File size unavailable";

  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const getAttachmentTypeLabel = (file: SlipAttachment) => {
  return file.attachmentType?.replace(/_/g, " ") || file.fileType || "Supporting file";
};

function AttachmentIcon({ kind }: { kind: AttachmentKind }) {
  return (
    <div
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border",
        kind === "image"
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : kind === "pdf"
            ? "border-primary/20 bg-primary/10 text-primary"
            : "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400",
      )}
    >
      {kind === "image" ? (
        <ImageIcon className="h-5 w-5" />
      ) : (
        <FileText className="h-5 w-5" />
      )}
    </div>
  );
}

function PreviewModal({
  file,
  slipId,
  isOpen,
  onOpenChange,
  onDownload,
  isDownloading,
}: {
  file: SlipAttachment;
  slipId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: () => void;
  isDownloading: boolean;
}) {
  const fileName = getFileName(file);
  const kind = getFileKind(file);
  const { previewUrl, isLoading, error } = useGetAttachmentPreview(
    isOpen ? slipId : undefined,
    isOpen ? file.id : undefined,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[calc(100vw-1.5rem)] max-w-5xl overflow-hidden rounded-3xl",
          "border-border bg-card p-0 shadow-2xl backdrop-blur-2xl",
        )}
        fallbackTitle="Attachment preview"
        fallbackDescription="Preview the selected admission slip attachment."
      >
        <DialogHeader className="border-b border-border/60 bg-muted/30 px-5 py-4 sm:px-6">
          <DialogTitle className="text-base font-bold tracking-tight text-foreground sm:text-lg">
            Attachment Preview
          </DialogTitle>
          <DialogDescription className="line-clamp-2 text-sm text-muted-foreground">
            {fileName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-4 sm:p-6">
          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div
            className={cn(
              "flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl",
              "border border-border bg-muted/20 shadow-inner",
              "sm:min-h-[420px]",
            )}
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                <LoaderCircle className="h-8 w-8 animate-spin" />
                Loading preview...
              </div>
            ) : previewUrl && kind === "image" ? (
              <img
                src={previewUrl}
                alt={fileName}
                className="max-h-[62vh] max-w-full object-contain"
              />
            ) : previewUrl && kind === "pdf" ? (
              <iframe
                src={previewUrl}
                className="h-[62vh] w-full border-0"
                title={fileName}
              />
            ) : (
              <div className="flex max-w-sm flex-col items-center gap-4 p-6 text-center">
                <AttachmentIcon kind={kind} />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Preview is not available for this file type.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Download the file to open it on your device.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              className="h-10 rounded-xl"
              onClick={onDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isDownloading ? "Downloading..." : "Download File"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AttachmentItem({
  file,
  onPreview,
  onDownload,
  isDownloading,
}: {
  file: SlipAttachment;
  onPreview: (file: SlipAttachment) => void;
  onDownload: (file: SlipAttachment) => void;
  isDownloading: boolean;
}) {
  const fileName = getFileName(file);
  const kind = getFileKind(file);
  const extension = getFileExtension(fileName).toUpperCase();

  return (
    <article
      className={cn(
        "group flex min-w-0 flex-col gap-4 rounded-2xl border border-border/70",
        "bg-card p-4 shadow-sm transition-all duration-200 hover:border-primary/30",
        "hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <AttachmentIcon kind={kind} />

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h4 className="max-w-full truncate text-sm font-semibold text-foreground" title={fileName}>
              {fileName}
            </h4>
            <span
              className={cn(
                "inline-flex h-6 shrink-0 items-center rounded-full border px-2",
                "text-[10px] font-bold uppercase tracking-[0.08em]",
                kind === "pdf"
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : "border-border bg-muted/40 text-muted-foreground",
              )}
            >
              {extension}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{formatFileSize(file.fileSize)}</span>
            <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/50 sm:inline-block" />
            <span className="capitalize">{getAttachmentTypeLabel(file).toLowerCase()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 rounded-xl px-3 text-xs font-semibold"
          onClick={() => onPreview(file)}
        >
          <Eye className="mr-2 h-3.5 w-3.5" />
          Preview
        </Button>

        <Button
          type="button"
          size="sm"
          className="h-10 rounded-xl px-3 text-xs font-semibold"
          onClick={() => onDownload(file)}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="mr-2 h-3.5 w-3.5" />
          )}
          {isDownloading ? "Saving..." : "Download"}
        </Button>
      </div>
    </article>
  );
}

export function AttachmentsGrid({ slipId, files }: AttachmentsGridProps) {
  const [selectedFile, setSelectedFile] = useState<SlipAttachment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const {
    downloadAttachment,
    downloadingAttachmentId,
    error,
    clearError,
  } = useDownloadAttachment();

  const normalizedFiles = useMemo(() => files || [], [files]);

  if (!normalizedFiles.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
        <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
        <p className="text-sm font-medium text-muted-foreground">
          No attachments uploaded
        </p>
      </div>
    );
  }

  const handlePreview = (file: SlipAttachment) => {
    clearError();
    setSelectedFile(file);
    setIsPreviewOpen(true);
  };

  const handleDownload = (file: SlipAttachment) => {
    downloadAttachment(slipId, file.id, getFileName(file));
  };

  return (
    <>
      <div className="space-y-3">
        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {normalizedFiles.map((file) => (
            <AttachmentItem
              key={file.id}
              file={file}
              onPreview={handlePreview}
              onDownload={handleDownload}
              isDownloading={downloadingAttachmentId === file.id}
            />
          ))}
        </div>
      </div>

      {selectedFile && (
        <PreviewModal
          file={selectedFile}
          slipId={slipId}
          isOpen={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          onDownload={() => handleDownload(selectedFile)}
          isDownloading={downloadingAttachmentId === selectedFile.id}
        />
      )}
    </>
  );
}
