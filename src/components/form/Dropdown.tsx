import { Check, Lock, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export default function Dropdown({
  id,
  label,
  name,
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
}: {
  id?: string;
  label?: string;
  name?: string;
  options: any[];
  identifier?: any;
  value: any;
  onChange: (val: any) => void;
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
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const safeOptions = options || [];
  const selectedOption = safeOptions.find(
    (opt) => String(opt[identifier]) === String(value),
  );
  const isFilled = selectedOption !== undefined && value !== "";
  const getLabel = (option: any) => {
    if (!option) return `Select ${label}`;
    if (labelKey) return option[labelKey] || "";
    return (
      option.label ||
      option.statusName ||
      option.programName ||
      option.courseName ||
      option.code ||
      option.name ||
      option.text ||
      option ||
      ""
    );
  };

  const handleSelect = (optionValue: string) => {
    const selected = safeOptions.find(
      (opt) => String(opt[identifier]) === optionValue,
    );
    if (selected) {
      const selectedVal = selected[get];
      if (String(value) === String(selectedVal)) {
        onChange("");
      } else {
        onChange(selectedVal);
      }
      setOpen(false);
      if (onBlur) onBlur();
    }
  };

  useEffect(() => {
    if (!open) return;

    const closeOnPageMovement = (event: Event) => {
      const target = event.target;

      if (
        target instanceof Node &&
        (contentRef.current?.contains(target) ||
          triggerRef.current?.contains(target))
      ) {
        return;
      }

      setOpen(false);
    };

    window.addEventListener("scroll", closeOnPageMovement, true);
    window.addEventListener("resize", closeOnPageMovement);
    window.visualViewport?.addEventListener("resize", closeOnPageMovement);

    return () => {
      window.removeEventListener("scroll", closeOnPageMovement, true);
      window.removeEventListener("resize", closeOnPageMovement);
      window.visualViewport?.removeEventListener("resize", closeOnPageMovement);
    };
  }, [open]);

  return (
    <div className="relative min-w-0 space-y-2">
      {label && (
        <div className="text-sm font-medium text-foreground">
          <span className="truncate">{label}</span>
          {required && <span className="flex-shrink-0 text-red-500"> *</span>}
        </div>
      )}

      <div id={id}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              ref={triggerRef}
              disabled={!enabled || loading}
              className={cn(
                "flex h-11 w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm font-medium tracking-tight text-foreground shadow-sm outline-none transition-all duration-200",
                !enabled || loading
                  ? "border-glass-border/20 cursor-not-allowed bg-muted/50 text-muted-foreground opacity-60"
                  : formStyle
                    ? isFilled
                      ? "dark:focus:bg-glass-bg/50 border-primary/30 bg-muted/20 focus:border-primary/50 focus:bg-glass-bg focus:ring-2 focus:ring-primary/5"
                      : "border-destructive/20 bg-muted/20 hover:border-destructive/40 focus:border-destructive/50 focus:ring-2 focus:ring-destructive/5"
                    : "border-glass-border/40 hover:border-glass-border/60 dark:focus:bg-glass-bg/40 bg-muted/20 shadow-sm focus:border-primary/50 focus:bg-glass-bg focus:ring-2 focus:ring-primary/5",
                error && "border-destructive/50",
                buttonClassName,
              )}
            >
              <span
                className={cn(
                  "flex-1 truncate",
                  !selectedOption &&
                    "font-normal italic text-muted-foreground/50",
                )}
              >
                {selectedOption && value !== ""
                  ? getLabel(selectedOption)
                  : `Select ${label}`}
              </span>

              <div className="ml-2 flex flex-shrink-0 items-center gap-2">
                {!enabled && (
                  <Lock
                    size={14}
                    className="text-muted-foreground/60"
                    strokeWidth={2}
                  />
                )}
                <ChevronDown
                  className={cn(
                    "size-4 opacity-40 transition-transform duration-300",
                    open && "rotate-180",
                  )}
                />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent
            ref={contentRef}
            className={cn(
              "speech-control-ignore z-50 w-[var(--radix-popover-trigger-width)]",
              "max-h-[min(22rem,var(--radix-popover-content-available-height))]",
              "max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl",
              "border-glass-border p-0",
              formStyle ? "bg-card" : "bg-background",
            )}
            align="start"
            sideOffset={8}
            collisionPadding={8}
            sticky="always"
            hideWhenDetached
            updatePositionStrategy="always"
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              triggerRef.current?.focus({ preventScroll: true });
            }}
          >
            <Command className={formStyle ? "bg-card" : "bg-background"}>
              {label && (
                <CommandInput
                  placeholder={`Search ${label.toLowerCase()}...`}
                  className="h-11"
                />
              )}
              <CommandList
                className={cn(
                  "max-h-[min(250px,var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain p-1",
                  formStyle ? "bg-card" : "bg-background",
                )}
              >
                {label && (
                  <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
                )}
                <CommandGroup>
                  {safeOptions.map((option, index) => {
                    const optId = option?.[identifier];
                    const key =
                      optId !== undefined ? String(optId) : `opt-${index}`;
                    const label = getLabel(option);
                    const isDisabled = option?.disabled; 

                    return (
                      <CommandItem
                        key={key}
                        value={`${label}|${key}`}
                        disabled={isDisabled} 
                        onSelect={() => {
                          if (!isDisabled) handleSelect(String(optId));
                        }}
                        className={cn(
                          "mb-0.5 flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                          isDisabled
                            ? "cursor-not-allowed opacity-50" 
                            : "cursor-pointer",
                          String(optId) === String(value)
                            ? "bg-primary/10 font-bold text-primary"
                            : !isDisabled && "text-foreground hover:bg-primary/5",
                        )}
                      >
                        <span className="truncate">{label}</span>
                        {String(optId) === String(value) && (
                          <Check className="size-4 flex-shrink-0" />
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>                                                                                                                                                                                                                                                                                                         
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {error && (
        <p className="mt-1 text-xs font-normal text-red-500">{error}</p>
      )}
    </div>
  );
}
