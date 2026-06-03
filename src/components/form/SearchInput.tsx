import { Search, X } from "lucide-react";
import { useState } from "react";
import { SPECIAL_CHARS_REGEX } from "@/utils/validation";
import { cn } from "@/lib/utils";

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

  const handleChange = (val: string) => {
    if (noSpecialCharacters && SPECIAL_CHARS_REGEX.test(val)) {
      setError("Special characters are not allowed");
    } else {
      setError("");
    }
    onSearchChange?.(val);
  };

  return (
    <div className={className}>
      {hasHeader && (
        <label className="mb-2 block text-sm font-medium text-card-foreground">
          Search:
        </label>
      )}
      <div className="flex items-center gap-2">
        <div className="relative w-full">
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => handleChange(e.target.value)}
            className={`hover:border-glass-border/60 dark:focus:bg-glass-bg/40 h-11 w-full rounded-xl border border-border bg-muted/60 px-4 py-2.5 text-sm font-medium text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground/70 focus:border-primary/50 focus:bg-glass-bg focus:ring-2 focus:ring-primary/5 dark:bg-muted/20 ${error ? "border-destructive/50 ring-destructive/5" : ""} `}
          />
        </div>
        {searchTerm ? (
          <button
            onClick={() => handleChange("")}
            className={cn(
              "flex cursor-pointer items-center justify-center rounded p-1",
              "text-card-foreground transition-colors hover:bg-muted/50",
            )}
            type="button"
          >
            <X size={ICON_SIZE} />
          </button>
        ) : (
          <div className="flex items-center justify-center p-1 text-card-foreground opacity-50">
            <Search size={ICON_SIZE} />
          </div>
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
