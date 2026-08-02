import { Check, ChevronDown, Lock, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
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
  const [query, setQuery] = useState("");

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
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) =>
      getLabel(option).toLowerCase().includes(normalized),
    );
  }, [options, query, labelKey]);

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
            setQuery("");
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
        >
          {label && (
            <div
              className="relative p-1 pb-2"
              onKeyDown={(event) => event.stopPropagation()}
            >
              <Search
                className={cn(
                  "pointer-events-none absolute left-4 top-1/2 size-4",
                  "-translate-y-1/2 text-muted-foreground",
                )}
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="h-10 pl-9 shadow-none"
                autoFocus
              />
            </div>
          )}

          <div className="max-h-64 overflow-y-auto overscroll-contain">
            {filteredOptions.length === 0 ? (
              <div
                className={cn(
                  "px-3 py-6 text-center text-sm",
                  "text-muted-foreground",
                )}
              >
                No {label?.toLowerCase() ?? "options"} found.
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const optionId = option?.[identifier];
                const optionValue = option?.[get];
                const selected = String(optionId) === String(value);
                const optionDisabled = Boolean(option?.disabled);
                return (
                  <DropdownMenuItem
                    key={optionId ?? index}
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
              })
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
