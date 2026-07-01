import { useContext, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { UIContext, PageMetadata } from "./UIContext";
import { ToastContext } from "./ToastContext";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

/**
 * Hook for child pages to set layout metadata when using Shared Layout
 */
export function usePageMetadata(metadata: Partial<PageMetadata>) {
  const { setPageMetadata } = useUI();

  useEffect(() => {
    setPageMetadata((prev) => {
      const hasChanged = Object.entries(metadata).some(([key, value]) => {
        return prev[key as keyof PageMetadata] !== value;
      });

      if (!hasChanged) return prev;
      return { ...prev, ...metadata };
    });
  }, [
    metadata.title,
    metadata.description,
    metadata.badgeText,
    metadata.badgeIcon,
    metadata.headerActions,
    metadata.headerStats,
    metadata.showDate,
    metadata.isLoading,
    metadata.showSubHeader,
    setPageMetadata,
  ]);

  // Handle cleanup separately to avoid resetting on every property change
  useEffect(() => {
    return () => {
      setPageMetadata({
        title: "",
        description: undefined,
        badgeText: undefined,
        badgeIcon: undefined,
        headerActions: undefined,
        headerStats: undefined,
        showDate: false,
        isLoading: false,
        showSubHeader: true,
      });
    };
  }, [setPageMetadata]);
}
