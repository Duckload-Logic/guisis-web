/**
 * Spinner Component
 * Reusable loading indicator
 */

import { Label } from "@radix-ui/react-label";
import React, { useEffect } from "react";

interface SpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export const Spinner: React.FC<SpinnerProps> = ({
  message = "Loading",
  size = "lg",
}) => {
  const sizeClasses = {
    sm: { container: "w-10 h-10", cube: "w-3 h-3" },
    md: { container: "w-20 h-20", cube: "w-5 h-5" },
    lg: { container: "w-32 h-32", cube: "w-8 h-8" },
  };

  const { container, cube } = sizeClasses[size];

  // Delay for 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      console.warn(
        "Spinner has been active for 10 seconds. Check for potential issues.",
      );
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-transparent">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes cubeChasing {
          0% {
            transform: translate(-75%, -75%) rotate(0deg);
            animation-timing-function: cubic-bezier(0.1, 0.7, 1.0, 0.1);
          }
          25% {
            transform: translate(75%, -75%) rotate(-90deg);
          }
          50% {
            transform: translate(75%, 75%) rotate(-180deg);
          }
          75% {
            transform: translate(-75%, 75%) rotate(-270deg);
          }
          95% {
            transform: translate(-75%, -75%) rotate(-360deg);
            animation-timing-function: cubic-bezier(0.0, 0.0, 0.2, 1.0);
          }
          100% {
            transform: translate(-75%, -75%) rotate(-360deg);
          }
        }
        .cube-anim {
          animation: cubeChasing 1.8s infinite both;
        }
        .cube-anim-delayed {
          animation: cubeChasing 1.8s infinite both;
          animation-delay: -0.9s;
        }
      `,
        }}
      />

      <div className={`relative ${container} flex items-center justify-center`}>
        {/* Primary Cube */}
        <div
          className={`absolute inset-0 m-auto rounded-sm border-2 border-primary bg-primary/20 ${cube} cube-anim shadow-[0_0_15px_rgba(var(--primary),0.3)]`}
        />

        {/* Secondary Cube */}
        <div
          className={`absolute inset-0 m-auto rounded-sm border-2 border-secondary bg-secondary/20 ${cube} cube-anim-delayed shadow-[0_0_15px_rgba(var(--secondary),0.3)]`}
        />
      </div>

      <div className="flex animate-pulse flex-col items-center gap-1">
        <Label className="text-sm font-bold uppercase text-muted-foreground opacity-80">
          {message}
        </Label>
      </div>
    </div>
  );
};
