import { useEffect, useRef, useState } from "react";
import { Loader2, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PDFPreviewProps {
  url: string;
  title?: string;
  className?: string;
}

export default function PDFPreview({ url, title, className }: PDFPreviewProps) {
  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

  if (isAndroid) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center",
          "bg-muted/10 p-6 text-center border-t border-border/50",
          className
        )}
      >
        <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground opacity-50" />
        <div className="mb-6 space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Document Ready
          </p>
          <p className="mx-auto max-w-xs text-xs text-muted-foreground">
            Android handles PDFs better in a new tab or via download. Tap below to view the document.
          </p>
        </div>
        <Button
          variant="default"
          asChild
          className="rounded-xl shadow-sm hover:shadow-md transition-all"
        >
          <a href={url} target="_blank" rel="noreferrer">
            <Download className="mr-2 h-4 w-4" />
            Open Document
          </a>
        </Button>
      </div>
    );
  }

  return (
    <iframe
      src={`${url}#toolbar=0`}
      className={cn("h-full w-full border-none", className)}
      title={title || "PDF Preview"}
    />
  );
}
