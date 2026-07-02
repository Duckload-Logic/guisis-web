import { FileText, ImageIcon, RefreshCw, X } from "lucide-react";

import { useGetAttachmentPreview } from "@/features/slips/hooks";
import { cn } from "@/lib/utils";

interface ExistingFileCardProps {
  slipId: string;
  file: any;
  onRemove: () => void;
}

export function ExistingFileCard({
  slipId,
  file,
  onRemove,
}: ExistingFileCardProps) {
  const { previewUrl, isLoading } = useGetAttachmentPreview(slipId, file.id);
  const isImage = file.fileName?.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/);
  const isPdf = file.fileName?.toLowerCase().endsWith(".pdf");
  const fileName = file.fileName.split("/").pop();

  return (
    <>
      <div
        className={cn(
          "group hidden overflow-hidden rounded-xl border md:flex",
          "border-border/60 bg-card transition-all duration-300",
          "hover:border-primary/40 hover:shadow-lg md:flex-col",
          "hover:shadow-primary/5",
        )}
      >
        <div
          className={cn(
            "relative flex aspect-[4/3] w-full cursor-pointer",
            "items-center justify-center overflow-hidden bg-muted/30",
          )}
        >
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted" />
            </div>
          ) : isImage && previewUrl ? (
            <img
              src={previewUrl}
              alt={file.fileName}
              className={cn(
                "h-full w-full object-cover transition-transform",
                "duration-500 group-hover:scale-110",
              )}
            />
          ) : isPdf ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "rounded-lg bg-red-100 p-3 shadow-sm",
                  "dark:bg-red-900/30",
                )}
              >
                <FileText className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <span
                className={cn(
                  "rounded-full bg-red-100/50 px-2 py-0.5",
                  "text-[8px] font-bold text-red-700",
                  "dark:bg-red-900/40 dark:text-red-300",
                )}
              >
                PDF
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "rounded-lg bg-blue-100 p-3 shadow-sm",
                  "dark:bg-blue-900/30",
                )}
              >
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex items-center justify-between border-t",
            "border-border/40 p-2",
          )}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            {isImage ? (
              <ImageIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
            ) : (
              <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
            )}
            <p
              className={cn(
                "truncate text-[10px] font-medium",
                "text-foreground/80",
              )}
            >
              {fileName}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className={cn(
              "rounded-full p-1 text-muted-foreground",
              "transition-colors hover:bg-red-100",
              "hover:text-red-500 dark:hover:bg-red-950/30",
            )}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border",
          "border-border/60 bg-card p-2 md:hidden",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center",
              "overflow-hidden rounded-md bg-muted/40",
            )}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : isImage && previewUrl ? (
              <img
                src={previewUrl}
                alt={file.fileName}
                className="h-full w-full object-cover"
              />
            ) : isPdf ? (
              <FileText className="h-5 w-5 text-red-500" />
            ) : (
              <FileText className="h-5 w-5 text-blue-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "truncate text-xs font-medium",
                "text-foreground/80",
              )}
            >
              {fileName}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            "rounded-full p-1.5 text-muted-foreground",
            "transition-colors hover:bg-red-50",
            "hover:text-red-500 dark:hover:bg-red-950/30",
          )}
        >
          <X size={16} />
        </button>
      </div>
    </>
  );
}
