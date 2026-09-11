import { useState, useCallback, useMemo, useRef } from "react";
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
import { PDFPreview } from "@/components/shared";

interface DropzoneProps {
  dragActive: boolean;
  selectedFile: File | null;
  inputId: string;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function CORUploadDropzone({
  dragActive,
  selectedFile,
  inputId,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileChange,
}: DropzoneProps) {
  return (
    <div
      className={cn(
        "group relative cursor-pointer rounded-xl border-2 border-dashed",
        "p-6 text-center transition-all duration-200 sm:p-8",
        dragActive
          ? "scale-[0.99] border-primary bg-primary/10"
          : "border-border/60 hover:border-primary/50 hover:bg-primary/5",
        selectedFile ? "border-emerald-500/50 bg-emerald-500/5" : "",
      )}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={() => document.getElementById(inputId)?.click()}
    >
      <input
        id={inputId}
        type="file"
        className="hidden"
        onChange={onFileChange}
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
      />

      <AnimatePresence mode="wait">
        {selectedFile ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <div
              className={cn(
                "mx-auto flex h-14 w-14 items-center justify-center",
                "rounded-full bg-emerald-500/15 text-emerald-500",
              )}
            >
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <p
                className={cn(
                  "mx-auto max-w-[260px] truncate text-sm font-semibold",
                  "text-foreground",
                )}
              >
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to
                upload
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div
              className={cn(
                "mx-auto flex h-14 w-14 items-center justify-center",
                "rounded-full bg-primary/10 text-primary transition-transform",
                "group-hover:scale-105",
              )}
            >
              <Upload className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Click to browse or drag file here
              </p>
              <p className="text-xs text-muted-foreground">
                Official PDF or scanned image (Max 5MB)
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CORGuidelinesCard() {
  return (
    <Card className="rounded-xl border border-border bg-muted/20 shadow-sm">
      <CardHeader className="p-4 pb-2">
        <h4
          className={cn(
            "flex items-center gap-2 text-xs font-bold uppercase",
            "tracking-wider text-muted-foreground",
          )}
        >
          <AlertCircle className="h-4 w-4 text-warning-foreground" />
          Upload Guidelines
        </h4>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>
              Filename must include <strong>"COR"</strong>,{" "}
              <strong>"Registration"</strong>, or{" "}
              <strong>"Certificate of Registration"</strong>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>
              Must clearly show your student number, full name, and active
              academic semester.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>
              Accepted formats: PDF, PNG, JPG, or JPEG up to 5MB in size.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>
              Only official registration certificates from PUP-SIS are verified.
            </span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}

export default function CORManagement() {
  const { user, refresh } = useAuth();
  const { triggerToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadingRef = useRef(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  usePageMetadata(
    useMemo(
      () => ({
        title: "COR Management",
        showSubHeader: true,
        description:
          "Manage your academic credentials and certificate of " +
          "registration.",
        isLoading: false,
        badgeText: "Student Credentials",
        badgeIcon: <ShieldCheck size={16} />,
      }),
      [],
    ),
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
        triggerToast(validation.error || "Please upload a valid COR file.");
        return false;
      }

      setSelectedFile(file);
      triggerToast("COR file selected. Click confirm to proceed.");
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const isValid = await validateAndSelectCorFile(e.target.files[0]);

      if (!isValid) {
        e.target.value = "";
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || uploadingRef.current) return;

    uploadingRef.current = true;
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const validation = await validateCorFile(selectedFile);

      if (!validation.isValid) {
        triggerToast(validation.error || "Please upload a valid COR file.");
        return;
      }

      await UploadCOR(selectedFile, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(percent);
          }
        },
      });
      await refresh();
      setSelectedFile(null);
      setIsUploadModalOpen(false);
      triggerToast("COR uploaded and validated successfully!");
    } catch (error: any) {
      const status = error.response?.status;
      if (status && status >= 500) {
        triggerToast(
          "Upload failed due to a server error. Please check your " +
            "document or try again.",
        );
      } else {
        const errMsg = getErrorMessage(error);
        if (errMsg.includes("couldn't connect to the server")) {
          triggerToast(
            "Connection failed. If you are on school Wi-Fi or VPN, " +
              "please switch networks.",
          );
        } else {
          triggerToast(errMsg);
        }
      }
    } finally {
      setIsUploading(false);
      uploadingRef.current = false;
    }
  };

  const corUrl = user?.studentCorUrl;
  const isPdf = corUrl?.toLowerCase().endsWith(".pdf");

  return (
    <div className="mx-auto w-full px-3 pb-24 sm:px-6 md:px-8">
      {!corUrl ? (
        /* State 1: Direct In-Page Upload Dropzone (No Indirection) */
        <div className="mx-auto max-w-3xl space-y-6 animate-fade-in-up">
          <Card
            className={cn(
              "overflow-hidden rounded-2xl border border-border",
              "bg-card shadow-sm",
            )}
          >
            <CardHeader
              className="border-b border-border/40 bg-muted/20 p-5 sm:p-6"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center",
                    "rounded-2xl border border-primary/20 bg-primary/10",
                    "text-primary",
                  )}
                >
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-foreground">
                    Upload Certificate of Registration
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Upload your official COR from PUP-SIS to verify your active
                    enrollment status.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-5 sm:p-6">
              <CORUploadDropzone
                dragActive={dragActive}
                selectedFile={selectedFile}
                inputId="cor-direct-upload"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onFileChange={handleFileChange}
              />

              {selectedFile && (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => setSelectedFile(null)}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 rounded-xl shadow-md"
                    onClick={handleUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-2 h-4 w-4" />
                    )}
                    Confirm & Upload COR
                  </Button>
                </div>
              )}

              <CORGuidelinesCard />
            </CardContent>
          </Card>
        </div>
      ) : (
        /* State 2: Dual-Pane Operational Workbench */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Pane: Status, Student Metadata, and Actions */}
          <div className="space-y-6 lg:col-span-4">
            <Card className="rounded-xl border border-border bg-card shadow-sm">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base font-bold text-foreground">
                    Academic Status
                  </CardTitle>
                  {user?.isStudentCorValid ? (
                    <Badge
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2.5 py-0.5",
                        "bg-emerald-500 text-[11px] font-semibold text-white",
                      )}
                    >
                      <CheckCircle2 className="h-3 w-3" /> Valid Term
                    </Badge>
                  ) : (
                    <Badge
                      variant="destructive"
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2.5 py-0.5",
                        "text-[11px] font-semibold",
                      )}
                    >
                      <AlertCircle className="h-3 w-3" /> Needs Update
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs leading-relaxed">
                  {user?.isStudentCorValid
                    ? "Your certificate is verified for the current semester."
                    : "Your certificate is outdated. Please upload your " +
                      "latest COR."}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 p-5 pt-1">
                <div
                  className={cn(
                    "divide-y divide-border rounded-xl border border-border",
                    "bg-muted/20 text-xs",
                  )}
                >
                  <div className="flex items-center justify-between p-3">
                    <span className="text-muted-foreground">Student No:</span>
                    <span className="font-semibold text-foreground">
                      {user?.studentNumber || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <span className="text-muted-foreground">Student Name:</span>
                    <span className="font-semibold text-foreground">
                      {user?.firstName} {user?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <span className="text-muted-foreground">Account:</span>
                    <span
                      className={cn(
                        "max-w-[160px] truncate font-medium text-foreground",
                      )}
                    >
                      {user?.email}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    onClick={() => {
                      setSelectedFile(null);
                      setIsUploadModalOpen(true);
                    }}
                    className="w-full gap-2 rounded-xl"
                  >
                    <Upload className="h-4 w-4" /> Replace / Update COR
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full gap-2 rounded-xl"
                    asChild
                  >
                    <a
                      href={`${import.meta.env.VITE_API_BASE_URL}${corUrl}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" /> Open Full View
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <CORGuidelinesCard />
          </div>

          {/* Right Pane: Document Viewer */}
          <div className="lg:col-span-8">
            <Card
              className={cn(
                "flex flex-col overflow-hidden rounded-xl border border-border",
                "bg-card shadow-sm",
              )}
            >
              <CardHeader
                className="border-b border-border/40 bg-muted/20 px-5 py-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Document Preview
                    </h3>
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-medium uppercase tracking-wider",
                      "text-muted-foreground",
                    )}
                  >
                    {isPdf ? "PDF Document" : "Image File"}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="h-[680px] p-0">
                {isPdf ? (
                  <PDFPreview
                    url={`${import.meta.env.VITE_API_BASE_URL}${corUrl}`}
                    className="h-full w-full border-none"
                    title="COR PDF Preview"
                  />
                ) : (
                  <div
                    className={cn(
                      "flex h-full w-full items-center justify-center",
                      "overflow-auto p-4 sm:p-8",
                    )}
                  >
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}${corUrl}`}
                      alt="COR Preview"
                      className={cn(
                        "block max-h-full max-w-full rounded-xl object-contain",
                        "shadow-md",
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Replacement Modal (Only triggered when replacing an existing COR) */}
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
            "max-w-xl border-border bg-card p-6 shadow-xl",
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Update Certificate of Registration
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Upload your latest COR to replace your current verified document.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <CORUploadDropzone
              dragActive={dragActive}
              selectedFile={selectedFile}
              inputId="cor-modal-upload"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onFileChange={handleFileChange}
            />

            {selectedFile && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setSelectedFile(null)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl shadow-md"
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Uploading Progress Overlay */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0 z-[100] flex flex-col items-center",
              "justify-center bg-slate-950/60 backdrop-blur-sm",
            )}
          >
            <div
              className={cn(
                "flex w-[calc(100%-2rem)] max-w-md flex-col items-center",
                "gap-6 rounded-2xl border border-border/40 bg-card/90 p-6",
                "shadow-2xl backdrop-blur-2xl sm:p-8",
              )}
            >
              <div className="space-y-1.5 text-center">
                <h3 className="text-xl font-bold text-foreground">
                  COR Upload Progress
                </h3>
                <p className="text-xs text-muted-foreground">
                  Processing file. Please do not close this window.
                </p>
              </div>

              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">
                    Overall Progress
                  </span>
                  <span className="font-bold text-primary">
                    {uploadProgress}%
                  </span>
                </div>
                <div
                  className={cn(
                    "h-2 w-full overflow-hidden rounded-full bg-muted/50",
                  )}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      "bg-primary",
                    )}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>

              <div className="w-full space-y-3 rounded-xl bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center",
                      "rounded-full text-[10px] font-bold",
                      uploadProgress === 100
                        ? "bg-emerald-500/20 text-emerald-500"
                        : "animate-pulse bg-primary/20 text-primary",
                    )}
                  >
                    {uploadProgress === 100 ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      "1"
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      uploadProgress === 100
                        ? "text-emerald-500"
                        : "text-foreground",
                    )}
                  >
                    Uploading COR file to server
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center",
                      "rounded-full text-[10px] font-bold",
                      uploadProgress < 100
                        ? "bg-muted-foreground/10 text-muted-foreground/50"
                        : "animate-pulse bg-primary/20 text-primary",
                    )}
                  >
                    2
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      uploadProgress < 100
                        ? "text-muted-foreground/50"
                        : "text-foreground",
                    )}
                  >
                    Extracting details (OCR Scanning)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center",
                      "rounded-full text-[10px] font-bold",
                      uploadProgress < 100
                        ? "bg-muted-foreground/10 text-muted-foreground/50"
                        : "animate-pulse bg-primary/20 text-primary",
                    )}
                  >
                    3
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      uploadProgress < 100
                        ? "text-muted-foreground/50"
                        : "text-foreground",
                    )}
                  >
                    Verifying academic settings
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
