import { Search, X } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { SPECIAL_CHARS_REGEX } from "@/utils/validation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    setLocalValue(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== searchTerm) {
        onSearchChange?.(localValue);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localValue, searchTerm, onSearchChange]);

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
    <div className={className}>
      {hasHeader && (
        <label className="mb-2 block text-sm font-medium text-card-foreground">
          Search:
        </label>
      )}
      <div className="relative w-full">
        <Search
          size={ICON_SIZE}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-card-foreground opacity-50"
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(
            "hover:border-glass-border/60 h-11 bg-muted/60 py-2.5 pl-10 pr-11",
            "text-sm font-medium text-foreground shadow-md outline-none",
            "transition-all duration-200 placeholder:text-muted-foreground/70",
            "focus:border-primary/50 focus:bg-glass-bg focus:ring-2 focus:ring-primary/5",
            "dark:focus:bg-glass-bg/40 dark:bg-muted/20",
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
              "absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full p-1.5",
              "text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors",
            )}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
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
