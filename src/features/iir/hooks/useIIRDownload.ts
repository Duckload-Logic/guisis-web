import { useState } from "react";
import { DownloadIIRPDF } from "../services/service";
import { useToast } from "@/context/hooks";

/**
 * Hook to handle downloading the student's IIR as a PDF.
 */
export function useIIRDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const { triggerToast } = useToast();

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>("");

  const generatePreview = async (iirID: string) => {
    if (!iirID) {
      triggerToast("Invalid IIR ID");
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    const progressInterval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.floor(Math.random() * 10) + 5;
      });
    }, 300);

    try {
      const { blob, fileName } = await DownloadIIRPDF(iirID, {
        handlerName: "useIIRDownload",
        stepName: "Generate PDF Preview",
      });

      setDownloadProgress(100);

      setTimeout(() => {
        const pdfBlob = new Blob([blob], { type: "application/pdf" });
        const url = window.URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        setCurrentFileName(fileName);
        setIsDownloading(false);
      }, 400); // Small delay to let user see 100%
    } catch (error) {
      console.error("Failed to generate IIR PDF preview:", error);
      triggerToast("Failed to generate IIR PDF preview. Please try again.");
      setIsDownloading(false);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const downloadFromPreview = () => {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.setAttribute("download", currentFileName || "iir_record.pdf");
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    triggerToast("IIR PDF downloaded successfully");
  };

  const clearPreview = () => {
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
      setCurrentFileName("");
    }
  };

  return {
    generatePreview,
    downloadFromPreview,
    clearPreview,
    pdfUrl,
    isDownloading,
    downloadProgress,
  };
}
