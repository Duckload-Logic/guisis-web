import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
          "max-w-md border border-border bg-card p-8 text-center shadow-md",
        )}
      >
        <div className="flex justify-center">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              "border border-success-foreground/20 bg-success-background",
              "text-success-foreground",
            )}
          >
            <Check
              className="h-6 w-6"
              strokeWidth={2.5}
            />
          </div>
        </div>

        <DialogTitle className="mt-4 text-xl font-bold text-foreground">
          {isEditMode ? "IIR Profile Updated" : "IIR Form Submitted"}
        </DialogTitle>

        <DialogDescription className="px-2 text-sm text-muted-foreground">
          {isEditMode
            ? "Your Individual Inventory Record has been successfully updated."
            : "Your Individual Inventory Record has been submitted and queued for guidance validation."}
        </DialogDescription>

        <Button
          onClick={onReturn}
          className="mt-4 h-11 w-full rounded-lg font-semibold"
        >
          Return to Dashboard
        </Button>
      </DialogContent>
    </Dialog>
  );
}
