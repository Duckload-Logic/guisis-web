import React from "react";
import { cn } from "@/lib/utils";

export default function Radio({
  label,
  options,
  value,
  onChange,
  required = false,
  columns = 1,
  disabled = false,
  name,
}: {
  label: string;
  options: Array<{
    id: string | number;
    name: string;
    text?: string;
    code?: string;
  }>;
  value: string | number;
  onChange: (val: string | number) => void;
  required?: boolean;
  columns?: number;
  disabled?: boolean;
  name?: string;
}) {
  const gridColsClass =
    {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
    }[columns] || "grid-cols-1";

  return (
    <div className="space-y-2">
      <div className="mb-4 flex items-start gap-1 text-sm font-medium text-card-foreground">
        <span>{label}</span>
        {required && <span className="text-red-500">*</span>}
      </div>
      <div className={`grid grid-cols-1 md:${gridColsClass} gap-4`}>
        {options.map((option) => (
          <label
            key={option.id}
            className="group/radio flex cursor-pointer items-center gap-3"
          >
            <div
              className={cn(
                "relative flex h-5 w-5 shrink-0 items-center justify-center",
                "transition-transform duration-200 group-active:scale-95",
              )}
            >
              <input
                type="radio"
                name={name || label}
                value={option.id}
                checked={String(value) === String(option.id)}
                onChange={() => onChange(option.id)}
                disabled={disabled}
                className="peer absolute z-10 h-full w-full cursor-pointer opacity-0"
              />
              <div
                className={cn(
                  "h-full w-full rounded-full border border-muted-foreground",
                  "bg-muted transition-all duration-200",
                  "peer-checked:border-primary peer-checked:bg-primary/10",
                )}
              />
              <div
                className={cn(
                  "pointer-events-none absolute h-2 w-2 scale-50 rounded-full",
                  "bg-primary opacity-0 transition-all duration-200",
                  "peer-checked:scale-100 peer-checked:opacity-100",
                )}
              />
            </div>
            <span
              className={cn(
                "text-sm font-medium text-foreground/80 transition-colors",
                "duration-200 group-hover/radio:text-primary",
              )}
            >
              {option.name || option.text || option.code}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
