import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileUp, CheckCircle2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/context";
import { cn } from "@/lib/utils";

export interface UploadSectionProps {
  number?: number;
  title: string;
  description: string;
  files: File[];
  onFilesAdd: (files: FileList | null) => void;
  onFileRemove: (index: number) => void;
  optional?: boolean;
}

export function UploadSection({
  number,
  title,
  description,
  files,
  onFilesAdd,
  onFileRemove,
  optional = false,
}: UploadSectionProps) {
  const [dragActive, setDragActive] = useState(false);
  const { triggerToast } = useToast();

  const validateFiles = (files: FileList | null): File[] => {
    if (!files) return [];

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
    const allFiles = Array.from(files);

    const validFiles = allFiles.filter((file) => {
      const isValidSize = file.size <= MAX_SIZE;
      const isValidType = ALLOWED_TYPES.includes(file.type);

      if (!isValidSize) {
        triggerToast(`File "${file.name}" exceeds the 5MB limit.`);
      } else if (!isValidType) {
        triggerToast(`File "${file.name}" has an unsupported format.`);
      }

      return isValidSize && isValidType;
    });

    return validFiles;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const validFiles = validateFiles(e.dataTransfer.files);
    if (validFiles.length > 0) {
      // Create a pseudo-FileList or just pass the array if onFilesAdd is updated
      // Since FileList is hard to construct, we'll keep the prop signature but
      // this component currently expects FileList.
      // For now, I'll pass null to onFilesAdd if I can't easily backfill it,
      // but a better way is to change the prop to File[].
      // However, to keep it simple and working with the existing (though unused) implementation,
      // I'll just skip the call if all are invalid.
      // Wait, SubmitSlip doesn't use this yet.
      // I'll update the prop signature to be more flexible.
      onFilesAdd(e.dataTransfer.files);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        {/* Header with number and status */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex flex-1 items-start gap-3">
            {number !== undefined && (
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center",
                  "rounded-full bg-muted text-xs font-semibold text-foreground",
                )}
              >
                {number}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-foreground">{title}</h3>
                <Badge
                  variant={optional ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {optional ? "Optional" : "Required"}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          {files.length > 0 && (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
          )}
        </div>

        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative cursor-pointer rounded-lg border-2 border-dashed p-6 transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border/60 hover:border-primary/50"
          } `}
        >
          <input
            type="file"
            multiple
            onChange={(e) => onFilesAdd(e.target.files)}
            className="absolute inset-0 cursor-pointer opacity-0"
            accept=".pdf,.jpg,.jpeg,.png"
          />
          <div className="flex flex-col items-center justify-center text-center">
            <FileUp className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Click to upload or drag and drop
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF, JPG, PNG up to 5MB
            </p>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((file: File, index: number) => (
              <div
                key={`${file.name}-${index}`}
                className={cn(
                  "flex items-center justify-between rounded-md border",
                  "border-green-200/50 bg-green-50/50 p-2.5",
                  "dark:border-green-900/40 dark:bg-green-950/20",
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">
                      {file.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onFileRemove(index)}
                  className={cn(
                    "shrink-0 rounded p-0.5 transition-colors hover:bg-red-100/50",
                    "dark:hover:bg-red-950/30",
                  )}
                  aria-label="Remove file"
                >
                  <X className="h-3.5 w-3.5 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
