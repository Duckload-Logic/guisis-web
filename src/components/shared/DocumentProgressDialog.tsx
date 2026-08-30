import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FileText } from "lucide-react";

interface DocumentProgressDialogProps {
  open: boolean;
  progress: number;
  message?: string;
}

export const DocumentProgressDialog: React.FC<DocumentProgressDialogProps> = ({
  open,
  progress,
  message = "Please wait while we compile your document.",
}) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <FileText className="mb-4 h-12 w-12 animate-pulse text-emerald-500" />
          <h3 className="mb-2 text-lg font-semibold">Generating Document</h3>
          <p className="mb-6 text-sm text-muted-foreground">{message}</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-500/20">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-bold text-emerald-600">{progress}%</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
