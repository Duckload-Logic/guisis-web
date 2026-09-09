import { Search, X } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { SPECIAL_CHARS_REGEX } from "@/utils/validation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const ICON_SIZE = 20;

interface SearchInputProps {
  className?: string;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  placeholder?: string;
  hasHeader?: boolean;
  noSpecialCharacters?: boolean;
}

export default function SearchInput({
  className = "",
  searchTerm = "",
  onSearchChange,
  placeholder = "Search...",
  hasHeader = true,
  noSpecialCharacters = false,
}: SearchInputProps) {
  const [error, setError] = useState("");
  const [localValue, setLocalValue] = useState(searchTerm);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSearchChangeRef = useRef(onSearchChange);
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    setLocalValue(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== searchTerm) {
        onSearchChangeRef.current?.(localValue);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localValue, searchTerm]);

  const handleChange = (val: string) => {
    if (noSpecialCharacters && SPECIAL_CHARS_REGEX.test(val)) {
      setError("Special characters are not allowed");
    } else {
      setError("");
    }
    setLocalValue(val);
  };

  const handleClear = () => {
    setError("");
    setLocalValue("");
    // The effect will trigger onSearchChange("") after delay,
    // but we can also fire it immediately for clear
    onSearchChange?.("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div className={cn("relative min-w-0 space-y-2", className)}>
      {hasHeader && (
        <label className="block text-sm font-medium text-foreground">
          Search:
        </label>
      )}
      <div className="relative w-full">
        <Search
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 h-4 w-4",
            "shrink-0 -translate-y-1/2 text-muted-foreground opacity-70",
          )}
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(
            "h-11 bg-muted/40 py-2.5 pl-10 pr-11 text-sm font-medium",
            "text-foreground shadow-md outline-none transition-all",
            "duration-200 hover:border-glass-border/60",
            "placeholder:text-muted-foreground/70",
            "focus:border-primary/50 focus:bg-glass-bg focus:ring-2",
            "focus:ring-primary/5",
            error ? "border-destructive/50 ring-destructive/5" : "",
          )}
        />
        {localValue && (
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={handleClear}
            className={cn(
              "absolute right-2 top-1/2 z-10 flex h-7 min-h-0 w-7",
              "shrink-0 -translate-y-1/2 items-center justify-center",
              "rounded-full p-0 text-muted-foreground transition-colors",
              "hover:bg-muted/80 hover:text-foreground",
            )}
            aria-label="Clear search"
          >
            <X
              className="h-4 w-4 shrink-0 text-current"
              strokeWidth={2.5}
            />
          </button>
        )}
      </div>
      {error && (
        <p
          className={cn(
            "animate-in fade-in slide-in-from-top-1 ml-1 mt-1.5",
            "text-[11px] font-medium text-destructive duration-200",
          )}
        >
          {error}
        </p>
      )}
    </div>
  );
}
