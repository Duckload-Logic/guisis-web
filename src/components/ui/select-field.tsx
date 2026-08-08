import { Check, ChevronDown, Lock } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  BASE_FIELD_CLASSES,
  getFieldStateClasses,
} from "./form-styles";

export interface SelectFieldProps {
  id?: string;
  label?: string;
  name?: string;
  options: any[];
  identifier?: string;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  enabled?: boolean;
  get?: string;
  loading?: boolean;
  lockedReason?: string;
  formStyle?: boolean;
  labelKey?: string;
  buttonClassName?: string;
}

export function SelectField({
  id,
  label,
  options = [],
  identifier = "id",
  value,
  onChange,
  onBlur,
  error,
  required = false,
  enabled = true,
  get = "id",
  loading = false,
  lockedReason = "Locked",
  formStyle = false,
  labelKey,
  buttonClassName,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const typeaheadBuffer = useRef("");
  const typeaheadTimeout = useRef<ReturnType<typeof setTimeout>>();
  const optionRefs = useRef(new Map<string, HTMLDivElement>());

  const getLabel = (option: any) => {
    if (!option) return "";
    if (labelKey) return option[labelKey] ?? "";
    return (
      option.label ??
      option.name ??
      option.text ??
      option.code ??
      String(option)
    );
  };

  const selectedOption = options.find(
    (option) => String(option?.[identifier]) === String(value),
  );

  const clearTypeahead = useCallback(() => {
    typeaheadBuffer.current = "";
    if (typeaheadTimeout.current) {
      clearTimeout(typeaheadTimeout.current);
      typeaheadTimeout.current = undefined;
    }
  }, []);

  useEffect(() => clearTypeahead, [clearTypeahead]);

  const disabled = !enabled || loading;
  const filled = selectedOption !== undefined && value !== "";

  const fieldStateClasses = cn(
    BASE_FIELD_CLASSES,
    getFieldStateClasses({
      disabled,
      error: !!error,
      filled,
      required: formStyle,
    }),
    buttonClassName,
  );

  return (
    <div className="relative min-w-0 space-y-2">
      {label && (
        <div className="text-sm font-medium text-foreground">
          <span>{label}</span>
          {required && <span className="text-red-500"> *</span>}
        </div>
      )}

      <DropdownMenu
        open={open}
        onOpenChange={(nextOpen) => {
          if (disabled) return;
          setOpen(nextOpen);
          if (!nextOpen) {
            clearTypeahead();
            onBlur?.();
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            title={!enabled ? lockedReason : undefined}
            className={fieldStateClasses}
          >
            <span
              className={cn(
                "min-w-0 flex-1 truncate",
                !filled && "font-normal italic text-muted-foreground/60",
              )}
            >
              {filled
                ? getLabel(selectedOption)
                : `Select ${label ?? "option"}`}
            </span>
            <span className="ml-2 flex shrink-0 items-center gap-2">
              {!enabled && <Lock className="size-4 text-muted-foreground" />}
              <ChevronDown
                className={cn(
                  "size-4 opacity-50 transition-transform",
                  open && "rotate-180",
                )}
              />
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className={cn(
            "speech-control-ignore",
            "w-[var(--radix-dropdown-menu-trigger-width)]",
            "min-w-[var(--radix-dropdown-menu-trigger-width)]",
            "max-w-[calc(100vw-1rem)] p-1",
          )}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onKeyDown={(event) => {
            if (
              event.defaultPrevented ||
              event.ctrlKey ||
              event.metaKey ||
              event.altKey ||
              event.nativeEvent.isComposing ||
              event.key.length !== 1
            ) {
              return;
            }

            const nextBuffer = `${typeaheadBuffer.current}${event.key}`.toLowerCase();
            const matchingOption = options.find(
              (option) =>
                !option?.disabled &&
                getLabel(option).toLowerCase().startsWith(nextBuffer),
            );

            if (!matchingOption) return;

            event.preventDefault();
            typeaheadBuffer.current = nextBuffer;
            if (typeaheadTimeout.current) clearTimeout(typeaheadTimeout.current);
            typeaheadTimeout.current = setTimeout(clearTypeahead, 750);

            const optionKey = String(matchingOption?.[identifier]);
            const optionElement = optionRefs.current.get(optionKey);
            optionElement?.focus({ preventScroll: true });
            optionElement?.scrollIntoView({ block: "nearest" });
          }}
        >
          <div className="max-h-64 overflow-y-auto overscroll-contain">
            {options.map((option, index) => {
              const optionId = option?.[identifier];
              const optionValue = option?.[get];
              const selected = String(optionId) === String(value);
              const optionDisabled = Boolean(option?.disabled);
              return (
                <DropdownMenuItem
                  key={optionId ?? index}
                  ref={(element) => {
                    const optionKey = String(optionId ?? index);
                    if (element) optionRefs.current.set(optionKey, element);
                    else optionRefs.current.delete(optionKey);
                  }}
                  disabled={optionDisabled}
                  onSelect={(event) => {
                    event.preventDefault();
                    if (optionDisabled) return;
                    onChange(
                      String(value) === String(optionValue)
                        ? ""
                        : optionValue,
                    );
                    setOpen(false);
                  }}
                  className={cn(
                    "mb-0.5 flex cursor-pointer items-center justify-between",
                    selected && "bg-primary/10 font-bold text-primary",
                  )}
                >
                  <span className="truncate">{getLabel(option)}</span>
                  {selected && <Check className="size-4 shrink-0" />}
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
