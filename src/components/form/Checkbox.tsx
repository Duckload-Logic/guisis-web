import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Checkbox({
  id,
  label,
  name,
  checked,
  onChange,
  onCheckedChange,
  disabled = false,
  className = "",
  info = "",
  square = false,
}: {
  id: string;
  label: string;
  name: string;
  checked: boolean;
  onChange?: (...args: any[]) => void;
  onCheckedChange?: (checked: boolean | "indeterminate") => void;
  disabled?: boolean;
  className?: string;
  info?: string;
  square?: boolean;
}) {
  return (
    <div className={className}>
      <div className="group/checkbox flex items-center gap-3">
        <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            id={id}
            name={name}
            checked={checked}
            onChange={(e) => {
              onChange?.(e);
              onCheckedChange?.(e.target.checked);
            }}
            disabled={disabled}
            className={cn(
              "peer absolute z-10 h-full w-full opacity-0",
              disabled
                ? "cursor-not-allowed pointer-events-none"
                : "cursor-pointer",
              className,
            )}
          />
          <div
            className={cn(
              `h-full w-full ${
                square ? "rounded-md" : "rounded-sm"
              } border border-border bg-muted transition-all duration-200`,
              "peer-checked:border-primary peer-checked:bg-primary",
              "peer-hover:border-primary",
              "dark:border-white/10 dark:border-white/30 dark:bg-white/[0.04]",
              disabled && "opacity-50",
            )}
          />
          <Check
            className={cn(
              "pointer-events-none absolute h-3 w-3 scale-50 text-white",
              "opacity-0 transition-all duration-200 peer-checked:scale-100",
              "peer-checked:opacity-100",
              disabled && "opacity-50",
            )}
          />
        </div>
        <label
          htmlFor={id}
          className={cn(
            "select-none text-sm font-medium",
            "text-foreground transition-colors duration-200",
            disabled
              ? "opacity-50 cursor-not-allowed pointer-events-none"
              : "cursor-pointer group-hover/checkbox:text-primary",
          )}
        >
          {label}
        </label>
      </div>
      {info && (
        <p className="ml-7 mt-1 text-xs text-muted-foreground">{info}</p>
      )}
    </div>
  );
}
