import { useState, useCallback, useMemo } from "react";
import { useAuth, useToast, usePageMetadata } from "@/context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Eye,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { UploadCOR } from "@/features/student-core/services/corService";
import { cn } from "@/lib/utils";
import { validateCorFile } from "@/utils/corValidation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/api";

export default function CORManagement() {
  const { user, refresh } = useAuth();
  const { triggerToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  usePageMetadata(
    useMemo(() => {
      return {
        title: "COR Management",
        showSubHeader: true,
        description:
          "Manage your current academic credentials and " +
          "verification documents.",
        isLoading: false,
        badgeText: "Verified Student",
        badgeIcon: <ShieldCheck size={16} />,
      };
    }, []),
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateAndSelectCorFile = useCallback(
    async (file: File) => {
      const validation = await validateCorFile(file);

      if (!validation.isValid) {
        triggerToast(
          validation.error || "Please upload a valid COR file.",
        );
        return false;
      }

      setSelectedFile(file);
      triggerToast(
        "COR file verified. You may now confirm the upload.",
      );
      return true;
    },
    [triggerToast],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        await validateAndSelectCorFile(e.dataTransfer.files[0]);
      }
    },
    [validateAndSelectCorFile],
  );

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const isValid = await validateAndSelectCorFile(e.target.files[0]);

      if (!isValid) {
        e.target.value = "";
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const validation = await validateCorFile(selectedFile);

      if (!validation.isValid) {
        triggerToast(
          validation.error || "Please upload a valid COR file.",
        );
        return;
      }

      await UploadCOR(selectedFile);
      await refresh();
      setSelectedFile(null);
      setIsUploadModalOpen(false);
      triggerToast("COR uploaded and validated successfully!");
    } catch (error: any) {
      const errMsg = getErrorMessage(error);
      triggerToast(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const corUrl = user?.studentCorUrl;
  const isPdf = corUrl?.toLowerCase().endsWith(".pdf");

  return(
      <div
        className={cn(
        "w-full mx-auto pb-12", 
        "px-4 sm:px-6 md:px-8",
        )}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3"></div>
      <Card
        className={cn(
          "flex h-[400px] flex-col overflow-hidden rounded-xl",
          "border-border bg-card shadow-md backdrop-blur-md",
          "dark:bg-card/45 sm:h-[750px]",
          "animate-fade-in-up transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.075)]"
        )}
        style={{ animationDelay: "0.05s", animationFillMode: "both" }}
        >
        <CardHeader
          className={cn(
            "shrink-0 border-b border-border/10 bg-muted/30 p-5",
            "dark:bg-muted/10 sm:p-8",
          )}
        >
          <div
            className={cn(
              "flex flex-col gap-4",
              "sm:flex-row sm:items-center sm:justify-between",
            )}
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "rounded-2xl bg-primary/10 p-2",
                  "text-primary sm:p-3",
                )}
              >
                <Eye className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <CardTitle className="text-xl font-bold sm:text-2xl">
                    Document Preview
                  </CardTitle>
                  {corUrl &&
                    (user?.isStudentCorValid ? (
                      <Badge
                        className={cn(
                          "flex items-center gap-1 rounded-full",
                          "bg-emerald-500 px-3 py-1 text-xs",
                          "font-semibold text-white hover:bg-emerald-600",
                        )}
                      >
                        <CheckCircle2 size={12} /> Valid COR
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className={cn(
                          "flex items-center gap-1 rounded-full",
                          "px-3 py-1 text-xs font-semibold",
                        )}
                      >
                        <AlertCircle size={12} /> Outdated COR
                      </Badge>
                    ))}
                </div>
                <CardDescription>
                  Visual inspection of your latest uploaded COR.
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full justify-center gap-2 rounded-xl sm:w-auto"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <Upload size={16} />
                {corUrl ? "Upload New COR" : "Upload COR"}
              </Button>
              {corUrl && (
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-center gap-2",
                    "rounded-xl sm:w-auto",
                  )}
                  asChild
                >
                  <a
                    href={
                      `${import.meta.env.VITE_API_BASE_URL}` +
                      `${corUrl}`
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={16} /> Open Full View
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent
          className={cn("relative flex-1 overflow-hidden bg-muted/30 p-0")}
        >
          {corUrl ? (
            isPdf ? (
              <iframe
                src={
                  `${import.meta.env.VITE_API_BASE_URL}` +
                  `${corUrl}#toolbar=0`
                }
                className="h-full w-full border-none"
                title="COR PDF Preview"
              />
            ) : (
              <div
                className={cn(
                  "flex h-full w-full items-center",
                  "justify-center p-8",
                )}
              >
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL}${corUrl}`}
                  alt="COR Preview"
                  className={cn(
                    "max-h-full max-w-full rounded-xl",
                    "object-contain shadow-2xl",
                  )}
                />
              </div>
            )
          ) : (
            <div
              className={cn(
                "flex h-full w-full flex-col items-center",
                "justify-center gap-4 p-12 text-center",
                "text-muted-foreground",
              )}
            >
              <div className="rounded-full bg-muted p-8 opacity-20">
                <FileText size={80} />
              </div>
              <div className="max-w-md space-y-4">
                <div>
                  <h3 className="mb-2 text-xl font-bold text-foreground">
                    No COR Uploaded Yet
                  </h3>
                  <p className="text-sm">
                    You haven't uploaded your Certificate of Registration for
                    the current term. Please upload one to verify.
                  </p>
                </div>
                <Button
                  onClick={() => setIsUploadModalOpen(true)}
                  className={cn(
                    "rounded-xl gap-2",
                    "shadow-lg shadow-primary/20",
                  )}
                >
                  <Upload size={16} /> Upload COR
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isUploadModalOpen}
        onOpenChange={(open) => {
          setIsUploadModalOpen(open);
          if (!open) {
            setSelectedFile(null);
          }
        }}
      >
        <DialogContent
          className={cn(
            "bg-card border-border max-w-2xl rounded-2xl shadow-xl p-6",
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Upload Certificate of Registration
            </DialogTitle>
            <DialogDescription>
              Upload a scanned copy or clear photo of your latest COR to verify
              your academic status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div
              className={cn(
                "group relative cursor-pointer rounded-xl border-2",
                "border-dashed p-6 text-center sm:p-10",
                "transition-all duration-300",
                dragActive
                  ? "scale-95 border-primary bg-primary/10"
                  : "border-border/30 hover:border-primary/50 " +
                    "hover:bg-primary/5",
                selectedFile ? "border-green-500/50 bg-green-500/5" : "",
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("cor-upload")?.click()}
            >
              <input
                id="cor-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept={
                  ".pdf,.png,.jpg,.jpeg,application/pdf," +
                  "image/png,image/jpeg"
                }
              />

              <AnimatePresence mode="wait">
                {selectedFile ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div
                      className={cn(
                        "mx-auto flex h-16 w-16 items-center",
                        "justify-center rounded-full bg-green-500/20",
                        "text-green-500",
                      )}
                    >
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <p
                        className={cn(
                          "mx-auto max-w-[200px] truncate",
                          "font-bold text-foreground",
                        )}
                      >
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div
                      className={cn(
                        "mx-auto flex h-16 w-16 items-center",
                        "justify-center rounded-full bg-primary/10",
                        "text-primary transition-transform",
                        "group-hover:scale-110",
                      )}
                    >
                      <Upload size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold">Click or drag file here</p>
                      <p className="text-xs text-muted-foreground">
                        PDF (Max 10MB). Filename must include "COR" or
                        "Certificate of Registration".
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {selectedFile && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  className={cn(
                    "flex-1 rounded-xl shadow-lg",
                    "shadow-primary/20",
                  )}
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Confirm & Upload
                </Button>
              </div>
            )}

            {/* Upload Guidelines */}
            <div className="rounded-xl border border-border p-4 bg-muted/20">
              <h4 className="flex items-center gap-2 text-sm font-bold mb-3">
                <AlertCircle size={16} className="text-amber-500" />
                Upload Guidelines
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div
                    className={cn(
                      "mt-1 h-1 w-1 shrink-0",
                      "rounded-full bg-primary",
                    )}
                  />
                  <span>
                    The file name must contain the words "Registration
                    Certificate", "COR" or "Certificate of Registration".
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div
                    className={cn(
                      "mt-1 h-1 w-1 shrink-0",
                      "rounded-full bg-primary",
                    )}
                  />
                  <span>
                    Ensure all text is readable and the document is not blurry.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div
                    className={cn(
                      "mt-1 h-1 w-1 shrink-0",
                      "rounded-full bg-primary",
                    )}
                  />
                  <span>
                    The document must show your name, student number, and
                    current term.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div
                    className={cn(
                      "mt-1 h-1 w-1 shrink-0",
                      "rounded-full bg-primary",
                    )}
                  />
                  <span>
                    Uploads are verified by extension, signature, and keywords.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div
                    className={cn(
                      "mt-1 h-1 w-1 shrink-0",
                      "rounded-full bg-primary",
                    )}
                  />
                  <span>
                    Only official PDF documents generated in PUP-SIS are valid.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0 z-[100] flex flex-col items-center",
              "justify-center bg-slate-950/40 shadow-md",
            )}
          >
            <div
              className={cn(
                "flex w-[calc(100%-2rem)] max-w-sm flex-col items-center",
                "gap-4 rounded-xl border border-border bg-card p-6",
                "shadow-2xl backdrop-blur-2xl sm:p-10",
              )}
            >
              <div className="relative">
                <RefreshCw
                  size={48}
                  className="animate-spin text-primary"
                />
                <div
                  className={cn(
                    "absolute inset-0 animate-ping rounded-full",
                    "border border-primary/20",
                  )}
                />
              </div>
              <div className="space-y-1 text-center">
                <h3 className="text-lg font-bold text-foreground">
                  Processing COR
                </h3>
                <p className="max-w-[280px] text-sm text-muted-foreground">
                  Extracting document details and validating academic term.
                  Please wait...
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
