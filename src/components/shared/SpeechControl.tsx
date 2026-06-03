import React, { useState, useEffect } from "react";
import {
  X,
  MousePointer2,
  Ear,
  AudioLines,
} from "lucide-react";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useUI } from "@/context";
import { cn } from "@/lib/utils";

export const SpeechControl: React.FC = () => {
  const isMobile = useIsMobile();
  const { voices, speechRate, speechVoice } = useUI();
  const { speak, stop } = useSpeechSynthesis(voices);
  const [isVisible, setIsVisible] = useState(false);
  const [readerActive, setReaderActive] = useState(false);
  const [showTip, setShowTip] = useState(false);

  // Auto-show after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      const viewedTip = localStorage.getItem("speech_tip_viewed_v2");
      if (!viewedTip) setShowTip(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const dismissTip = () => {
    setShowTip(false);
    localStorage.setItem("speech_tip_viewed_v2", "true");
  };

  const handleToggle = () => {
    dismissTip();
    const newState = !readerActive;
    setReaderActive(newState);
    if (!newState) {
      stop();
      // Remove any leftover outlines
      document.querySelectorAll(".reader-highlight").forEach((el) => {
        el.classList.remove("reader-highlight");
      });
    }
  };

  // Global Interaction Logic
  useEffect(() => {
    if (!readerActive) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Filter out speech control UI and any portaled content (like dropdowns)
      if (
        target.closest(".speech-control-ui") ||
        target.closest(".speech-control-ignore") ||
        target.closest("[data-radix-portal]")
      )
        return;

      // Clean up previous
      document.querySelectorAll(".reader-highlight").forEach((el) => {
        el.classList.remove("reader-highlight");
      });

      // Add highlight to current
      target.classList.add("reader-highlight");
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Filter out speech control UI and any portaled content (like dropdowns)
      if (
        target.closest(".speech-control-ui") ||
        target.closest(".speech-control-ignore") ||
        target.closest("[data-radix-portal]")
      )
        return;

      e.preventDefault();
      e.stopPropagation();

      const text = target.innerText || target.getAttribute("aria-label") || "";
      if (text.trim()) {
        const voice = voices.find(
          (v) => v.name === speechVoice || v.voiceURI === speechVoice,
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
  }, [readerActive, speak, speechRate, speechVoice]);

  if (!isVisible) return null;

  return (
    <div
      className={`speech-control-ui fixed z-50 flex flex-col items-end gap-3 transition-all duration-500 ${isMobile ? "bottom-24 right-4" : "bottom-6 right-6"}`}
    >
      {/* Quick Tip */}
      {showTip && !readerActive && (
        <div
          className={cn(
            "animate-in slide-in-from-right-4 fade-in pointer-events-auto",
            "relative mb-2 mr-2 max-w-[220px] rounded-2xl bg-primary p-4",
            "text-primary-foreground shadow-xl duration-500",
          )}
        >
          <button
            onClick={dismissTip}
            className="absolute -right-1 -top-1 rounded-full border border-white/20 bg-slate-900 p-1"
          >
            <X size={10} />
          </button>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
            <Ear size={14} /> Interactive Reader
          </p>
          <p className="text-[10px] leading-tight opacity-90">
            Turn it on and click any part of the page to have it read aloud!
          </p>
        </div>
      )}

      {/* Reader Status Indicator */}
      {readerActive && (
        <div
          className={cn(
            "animate-in slide-in-from-bottom-4 fade-in",
            "pointer-events-none mb-2 flex flex-col items-end gap-2",
            "duration-300",
          )}
        >
          <div
            className={cn(
              "flex animate-pulse items-center gap-2 rounded-full border",
              "border-white/20 bg-primary px-3 py-1.5 text-[10px] font-bold",
              "uppercase text-primary-foreground shadow-lg",
            )}
          >
            <MousePointer2 size={12} /> Live Reader
          </div>
        </div>
      )}

      {/* Main Toggle Bubble */}
      <div className="pointer-events-auto">
        <button
          onClick={handleToggle}
          className={`group relative flex h-16 w-16 items-center justify-center border shadow-[0_12px_40px_-8px_rgb(0,0,0,0.15)] transition-all duration-500 ${
            readerActive
              ? "rounded-full border-primary bg-primary text-primary-foreground"
              : "rounded-full border-white/20 bg-primary text-primary-foreground hover:scale-110 active:scale-95"
          } `}
        >
          {readerActive ? <Ear size={30} /> : <AudioLines size={30} />}

          {/* Status Label (Desktop) */}
          {!readerActive && !isMobile && (
            <span
              className={cn(
                "absolute right-full mr-3 translate-x-2 whitespace-nowrap",
                "rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium",
                "text-white opacity-0 transition-opacity duration-200",
                "group-hover:translate-x-0 group-hover:opacity-100",
              )}
            >
              Turn On Reader Mode
            </span>
          )}

          {/* Active Ping */}
          {readerActive && (
            <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/20" />
          )}
        </button>
      </div>
    </div>
  );
};
