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
  const [isAndroid, setIsAndroid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsAndroid(/Android/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (!isAndroid) return;

    let isMounted = true;
    const canvases: HTMLCanvasElement[] = [];

    const loadAndRender = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load PDF.js script dynamically if not already loaded
        if (!(window as any).pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src =
              "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/" +
              "3.4.120/pdf.min.js";
            script.onload = () => resolve();
            script.onerror = () =>
              reject(
                new Error("Failed to load PDF viewer library."),
              );
            document.head.appendChild(script);
          });
        }

        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/" +
          "3.4.120/pdf.worker.min.js";

        const loadingTask = pdfjsLib.getDocument({
          url,
          withCredentials: true,
        });

        const pdf = await loadingTask.promise;

        if (!isMounted) return;

        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = ""; // Clear loader/previous canvases

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.className = cn(
            "w-full max-w-full h-auto mb-4",
            "border border-border/50 rounded-lg shadow-sm",
          );
          const context = canvas.getContext("2d");

          if (!context) continue;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          container.appendChild(canvas);
          canvases.push(canvas);

          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error("PDF preview error:", err);
        if (isMounted) {
          setError(err.message || "Failed to load PDF preview.");
          setIsLoading(false);
        }
      }
    };

    loadAndRender();

    return () => {
      isMounted = false;
    };
  }, [url, isAndroid]);

  if (!isAndroid) {
    return (
      <iframe
        src={`${url}#toolbar=0`}
        className={cn("w-full h-full border-none", className)}
        title={title || "PDF Preview"}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col w-full h-full",
        "overflow-auto bg-muted/10 p-4",
        className,
      )}
    >
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center",
            "justify-center bg-background/50 z-10 gap-2",
          )}
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">
            Loading preview...
          </p>
        </div>
      )}

      {error ? (
        <div
          className={cn(
            "flex flex-col items-center justify-center",
            "flex-1 p-6 text-center gap-4",
          )}
        >
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Preview Unavailable
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {error}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-xl">
            <a href={url} download target="_blank" rel="noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </a>
          </Button>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex flex-col items-center w-full"
        />
      )}
    </div>
  );
}
