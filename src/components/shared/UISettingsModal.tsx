import React, { useState, useEffect, useRef } from "react";
import {
  ResponsiveModal,
  ResponsiveModalContent,
} from "@/components/ui/responsive-modal";
import { Palette, Type, Volume2, Leaf, Zap } from "lucide-react";
import { useUI } from "@/context";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface UISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UISettingsModal: React.FC<UISettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    grayscale,
    setGrayscale,
    dyslexiaMode,
    setDyslexiaMode,
    fontScale,
    setFontScale,
    speechRate,
    setSpeechRate,
    speechVoice,
    setSpeechVoice,
    performanceMode,
    setPerformanceMode,
  } = useUI();

  // Draft states for pending changes
  const [draftFontScale, setDraftFontScale] = useState(fontScale);
  const [draftGrayscale, setDraftGrayscale] = useState(grayscale);
  const [draftDyslexic, setDraftDyslexic] = useState(dyslexiaMode);
  const [draftPerformanceMode, setDraftPerformanceMode] =
    useState(performanceMode);
  const [draftSpeechRate, setDraftSpeechRate] = useState(speechRate);
  const [draftSpeechVoice, setDraftSpeechVoice] = useState(speechVoice);

  const fontSteps = [80, 90, 100, 110, 120];

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Sync draft state with global state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDraftFontScale(fontScale);
      setDraftGrayscale(grayscale);
      setDraftDyslexic(dyslexiaMode);
      setDraftPerformanceMode(performanceMode);
      setDraftSpeechRate(speechRate);
      setDraftSpeechVoice(speechVoice);
    }
  }, [
    isOpen,
    fontScale,
    grayscale,
    dyslexiaMode,
    performanceMode,
    speechRate,
    speechVoice,
  ]);

  const hasPendingChanges =
    draftFontScale !== fontScale ||
    draftGrayscale !== grayscale ||
    draftDyslexic !== dyslexiaMode ||
    draftPerformanceMode !== performanceMode ||
    draftSpeechRate !== speechRate ||
    draftSpeechVoice !== speechVoice;

  const increaseFont = () => {
    const currentIndex = fontSteps.indexOf(draftFontScale);
    if (currentIndex < fontSteps.length - 1) {
      setDraftFontScale(fontSteps[currentIndex + 1]);
    }
  };

  const decreaseFont = () => {
    const currentIndex = fontSteps.indexOf(draftFontScale);
    if (currentIndex > 0) {
      setDraftFontScale(fontSteps[currentIndex - 1]);
    }
  };

  const handleApplySettings = () => {
    setFontScale(draftFontScale);
    setGrayscale(draftGrayscale);
    setDyslexiaMode(draftDyslexic);
    setPerformanceMode(draftPerformanceMode);
    setSpeechRate(draftSpeechRate);
    setSpeechVoice(draftSpeechVoice);
    onClose();
  };

  const handleCancelSettings = () => {
    onClose();
  };

  // Preview logic: Apply draft settings to the document root while open
  useEffect(() => {
    if (!isOpen) return;

    const root = document.documentElement;

    // Apply Grayscale Preview
    if (draftGrayscale) {
      root.style.filter = "grayscale(100%)";
    } else {
      root.style.filter = "";
    }

    // Apply Dyslexia Preview
    if (draftDyslexic) {
      root.classList.add("dyslexic-mode");
    } else {
      root.classList.remove("dyslexic-mode");
    }

    // Apply Performance Preview (Performance Mode ON = true = add perf-mode class)
    if (draftPerformanceMode) {
      root.classList.add("perf-mode");
    } else {
      root.classList.remove("perf-mode");
    }

    // Apply Font Scale Preview
    root.style.fontSize = `${(draftFontScale / 100) * 16}px`;

    return () => {};
  }, [
    isOpen,
    draftGrayscale,
    draftDyslexic,
    draftPerformanceMode,
    draftFontScale,
  ]);

  // Revert preview on cancel/close
  useEffect(() => {
    if (!isOpen && mounted) {
      const root = document.documentElement;
      // Revert to global state values
      if (grayscale) {
        root.style.filter = "grayscale(100%)";
      } else {
        root.style.filter = "";
      }

      if (dyslexiaMode) {
        root.classList.add("dyslexic-mode");
      } else {
        root.classList.remove("dyslexic-mode");
      }

      if (performanceMode) {
        root.classList.add("perf-mode");
      } else {
        root.classList.remove("perf-mode");
      }

      root.style.fontSize = `${(fontScale / 100) * 16}px`;
    }
  }, [isOpen, grayscale, dyslexiaMode, performanceMode, fontScale, mounted]);

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={handleCancelSettings}
    >
      <ResponsiveModalContent
        className={cn(
          "flex h-[95dvh] w-full flex-col overflow-hidden border-t",
          "border-border bg-card p-0 text-card-foreground",
          "shadow-2xl sm:h-auto sm:max-h-[80vh] sm:max-w-2xl sm:border",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "shrink-0 border-b border-border bg-muted/20 px-5 py-4",
            "sm:px-7 sm:py-6",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                Display & Accessibility
              </h2>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Customize your viewing and reading experience
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className={cn(
            "flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-6",
            "sm:space-y-6 sm:px-7 sm:py-8",
          )}
        >
          {/* Grayscale */}
          <div className="rounded-3xl border border-border bg-muted/10 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Palette
                size={18}
                className="text-primary"
              />
              <p className="text-lg font-medium text-foreground">
                Grayscale Mode
              </p>
            </div>
            <button
              onClick={() => setDraftGrayscale(!draftGrayscale)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border",
                "border-border bg-card px-5 py-4 transition",
                "hover:border-primary/50",
              )}
            >
              <span className="font-medium">
                {draftGrayscale ? "On" : "Off"}
              </span>
              <div
                className={cn(
                  "relative h-6 w-11 rounded-full p-1 transition-colors",
                  draftGrayscale ? "bg-primary" : "bg-muted",
                )}
              >
                <div
                  className={cn(
                    "h-4 w-4 rounded-full bg-background transition-transform",
                    draftGrayscale ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </div>
            </button>
          </div>

          {/* Dyslexia Friendly */}
          <div className="rounded-3xl border border-border bg-muted/10 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Type
                size={18}
                className="text-primary"
              />
              <p className="text-lg font-medium text-foreground">
                Dyslexia Friendly Font
              </p>
            </div>
            <button
              onClick={() => setDraftDyslexic(!draftDyslexic)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border",
                "border-border bg-card px-5 py-4 text-foreground transition",
                "hover:border-primary/50",
              )}
            >
              <span className="font-medium">
                {draftDyslexic ? "On" : "Off"}
              </span>
              <div
                className={`relative h-6 w-11 rounded-full p-1 transition-colors ${draftDyslexic ? "bg-primary" : "bg-muted"}`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-background transition-transform ${draftDyslexic ? "translate-x-5" : "translate-x-0"}`}
                />
              </div>
            </button>
          </div>

          {/* Performance Mode */}
          <div className="rounded-3xl border border-border bg-muted/10 p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {draftPerformanceMode ? (
                  <Leaf
                    size={18}
                    className="shrink-0 text-emerald-500"
                  />
                ) : (
                  <Zap
                    size={18}
                    className="shrink-0 text-amber-500"
                  />
                )}
                <p className="text-[17px] font-medium leading-tight text-foreground sm:text-lg">
                  Graphics Quality
                </p>
              </div>
            </div>
            <button
              onClick={() => setDraftPerformanceMode(!draftPerformanceMode)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border",
                "border-border bg-card px-5 py-4 text-foreground transition",
                "hover:border-primary/50",
              )}
            >
              <span className="font-medium">
                {draftPerformanceMode ? "Performance" : "High Quality"}
              </span>
              <div
                className={`relative h-6 w-11 rounded-full p-1 transition-colors ${draftPerformanceMode ? "bg-emerald-500" : "bg-amber-500"}`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-background transition-transform ${draftPerformanceMode ? "translate-x-5" : "translate-x-0"}`}
                />
              </div>
            </button>
          </div>

          {/* Font Size Section */}
          <div className="rounded-3xl border border-border bg-muted/10 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Type
                size={18}
                className="text-primary"
              />
              <p className="text-lg font-medium text-foreground">Font Size</p>
            </div>

            <div
              className={cn(
                "mx-auto flex min-h-[60px] w-full max-w-sm items-center",
                "justify-center gap-3 px-2 md:px-6",
              )}
            >
              {/* Desktop Font Scale Slider */}
              <span className="hidden shrink-0 text-xl font-medium text-foreground md:block">
                A
              </span>

              <div className="hidden flex-1 items-center justify-between px-1 md:flex">
                {fontSteps.map((step, index) => {
                  const isActive = step === draftFontScale;

                  return (
                    <div
                      key={step}
                      className="relative flex flex-1 items-center justify-center"
                    >
                      {index < fontSteps.length - 1 && (
                        <span className="absolute left-1/2 top-1/2 h-1 w-full -translate-y-1/2 bg-border" />
                      )}

                      <button
                        type="button"
                        onClick={() => setDraftFontScale(step)}
                        className="group relative z-10 flex items-center justify-center"
                        aria-label={`Set font size to ${step}%`}
                      >
                        <span
                          className={`relative h-2 w-2 rounded-full border transition ${
                            isActive
                              ? "scale-125 border-primary bg-primary shadow-[0_0_0_6px_rgba(var(--primary),0.18)]"
                              : "border-border bg-card hover:scale-110 hover:border-primary/50 hover:bg-primary/15"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              <span
                className={cn(
                  "hidden shrink-0 text-5xl font-medium leading-none",
                  "text-foreground md:block",
                )}
              >
                A
              </span>

              {/* Mobile Text Preview */}
              <div
                className={cn(
                  "flex h-16 w-full items-center justify-center rounded-2xl",
                  "border border-border bg-muted/20 shadow-inner md:hidden",
                )}
              >
                <span
                  className="font-medium text-foreground transition-all duration-300"
                  style={{ fontSize: `${(draftFontScale / 100) * 1.5}rem` }}
                >
                  Aa
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={decreaseFont}
                disabled={draftFontScale <= 80}
                className={cn(
                  "rounded-xl border border-border bg-card px-3 py-1.5",
                  "text-sm font-medium text-foreground shadow-sm transition",
                  "hover:scale-105 hover:border-primary/25 hover:text-primary",
                  "active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                −
              </button>

              <p className="min-w-[72px] text-center text-sm font-medium text-muted-foreground">
                {draftFontScale}%
              </p>

              <button
                onClick={increaseFont}
                disabled={draftFontScale >= 120}
                className={cn(
                  "rounded-xl border border-border bg-card px-3 py-1.5",
                  "text-sm font-medium text-foreground shadow-sm transition",
                  "hover:scale-105 hover:border-primary/25 hover:text-primary",
                  "active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                +
              </button>
            </div>
          </div>

          {/* Voice Speed */}
          <div className="rounded-3xl border border-border bg-muted/10 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2
                  size={18}
                  className="text-primary"
                />
                <p className="text-lg font-medium text-foreground">
                  Reading Speed
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                {draftSpeechRate}x
              </span>
            </div>
            <div className="px-2">
              <Slider
                value={[draftSpeechRate]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={([v]) => setDraftSpeechRate(v)}
                className="py-4"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={cn(
            "flex shrink-0 flex-col-reverse items-stretch justify-end",
            "gap-3 border-t border-border bg-muted/20 p-4 pb-6",
            "sm:flex-row sm:items-center sm:px-7 sm:py-5 sm:pb-5",
          )}
        >
          {!hasPendingChanges && (
            <p className="mr-auto hidden text-xs font-medium text-muted-foreground sm:block">
              Settings are up to date
            </p>
          )}
          <button
            onClick={handleCancelSettings}
            className={cn(
              "w-full rounded-2xl border border-border bg-card px-6",
              "py-3.5 text-sm font-medium text-foreground transition",
              "hover:bg-muted sm:w-auto sm:py-2.5",
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleApplySettings}
            disabled={!hasPendingChanges}
            className={cn(
              "w-full rounded-2xl px-8 py-3.5 text-sm font-bold shadow-lg transition sm:w-auto sm:py-2.5",
              hasPendingChanges
                ? "hover:bg-primary-dark bg-primary text-primary-foreground"
                : "cursor-not-allowed bg-muted text-muted-foreground",
            )}
          >
            Apply Changes
          </button>
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
