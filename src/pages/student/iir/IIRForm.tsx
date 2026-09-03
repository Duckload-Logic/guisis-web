import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, User } from "lucide-react";
import { GetAcademicSettings } from "@/features/student-core/services/academicSettingsService";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AnimationStyles } from "@/components/ui/animations";
import { usePageMetadata, useToast } from "@/context";
import { useIIRProfile, useIIRStatus, useUserIIR } from "@/features/iir/hooks";
import {
  useGetIIRDraft,
  useIIRFormSave,
  useSaveIIRDraft,
  useTouchedState,
} from "@/features/iir/hooks";
import { EMPTY_IIR_FORM } from "@/features/iir/constants";
import {
  PatchIIRSubmit,
  UploadIIRTwoByTwoPhoto,
} from "@/features/iir/services/service";
import type { IIRForm as IIRFormType } from "@/features/iir/types";
import {
  calculateSectionCompletion,
  initializeFormData,
  updateNestedField,
  validateAllSections,
  validateSection,
} from "@/features/iir/utils/form";
import {
  FormErrorModal,
  groupErrorsBySection,
} from "@/features/iir/components/form/FormErrorModal";
import { SectionProgress } from "@/features/iir/components/form/SectionProgress";
import ConsentDialog from "@/features/iir/components/form/ConsentDialog";
import { useMe } from "@/features/users/hooks/useMe";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api";
import {
  getIIRTwoByTwoPhoto,
  getTwoByTwoPhotoIdentityFromForm,
  saveIIRTwoByTwoPhoto,
  dataUrlToFile,
} from "@/features/iir/utils/twoByTwoPhoto";

import {
  IIRDraftPrompt,
  IIRFormNavigation,
  IIRProgressPill,
  IIRResetConfirmDialog,
  IIRSectionRenderer,
  IIRSuccessPopup,
} from "./components";
import { getActiveIIRSections } from "./config/iirFormSections";

const PHOTO_REQUIRED_SECTION = 1;
const PHOTO_REQUIRED_FIELD = "student.personalInfo.twoByTwoPhotoDataUrl";
const PHOTO_REQUIRED_MESSAGE =
  "Upload your required 2x2 profile photo before moving to the next step.";

export default function IIRForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const editIirId = searchParams.get("iirId") || undefined;
  const isEditMode = searchParams.get("edit") === "true" && !!editIirId;
  const activeSections = useMemo(
    () => getActiveIIRSections(isEditMode),
    [isEditMode],
  );

  const { data: me } = useMe({});

  const { saveDraft, clearDraft, lastSaved } = useSaveIIRDraft();
  const { draft, isLoadingDraft, draftError } = useGetIIRDraft();

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
    return saved ? JSON.parse(saved) : [1];
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
  const [showPhotoValidationWarning, setShowPhotoValidationWarning] =
    useState(false);
  const { triggerToast } = useToast();

  const { data: statusData, isLoading: isLoadingStatus } = useIIRStatus();
  const isSubmitted = statusData?.isSubmitted ?? false;
  const isCompleted = statusData?.isCompleted ?? false;

  const profileId =
    editIirId ||
    (isSubmitted && !isCompleted ? statusData?.id : undefined);
  const { data: profileData, isLoading: isLoadingProfile } = useIIRProfile(
    profileId || "",
  );

  useEffect(() => {
    if (!isLoadingStatus && isSubmitted && isCompleted && !isEditMode) {
      triggerToast("You have already submitted your IIR.");
      navigate("/student/iir", { replace: true });
    }
  }, [
    isSubmitted,
    isCompleted,
    isLoadingStatus,
    isEditMode,
    navigate,
    triggerToast,
  ]);

  const [isExpressSubmitting, setIsExpressSubmitting] = useState(false);

  const { data: academicSettings } = useQuery({
    queryKey: ["counselor", "academicSettings"],
    queryFn: GetAcademicSettings,
    staleTime: 1000 * 60 * 5,
  });

  const isNonFreshman = useMemo(() => {
    const studentNumber = localFormData?.student?.personalInfo?.studentNumber;
    if (!studentNumber || !academicSettings?.currentYearStart) {
      return false;
    }
    const match = studentNumber.match(/^(\d{4})/);
    if (!match) return false;
    const enrollmentYear = parseInt(match[1], 10);
    return enrollmentYear < academicSettings.currentYearStart;
  }, [
    localFormData?.student?.personalInfo?.studentNumber,
    academicSettings?.currentYearStart,
  ]);

  const showExpressSubmit =
    currentSection === 3 &&
    academicSettings?.allowExpeditedIIR &&
    isNonFreshman &&
    !isEditMode;

  const handleExpressSubmit = async () => {
    if (!localFormData) return;

    const sectionRefs: Record<number, any> = {
      1: personalSectionRef,
      2: personalSectionRef,
      3: personalSectionRef,
    };

    let hasErrors = false;
    const allErrors: Record<string, string> = {};

    for (let sec = 1; sec <= 3; sec++) {
      const validation = validateSection(sectionRefs[sec], sec);
      if (!validation.isValid) {
        hasErrors = true;
        Object.assign(allErrors, validation.errors || {});
      }
    }

    if (hasErrors) {
      markAllTouched();
      const total = Object.keys(allErrors).length;
      if (total > 0) {
        setGroupedErrors(groupErrorsBySection(allErrors));
        setTotalErrors(total);
        setIsErrorModalOpen(true);
      }
      return;
    }

    setIsExpressSubmitting(true);
    setShowConsentDialog(true);
  };

  // Modal error state
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [groupedErrors, setGroupedErrors] = useState({});
  const [totalErrors, setTotalErrors] = useState(0);

  const [lastChangeTimestamp, setLastChangeTimestamp] = useState(0);

  const hasRequiredPhoto = Boolean(
    localFormData?.student?.personalInfo?.twoByTwoPhotoDataUrl,
  );
  const isOnPhotoRequiredStep = currentSection === PHOTO_REQUIRED_SECTION;
  const isPhotoStepBlocked = isOnPhotoRequiredStep && !hasRequiredPhoto;

  const scrollToTop = () => {
    const performScroll = () => {
      window.scrollTo({ top: 0, behavior: "auto" });
      document.documentElement.scrollTo({ top: 0, behavior: "auto" });
      document.body.scrollTo({ top: 0, behavior: "auto" });
      let el = document.querySelector("main") as HTMLElement | null;
      while (el) {
        if (typeof el.scrollTo === "function") {
          el.scrollTo({ top: 0, behavior: "auto" });
        }
        el = el.parentElement;
      }
    };
    performScroll();
    requestAnimationFrame(performScroll);
    setTimeout(performScroll, 50);
    setTimeout(performScroll, 150);
    setTimeout(performScroll, 300);
  };

  const handleInputChange = useCallback((fieldPath: string, value: any) => {
    const path = fieldPath.split(".");
    setLocalFormData((prev: IIRFormType | null) =>
      updateNestedField(prev, path, value),
    );
    if (fieldPath === PHOTO_REQUIRED_FIELD && value) {
      setShowPhotoValidationWarning(false);
    }
    setLastChangeTimestamp(Date.now());
  }, []);

  const persistTwoByTwoPhoto = useCallback(
    (formData?: IIRFormType | null) => {
      const photoDataUrl =
        formData?.student?.personalInfo?.twoByTwoPhotoDataUrl;
      if (!photoDataUrl) return;

      saveIIRTwoByTwoPhoto(
        photoDataUrl,
        getTwoByTwoPhotoIdentityFromForm(formData, (me as any)?.id, profileId),
      );
    },
    [profileId, me],
  );

  useEffect(() => {
    const initializeForm = () => {
      if (
        isLoadingDraft ||
        isLoadingProfile ||
        isLoadingStatus ||
        !me ||
        hasInitialized.current
      )
        return;

      if (profileId && !profileData) return;

      const sourceData = profileId
        ? profileData || draft
        : draft;
      const initializedData = initializeFormData(
        sourceData ?? null,
        EMPTY_IIR_FORM,
        me,
        { preserveBasicInfoFromSource: !!profileId },
      );
      const savedPhoto = getIIRTwoByTwoPhoto(
        getTwoByTwoPhotoIdentityFromForm(
          initializedData,
          (me as any)?.id,
          profileId,
        ),
        initializedData,
      );
      if (savedPhoto) {
        initializedData.student.personalInfo.twoByTwoPhotoDataUrl =
          savedPhoto;
      }
      setLocalFormData(initializedData);
      setIsInitializing(false);
      hasInitialized.current = true;
    };

    initializeForm();
  }, [
    isLoadingDraft,
    isLoadingProfile,
    isLoadingStatus,
    profileId,
    profileData,
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
      const savedPhoto = getIIRTwoByTwoPhoto(
        getTwoByTwoPhotoIdentityFromForm(
          draftData,
          (me as any)?.id,
          profileId,
        ),
        draftData,
      );
      const restoredDraft = {
        ...draftData,
        student: {
          ...draftData.student,
          personalInfo: {
            ...draftData.student.personalInfo,
            twoByTwoPhotoDataUrl:
              savedPhoto ||
              draftData.student.personalInfo.twoByTwoPhotoDataUrl ||
              null,
          },
        },
      };
      setLocalFormData(restoredDraft);
    }
    setShowDraftPrompt(false);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    const baselineData = initializeFormData(
      profileData ?? null,
      EMPTY_IIR_FORM,
      me,
      { preserveBasicInfoFromSource: !!profileId }
    );
    setLocalFormData(baselineData);
    setShowDraftPrompt(false);
  };

  const autoSave = async () => {
    if (!localFormData) return;

    try {
      persistTwoByTwoPhoto(localFormData);
      await saveDraft(localFormData);
    } catch (err) {
      console.error("[AutoSave] Error saving draft:", err);
    }
  };

  const isLoading =
    isLoadingDraft ||
    isLoadingProfile ||
    isLoadingStatus ||
    isSubmitting ||
    (isSubmitted && isCompleted && !isEditMode);

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

  const handleBlockedPhotoStep = () => {
    setShowPhotoValidationWarning(true);
    markFieldTouched(PHOTO_REQUIRED_FIELD);
    personalSectionRef.current?.validate?.(PHOTO_REQUIRED_SECTION);
    scrollToTop();
  };

  const handleSectionNavigation = (targetSection: number) => {
    if (targetSection > currentSection && isPhotoStepBlocked) {
      handleBlockedPhotoStep();
      return;
    }

    setCurrentSection(targetSection);
    setSectionsWithErrors([]);
  };

  const handleNextSection = async () => {
    if (isPhotoStepBlocked) {
      handleBlockedPhotoStep();
      return;
    }

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

    const stepToValidate =
      currentSection >= 6 && currentSection <= 9
        ? currentSection - 5
        : currentSection;

    const validation = validateSection(
      sectionRefs[currentSection],
      stepToValidate,
    );
    if (!validation.isValid) {
      markAllTouched();
      const raw = validation.errors || {};
      const total = Object.keys(raw).length;
      if (total > 0) {
        setGroupedErrors(groupErrorsBySection(raw));
        setTotalErrors(total);
        setIsErrorModalOpen(true);
      }
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
    setIsExpressSubmitting(false);
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
    persistTwoByTwoPhoto(localFormData);

    try {
      const photoDataUrl =
        localFormData.student?.personalInfo?.twoByTwoPhotoDataUrl;
      if (photoDataUrl && photoDataUrl.startsWith("data:image/")) {
        try {
          const fileToUpload = dataUrlToFile(
            photoDataUrl,
            "iir-profile-photo.jpg",
          );
          await UploadIIRTwoByTwoPhoto(fileToUpload);
        } catch (uploadErr) {
          console.error(
            "[IIRForm] {UploadIIRTwoByTwoPhoto}:",
            uploadErr,
          );
        }
      }

      const payloadData = {
        ...localFormData,
        isCompleted: isExpressSubmitting ? false : true,
      };

      // Submit or update backend record
      if (isEditMode && editIirId) {
        await PatchIIRSubmit(editIirId, payloadData);
      } else {
        await submitFormAsync(payloadData);
      }

      // Invalidate all IIR-related queries so everything updates automatically
      queryClient.removeQueries({ queryKey: ["iir"] });
      queryClient.invalidateQueries({ queryKey: ["iir"] });

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
      const errorMessage = getErrorMessage(err);
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
              program: { id: 0 },
              yearLevel: 1,
              section: "",
            },
          };
          updated.student.personalInfo.studentNumber = "";
          fieldsToClearTouched.push(
            "student.personalInfo.studentNumber",
            "student.personalInfo.program",
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
              civilStatus: { id: 0 },
              religion: { id: 0 },
            },
          };
          updated.student.personalInfo.gender = { id: 0 };
          updated.student.personalInfo.dateOfBirth = "";
          updated.student.personalInfo.placeOfBirth = "";
          updated.student.personalInfo.highSchoolGWA = "";
          updated.student.personalInfo.heightM = "";
          updated.student.personalInfo.weightKg = "";
          updated.student.personalInfo.complexion = "";
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
              ...related[0],
              educationalAttainment: { id: 0 },
              occupation: null,
              employerName: null,
              employerAddress: null,
              relationship: { id: 1 },
              isParent: true,
              isGuardian: false,
              isLiving: true,
            };
            related[0].firstName = "";
            related[0].middleName = null;
            related[0].lastName = "";
            related[0].dateOfBirth = "";
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
              ...related[1],
              educationalAttainment: { id: 0 },
              occupation: null,
              employerName: null,
              employerAddress: null,
              relationship: { id: 2 },
              isParent: true,
              isGuardian: false,
              isLiving: true,
            };
            related[1].firstName = "";
            related[1].middleName = null;
            related[1].lastName = "";
            related[1].dateOfBirth = "";
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
              visionHasProblem: null,
              visionDetails: null,
              hearingHasProblem: null,
              hearingDetails: null,
              speechHasProblem: null,
              speechDetails: null,
              generalHealthHasProblem: null,
              generalHealthDetails: null,
              mentalEmotionalHasProblem: null,
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
        <div className="relative z-10 mx-auto w-full min-w-0 max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="min-w-0 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-8">
            {/* Sidebar Progress Tracker (Desktop) */}
            <aside className="hidden min-w-0 lg:block">
              <SectionProgress
                sections={activeSections}
                currentSection={currentSection}
                sectionsWithErrors={sectionsWithErrors}
                visitedSections={visitedSections}
                onNavigate={handleSectionNavigation}
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
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-col gap-6">
                {/* Mobile/Tablet Progress Tracker */}
                <div className="lg:hidden">
                  <SectionProgress
                    sections={activeSections}
                    currentSection={currentSection}
                    sectionsWithErrors={sectionsWithErrors}
                    visitedSections={visitedSections}
                    onNavigate={handleSectionNavigation}
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
                  <IIRDraftPrompt
                    onDiscard={handleDiscardDraft}
                    onRestore={handleRestoreDraft}
                  />
                )}

                <div className="flex flex-col">
                  {/* Form Content Wrapper */}
                  <div className="">
                    {/* Floating Completion Pill */}
                    <IIRProgressPill
                      completion={calculateSectionCompletion(
                        currentSection,
                        localFormData ?? null,
                        isEditMode,
                      )}
                    />

                    {/* Individual Form Sections */}
                    <div
                      className={cn(
                        "animate-in fade-in slide-in-from-bottom-8",
                        "fill-mode-both duration-700 ease-out",
                      )}
                    >
                      <IIRSectionRenderer
                        currentSection={currentSection}
                        formData={localFormData}
                        isTransitioningStep={isTransitioningStep}
                        isEditMode={isEditMode}
                        personalSectionRef={personalSectionRef}
                        educationSectionRef={educationSectionRef}
                        familySectionRef={familySectionRef}
                        healthSectionRef={healthSectionRef}
                        interestsSectionRef={interestsSectionRef}
                        onChange={handleInputChange}
                        onFieldBlur={markFieldTouched}
                        shouldShowError={shouldShowError}
                      />
                    </div>
                  </div>

                  {/* Form Navigation Action Bar */}
                  <IIRFormNavigation
                    currentSection={currentSection}
                    currentIndex={currentIndex}
                    totalSections={activeSections.length}
                    isSaving={isSaving}
                    isSubmitting={isSubmitting}
                    isEditMode={isEditMode}
                    onReset={() => setShowResetConfirm(true)}
                    isNextBlocked={isPhotoStepBlocked}
                    nextBlockedMessage={
                      showPhotoValidationWarning || isPhotoStepBlocked
                        ? PHOTO_REQUIRED_MESSAGE
                        : undefined
                    }
                    showExpressSubmit={showExpressSubmit}
                    onExpressSubmit={handleExpressSubmit}
                    onPrevious={handlePreviousSection}
                    onNext={handleNextSection}
                    onSubmit={handleSubmit}
                  />
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

        <IIRSuccessPopup
          isOpen={showSuccessPopup}
          onReturn={() => navigate(isEditMode ? "/student/iir" : "/student")}
          isEditMode={isEditMode}
        />

        <IIRResetConfirmDialog
          open={showResetConfirm}
          onOpenChange={setShowResetConfirm}
          onConfirm={confirmReset}
        />

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
