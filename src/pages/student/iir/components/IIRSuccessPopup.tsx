import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface IIRSuccessPopupProps {
  isOpen: boolean;
  onReturn: () => void;
  isEditMode?: boolean;
}

export function IIRSuccessPopup({
  isOpen,
  onReturn,
  isEditMode = false,
}: IIRSuccessPopupProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent
        hasCloseButton={false}
        className={cn(
          "max-w-md border-card bg-card p-10 text-center shadow-2xl",
          "backdrop-blur-2xl",
        )}
      >
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-green-500/20 blur-2xl" />
            <div
              className={cn(
                "relative flex h-20 w-20 items-center justify-center",
                "animate-bounce rounded-full bg-green-500 shadow-xl",
                "shadow-green-500/30",
              )}
            >
              <Check className="h-10 w-10 text-white" strokeWidth={4} />
            </div>
          </div>
        </div>

        <h3 className="text-3xl font-[900] text-neutral-900 dark:text-white">
          All Done!
        </h3>

        <p className="px-4 font-medium text-neutral-500 dark:text-neutral-400">
          {isEditMode
            ? "Your Individual Inventory Record has been successfully updated and saved."
            : "Your Individual Inventory Record has been successfully submitted and saved to our secure database."}
        </p>

        <Button
          onClick={onReturn}
          className={cn(
            "h-14 w-full rounded-md bg-primary text-lg font-bold",
            "text-primary-foreground shadow-xl transition-all",
            "duration-300 hover:bg-primary/90 active:scale-95",
          )}
        >
          Complete
        </Button>
      </DialogContent>
    </Dialog>
  );
}
