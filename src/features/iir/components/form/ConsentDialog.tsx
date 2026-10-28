/**
 * Legal Consent Dialog for IIR Form Submission
 * Displays terms of use and privacy policy acknowledgment
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConsentDialogProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function ConsentDialog({
  open,
  onAccept,
  onCancel,
  isSubmitting = false,
}: ConsentDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && !isSubmitting && onCancel()}
    >
      <DialogContent
        hasCloseButton={false}
        className="sm:max-w-[600px]"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">Confirm Submission</DialogTitle>
          <DialogDescription className="pt-4 text-justify text-base">
            By submitting this form, I confirm that the information I entered
            is true and complete. I allow the{" "}
            <span className="font-semibold text-primary">
              PUP-Taguig Guidance Office
            </span>{" "}
            to keep and use my records confidentially for counseling and
            student support, and I understand that submitting false information
            may violate university rules.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-11 border border-border hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onAccept}
            disabled={isSubmitting}
            className={cn(
              "h-11 bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {isSubmitting ? (
              <>
                <div
                  className={cn(
                    "mr-2 h-4 w-4 animate-spin rounded-full border-2",
                    "border-primary-foreground border-t-transparent",
                  )}
                />
                Submitting...
              </>
            ) : (
              "I Agree & Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
