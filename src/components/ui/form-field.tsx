import { Info, Mic, MicOff } from "lucide-react";
import React, { forwardRef, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { cn } from "@/lib/utils";
import { SPECIAL_CHARS_REGEX } from "@/utils/validation";

export interface FormFieldProps {
  id?: string;
  className?: string;
  name?: string;
  label: string;
  min?: string | number;
  max?: string | number;
  type?: string;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  isTextarea?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  disabled?: boolean;
  info?: string;
  prefix?: string;
  noSpecialCharacters?: boolean;
  list?: string;
  maxChars?: number;
}

export const FormField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  FormFieldProps
>(function FormField(
  {
    id,
    className,
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
    info,
    prefix,
    noSpecialCharacters = true,
    list,
    maxChars,
  },
  ref,
) {
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition,
  } = useSpeechToText();
  const previousTranscriptRef = useRef("");
  const [internalError, setInternalError] = useState("");
  const isTextbox = isTextarea || type === "textbox";
  const stringValue = value ?? "";
  const charCount = typeof stringValue === "string" ? stringValue.length : 0;

  const emitChange = (nextValue: string, sourceEvent?: any) => {
    try {
      onChange(nextValue);
    } catch {
      if (sourceEvent) {
        sourceEvent.target.value = nextValue;
        onChange(sourceEvent);
      } else {
        onChange({
          target: { value: nextValue, name },
          currentTarget: { value: nextValue, name },
        });
      }
    }
  };

  useEffect(() => {
    if (!transcript || transcript === previousTranscriptRef.current) return;
    const appended = transcript.slice(previousTranscriptRef.current.length);
    const nextValue = `${stringValue}${appended}`.slice(0, maxChars ?? Infinity);
    emitChange(nextValue);
    previousTranscriptRef.current = transcript;
  }, [transcript]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    let nextValue = event.target.value.replace(/^\s+/, "");
    if (isTextbox && maxChars) nextValue = nextValue.slice(0, maxChars);
    setInternalError(
      noSpecialCharacters && SPECIAL_CHARS_REGEX.test(nextValue)
        ? "Special characters are not allowed"
        : "",
    );
    emitChange(nextValue, event);
  };

  const handleBlur = (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (typeof stringValue === "string") {
      const trimmed = stringValue.trim();
      if (trimmed !== stringValue) emitChange(trimmed, event);
    }
    onBlur?.();
  };

  const hasValue = stringValue !== "" && stringValue !== null;
  const fieldStateClasses = cn(
    disabled
      ? "border-0 bg-border/50 text-muted-foreground opacity-90"
      : error || internalError
        ? "border-destructive/50 focus-visible:border-destructive/60 focus-visible:ring-destructive/10"
        : hasValue
          ? "border-primary/30 bg-muted/20 shadow-md focus-visible:border-primary/50"
          : required
            ? "border-destructive/20 hover:border-destructive/40 focus-visible:border-destructive/50 focus-visible:ring-destructive/5"
            : "",
    isListening && "border-primary ring-2 ring-primary/10",
    prefix && "rounded-l-none",
  );

  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      {(label || (isTextbox && maxChars)) && (
        <div className="flex items-start justify-between gap-2 text-sm font-medium text-card-foreground">
          <div className="flex min-w-0 items-center gap-1">
            {info && <CustomTooltip content={info} />}
            {label && <span className="truncate">{label}</span>}
            {required && label && <span className="text-red-500">*</span>}
          </div>
          {isTextbox && maxChars && (
            <span className="shrink-0 text-xs font-semibold text-muted-foreground">
              {charCount}/{maxChars}
            </span>
          )}
        </div>
      )}

      <div className={cn("flex items-start", prefix ? "gap-0" : "gap-2")}>
        {prefix && (
          <div className="flex h-11 shrink-0 items-center rounded-l-xl border border-r-0 border-glass-border/30 bg-muted-foreground/20 px-4 text-sm font-medium text-card-foreground">
            {prefix}
          </div>
        )}

        <div className="relative min-w-0 flex-1">
          {isTextbox ? (
            <Textarea
              id={id}
              name={name}
              ref={ref as React.Ref<HTMLTextAreaElement>}
              value={stringValue}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled}
              rows={5}
              maxLength={maxChars}
              className={cn(
                browserSupportsSpeechRecognition && !disabled && "pb-12",
                fieldStateClasses,
              )}
            />
          ) : (
            <Input
              id={id}
              name={name}
              ref={ref as React.Ref<HTMLInputElement>}
              type={type}
              value={stringValue}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={placeholder}
              inputMode={inputMode}
              disabled={disabled}
              min={min}
              max={max}
              list={list}
              className={fieldStateClasses}
            />
          )}

          {isTextbox && browserSupportsSpeechRecognition && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                isListening ? stopListening() : startListening();
              }}
              title={isListening ? "Stop Dictation" : "Start Dictation"}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
              aria-pressed={isListening}
              className={cn(
                "absolute bottom-3 right-2 h-9 w-9 rounded-xl",
                isListening
                  ? "animate-pulse bg-primary text-white ring-4 ring-primary/20"
                  : "bg-glass-bg text-muted-foreground hover:bg-primary/10 hover:text-primary",
              )}
            >
              {isListening ? <Mic size={15} /> : <MicOff size={15} />}
            </Button>
          )}
        </div>

        {required && !label && (
          <span className={cn("px-1 font-bold text-red-500", isTextbox ? "pt-3" : "flex h-11 items-center")}>*</span>
        )}
      </div>

      {(error || internalError) && (
        <p className="ml-1 mt-1.5 text-[11px] font-medium text-destructive">
          {error || internalError}
        </p>
      )}
    </div>
  );
});

export function CustomTooltip({
  content,
  children,
}: {
  content: string;
  children?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <span
        className="cursor-help"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        tabIndex={0}
      >
        {children ?? <Info className="h-4 w-4 text-muted-foreground" />}
      </span>
      {visible && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-xs -translate-x-1/2 rounded-xl border border-primary bg-card px-3 py-2 text-sm text-card-foreground shadow-lg">
          {content}
        </span>
      )}
    </span>
  );
}
