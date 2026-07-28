import React, { useEffect, useState } from "react";
import { AudioLines, Ear, MousePointer2, X, ChevronDown } from "lucide-react";

import { useUI, useAuth } from "@/context";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { cn } from "@/lib/utils";

export const SpeechControl: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    isStudent,
    isAdmin,
    isSuperAdmin,
    isDeveloper,
  } = useAuth();
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

  const handleToggle = React.useCallback(() => {
    dismissTip();

    const nextState = !readerActive;
    setReaderActive(nextState);

    if (!nextState) {
      stop();
      document.querySelectorAll(".reader-highlight").forEach((el) => {
        el.classList.remove("reader-highlight");
      });
    }
  }, [readerActive, stop]);

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

  useEffect(() => {
    const handleExternalToggle = () => {
      handleToggle();
    };
    window.addEventListener("toggle-speech-reader", handleExternalToggle);
    return () => {
      window.removeEventListener(
        "toggle-speech-reader",
        handleExternalToggle
      );
    };
  }, [readerActive, handleToggle]);

  if (!isVisible) return null;

  return (
    <>
      <span className="sr-only" aria-live="polite">
        {readerActive ? "Live reader is active" : "Live reader is inactive"}
      </span>

      {readerActive && (
        <div
          className="speech-control-ui select-none fixed bottom-4 left-4
            z-[70] flex items-center gap-2 rounded-xl bg-primary px-3 py-2
            text-xs font-semibold text-primary-foreground shadow-lg border
            border-white/10 animate-in slide-in-from-left-4 fade-in
            duration-300 sm:bottom-5 sm:left-5 xl:bottom-8 xl:left-8"
        >
          <AudioLines className="h-4 w-4 animate-pulse" />
          <span>Live Reader Active</span>
          <button
            onClick={handleToggle}
            className="ml-2 rounded-lg p-1 hover:bg-white/15 transition-colors"
            aria-label="Stop Reader"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </>
  );
};
