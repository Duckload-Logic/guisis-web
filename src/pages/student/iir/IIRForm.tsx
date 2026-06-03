import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMe } from "@/features/users/hooks/useMe";
import {
  useIIRFormSave,
  useSaveIIRDraft,
  useGetIIRDraft,
  useTouchedState,
  useIIRProfile,
} from "@/features/iir/hooks";
import { IIRForm as IIRFormType } from "@/features/iir/types";
import {
  EMPTY_IIR_FORM,
  COMPLETE_IIR_FORM as completeIIRForm,
} from "@/features/iir/constants";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePageMetadata } from "@/context";
import { useToast } from "@/context";
import { Button } from "@/components/ui/button";
import { AnimationStyles } from "@/components/ui/animations";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertCircle,
  Save,
  ChevronLeft,
  ChevronRight,
  Check,
  User,
} from "lucide-react";
import {
  PersonalSection,
  EducationSection,
  FamilySection,
  HealthSection,
  InterestsSection,
} from "@/features/iir/components/form";
import {
  updateNestedField,
  createResetFormData,
  initializeFormData,
  calculateSectionCompletion,
  validateAllSections,
  validateSection,
} from "@/features/iir/utils/form";
import {
  FormErrorModal,
  groupErrorsBySection,
} from "@/features/iir/components/form/FormErrorModal";
import { SectionProgress } from "@/features/iir/components/form/SectionProgress";
import ConsentDialog from "@/features/iir/components/form/ConsentDialog";
import { cn } from "@/lib/utils";
import { PatchIIRSubmit } from "@/features/iir/services/service";
import { Skeleton } from "@/components/ui/skeleton";

function FormSectionSkeleton() {
  return (
    <div
      className={cn(
        "space-y-6 rounded-3xl border border-glass-border",
        "bg-glass-bg p-6 shadow-md",
      )}
    >
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>
      <hr className="border-glass-border" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="space-y-2"
          >
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

const FORM_SECTIONS = [
  { title: "Basic Info", id: 1, key: "personal_basic", main: 1 },
  { title: "Personal Profile", id: 2, key: "personal_profile", main: 1 },
  { title: "Address & Contact", id: 3, key: "personal_address", main: 1 },
  { title: "Employment", id: 4, key: "personal_employment", main: 1 },
  { title: "Educational Background", id: 5, key: "education", main: 2 },
  { title: "Home Environment", id: 6, key: "family_background", main: 3 },
  { title: "Father's Information", id: 7, key: "family_father", main: 3 },
  { title: "Mother's Information", id: 8, key: "family_mother", main: 3 },
  { title: "Guardian & Siblings", id: 9, key: "family_others", main: 3 },
  { title: "Health Information", id: 10, key: "health", main: 4 },
  { title: "Interests & Hobbies", id: 11, key: "interests", main: 5 },
];

export default function IIRForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editIirId = searchParams.get("iirId") || undefined;
  const isEditMode = searchParams.get("edit") === "true" && !!editIirId;
  const activeSections = useMemo(() => {
    if (isEditMode) {
      return FORM_SECTIONS.filter((s) =>
        [1, 2, 3, 4, 7, 8, 9].includes(s.id),
      ).map((s) => {
        if (s.id === 9) {
          return { ...s, title: "Guardian's Information" };
        }
        return s;
      });
    }
    return FORM_SECTIONS;
  }, [isEditMode]);

  const { data: me } = useMe({});

  const { saveDraft, clearDraft, lastSaved } = useSaveIIRDraft();
  const { draft, isLoadingDraft, draftError } = useGetIIRDraft();
  const { data: editProfileData, isLoading: isLoadingEditProfile } =
    useIIRProfile(editIirId || "");

  const { submitFormAsync, isSubmitting } = useIIRFormSave();

  // Touched state management
  const {
    markFieldTouched,
    markAllTouched,
    shouldShowError,
    resetTouched,
    clearFieldTouched,
  } = useTouchedState();

  const hasInitialized = useRef(false);
  const personalSectionRef = useRef<any>(null);
  const educationSectionRef = useRef<any>(null);
  const familySectionRef = useRef<any>(null);
  const healthSectionRef = useRef<any>(null);
  const interestsSectionRef = useRef<any>(null);

  const [currentSection, setCurrentSection] = useState<number>(1);
  const [visitedSections, setVisitedSections] = useState<number[]>(() => {
    const saved = localStorage.getItem("iir_visited_sections");
    const parsed = saved ? JSON.parse(saved) : [1];
    if (isEditMode) {
      const ids = [1, 2, 3, 4, 7, 8, 9];
      return parsed.filter((id: number) => ids.includes(id));
    }
    return parsed;
  });
  const currentIndex = activeSections.findIndex((s) => s.id === currentSection);
  const [localFormData, setLocalFormData] = useState<IIRFormType | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTransitioningStep, setIsTransitioningStep] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [sectionsWithErrors, setSectionsWithErrors] = useState<number[]>([]);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [draftData, setDraftData] = useState<IIRFormType | null>(null);
  const { triggerToast } = useToast();

  // Modal error state
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [groupedErrors, setGroupedErrors] = useState({});
  const [totalErrors, setTotalErrors] = useState(0);

  const [lastChangeTimestamp, setLastChangeTimestamp] = useState(0);

  const scrollToTop = () => {
    const container = document.querySelector("main")?.parentElement;
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleInputChange = useCallback((fieldPath: string, value: any) => {
    const path = fieldPath.split(".");
    setLocalFormData((prev: IIRFormType | null) =>
      updateNestedField(prev, path, value),
    );
    setLastChangeTimestamp(Date.now());
  }, []);

  useEffect(() => {
    const initializeForm = () => {
      if (
        isLoadingDraft ||
        isLoadingEditProfile ||
        !me ||
        hasInitialized.current
      )
        return;

      if (isEditMode && !editProfileData) return;

      const sourceData = isEditMode ? editProfileData || draft : draft;
      const initializedData = initializeFormData(
        // sourceData ?? null,
        completeIIRForm,
        EMPTY_IIR_FORM,
        me,
        { preserveBasicInfoFromSource: isEditMode },
      );
      setLocalFormData(initializedData);
      setIsInitializing(false);
      hasInitialized.current = true;
    };

    initializeForm();
  }, [
    isLoadingDraft,
    isLoadingEditProfile,
    isEditMode,
    editProfileData,
    draft,
    me,
  ]);

  useEffect(() => {
    if (isInitializing || !localFormData) return;

    const saveTimer = setTimeout(() => {
      autoSave();
    }, 1000);

    return () => clearTimeout(saveTimer);
  }, [localFormData, lastChangeTimestamp]);

  useEffect(() => {
    setVisitedSections((prev) => {
      if (!prev.includes(currentSection)) {
        const next = [...prev, currentSection];
        localStorage.setItem("iir_visited_sections", JSON.stringify(next));
        return next;
      }
      return prev;
    });
    localStorage.setItem("iir_current_section", currentSection.toString());
    scrollToTop();
  }, [currentSection]);

  useEffect(() => {
    const localDraftStr = localStorage.getItem(`iir_draft-student_${me?.id}`);
    if (localDraftStr) {
      try {
        const parsed = JSON.parse(localDraftStr) as IIRFormType;
        if (
          parsed.student?.basicInfo?.lastName ||
          parsed.student?.basicInfo?.firstName ||
          (parsed.family?.relatedPersons &&
            parsed.family.relatedPersons.length > 0)
        ) {
          setDraftData(parsed);
          setShowDraftPrompt(true);
        }
      } catch (e) {
        clearDraft();
      }
    }
  }, [clearDraft]);

  const handleRestoreDraft = () => {
    if (draftData) {
      setLocalFormData(draftData);
    }
    setShowDraftPrompt(false);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftPrompt(false);
  };

  const autoSave = async () => {
    if (!localFormData) return;

    try {
      await saveDraft(localFormData);
    } catch (err) {
      console.error("[AutoSave] Error saving draft:", err);
    }
  };

  const isLoading = isLoadingDraft || isLoadingEditProfile || isSubmitting;

  if (draftError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {draftError?.message || "Error loading draft data"}
        </AlertDescription>
      </Alert>
    );
  }

  const handleNextSection = async () => {
    // Validate current section using its ref
    const sectionRefs: Record<number, any> = {
      1: personalSectionRef,
      2: personalSectionRef,
      3: personalSectionRef,
      4: personalSectionRef,
      5: educationSectionRef,
      6: familySectionRef,
      7: familySectionRef,
      8: familySectionRef,
      9: familySectionRef,
      10: healthSectionRef,
      11: interestsSectionRef,
    };

    const validation = validateSection(sectionRefs[currentSection]);
    if (!validation.isValid) {
      markAllTouched();
      return;
    }

    if (currentIndex < activeSections.length - 1) {
      setCurrentSection(activeSections[currentIndex + 1].id);
    }

    setIsSaving(true);
    setIsTransitioningStep(true);
    try {
      if (localFormData) {
        await saveDraft(localFormData);
      }
    } catch (err: any) {
      console.error("Error saving section:", err);
    } finally {
      setIsSaving(false);
      setIsTransitioningStep(false);
    }
  };

  const handlePreviousSection = () => {
    if (currentIndex > 0) {
      setCurrentSection(activeSections[currentIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    // Mark all fields as touched so validation errors show
    markAllTouched();

    // Always trigger validate() on the current section so inline field errors show
    const currentSectionRefs: Record<number, any> = {
      1: personalSectionRef,
      2: personalSectionRef,
      3: personalSectionRef,
      4: personalSectionRef,
      5: educationSectionRef,
      6: familySectionRef,
      7: familySectionRef,
      8: familySectionRef,
      9: familySectionRef,
      10: healthSectionRef,
      11: interestsSectionRef,
    };
    currentSectionRefs[currentSection]?.current?.validate?.();

    // Validate all sections
    const sectionRefs: Record<number, any> = {
      1: personalSectionRef,
      2: personalSectionRef,
      3: personalSectionRef,
      4: personalSectionRef,
      5: educationSectionRef,
      6: familySectionRef,
      7: familySectionRef,
      8: familySectionRef,
      9: familySectionRef,
      10: healthSectionRef,
      11: interestsSectionRef,
    };

    const validationResult = validateAllSections(
      sectionRefs,
      activeSections,
      (sectionIndex) =>
        calculateSectionCompletion(
          sectionIndex,
          localFormData ?? null,
          isEditMode,
        ),
      currentSection,
    );

    if (validationResult.hasErrors) {
      setSectionsWithErrors(validationResult.sectionsWithErrors);

      const raw = validationResult.rawErrors || {};
      const total = Object.keys(raw).length;

      if (total > 0) {
        setGroupedErrors(groupErrorsBySection(raw));
        setTotalErrors(total);
        setIsErrorModalOpen(true);
      } else if (validationResult.incompleteCompletionSections.length > 0) {
        triggerToast("Please complete all sections before submitting.");
        if (
          !validationResult.incompleteCompletionSections.includes(
            currentSection,
          )
        ) {
          setCurrentSection(validationResult.incompleteCompletionSections[0]);
        }
      } else {
        triggerToast("Please fix errors before submitting.");
        if (!validationResult.sectionsWithErrors.includes(currentSection)) {
          setCurrentSection(validationResult.sectionsWithErrors[0]);
        }
      }
      return;
    }

    // All validations passed, clear section errors and open legal consent dialog
    clearDraft();
    setSectionsWithErrors([]);
    setShowConsentDialog(true);
  };

  const handleLegalConsentAccept = async () => {
    if (!localFormData) {
      triggerToast("Form data is missing. Please try again.");
      return;
    }

    setIsSaving(true);

    try {
      // Submit or update backend record (service handles transformation via normalizeIIRPayload)
      if (isEditMode && editIirId) {
        await PatchIIRSubmit(editIirId, localFormData);
      } else {
        await submitFormAsync(localFormData);
      }

      // Cleanup local draft on successful final submission
      clearDraft();

      // Success
      setShowConsentDialog(false);
      triggerToast(
        isEditMode
          ? "IIR profile updated successfully!"
          : "Form submitted successfully!",
      );
      setShowSuccessPopup(true);

      localStorage.setItem("refresh_student_profile", "true");
    } catch (err: any) {
      console.error("Error submitting form:", err);
      const errorMessage =
        err?.response?.data?.error ||
        "Failed to submit form. Please try again.";
      triggerToast(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLegalConsentCancel = () => {
    setShowConsentDialog(false);
  };

  const confirmReset = () => {
    if (!localFormData) return;

    setLocalFormData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      const fieldsToClearTouched: string[] = [];

      switch (currentSection) {
        case 1:
          updated.student = {
            ...updated.student,
            personalInfo: {
              ...updated.student.personalInfo,
              studentNumber: "",
              course: { id: 0 },
              yearLevel: 1,
              section: "",
            },
          };
          fieldsToClearTouched.push(
            "student.personalInfo.studentNumber",
            "student.personalInfo.course",
            "student.personalInfo.yearLevel",
            "student.personalInfo.section",
          );
          break;
        case 2:
          updated.student = {
            ...updated.student,
            personalInfo: {
              ...updated.student.personalInfo,
              suffix: "",
              gender: { id: 0 },
              civilStatus: { id: 0 },
              religion: { id: 0 },
              dateOfBirth: "",
              placeOfBirth: "",
              highSchoolGWA: "",
              heightM: "",
              weightKg: "",
              complexion: "",
            },
          };
          fieldsToClearTouched.push(
            "student.personalInfo.suffix",
            "student.personalInfo.gender",
            "student.personalInfo.civilStatus",
            "student.personalInfo.religion",
            "student.personalInfo.dateOfBirth",
            "student.personalInfo.placeOfBirth",
            "student.personalInfo.highSchoolGWA",
            "student.personalInfo.heightM",
            "student.personalInfo.weightKg",
            "student.personalInfo.complexion",
          );
          break;
        case 3:
          updated.student = {
            ...updated.student,
            personalInfo: {
              ...updated.student.personalInfo,
              mobileNumber: "",
              telephoneNumber: null,
              emergencyContact: {
                firstName: "",
                middleName: null,
                lastName: "",
                contactNumber: "",
                relationship: { id: 0 },
                address: {
                  region: { id: 0, code: "" },
                  province: null,
                  city: { id: 0, code: "" },
                  barangay: { id: 0, code: "" },
                  streetDetail: "",
                },
              },
            },
            addresses: [],
          };
          fieldsToClearTouched.push(
            "student.personalInfo.mobileNumber",
            "student.personalInfo.telephoneNumber",
            "student.personalInfo.emergencyContact.firstName",
            "student.personalInfo.emergencyContact.lastName",
            "student.personalInfo.emergencyContact.middleName",
            "student.personalInfo.emergencyContact.contactNumber",
            "student.personalInfo.emergencyContact.relationship",
            "student.personalInfo.emergencyContact.address.region",
            "student.personalInfo.emergencyContact.address.province",
            "student.personalInfo.emergencyContact.address.city",
            "student.personalInfo.emergencyContact.address.barangay",
            "student.addresses.0.address.region",
            "student.addresses.0.address.province",
            "student.addresses.0.address.city",
            "student.addresses.0.address.barangay",
            "student.addresses.1.address.region",
            "student.addresses.1.address.province",
            "student.addresses.1.address.city",
            "student.addresses.1.address.barangay",
          );
          break;
        case 4:
          updated.student = {
            ...updated.student,
            personalInfo: {
              ...updated.student.personalInfo,
              isEmployed: false,
              employerName: null,
              employerAddress: null,
              employerContactNumber: null,
            },
          };
          fieldsToClearTouched.push(
            "student.personalInfo.isEmployed",
            "student.personalInfo.employerName",
            "student.personalInfo.employerAddress",
            "student.personalInfo.employerContactNumber",
          );
          break;
        case 5:
          updated.education = {
            natureOfSchooling: "",
            interruptedDetails: null,
            schools: [],
          };
          fieldsToClearTouched.push(
            "education.natureOfSchooling",
            "education.interruptedDetails",
            "education.schools",
          );
          break;
        case 6:
          updated.family = {
            ...updated.family,
            background: {
              ...updated.family.background,
              parentalStatus: "",
              parentalStatusDetails: null,
              haveQuietPlaceToStudy: false,
              isSharingRoom: false,
              roomSharingDetails: null,
              natureOfResidence: {},
            } as any,
          };
          fieldsToClearTouched.push(
            "family.background.parentalStatus",
            "family.background.parentalStatusDetails",
            "family.background.haveQuietPlaceToStudy",
            "family.background.isSharingRoom",
            "family.background.roomSharingDetails",
            "family.background.natureOfResidence",
          );
          break;
        case 7:
          if (updated.family?.relatedPersons) {
            const related = [...updated.family.relatedPersons];
            related[0] = {
              firstName: "",
              middleName: null,
              lastName: "",
              dateOfBirth: "",
              educationalAttainment: { id: 0 },
              occupation: null,
              employerName: null,
              employerAddress: null,
              relationship: { id: 1 },
              isParent: true,
              isGuardian: false,
              isLiving: true,
            };
            updated.family = {
              ...updated.family,
              relatedPersons: related,
            };
          }
          fieldsToClearTouched.push(
            "family.relatedPersons.0.isLiving",
            "family.relatedPersons.0.firstName",
            "family.relatedPersons.0.middleName",
            "family.relatedPersons.0.lastName",
            "family.relatedPersons.0.dateOfBirth",
            "family.relatedPersons.0.educationalAttainment",
            "family.relatedPersons.0.occupation",
            "family.relatedPersons.0.employerName",
            "family.relatedPersons.0.employerAddress",
          );
          break;
        case 8:
          if (updated.family?.relatedPersons) {
            const related = [...updated.family.relatedPersons];
            related[1] = {
              firstName: "",
              middleName: null,
              lastName: "",
              dateOfBirth: "",
              educationalAttainment: { id: 0 },
              occupation: null,
              employerName: null,
              employerAddress: null,
              relationship: { id: 2 },
              isParent: true,
              isGuardian: false,
              isLiving: true,
            };
            updated.family = {
              ...updated.family,
              relatedPersons: related,
            };
          }
          fieldsToClearTouched.push(
            "family.relatedPersons.1.isLiving",
            "family.relatedPersons.1.firstName",
            "family.relatedPersons.1.middleName",
            "family.relatedPersons.1.lastName",
            "family.relatedPersons.1.dateOfBirth",
            "family.relatedPersons.1.educationalAttainment",
            "family.relatedPersons.1.occupation",
            "family.relatedPersons.1.employerName",
            "family.relatedPersons.1.employerAddress",
          );
          break;
        case 9:
          if (updated.family?.relatedPersons) {
            const related = [...updated.family.relatedPersons];
            related[2] = {
              firstName: "",
              middleName: null,
              lastName: "",
              dateOfBirth: "",
              educationalAttainment: { id: 0 },
              occupation: null,
              employerName: null,
              employerAddress: null,
              relationship: { id: 3 },
              isParent: false,
              isGuardian: true,
              isLiving: true,
            };
            updated.family = {
              ...updated.family,
              relatedPersons: related,
              background: {
                ...updated.family.background,
                brothers: 0,
                sisters: 0,
                employedSiblings: 0,
                ordinalPosition: 1,
              } as any,
              finance: {
                monthlyFamilyIncomeRange: { id: 0 },
                weeklyAllowance: "",
                financialSupportTypes: [],
              } as any,
            };
          }
          fieldsToClearTouched.push(
            "family.relatedPersons.2.relationship",
            "family.relatedPersons.2.isLiving",
            "family.relatedPersons.2.firstName",
            "family.relatedPersons.2.middleName",
            "family.relatedPersons.2.lastName",
            "family.relatedPersons.2.dateOfBirth",
            "family.relatedPersons.2.occupation",
            "family.relatedPersons.2.educationalAttainment",
            "family.background.brothers",
            "family.background.sisters",
            "family.background.employedSiblings",
            "family.background.ordinalPosition",
            "family.finance.monthlyFamilyIncomeRange",
            "family.finance.weeklyAllowance",
            "family.finance.financialSupportTypes",
          );
          break;
        case 10:
          updated.health = {
            healthRecord: {
              visionHasProblem: false,
              visionDetails: null,
              hearingHasProblem: false,
              hearingDetails: null,
              speechHasProblem: false,
              speechDetails: null,
              generalHealthHasProblem: false,
              generalHealthDetails: null,
              mentalEmotionalHasProblem: false,
              mentalEmotionalDetails: null,
            } as any,
            consultations: [],
          };
          fieldsToClearTouched.push(
            "health.healthRecord.visionHasProblem",
            "health.healthRecord.visionDetails",
            "health.healthRecord.hearingHasProblem",
            "health.healthRecord.hearingDetails",
            "health.healthRecord.speechHasProblem",
            "health.healthRecord.speechDetails",
            "health.healthRecord.generalHealthHasProblem",
            "health.healthRecord.generalHealthDetails",
            "health.healthRecord.mentalEmotionalHasProblem",
            "health.healthRecord.mentalEmotionalDetails",
            "health.consultations",
          );
          break;
        case 11:
          updated.interests = {
            activities: [],
            subjectPreferences: [],
            hobbies: [],
          };
          fieldsToClearTouched.push(
            "interests.activities",
            "interests.subjectPreferences",
            "interests.hobbies",
          );
          break;
        default:
          break;
      }

      fieldsToClearTouched.forEach((path) => {
        clearFieldTouched(path);
      });

      return updated;
    });

    setShowResetConfirm(false);
    triggerToast("Section has been reset.");
    scrollToTop();
  };

  const badgeIcon = useMemo(() => <User className="h-4 w-4" />, []);

  usePageMetadata({
    title: isEditMode
      ? "Edit Individual Inventory Record"
      : "Individual Inventory Record",
    description: isEditMode
      ? "Review and update your student profile information."
      : "Fill out your student information with confidence. " +
        "Your data is protected and used solely for " +
        "academic and guidance purposes.",
    badgeText: "Student Profile Portal",
    badgeIcon,
    isLoading,
  });

  return (
    <>
      <div className="transition-colors duration-500">
        <AnimationStyles />

        {/* Main Content Container */}
        <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-start lg:gap-10">
            {/* Sidebar Progress Tracker (Desktop) */}
            <aside className="hidden w-[300px] shrink-0 lg:sticky lg:top-24 lg:block">
              <SectionProgress
                sections={activeSections}
                currentSection={currentSection}
                sectionsWithErrors={sectionsWithErrors}
                visitedSections={visitedSections}
                onNavigate={(id: number) => {
                  setCurrentSection(id);
                  setSectionsWithErrors([]);
                }}
                calculateCompletion={(sectionIndex: number) =>
                  calculateSectionCompletion(
                    sectionIndex,
                    localFormData ?? null,
                    isEditMode,
                  )
                }
                lastSaved={lastSaved}
              />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1">
              <div className="flex flex-col gap-6">
                {/* Mobile/Tablet Progress Tracker */}
                <div className="lg:hidden">
                  <SectionProgress
                    sections={activeSections}
                    currentSection={currentSection}
                    sectionsWithErrors={sectionsWithErrors}
                    visitedSections={visitedSections}
                    onNavigate={(id: number) => {
                      setCurrentSection(id);
                      setSectionsWithErrors([]);
                    }}
                    calculateCompletion={(sectionIndex: number) =>
                      calculateSectionCompletion(
                        sectionIndex,
                        localFormData ?? null,
                        isEditMode,
                      )
                    }
                    lastSaved={lastSaved}
                  />
                </div>

                {/* Draft Restore Prompt */}
                {showDraftPrompt && (
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
                          onClick={handleDiscardDraft}
                          className={cn(
                            "flex-1 rounded-xl font-bold text-muted-foreground",
                            "hover:bg-neutral-100 dark:hover:bg-neutral-800 sm:flex-none",
                          )}
                        >
                          Discard
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleRestoreDraft}
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
                )}

                <div className="flex flex-col">
                  {/* Form Content Wrapper */}
                  <div className="">
                    {/* Floating Completion Pill */}
                    <div className="animate-in fade-in slide-in-from-right-4 mb-4 delay-300 duration-700">
                      <div
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border",
                          "bg-glass border-glass-border px-4 py-2",
                          "shadow-md backdrop-blur-md",
                        )}
                      >
                        <div
                          className={cn(
                            "h-2.5 w-2.5 animate-pulse rounded-full bg-primary",
                            "shadow-[0_0_10px_rgba(var(--primary),0.6)]",
                          )}
                        />
                        <span
                          className={cn(
                            "text-[11px] uppercase",
                            "text-neutral-700 dark:text-white",
                          )}
                        >
                          {calculateSectionCompletion(
                            currentSection,
                            localFormData ?? null,
                            isEditMode,
                          )}
                          % Form Progress
                        </span>
                      </div>
                    </div>

                    {/* Individual Form Sections */}
                    <div
                      className={cn(
                        "animate-in fade-in slide-in-from-bottom-8",
                        "fill-mode-both duration-700 ease-out",
                      )}
                    >
                      {isTransitioningStep ? (
                        <FormSectionSkeleton />
                      ) : (
                        <>
                          {[1, 2, 3, 4].includes(currentSection) &&
                            localFormData?.student && (
                              <PersonalSection
                                ref={personalSectionRef}
                                studentInfo={localFormData.student}
                                onChange={handleInputChange}
                                onFieldBlur={markFieldTouched}
                                shouldShowError={shouldShowError}
                                subStep={currentSection}
                                isEditMode={isEditMode}
                              />
                            )}
                          {currentSection === 5 && localFormData?.education && (
                            <EducationSection
                              ref={educationSectionRef}
                              education={localFormData.education}
                              onChange={handleInputChange}
                              onFieldBlur={markFieldTouched}
                              shouldShowError={shouldShowError}
                            />
                          )}
                          {[6, 7, 8, 9].includes(currentSection) &&
                            localFormData?.family && (
                              <FamilySection
                                ref={familySectionRef}
                                family={localFormData.family}
                                onChange={handleInputChange}
                                onFieldBlur={markFieldTouched}
                                shouldShowError={shouldShowError}
                                subStep={currentSection - 5}
                                isEditMode={isEditMode}
                              />
                            )}
                          {currentSection === 10 && localFormData?.health && (
                            <HealthSection
                              ref={healthSectionRef}
                              health={localFormData.health}
                              onChange={handleInputChange}
                              onFieldBlur={markFieldTouched}
                              shouldShowError={shouldShowError}
                              isEditMode={isEditMode}
                            />
                          )}
                          {currentSection === 11 &&
                            localFormData?.interests && (
                              <InterestsSection
                                ref={interestsSectionRef}
                                interests={localFormData.interests}
                                onChange={handleInputChange}
                                onFieldBlur={markFieldTouched}
                                shouldShowError={shouldShowError}
                              />
                            )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Form Navigation Action Bar */}
                  <div
                    className={cn(
                      "animate-in fade-in slide-in-from-bottom-4 flex",
                      "flex-col items-center justify-between gap-4 rounded-xl",
                      "border border-glass-border bg-glass-bg p-5",
                      "shadow-md",
                      "delay-500 duration-700 md:flex-row",
                    )}
                  >
                    <Button
                      variant="ghost"
                      onClick={() => setShowResetConfirm(true)}
                      className={cn(
                        "rounded-xl px-4 font-bold text-neutral-400 transition-all",
                        "duration-300 hover:bg-destructive/10 hover:text-destructive",
                        "sm:px-6",
                      )}
                    >
                      Reset Section
                    </Button>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={handlePreviousSection}
                        disabled={currentSection === 1 || isSaving}
                        className={cn(
                          "flex h-12 items-center gap-2 rounded-2xl",
                          "border-neutral-200/50 bg-white/30 px-5 font-bold",
                          "text-neutral-700 shadow-sm transition-all duration-300",
                          "hover:bg-white/60 dark:border-white/10 dark:bg-white/5",
                          "dark:text-neutral-200 dark:hover:bg-white/10 sm:px-7",
                        )}
                      >
                        <ChevronLeft className="h-5 w-5" />
                        <span className="hidden sm:inline">Back</span>
                      </Button>

                      {currentIndex < activeSections.length - 1 ? (
                        <Button
                          onClick={handleNextSection}
                          disabled={isSaving}
                          className={cn(
                            "flex h-12 items-center gap-2 rounded-2xl bg-primary px-6",
                            "font-black tracking-tight text-primary-foreground shadow-xl",
                            "shadow-primary/20 transition-all duration-300",
                            "hover:bg-primary/90 active:scale-95 sm:px-10",
                          )}
                        >
                          {isSaving ? (
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "border-3 h-5 w-5 animate-spin rounded-full",
                                  "border-primary-foreground border-t-transparent",
                                )}
                              />
                              <span>Saving...</span>
                            </div>
                          ) : (
                            <>
                              <span>Next Step</span>
                              <ChevronRight className="h-5 w-5" />
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleSubmit}
                          disabled={isSaving}
                          className={cn(
                            "flex h-12 items-center gap-2 rounded-2xl bg-primary",
                            "px-6 tracking-tight",
                            "text-primary-foreground shadow-xl shadow-primary/20",
                            "transition-all duration-300 hover:bg-primary/90",
                            "active:scale-95 sm:px-10",
                          )}
                        >
                          {isSubmitting ? (
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "border-3 h-5 w-5 animate-spin rounded-full",
                                  "border-primary-foreground border-t-transparent",
                                )}
                              />
                              <span>Submitting...</span>
                            </div>
                          ) : (
                            <>
                              <Save className="h-5 w-5" />
                              <span>
                                {isEditMode
                                  ? "Save Changes"
                                  : "Complete Profile"}
                              </span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overlays & Modals */}
        <ConsentDialog
          open={showConsentDialog}
          onAccept={handleLegalConsentAccept}
          onCancel={handleLegalConsentCancel}
          isSubmitting={isSaving}
        />

        <SuccessPopup
          isOpen={showSuccessPopup}
          onReturn={() => navigate(isEditMode ? "/student/iir" : "/student")}
          isEditMode={isEditMode}
        />

        <AlertDialog
          open={showResetConfirm}
          onOpenChange={(open) => setShowResetConfirm(open)}
        >
          <AlertDialogContent
            className={cn(
              "max-w-sm rounded-3xl shadow-md",
              "backdrop-blur-3xl",
            )}
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl">
                Reset this section?
              </AlertDialogTitle>
              <AlertDialogDescription
                className={cn(
                  "font-medium text-neutral-500",
                  "dark:text-neutral-400",
                )}
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
                onClick={confirmReset}
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

        <FormErrorModal
          isOpen={isErrorModalOpen}
          onClose={() => setIsErrorModalOpen(false)}
          groupedErrors={groupedErrors}
          totalErrors={totalErrors}
          onNavigateToSection={(id) => setCurrentSection(id)}
        />
      </div>
    </>
  );
}

/**
 * Premium Success Popup Component
 */
function SuccessPopup({
  isOpen,
  onReturn,
  isEditMode = false,
}: {
  isOpen: boolean;
  onReturn: () => void;
  isEditMode?: boolean;
}) {
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
            <div
              className={cn(
                "absolute inset-0 rounded-full",
                "bg-green-500/20 blur-2xl",
              )}
            />
            <div
              className={cn(
                "relative flex h-20 w-20 items-center justify-center",
                "animate-bounce rounded-full bg-green-500 shadow-xl",
                "shadow-green-500/30",
              )}
            >
              <Check
                className="h-10 w-10 text-white"
                strokeWidth={4}
              />
            </div>
          </div>
        </div>

        <h3
          className={cn(
            "text-3xl font-[900]",
            "text-neutral-900 dark:text-white",
          )}
        >
          All Done!
        </h3>

        <p
          className={cn(
            "px-4 font-medium",
            "text-neutral-500 dark:text-neutral-400",
          )}
        >
          {isEditMode
            ? "Your Individual Inventory Record has been successfully " +
              "updated and saved."
            : "Your Individual Inventory Record has been successfully " +
              "submitted and saved to our secure database."}
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
