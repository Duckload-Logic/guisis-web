import { Info, Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { SPECIAL_CHARS_REGEX } from "@/utils/validation";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const FormInput = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  {
    id?: any;
    className?: string;
    name?: string;
    label: string;
    min?: string | number;
    max?: string | number;
    type?: string;
    value: any;
    onChange: (val: any) => void;
    onBlur?: () => void;
    error?: string;
    placeholder?: string;
    required?: boolean;
    isTextarea?: boolean;
    inputMode?:
      | "search"
      | "none"
      | "text"
      | "tel"
      | "url"
      | "email"
      | "numeric"
      | "decimal";
    disabled?: boolean;
    info?: string;
    prefix?: string;
    noSpecialCharacters?: boolean;
    list?: string;
    maxChars?: number;
  }
>(
  (
    {
      id,
      className = "",
      name,
      label,
      min,
      max,
      type = "text",
      value,
      onChange,
      onBlur,
      error,
      placeholder,
      required = false,
      isTextarea = false,
      inputMode,
      disabled = false,
      info = "",
      prefix,
      noSpecialCharacters = true,
      list,
      maxChars,
    },
    ref,
  ) => {
    const {
      isListening,
      transcript,
      startListening,
      stopListening,
      browserSupportsSpeechRecognition,
    } = useSpeechToText();

    const previousTranscriptRef = useRef("");
    const isTextboxType = isTextarea || type === "textbox";
    const charCount = typeof value === "string" ? value.length : 0;

    useEffect(() => {
      if (transcript && transcript !== previousTranscriptRef.current) {
        const newPart = transcript.slice(previousTranscriptRef.current.length);
        const newValue = (value || "") + newPart;

        // Support both string-based and event-based onChange (React Hook Form)
        if (typeof onChange === "function") {
          // Create a synthetic event for React Hook Form if needed
          const event = {
            target: { value: newValue, name },
            currentTarget: { value: newValue, name },
          } as any;

          try {
            onChange(newValue);
          } catch (e) {
            onChange(event);
          }
        }
        previousTranscriptRef.current = transcript;
      }
    }, [transcript, onChange, value, name, isTextboxType, maxChars]);

    const handleMicToggle = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    };

    const [internalError, setInternalError] = useState("");

    const validateContent = (val: string) => {
      if (noSpecialCharacters && SPECIAL_CHARS_REGEX.test(val)) {
        setInternalError("Special characters are not allowed");
      } else {
        setInternalError("");
      }
    };

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      let newValue = e.target.value;
      newValue = newValue.replace(/^\s+/, "");
      if (isTextboxType && maxChars && newValue.length > maxChars) {
        newValue = newValue.slice(0, maxChars);
      }
      validateContent(newValue);

      try {
        onChange(newValue);
      } catch (err) {
        e.target.value = newValue;
        onChange(e);
      }
    };

    const handleBlur = (
      e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed !== value) {
          try {
            onChange(trimmed);
          } catch (err) {
            e.target.value = trimmed;
            onChange(e as any);
          }
        }
      }
      if (onBlur) {
        onBlur();
      }
    };

    const inputClasses = cn(
      "w-full rounded-xl border px-4 py-2.5 outline-none transition-all",
      "duration-200 text-sm font-medium tracking-tight text-foreground",
      "placeholder:text-muted-foreground/70",
      "bg-card border-foreground/30",
      disabled
        ? "bg-border/50 border-0 text-muted-foreground " +
            "cursor-not-allowed opacity-90"
        : value !== undefined && value !== null && value !== ""
          ? "bg-muted/20 border-primary/30 focus:bg-glass-bg " +
            "dark:focus:bg-glass-bg/50 focus:border-primary/50 " +
            "focus:ring-2 focus:ring-primary/5 shadow-sm"
          : required
            ? "hover:border-destructive/40 focus:border-destructive/50 " +
              "focus:ring-2 focus:ring-destructive/5"
            : "hover:border-glass-border/60 focus:bg-glass-bg " +
              "dark:focus:bg-glass-bg/40 focus:border-primary/50 " +
              "focus:ring-2 focus:ring-primary/5",
      isTextboxType
        ? cn(
            "min-h-[100px] pt-3 pr-4 resize-none",
            browserSupportsSpeechRecognition && !disabled ? "pb-12" : "pb-3",
          )
        : "h-11",
      isListening ? "border-primary ring-2 ring-primary/10" : "",
    );

    return (
      <div className={`space-y-2 ${className}`}>
        <div
          className={cn(
            "flex max-h-10 items-start justify-between gap-1",
            "text-sm font-medium text-card-foreground",
          )}
        >
          <div className="flex items-center gap-1">
            {info && <CustomTooltip content={info} />}
            <span>{label}</span>
            {required && <span className="text-red-500">*</span>}
          </div>
          {isTextboxType && maxChars && (
            <span className="text-xs font-semibold text-muted-foreground">
              {charCount}/{maxChars}
            </span>
          )}
        </div>
        <div className={cn("flex", prefix ? "gap-0" : "gap-2")}>
          {prefix && (
            <div
              className={cn(
                "relative flex h-11 w-fit items-center rounded-l-xl rounded-r-none",
                "bg-muted-foreground/20 px-4 text-muted-foreground",
                "border-glass-border/30 border border-r-0",
              )}
            >
              <span className="text-nowrap text-sm font-medium text-card-foreground">
                {prefix}
              </span>
              {/* Protruding puzzle piece tab */}
              <div
                className={cn(
                  "absolute right-[-6px] top-1/2 -translate-y-1/2",
                  "z-10 h-3 w-3 rounded-full bg-muted-foreground/20",
                  "border-glass-border/30 border border-l-0",
                )}
              />
            </div>
          )}
          <div className="relative w-full">
            {isTextboxType ? (
              <textarea
                id={id}
                name={name}
                ref={ref as any}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(inputClasses, prefix && "rounded-l-none")}
                style={
                  prefix
                    ? {
                        WebkitMaskImage:
                          "radial-gradient(circle 6px at 0px 50%, " +
                          "transparent 6px, black 6.5px)",
                        maskImage:
                          "radial-gradient(circle 6px at 0px 50%, " +
                          "transparent 6px, black 6.5px)",
                      }
                    : undefined
                }
                rows={5}
                maxLength={maxChars}
              />
            ) : (
              <input
                id={id}
                name={name}
                ref={ref as any}
                type={type}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                inputMode={inputMode}
                disabled={disabled}
                className={cn(inputClasses, prefix && "rounded-l-none")}
                style={
                  prefix
                    ? {
                        WebkitMaskImage:
                          "radial-gradient(circle 6px at 0px 50%, " +
                          "transparent 6px, black 6.5px)",
                        maskImage:
                          "radial-gradient(circle 6px at 0px 50%, " +
                          "transparent 6px, black 6.5px)",
                      }
                    : undefined
                }
                min={min}
                max={max}
                list={list}
              />
            )}

            {isTextboxType && browserSupportsSpeechRecognition && !disabled && (
              <div className="absolute bottom-4 right-2 z-10">
                <button
                  type="button"
                  onClick={handleMicToggle}
                  title={isListening ? "Stop Dictation" : "Start Dictation"}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg p-0",
                    "transition-all",
                    isListening
                      ? "animate-pulse bg-primary text-white ring-4 ring-primary/20"
                      : "bg-glass-bg text-muted-foreground hover:bg-primary/10 " +
                          "hover:text-primary",
                  )}
                >
                  {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                </button>
              </div>
            )}
          </div>
        </div>
        {(error || internalError) && (
          <p
            className={cn(
              "animate-in fade-in slide-in-from-top-1 ml-1 mt-1.5",
              "text-[11px] font-medium text-destructive duration-200",
            )}
          >
            {error || internalError}
          </p>
        )}
      </div>
    );
  },
);

export default FormInput;

export function CustomTooltip({
  content,
  children,
}: {
  content: string;
  children?: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const handleMouseEnter = () => {
    setIsVisible(true);
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom - rect.height * 3.9,
        left: rect.left - rect.width / 2,
      });
    }
  };

  return (
    <div className="relative inline-flex items-center overflow-visible">
      <div
        ref={triggerRef}
        className="cursor-help transition-all duration-200 hover:scale-110"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children || (
          <Info className="h-4 w-4 text-muted-foreground transition-colors duration-200 hover:text-primary" />
        )}
      </div>

      {isVisible && (
        <div
          className={cn(
            "animate-in fade-in slide-in-from-bottom-2 fixed z-50",
            "max-w-xs whitespace-normal rounded-md border-2 border-primary",
            "bg-card px-3 py-2 text-sm text-card-foreground shadow-lg",
            "duration-200",
          )}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: "translateX(-50%)",
            pointerEvents: "none",
          }}
        >
          {content}
          {/* <div className={cn(
    "absolute top-full left-1/2 -translate-x-1/2 w-0 h-0",
    "border-l-4 border-r-4 border-t-4 border-l-transparent",
    "border-r-transparent border-t-primary"
  )} /> */}
        </div>
      )}
    </div>
  );
}
