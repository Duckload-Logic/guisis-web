import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  FileUp,
  CheckCircle2,
  AlertCircle,
  FileText,
  Info,
  X,
  MapPin,
  HelpCircle,
  Folder,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { SelectField } from "@/components/ui/select-field";
import { FormField } from "@/components/ui/form-field";
import { PDFPreview } from "@/components/shared";
import { ExistingFileCard } from "./components/ExistingFileCard";
import { LocalFileCard } from "./components/LocalFileCard";
import {
  useGetSlipCategories,
  useSubmitSlip,
  useUpdateSlip,
  useGetSlipById,
  useGetSlipAttachments,
} from "@/features/slips/hooks";
import { CreateSlipRequest } from "@/features/slips/types";
import { usePageMetadata, useToast } from "@/context";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api";
import goodCertImage from "@/assets/images/good-certificate-example.png";
import badCertImage from "@/assets/images/bad-certificate-example.png";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_REASON_CHARS = 500;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"];

type DocumentType = "excuseLetter" | "parentId" | "medicalCert";

interface SubmitSlipFormState {
  dateOfAbsence: string;
  dateNeeded: string;
  reason: string;
  categoryId: number;
  files: {
    excuseLetter: File[];
    parentId: File[];
    medicalCert: File[];
  };
}

const EMPTY_FORM_DATA: SubmitSlipFormState = {
  dateOfAbsence: "",
  dateNeeded: "",
  reason: "",
  categoryId: 0,
  files: {
    excuseLetter: [],
    parentId: [],
    medicalCert: [],
  },
};

export default function SubmitSlip() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { triggerToast } = useToast();
  const submittingRef = useRef(false);

  const [formData, setFormData] =
    useState<SubmitSlipFormState>(EMPTY_FORM_DATA);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState<{
    file: File;
    url: string;
  } | null>(null);
  const [isGuidelineModalOpen, setIsGuidelineModalOpen] = useState(false);
  const [keptAttachments, setKeptAttachments] = useState<any[]>([]);

  const { data: categories = [], isLoading: isCategoriesLoading } =
    useGetSlipCategories();
  const { data: existingSlip } = useGetSlipById(id || "");
  const { data: existingAttachments = [] } = useGetSlipAttachments(
    isEditMode ? id : undefined,
  );

  const { mutate: submitSlip, isPending: isSubmitting } = useSubmitSlip();
  const { mutate: updateSlip, isPending: isUpdating } = useUpdateSlip();

  usePageMetadata(
    useMemo(
      () => ({
        title: isEditMode
          ? "Edit Admission Slip"
          : "Submit Admission Slip Request",
        description: "Submit your excuse letter and supporting documents",
        badgeText: "Student Portal",
        badgeIcon: <FileUp className="h-4 w-4" />,
      }),
      [isEditMode],
    ),
  );

  useEffect(() => {
    if (isEditMode && existingAttachments.length > 0) {
      setKeptAttachments(existingAttachments);
    }
  }, [isEditMode, existingAttachments]);

  useEffect(() => {
    if (isEditMode && existingSlip) {
      setFormData({
        dateOfAbsence: existingSlip.dateOfAbsence
          ? new Date(existingSlip.dateOfAbsence).toISOString().split("T")[0]
          : "",
        dateNeeded: existingSlip.dateNeeded
          ? new Date(existingSlip.dateNeeded).toISOString().split("T")[0]
          : "",
        reason: existingSlip.reason,
        categoryId: existingSlip.category?.id || 0,
        files: {
          excuseLetter: [],
          parentId: [],
          medicalCert: [],
        },
      });
    }
  }, [isEditMode, existingSlip]);

  const getKeptFiles = (type: DocumentType) => {
    return keptAttachments.filter((att) =>
      att.fileName?.toLowerCase().startsWith(type.toLowerCase()),
    );
  };

  const selectedCategory = categories.find((c) => c.id === formData.categoryId);

  const isMedicalCategory = useMemo(() => {
    if (!selectedCategory) return false;
    const catName = selectedCategory.name?.toLowerCase() || "";
    return (
      catName.includes("medical") ||
      catName.includes("health") ||
      catName.includes("illness") ||
      catName.includes("sick")
    );
  }, [selectedCategory]);

  const datesComplete = !!(formData.dateOfAbsence && formData.dateNeeded);
  const categoryComplete =
    formData.categoryId > 0 && formData.reason.trim().length > 0;
  const excuseLetterProvided =
    formData.files.excuseLetter.length > 0 ||
    getKeptFiles("excuseLetter").length > 0;
  const parentIdProvided =
    formData.files.parentId.length > 0 || getKeptFiles("parentId").length > 0;
  const medicalCertProvided =
    !isMedicalCategory ||
    formData.files.medicalCert.length > 0 ||
    getKeptFiles("medicalCert").length > 0;

  const isFormValid =
    datesComplete &&
    categoryComplete &&
    excuseLetterProvided &&
    parentIdProvided &&
    medicalCertProvided;

  const handleDateChange = (
    field: "dateOfAbsence" | "dateNeeded",
    value: string,
  ) => {
    if (field === "dateOfAbsence" && value) {
      const selected = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selected > today) {
        triggerToast("Date of absence cannot be in the future.");
        return;
      }
    }

    if (field === "dateNeeded" && value) {
      const selected = new Date(value);
      selected.setHours(23, 59, 59, 999);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        triggerToast("Date needed cannot be in the past.");
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const sanitizeFileNames = (
    documentType: DocumentType,
    filesList: File[],
  ): File[] => {
    return filesList.map((file, idx) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const newName = `${documentType}-page-${idx + 1}.${ext}`;
      if (file.name === newName) return file;
      return new File([file], newName, { type: file.type });
    });
  };

  const handleFileAdd = (documentType: DocumentType, files: FileList | null) => {
    if (!files) return;

    const allFiles = Array.from(files);
    const currentTotalSize = formData.files[documentType].reduce(
      (acc, f) => acc + f.size,
      0,
    );

    let incomingSize = 0;
    const validFiles: File[] = [];

    for (const file of allFiles) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      const isValidType =
        ALLOWED_TYPES.includes(file.type) ||
        ALLOWED_EXTENSIONS.includes(extension);

      if (!isValidType) {
        triggerToast(`File "${file.name}" has an unsupported format.`);
      } else {
        validFiles.push(file);
        incomingSize += file.size;
      }
    }

    if (validFiles.length === 0) return;

    if (currentTotalSize + incomingSize > MAX_FILE_SIZE_BYTES) {
      triggerToast("Total size for this category must not exceed 5MB.");
      return;
    }

    setFormData((prev) => {
      const updated = [...prev.files[documentType], ...validFiles];
      return {
        ...prev,
        files: {
          ...prev.files,
          [documentType]: sanitizeFileNames(documentType, updated),
        },
      };
    });
  };

  const handleFileRemove = (documentType: DocumentType, index: number) => {
    setFormData((prev) => {
      const filtered = prev.files[documentType].filter((_, i) => i !== index);
      return {
        ...prev,
        files: {
          ...prev.files,
          [documentType]: sanitizeFileNames(documentType, filtered),
        },
      };
    });
  };

  const handleSubmit = async () => {
    if (!isFormValid || submittingRef.current) return;

    submittingRef.current = true;
    setUploadProgress(0);

    const payload: CreateSlipRequest = {
      reason: formData.reason,
      dateOfAbsence: new Date(formData.dateOfAbsence)
        .toISOString()
        .split("T")[0],
      dateNeeded: new Date(formData.dateNeeded).toISOString().split("T")[0],
      categoryId: formData.categoryId,
      files: {
        excuseLetter: formData.files.excuseLetter,
        parentId: formData.files.parentId,
        medicalCert: formData.files.medicalCert,
      },
      keepFileIds: isEditMode
        ? keptAttachments.map((att) => att.id)
        : undefined,
    };

    const progressHandler = (progressEvent: any) => {
      if (progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        setUploadProgress(percent);
      }
    };

    if (isEditMode && id) {
      updateSlip(
        { id, data: payload, onUploadProgress: progressHandler },
        {
          onSuccess: () => {
            submittingRef.current = false;
            triggerToast("Admission slip updated successfully");
            navigate(`/student/slips/${id}`);
          },
          onError: (error: any) => {
            submittingRef.current = false;
            triggerToast(getErrorMessage(error));
          },
        },
      );
    } else {
      submitSlip(
        { ...payload, onUploadProgress: progressHandler },
        {
          onSuccess: () => {
            submittingRef.current = false;
            triggerToast("Admission slip submitted successfully");
            navigate("/student/slips");
          },
          onError: (error: any) => {
            submittingRef.current = false;
            if (error.message?.includes("IIR profile")) {
              navigate("/iir-form");
            } else {
              triggerToast(getErrorMessage(error));
            }
          },
        },
      );
    }
  };

  const renderUploadDropzone = (
    documentType: DocumentType,
    title: string,
    badgeText: string,
    description: string,
    isMandatory: boolean,
  ) => {
    const localFiles = formData.files[documentType];
    const keptFiles = getKeptFiles(documentType);
    const hasFiles = localFiles.length > 0 || keptFiles.length > 0;

    return (
      <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{title}</span>
            <Badge
              variant={isMandatory ? "destructive" : "secondary"}
              className="text-[10px]"
            >
              {badgeText}
            </Badge>
          </div>
          {hasFiles && (
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[10px]"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Attached ({localFiles.length + keptFiles.length})
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>

        {/* Existing & Local File Cards */}
        {hasFiles && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
            {keptFiles.map((file) => (
              <ExistingFileCard
                key={file.id}
                slipId={id || ""}
                file={file}
                onRemove={() => {
                  setKeptAttachments((prev) =>
                    prev.filter((x) => x.id !== file.id),
                  );
                }}
              />
            ))}
            {localFiles.map((file, idx) => (
              <LocalFileCard
                key={`${documentType}-${idx}`}
                file={file}
                onRemove={() => handleFileRemove(documentType, idx)}
                onPreview={(f, url) => setPreviewData({ file: f, url })}
              />
            ))}
          </div>
        )}

        {/* Upload Button Dropzone */}
        <div className="relative flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 transition-colors hover:border-primary/50 hover:bg-muted/40">
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileAdd(documentType, e.target.files)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Folder className="h-4 w-4 text-primary" />
            <span>Click or drag to attach {title.toLowerCase()}</span>
            <span className="text-[10px] text-muted-foreground/60">
              (PDF, JPG, PNG ≤ 5MB)
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-12 sm:px-6 md:px-8">
      {/* 2-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Form & Attachments (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card 1: Absence Details */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">
                  1. Absence & Filing Details
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your absence date and state your reason for filing
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DatePicker
                  label="Date of Absence"
                  required
                  value={formData.dateOfAbsence}
                  onChange={(val) => handleDateChange("dateOfAbsence", val)}
                />
                <DatePicker
                  label="Date Needed"
                  required
                  value={formData.dateNeeded}
                  onChange={(val) => handleDateChange("dateNeeded", val)}
                />
              </div>

              <SelectField
                label="Absence Category"
                value={formData.categoryId}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    categoryId: Number(val),
                  }))
                }
                options={categories}
                loading={isCategoriesLoading}
                required
              />

              <FormField
                label="Reason for Absence"
                value={formData.reason}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, reason: val }))
                }
                placeholder="Explain why you were absent"
                isTextarea
                required
                maxChars={MAX_REASON_CHARS}
                info="This will be reviewed by the guidance counselor upon validation."
              />
            </CardContent>
          </Card>

          {/* Card 2: Required Supporting Documents */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-semibold">
                    2. Supporting Documents
                  </CardTitle>
                </div>
                {isMedicalCategory && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsGuidelineModalOpen(true)}
                    className="h-8 gap-1.5 rounded-lg text-xs"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-primary" />
                    Nurse Sign-off Guide
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload clear photocopies or digital files of all required
                documents
              </p>
            </CardHeader>

            <CardContent className="space-y-4 p-4 sm:p-6">
              {/* 1. Excuse Letter */}
              {renderUploadDropzone(
                "excuseLetter",
                "Excuse Letter",
                "Required",
                "Parent or legal guardian signature required placed above their printed name.",
                true,
              )}

              {/* 2. Parent / Guardian ID */}
              {renderUploadDropzone(
                "parentId",
                "Parent / Guardian ID",
                "Required",
                "1-page clear copy of parent or legal guardian's valid government/company ID with signature.",
                true,
              )}

              {/* 3. Medical Certificate */}
              {renderUploadDropzone(
                "medicalCert",
                "Medical Certificate",
                isMedicalCategory ? "Required for Medical Cases" : "Optional",
                isMedicalCategory
                  ? "Must be signed by the University Nurse prior to filing."
                  : "Only required for medical or illness-related absences.",
                isMedicalCategory,
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sticky Filing Summary Sidebar (4 cols) */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:col-span-4">
          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/60 pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Filing Checklist & Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Dates Pill */}
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Filing Timeline
                </span>
                <div className="mt-1 flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Absence: {formData.dateOfAbsence || "—"}</span>
                  <span>Needed: {formData.dateNeeded || "—"}</span>
                </div>
              </div>

              {/* Category */}
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Category
                </span>
                <p className="mt-1 text-xs font-semibold text-foreground">
                  {selectedCategory?.name || (
                    <span className="italic text-muted-foreground">
                      No category selected
                    </span>
                  )}
                </p>
              </div>

              {/* Readiness Checklist (3-Click Rule) */}
              <div className="space-y-2 border-t border-border/60 pt-3">
                <span className="text-xs font-semibold text-muted-foreground">
                  Filing Checklist (3-Click Rule):
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    {datesComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span
                      className={cn(
                        datesComplete
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      Absence dates filled
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {categoryComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span
                      className={cn(
                        categoryComplete
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      Category & reason provided
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {excuseLetterProvided ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span
                      className={cn(
                        excuseLetterProvided
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      Excuse letter attached
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {parentIdProvided ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span
                      className={cn(
                        parentIdProvided
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      Parent/Guardian ID attached
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {medicalCertProvided ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span
                      className={cn(
                        medicalCertProvided
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {isMedicalCategory
                        ? "Medical certificate attached"
                        : "Medical certificate (Not required)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Physical Protocol Callout */}
              <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-foreground">
                  Please bring all original physical copies to the Guidance
                  Office when claiming your slip.
                </p>
              </div>

              {/* Primary Action Button */}
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting || isUpdating}
                className="w-full rounded-xl py-5 text-sm font-semibold shadow-sm"
              >
                {isSubmitting || isUpdating
                  ? `Uploading... ${uploadProgress}%`
                  : isEditMode
                    ? "Update Admission Slip"
                    : "Submit Admission Slip"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Guidelines Modal Dialog */}
      <Dialog
        open={isGuidelineModalOpen}
        onOpenChange={setIsGuidelineModalOpen}
      >
        <DialogContent className="max-w-2xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              University Nurse Sign-off Requirement
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              For all medical cases, medical certificates must have the
              University Clinic Nurse signature before submission.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-center">
              <Badge
                variant="outline"
                className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" /> Valid Example
              </Badge>
              <img
                src={goodCertImage}
                alt="Valid certificate example"
                className="mt-3 max-h-48 w-full object-contain"
              />
            </div>
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-center">
              <Badge
                variant="outline"
                className="border-destructive/40 bg-destructive/10 text-destructive"
              >
                <X className="mr-1 h-3 w-3" /> Invalid (Unsigned)
              </Badge>
              <img
                src={badCertImage}
                alt="Invalid certificate example"
                className="mt-3 max-h-48 w-full object-contain"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Local File Preview Dialog */}
      <Dialog
        open={!!previewData}
        onOpenChange={(open) => !open && setPreviewData(null)}
      >
        <DialogContent className="max-w-3xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {previewData?.file.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Local document preview
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex min-h-[320px] items-center justify-center">
            {previewData?.file.type.startsWith("image/") ? (
              <img
                src={previewData.url}
                alt="Preview"
                className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-md"
              />
            ) : previewData?.file.type === "application/pdf" ? (
              <PDFPreview
                url={previewData.url}
                className="h-[60vh] w-full rounded-xl"
                title="Document Preview"
              />
            ) : (
              <div className="text-xs text-muted-foreground">
                Preview not available for this file type.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
