import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText } from "lucide-react";

interface CORPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl?: string | null;
  studentName?: string;
}

export function CORPreviewDialog({
  isOpen,
  onClose,
  fileUrl,
  studentName = "Student",
}: CORPreviewDialogProps) {
  if (!fileUrl) return null;

  const fullUrl = `${import.meta.env.VITE_API_BASE_URL}${fileUrl}`;
  const isPdf = fileUrl.toLowerCase().endsWith(".pdf");

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent
        hasCloseButton={false}
        className="flex h-[90vh] max-w-5xl flex-col overflow-hidden rounded-[32px] border-none bg-background/95 p-0 shadow-2xl backdrop-blur-md"
      >
        <DialogHeader className="shrink-0 border-b bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <FileText size={24} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  COR Preview: {studentName}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Certificate of Registration verification document.
                </DialogDescription>
              </div>
            </div>
            <div className="mr-8 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl"
                asChild
              >
                <a
                  href={fullUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download size={14} /> Download
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl"
                asChild
              >
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={14} /> Full View
                </a>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="relative flex-1 bg-muted/30">
          {isPdf ? (
            <iframe
              src={`${fullUrl}#toolbar=0`}
              className="h-full w-full border-none"
              title="COR Preview"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center overflow-auto p-8">
              <img
                src={fullUrl}
                alt="COR Preview"
                className="max-h-full max-w-full rounded-lg object-contain shadow-xl"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
