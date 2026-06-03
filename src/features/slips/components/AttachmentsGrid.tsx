import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
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

// Sub-component for preview modal with authorized image loading
function PreviewModal({
  file,
  slipId,
  isOpen,
  onOpenChange,
  onDownload,
  isDownloading,
  error,
  isImageFile,
  isPdfFile,
}: {
  file: SlipAttachment;
  slipId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: () => void;
  isDownloading: boolean;
  error: string | null;
  isImageFile: (url: string) => boolean;
  isPdfFile: (url: string) => boolean;
}) {
  const { previewUrl, isLoading } = useGetAttachmentPreview(slipId, file.id);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className={cn(
          "w-[95vw] max-w-4xl border-border/40 bg-background/95",
          "shadow-2xl backdrop-blur-xl sm:w-full"
        )}
      >
        <DialogHeader>
          <DialogTitle>File Preview</DialogTitle>
          <DialogDescription>
            File preview - Use download button to save the file
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div
            className={cn(
              "rounded-md border border-destructive bg-destructive/10 p-3",
              "text-sm text-destructive",
            )}
          >
            {error}
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
          {isLoading ? (
            <div className="flex h-96 w-full items-center justify-center rounded-lg bg-muted">
              <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isImageFile(file.fileName) && previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className={cn(
                "max-h-[50vh] max-w-full rounded-lg object-contain",
                "sm:max-h-[60vh]"
              )}
            />
          ) : isPdfFile(file.fileName) && previewUrl ? (
            <iframe
              src={previewUrl}
              className={cn(
                "h-[45vh] w-full rounded-lg border border-border/40",
                "sm:h-[60vh]"
              )}
              title="PDF Preview"
            />
          ) : (
            <div className="flex h-96 w-full items-center justify-center rounded-lg bg-muted">
              <div className="text-center">
                <FileText className="mx-auto mb-2 h-12 w-12 text-blue-500" />
                <p className="text-muted-foreground">
                  Preview not available for this file type
                </p>
                <Button
                  onClick={onDownload}
                  className="w-full gap-2"
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <span className="animate-spin">
                      <LoaderCircle className="h-4 w-4" />
                    </span>
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isDownloading ? "Downloading..." : "Download File"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Sub-component for individual attachment with preview URL
function AttachmentItem({
  slipId,
  file,
  index,
  onPreview,
  isImageFile,
  getFileExtension,
  getFileName,
}: {
  slipId: string;
  file: SlipAttachment;
  index: number;
  onPreview: (file: SlipAttachment) => void;
  isImageFile: (url: string) => boolean;
  getFileExtension: (url: string) => string;
  getFileName: (url: string) => string;
}) {
  const { previewUrl, isLoading } = useGetAttachmentPreview(slipId, file.id);

  return (
    <div
      key={index}
      onClick={() => onPreview(file)}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden",
        "rounded-xl border border-border/60 bg-card transition-all",
        "duration-300 hover:border-primary/40 hover:shadow-lg",
        "hover:shadow-primary/5",
      )}
    >
      {/* Thumbnail Area */}
      <div
        className={cn(
          "relative aspect-[4/3] overflow-hidden bg-muted/30",
          "flex items-center justify-center",
        )}
      >
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isImageFile(file.fileName) && previewUrl ? (
          <img
            src={previewUrl}
            alt={file.fileName}
            className={cn(
              "h-full w-full object-cover transition-transform",
              "duration-500 group-hover:scale-110",
            )}
          />
        ) : file.fileName.toLowerCase().endsWith(".pdf") ? (
          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                "rounded-lg bg-red-100 p-4 shadow-sm",
                "dark:bg-red-900/30",
              )}
            >
              <FileText className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <span
              className={cn(
                "rounded-full bg-red-100/50 px-2.5 py-0.5",
                "text-[10px] font-bold text-red-700 dark:bg-red-900/40",
                "dark:text-red-300",
              )}
            >
              PDF DOCUMENT
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-4 shadow-sm dark:bg-blue-900/30">
              <FileText className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="rounded-full bg-blue-100/50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {getFileExtension(file.fileName).toUpperCase()} FILE
            </span>
          </div>
        )}

        {/* Hover Overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "bg-primary/10 opacity-0 transition-opacity duration-300",
            "group-hover:opacity-100 backdrop-blur-[2px]",
          )}
        >
          <div className="rounded-full bg-white/90 p-3 shadow-lg dark:bg-black/90">
            <Eye className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>

      {/* Info Area */}
      <div className="border-t border-border/40 p-3">
        <div className="flex items-center gap-2">
          {isImageFile(file.fileName) ? (
            <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <p className="truncate text-xs font-medium text-foreground/80">
            {getFileName(file.fileName)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AttachmentsGrid({ slipId, files }: AttachmentsGridProps) {
  const [selectedFile, setSelectedFile] = useState<SlipAttachment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { downloadAttachment, isDownloading, error } = useDownloadAttachment();

  if (!files || files.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No attachments uploaded</p>
    );
  }

  const getFileExtension = (url: string) => {
    const parts = url.split(".");
    return parts[parts.length - 1].toLowerCase();
  };

  const isImageFile = (url: string) => {
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
    return imageExtensions.includes(getFileExtension(url));
  };

  const isPdfFile = (url: string) => {
    return getFileExtension(url) === "pdf";
  };

  const getFileName = (url: string) => {
    const parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1]);
  };

  const handlePreview = (file: SlipAttachment) => {
    setSelectedFile(file);
    setIsPreviewOpen(true);
  };

  const handleDownload = (file: SlipAttachment) => {
    const fileName = getFileName(file.fileName);
    downloadAttachment(slipId, file.id, fileName);
  };

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-2 gap-2.5",
          "sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {files.map((file, index) => (
          <AttachmentItem
            key={index}
            slipId={slipId}
            file={file}
            index={index}
            onPreview={handlePreview}
            isImageFile={isImageFile}
            getFileExtension={getFileExtension}
            getFileName={getFileName}
          />
        ))}
      </div>

      {/* Preview Modal */}
      {selectedFile && (
        <PreviewModal
          file={selectedFile}
          slipId={slipId}
          isOpen={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          onDownload={() => handleDownload(selectedFile)}
          isDownloading={isDownloading}
          error={error}
          isImageFile={isImageFile}
          isPdfFile={isPdfFile}
        />
      )}
    </>
  );
}
