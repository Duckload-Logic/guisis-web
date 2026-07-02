import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IIRDraftPromptProps {
  onDiscard: () => void;
  onRestore: () => void;
}

export function IIRDraftPrompt({ onDiscard, onRestore }: IIRDraftPromptProps) {
  return (
    <div className="animate-in slide-in-from-top-4 duration-500">
      <div
        className={cn(
          "rounded-3xl border border-primary/20 bg-primary/5 p-5",
          "backdrop-blur-md dark:border-primary/20",
          "dark:bg-primary/10 sm:flex-row",
        )}
      >
        <div className="mb-4 flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-2xl",
              "bg-primary/10 text-primary",
            )}
          >
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              Unsaved Progress Found
            </h4>
            <p className="text-xs font-medium text-muted-foreground">
              Would you like to restore your previous work?
            </p>
          </div>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDiscard}
            className={cn(
              "flex-1 rounded-xl font-bold text-muted-foreground",
              "hover:bg-neutral-100 dark:hover:bg-neutral-800 sm:flex-none",
            )}
          >
            Discard
          </Button>
          <Button
            size="sm"
            onClick={onRestore}
            className={cn(
              "flex-1 rounded-xl bg-primary px-6 font-bold text-white",
              "shadow-lg shadow-primary/20 hover:bg-primary/90 sm:flex-none",
            )}
          >
            Restore Draft
          </Button>
        </div>
      </div>
    </div>
  );
}
