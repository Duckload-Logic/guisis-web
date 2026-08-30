import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/config/apiRoutes";
import {
  IIRAnalyticsReportResponse,
  AnalyticsProgram,
} from "../types/analytics.types";

export function useAnalyticsDashboard() {
  const [data, setData] = useState<IIRAnalyticsReportResponse | null>(null);
  const [programs, setPrograms] = useState<AnalyticsProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PDF Export states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>("");

  const fetchDashboard = useCallback(
    async (year?: number, programId?: number, statusId?: number) => {
      try {
        setLoading(true);
        const params: any = {};
        if (year) params.year = year;
        if (programId) params.program_id = programId;
        if (statusId) params.status_id = statusId;

        const response = await apiClient.get(API_ROUTES.analytics.iirReport, {
          params,
        });

        if (response.data) {
          setData(response.data);
        } else {
          setError("Failed to fetch dashboard data");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchPrograms = useCallback(async () => {
    try {
      const response = await apiClient.get("/students/lookups/programs");
      if (response.data.success) {
        setPrograms(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch programs", err);
    }
  }, []);

  const generatePreview = useCallback(
    async (year?: number, programId?: number) => {
      let progressInterval: NodeJS.Timeout | undefined;
      try {
        setIsDownloading(true);
        setDownloadProgress(0);

        progressInterval = setInterval(() => {
          setDownloadProgress((prev) => {
            if (prev >= 90) return prev;
            return prev + Math.floor(Math.random() * 10) + 5;
          });
        }, 300);

        const params: any = {};
        if (year) params.year = year;
        if (programId) params.program_id = programId;

        const response = await apiClient.get(
          API_ROUTES.analytics.iirReportExport,
          {
            params,
            responseType: "blob",
          },
        );

        setDownloadProgress(100);

        setTimeout(() => {
          const url = window.URL.createObjectURL(
            new Blob([response.data], { type: "application/pdf" }),
          );
          setPdfUrl(url);
          setCurrentFileName(
            `Freshmen-Profile_${year || new Date().getFullYear()}.pdf`,
          );
          setIsDownloading(false);
        }, 400);
      } catch (err) {
        console.error("Failed to generate PDF preview", err);
        alert("Failed to generate PDF report preview. Please try again.");
        setIsDownloading(false);
      } finally {
        if (progressInterval) clearInterval(progressInterval);
      }
    },
    [],
  );

  const downloadFromPreview = useCallback(() => {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.setAttribute(
      "download",
      currentFileName || "Student-Profiles-Report.pdf",
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [pdfUrl, currentFileName]);

  const clearPreview = useCallback(() => {
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
      setCurrentFileName("");
    }
  }, [pdfUrl]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  return {
    data,
    programs,
    loading,
    error,
    refresh: fetchDashboard,
    generatePreview,
    downloadFromPreview,
    clearPreview,
    pdfUrl,
    isDownloading,
    downloadProgress,
  };
}
