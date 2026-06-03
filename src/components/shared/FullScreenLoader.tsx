import React from "react";
import { Spinner } from "./Spinner";
import { cn } from "@/lib/utils";

interface FullScreenLoaderProps {
  isLoading: boolean;
  message?: string;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  isLoading,
  message = "Generating Document...",
}) => {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center",
        "bg-background/80 backdrop-blur-sm transition-all duration-300",
      )}
    >
      <Spinner size="lg" message={message} />
    </div>
  );
};
