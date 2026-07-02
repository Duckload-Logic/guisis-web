import { useEffect, useState } from "react";
import { Eye, FileText, ImageIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface LocalFileCardProps {
  file: File;
  onRemove: () => void;
  onPreview: (file: File, url: string) => void;
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";

  const base = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const index = Math.floor(Math.log(bytes) / Math.log(base));

  return `${parseFloat((bytes / Math.pow(base, index)).toFixed(1))} ${sizes[index]}`;
}

export function LocalFileCard({
  file,
  onRemove,
  onPreview,
}: LocalFileCardProps) {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <>
      <div
        className={cn(
          "group hidden overflow-hidden rounded-xl border",
          "border-border/60 bg-card transition-all duration-300",
          "hover:border-primary/40 hover:shadow-lg",
          "hover:shadow-primary/5 md:flex md:flex-col",
        )}
      >
        <div
          onClick={() => onPreview(file, previewUrl)}
          className={cn(
            "relative flex aspect-[4/3] cursor-pointer",
            "items-center justify-center overflow-hidden bg-muted/30",
          )}
        >
          {isImage && previewUrl ? (
            <img
              src={previewUrl}
              alt={file.name}
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

          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              "bg-primary/10 opacity-0 backdrop-blur-[2px]",
              "transition-opacity duration-300 group-hover:opacity-100",
            )}
          >
            <div
              className={cn(
                "rounded-full bg-white/90 p-2 shadow-lg",
                "dark:bg-black/90",
              )}
            >
              <Eye className="h-4 w-4 text-primary" />
            </div>
          </div>
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
              {file.name}
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
        <div
          onClick={() => onPreview(file, previewUrl)}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5"
        >
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center",
              "overflow-hidden rounded-md bg-muted/40",
            )}
          >
            {isImage && previewUrl ? (
              <img
                src={previewUrl}
                alt={file.name}
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
              {file.name}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatFileSize(file.size)}
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
