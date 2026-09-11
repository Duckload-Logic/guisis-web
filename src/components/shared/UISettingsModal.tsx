import React, { useState, useEffect } from "react";
import {
  ResponsiveModal,
  ResponsiveModalContent,
} from "@/components/ui/responsive-modal";
import { Palette, Type, Volume2, Leaf, Zap } from "lucide-react";
import { useUI } from "@/context";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FONT_SCALE_MIN = 80;
const FONT_SCALE_MAX = 120;
const FONT_SCALE_STEP = 10;
const BASE_FONT_SIZE_PX = 16;

const SPEECH_RATE_MIN = 0.5;
const SPEECH_RATE_MAX = 2.0;
const SPEECH_RATE_STEP = 0.1;

interface SettingToggleRowProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  statusLabel?: string;
}

const SettingToggleRow: React.FC<SettingToggleRowProps> = ({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
  statusLabel,
}) => (
  <div
    className={cn(
      "flex items-center justify-between rounded-xl border border-border",
      "bg-muted/10 p-4 transition-colors hover:bg-muted/20",
    )}
  >
    <div className="flex items-center gap-3">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
    <div className="flex items-center gap-3">
      {statusLabel && (
        <span className="text-xs font-medium text-muted-foreground">
          {statusLabel}
        </span>
      )}
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  </div>
);

interface UISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UISettingsModal: React.FC<UISettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);

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
    setDraftFontScale((prev) =>
      Math.min(FONT_SCALE_MAX, prev + FONT_SCALE_STEP),
    );
  };

  const decreaseFont = () => {
    setDraftFontScale((prev) =>
      Math.max(FONT_SCALE_MIN, prev - FONT_SCALE_STEP),
    );
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

    // Apply Performance Preview
    if (draftPerformanceMode) {
      root.classList.add("perf-mode");
    } else {
      root.classList.remove("perf-mode");
    }

    // Apply Font Scale Preview
    root.style.fontSize = `${(draftFontScale / 100) * BASE_FONT_SIZE_PX}px`;

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

      root.style.fontSize = `${(fontScale / 100) * BASE_FONT_SIZE_PX}px`;
    }
  }, [isOpen, grayscale, dyslexiaMode, performanceMode, fontScale, mounted]);

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={handleCancelSettings}
    >
      <ResponsiveModalContent
        className={cn(
          "flex max-h-[90dvh] w-full flex-col overflow-hidden border-t",
          "border-border bg-card p-0 text-card-foreground shadow-2xl",
          "sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl sm:border",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "shrink-0 border-b border-border bg-muted/20 px-5 py-4",
            "sm:px-6 sm:py-5",
          )}
        >
          <h2 className="text-lg font-bold text-foreground sm:text-xl">
            Display & Accessibility
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Customize your viewing and reading experience
          </p>
        </div>

        {/* Content */}
        <div
          className={cn(
            "flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-4 py-5",
            "sm:space-y-4 sm:px-6 sm:py-6",
          )}
        >
          {/* Grayscale */}
          <SettingToggleRow
            icon={<Palette size={18} />}
            title="Grayscale Mode"
            description="Reduce visual noise with monochrome display"
            checked={draftGrayscale}
            onCheckedChange={setDraftGrayscale}
            statusLabel={draftGrayscale ? "On" : "Off"}
          />

          {/* Dyslexia Friendly */}
          <SettingToggleRow
            icon={<Type size={18} />}
            title="Dyslexia Friendly Font"
            description="Enhance letter distinction and readability"
            checked={draftDyslexic}
            onCheckedChange={setDraftDyslexic}
            statusLabel={draftDyslexic ? "On" : "Off"}
          />

          {/* Graphics Quality */}
          <SettingToggleRow
            icon={
              draftPerformanceMode ? (
                <Leaf size={18} className="text-emerald-500" />
              ) : (
                <Zap size={18} className="text-amber-500" />
              )
            }
            title="Graphics Quality"
            description={
              draftPerformanceMode
                ? "Reduced animations for faster performance"
                : "Smooth animations and visual transitions"
            }
            checked={draftPerformanceMode}
            onCheckedChange={setDraftPerformanceMode}
            statusLabel={
              draftPerformanceMode ? "Performance" : "High Quality"
            }
          />

          {/* Font Size Section */}
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type size={18} className="text-primary" />
                <p className="text-sm font-medium text-foreground">
                  Font Size
                </p>
              </div>
              <span className="text-xs font-semibold text-primary">
                {draftFontScale}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={decreaseFont}
                disabled={draftFontScale <= FONT_SCALE_MIN}
                aria-label="Decrease font size"
                className="h-8 w-8 p-0 text-base"
              >
                −
              </Button>

              <div className="flex-1 px-1">
                <Slider
                  value={[draftFontScale]}
                  min={FONT_SCALE_MIN}
                  max={FONT_SCALE_MAX}
                  step={FONT_SCALE_STEP}
                  onValueChange={([val]) => setDraftFontScale(val)}
                  aria-label="Font scale slider"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={increaseFont}
                disabled={draftFontScale >= FONT_SCALE_MAX}
                aria-label="Increase font size"
                className="h-8 w-8 p-0 text-base"
              >
                +
              </Button>
            </div>
          </div>

          {/* Reading Speed Section */}
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 size={18} className="text-primary" />
                <p className="text-sm font-medium text-foreground">
                  Reading Speed
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full bg-primary/10 px-2.5 py-0.5",
                  "text-xs font-bold text-primary",
                )}
              >
                {draftSpeechRate}x
              </span>
            </div>
            <div className="px-1">
              <Slider
                value={[draftSpeechRate]}
                min={SPEECH_RATE_MIN}
                max={SPEECH_RATE_MAX}
                step={SPEECH_RATE_STEP}
                onValueChange={([v]) => setDraftSpeechRate(v)}
                aria-label="Reading speed slider"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={cn(
            "flex shrink-0 flex-col-reverse items-stretch justify-end",
            "gap-2 border-t border-border bg-muted/20 p-4 pb-5",
            "sm:flex-row sm:items-center sm:px-6 sm:py-4",
          )}
        >
          {!hasPendingChanges && (
            <p
              className={cn(
                "mr-auto hidden text-xs font-medium",
                "text-muted-foreground sm:block",
              )}
            >
              Settings are up to date
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelSettings}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApplySettings}
            disabled={!hasPendingChanges}
          >
            Apply Changes
          </Button>
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
