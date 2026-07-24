import React, { useEffect, useState } from "react";
import { AudioLines, Ear, MousePointer2, X } from "lucide-react";

import { useUI } from "@/context";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { cn } from "@/lib/utils";

export const SpeechControl: React.FC = () => {
  const isMobile = useIsMobile();
  const { voices, speechRate, speechVoice } = useUI();
  const { speak, stop } = useSpeechSynthesis(voices);
  const [isVisible, setIsVisible] = useState(false);
  const [readerActive, setReaderActive] = useState(false);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(true);

      // Keep phones and tablets uncluttered. The instructional tip is only
      // displayed on desktop where there is enough available screen space.
      if (!isMobile) {
        const viewedTip = localStorage.getItem("speech_tip_viewed_v2");
        if (!viewedTip) setShowTip(true);
      }
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [isMobile]);

  useEffect(() => {
    // Immediately remove desktop-only helper UI when switching to a phone or
    // tablet viewport through responsive mode or device rotation.
    if (isMobile) setShowTip(false);
  }, [isMobile]);

  const dismissTip = () => {
    setShowTip(false);
    localStorage.setItem("speech_tip_viewed_v2", "true");
  };

  const handleToggle = () => {
    dismissTip();

    const nextState = !readerActive;
    setReaderActive(nextState);

    if (!nextState) {
      stop();
      document.querySelectorAll(".reader-highlight").forEach((el) => {
        el.classList.remove("reader-highlight");
      });
    }
  };

  useEffect(() => {
    if (!readerActive) return;

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (
        target.closest(".speech-control-ui") ||
        target.closest(".speech-control-ignore") ||
        target.closest("[data-radix-portal]")
      ) {
        return;
      }

      document.querySelectorAll(".reader-highlight").forEach((el) => {
        el.classList.remove("reader-highlight");
      });

      target.classList.add("reader-highlight");
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (
        target.closest(".speech-control-ui") ||
        target.closest(".speech-control-ignore") ||
        target.closest("[data-radix-portal]")
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const text = target.innerText || target.getAttribute("aria-label") || "";

      if (text.trim()) {
        const voice = voices.find(
          (item) =>
            item.name === speechVoice || item.voiceURI === speechVoice,
        );

        speak(text, {
          rate: speechRate,
          voiceName: voice?.name || speechVoice,
          voiceURI: voice?.voiceURI,
        });
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("click", handleClick, true);
      document.querySelectorAll(".reader-highlight").forEach((el) => {
        el.classList.remove("reader-highlight");
      });
    };
  }, [readerActive, speak, speechRate, speechVoice, stop, voices]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "speech-control-ui pointer-events-none fixed z-[60] flex flex-col items-end gap-3",
        "right-4 sm:right-5 xl:right-8",
        // Phones and tablets use a fixed 4rem bottom navigation. Keep the
        // reader completely above it, including the device safe-area inset.
        "bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)]",
        "sm:bottom-[calc(4rem+env(safe-area-inset-bottom)+1.25rem)]",
        // Desktop has no bottom navigation, so maintain a clean edge gap.
        "xl:bottom-8",
        "transition-[bottom,right,opacity,transform] duration-300",
      )}
    >
      {showTip && !readerActive && !isMobile && (
        <div
          className={cn(
            "animate-in slide-in-from-right-4 fade-in pointer-events-auto",
            "relative mb-1 mr-1 max-w-[220px] rounded-xl bg-primary p-4",
            "text-primary-foreground shadow-md duration-500",
          )}
        >
          <button
            type="button"
            onClick={dismissTip}
            aria-label="Dismiss reader mode tip"
            className={cn(
              "absolute -right-1 -top-1 rounded-full border border-white/20",
              "bg-slate-900 p-1 text-white",
            )}
          >
            <X size={10} aria-hidden="true" />
          </button>

          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
            <Ear size={14} aria-hidden="true" /> Interactive Reader
          </p>

          <p className="text-[10px] leading-tight opacity-90">
            Turn it on and click any part of the page to have it read aloud.
          </p>
        </div>
      )}

      {readerActive && !isMobile && (
        <div
          className={cn(
            "animate-in slide-in-from-bottom-4 fade-in pointer-events-none",
            "mb-1 flex items-center rounded-full border border-white/20",
            "bg-primary px-3 py-1.5 text-[10px] font-bold uppercase",
            "text-primary-foreground shadow-md duration-300",
          )}
          aria-hidden="true"
        >
          <MousePointer2 size={12} className="mr-2" /> Live Reader
        </div>
      )}

      <button
        type="button"
        onClick={handleToggle}
        aria-label={readerActive ? "Turn off reader mode" : "Turn on reader mode"}
        aria-pressed={readerActive}
        className={cn(
          "group pointer-events-auto relative flex shrink-0 touch-manipulation items-center",
          "justify-center rounded-full border border-white/25 bg-primary p-0",
          "h-12 w-12 sm:h-14 sm:w-14 xl:h-16 xl:w-16",
          "text-primary-foreground shadow-md outline-none",
          "transition-transform duration-200 hover:scale-105 active:scale-95",
          "focus-visible:ring-2 focus-visible:ring-primary",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        {readerActive ? (
          <Ear
            className="h-6 w-6 shrink-0 xl:h-7 xl:w-7"
            strokeWidth={2.5}
            aria-hidden="true"
          />
        ) : (
          <AudioLines
            className="h-6 w-6 shrink-0 xl:h-7 xl:w-7"
            strokeWidth={2.5}
            aria-hidden="true"
          />
        )}

        {!readerActive && !isMobile && (
          <span
            className={cn(
              "pointer-events-none absolute right-full mr-3 translate-x-2",
              "whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5",
              "text-xs font-medium text-white opacity-0 shadow-md",
              "transition-all duration-200 group-hover:translate-x-0",
              "group-hover:opacity-100 group-focus-visible:translate-x-0",
              "group-focus-visible:opacity-100",
            )}
          >
            Turn On Reader Mode
          </span>
        )}

        {readerActive && !isMobile && (
          <span
            className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/20"
            aria-hidden="true"
          />
        )}
      </button>

      <span className="sr-only" aria-live="polite">
        {readerActive ? "Live reader is active" : "Live reader is inactive"}
      </span>
    </div>
  );
};
