import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface IIRResetConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function IIRResetConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: IIRResetConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn("max-w-sm rounded-3xl shadow-md", "backdrop-blur-3xl")}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl">
            Reset this section?
          </AlertDialogTitle>
          <AlertDialogDescription
            className={cn("font-medium text-neutral-500", "dark:text-neutral-400")}
          >
            This will clear all answers in the current section. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter
          className={cn(
            "mt-4 flex flex-row items-center justify-center gap-2",
            "sm:space-x-0",
          )}
        >
          <AlertDialogCancel
            className={cn(
              "mt-0 flex-1 rounded-xl border border-neutral-200",
              "bg-transparent font-bold text-foreground",
              "hover:bg-accent hover:text-accent-foreground",
              "dark:border-neutral-800",
            )}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              "mt-0 flex-1 rounded-xl bg-destructive font-bold text-white",
              "shadow-lg shadow-destructive/20 hover:bg-destructive/90",
            )}
          >
            Yes, Reset
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
