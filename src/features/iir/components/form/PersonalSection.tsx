import {
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Checkbox } from "@/components/form";
import { FormField } from "@/components/ui/form-field";
import { SelectField } from "@/components/ui/select-field";
import { SectionContainer } from "./SectionContainer";
import { FormDividerGroup } from "./shared";
import {
  User,
  MapPin,
  Phone,
  Briefcase,
  Activity,
  Camera,
  Upload,
  Pencil,
  X,
  Info,
  CheckCircle2,
} from "lucide-react";
import {
  usePrograms,
  useGenders,
  useCivilStatuses,
  useReligions,
  useStudentRelationshipTypes,
  useAddressSync,
} from "@/features/iir/hooks";
import { CheckStudentNumberUniqueness } from "@/features/iir/services/service";
import { COMPLEXIONS } from "@/features/iir/constants";
import {
  useGetRegions,
  useGetProvinces,
  useGetCities,
  useGetBarangays,
} from "@/features/locations/hooks";
import {
  Barangay,
  City,
  Province,
  Region,
  StudentSection,
} from "@/features/iir/types";
import {
  validateObject,
  commonRules,
  isFieldRequired,
  FieldValidationSchema,
  validateField,
} from "@/services/validationSchema";
import { personalInformationValidationSchema } from "@/features/iir/config/personalInfoValidationSchema";
import { cn } from "@/lib/utils";
import {
  createTwoByTwoPhotoDataUrl,
  removeIIRTwoByTwoPhoto,
  saveIIRTwoByTwoPhoto,
} from "@/features/iir/utils/twoByTwoPhoto";

import { PERSONAL_SUBSTEP_FIELDS } from "@/features/iir/config/subStepFields";

import formalImage from "@/assets/images/formal_image.png";
import notFormalImage from "@/assets/images/notformal_image.png";
import { useToast } from "@/context";
import { DatePicker } from "@/components/ui/date-picker";

interface FormErrors {
  [key: string]: string;
}

interface PersonalSectionRef {
  validate: (step?: number) => { isValid: boolean; errors: FormErrors };
}

export const PersonalSection = forwardRef<
  PersonalSectionRef,
  {
    studentInfo: StudentSection;
    onChange: (path: string, value: any) => void;
    onFieldBlur?: (fieldPath: string) => void;
    shouldShowError?: (fieldPath: string) => boolean;
    subStep?: number;
    isEditMode?: boolean;
  }
>(function PersonalSection(
  {
    studentInfo,
    onChange,
    onFieldBlur,
    shouldShowError,
    subStep = 1,
    isEditMode = false,
  }: {
    studentInfo: StudentSection;
    onChange: (path: string, value: any) => void;
    onFieldBlur?: (fieldPath: string) => void;
    shouldShowError?: (fieldPath: string) => boolean;
    subStep?: number;
    isEditMode?: boolean;
  },
  ref,
) {
  const { data: programs = [], isLoading: isProgramsLoading } = usePrograms();
  const { data: genders = [] } = useGenders();
  const { data: civilStatuses = [] } = useCivilStatuses();
  const { data: religions = [] } = useReligions();
  const { data: studentRelationshipTypes = [] } = useStudentRelationshipTypes();
  const { data: regions = [] } = useGetRegions();
  const [errors, setErrors] = useState<FormErrors>({});
  const [studentNumberStatus, setStudentNumberStatus] = useState<
    "idle" | "checking" | "taken" | "available"
  >("idle");
  const [checkedStudentNumber, setCheckedStudentNumber] = useState<string>("");

  const performUniquenessCheck = useCallback(
    async (num: string) => {
      if (num === checkedStudentNumber) return;
      setStudentNumberStatus("checking");
      try {
        const exists = await CheckStudentNumberUniqueness(num);
        if (exists) {
          setStudentNumberStatus("taken");
          setErrors((prev: FormErrors) => ({
            ...prev,
            "student.personalInfo.studentNumber":
              "Student number is already registered",
          }));
        } else {
          setStudentNumberStatus("available");
          setCheckedStudentNumber(num);
          setErrors((prev: FormErrors) => {
            const updated = { ...prev };
            const currentErr = updated["student.personalInfo.studentNumber"];
            if (
              currentErr === "Student number is already registered" ||
              currentErr === "Checking student number availability..."
            ) {
              delete updated["student.personalInfo.studentNumber"];
            }
            return updated;
          });
        }
      } catch (err) {
        console.error("Uniqueness check failed:", err);
        setStudentNumberStatus("available");
        setErrors((prev: FormErrors) => {
          const updated = { ...prev };
          if (
            updated["student.personalInfo.studentNumber"] ===
            "Checking student number availability..."
          ) {
            delete updated["student.personalInfo.studentNumber"];
          }
          return updated;
        });
      }
    },
    [checkedStudentNumber],
  );

  useEffect(() => {
    if (isEditMode) return;
    const num = studentInfo?.personalInfo?.studentNumber || "";
    const isValidFormat = /^\d{4}-\d{5}-TG-[01]$/.test(num);
    if (!isValidFormat) {
      setStudentNumberStatus("idle");
      return;
    }

    if (num === checkedStudentNumber) {
      return;
    }

    const timer = setTimeout(() => {
      performUniquenessCheck(num);
    }, 500);

    return () => clearTimeout(timer);
  }, [
    studentInfo?.personalInfo?.studentNumber,
    checkedStudentNumber,
    performUniquenessCheck,
    isEditMode,
  ]);

  const { triggerToast } = useToast();

  // Stable indices for address array
  const PROVINCIAL_IDX = 0;
  const RESIDENTIAL_IDX = 1;

  /**
   * Get address by type and return both address and index
   */
  const getAddressByType = (type: string) => {
    const addresses = (studentInfo as any)?.addresses || [];
    const idx = type === "provincial" ? PROVINCIAL_IDX : RESIDENTIAL_IDX;
    const addr = addresses[idx]?.address || {};
    return { address: addr, index: idx };
  };

  const provincialData = getAddressByType("provincial");
  const residentialData = getAddressByType("residential");
  const provincialAddr = provincialData.address;
  const residentialAddr = residentialData.address;
  const emergencyAddr =
    (studentInfo as any)?.personalInfo?.emergencyContact?.address || {};
  const twoByTwoPhotoDataUrl =
    (studentInfo as any)?.personalInfo?.twoByTwoPhotoDataUrl || "";

  const handleResidentialRegionChange = (val: any) => {
    const regionObj = { code: val };
    const emptyProvince = { code: "" } as Province;
    const emptyCity = { code: "" } as City;
    const emptyBarangay = { code: "" } as Barangay;

    onChange(`student.addresses.${RESIDENTIAL_IDX}.address.region`, regionObj);
    onChange(
      `student.addresses.${RESIDENTIAL_IDX}.address.province`,
      emptyProvince,
    );
    onChange(`student.addresses.${RESIDENTIAL_IDX}.address.city`, emptyCity);
    onChange(
      `student.addresses.${RESIDENTIAL_IDX}.address.barangay`,
      emptyBarangay,
    );

    setErrors((prev: FormErrors) => {
      const u = { ...prev };
      delete u[`student.addresses.${RESIDENTIAL_IDX}.address.region`];
      delete u[`student.addresses.${RESIDENTIAL_IDX}.address.province`];
      delete u[`student.addresses.${RESIDENTIAL_IDX}.address.city`];
      delete u[`student.addresses.${RESIDENTIAL_IDX}.address.barangay`];
      return u;
    });
  };

  const handleResidentialProvinceChange = (val: any) => {
    const provinceObj = { code: val };
    const emptyCity = { code: "" } as City;
    const emptyBarangay = { code: "" } as Barangay;

    onChange(
      `student.addresses.${RESIDENTIAL_IDX}.address.province`,
      provinceObj,
    );
    onChange(`student.addresses.${RESIDENTIAL_IDX}.address.city`, emptyCity);
    onChange(
      `student.addresses.${RESIDENTIAL_IDX}.address.barangay`,
      emptyBarangay,
    );

    setErrors((prev: FormErrors) => {
      const u = { ...prev };
      delete u[`student.addresses.${RESIDENTIAL_IDX}.address.province`];
      delete u[`student.addresses.${RESIDENTIAL_IDX}.address.city`];
      delete u[`student.addresses.${RESIDENTIAL_IDX}.address.barangay`];
      return u;
    });
  };

  const handleResidentialCityChange = (val: any) => {
    const cityObj = { code: val };
    const emptyBarangay = { code: "" } as Barangay;

    onChange(`student.addresses.${RESIDENTIAL_IDX}.address.city`, cityObj);
    onChange(
      `student.addresses.${RESIDENTIAL_IDX}.address.barangay`,
      emptyBarangay,
    );

    setErrors((prev: FormErrors) => {
      const u = { ...prev };
      delete u[`student.addresses.${RESIDENTIAL_IDX}.address.city`];
      delete u[`student.addresses.${RESIDENTIAL_IDX}.address.barangay`];
      return u;
    });
  };

  const handleResidentialBarangayChange = (val: any) => {
    const barangayObj = { code: val };

    onChange(
      `student.addresses.${RESIDENTIAL_IDX}.address.barangay`,
      barangayObj,
    );

    setErrors((prev: FormErrors) => {
      const u = { ...prev };
      delete u[`student.addresses.${RESIDENTIAL_IDX}.address.barangay`];
      return u;
    });
  };

  const handleResidentialStreetDetailChange = (val: any) => {
    onChange(`student.addresses.${RESIDENTIAL_IDX}.address.streetDetail`, val);

    setErrors((prev: FormErrors) => {
      const u = { ...prev };
      delete u[`student.addresses.${RESIDENTIAL_IDX}.address.streetDetail`];
      return u;
    });
  };

  const provincialSync = useAddressSync(
    residentialAddr,
    provincialAddr,
    useCallback(
      (address) => {
        if (address) {
          onChange(
            `student.addresses.${PROVINCIAL_IDX}.address.region`,
            address.region,
          );
          onChange(
            `student.addresses.${PROVINCIAL_IDX}.address.province`,
            address.province,
          );
          onChange(
            `student.addresses.${PROVINCIAL_IDX}.address.city`,
            address.city,
          );
          onChange(
            `student.addresses.${PROVINCIAL_IDX}.address.barangay`,
            address.barangay,
          );
          onChange(
            `student.addresses.${PROVINCIAL_IDX}.address.streetDetail`,
            address.streetDetail,
          );

          // Clear errors for synced fields
          setErrors((prev: FormErrors) => {
            const updated = { ...prev };
            delete updated[
              `student.addresses.${PROVINCIAL_IDX}.address.region`
            ];
            delete updated[
              `student.addresses.${PROVINCIAL_IDX}.address.province`
            ];
            delete updated[`student.addresses.${PROVINCIAL_IDX}.address.city`];
            delete updated[
              `student.addresses.${PROVINCIAL_IDX}.address.barangay`
            ];
            return updated;
          });
        }
      },
      [onChange],
    ),
  );

  const emergencySync = useAddressSync(
    residentialAddr,
    emergencyAddr,
    useCallback(
      (address) => {
        if (address) {
          onChange(
            `student.personalInfo.emergencyContact.address.region`,
            address.region,
          );
          onChange(
            `student.personalInfo.emergencyContact.address.province`,
            address.province,
          );
          onChange(
            `student.personalInfo.emergencyContact.address.city`,
            address.city,
          );
          onChange(
            `student.personalInfo.emergencyContact.address.barangay`,
            address.barangay,
          );
          onChange(
            `student.personalInfo.emergencyContact.address.streetDetail`,
            address.streetDetail,
          );

          // Clear errors for synced fields
          setErrors((prev: FormErrors) => {
            const updated = { ...prev };
            delete updated[
              `student.personalInfo.emergencyContact.address.region`
            ];
            delete updated[
              `student.personalInfo.emergencyContact.address.province`
            ];
            delete updated[
              `student.personalInfo.emergencyContact.address.city`
            ];
            delete updated[
              `student.personalInfo.emergencyContact.address.barangay`
            ];
            return updated;
          });
        }
      },
      [onChange],
    ),
  );

  const addressRegion = {
    provincial: provincialAddr?.region,
    residential: residentialAddr?.region,
    emergency: emergencyAddr?.region,
  };
  const addressProvince = {
    provincial: provincialAddr?.province,
    residential: residentialAddr?.province,
    emergency: emergencyAddr?.province,
  };
  const addressCity = {
    provincial: provincialAddr?.city,
    residential: residentialAddr?.city,
    emergency: emergencyAddr?.city,
  };

  // Detect if regions are NCR (code: 1300000000)
  const isProvincialNCR =
    String(addressRegion.provincial?.code) === "1300000000";
  const isResidentialNCR =
    String(addressRegion.residential?.code) === "1300000000";
  const isEmergencyNCR = String(addressRegion.emergency?.code) === "1300000000";

  // Get provinces for provincial address
  const { data: provincialProvinces = [] } = useGetProvinces(
    !isProvincialNCR && addressRegion.provincial?.code
      ? addressRegion.provincial.code
      : undefined,
  );

  // Get provinces for permanent address
  const { data: residentialProvinces = [] } = useGetProvinces(
    !isResidentialNCR && addressRegion.residential?.code
      ? addressRegion.residential.code
      : undefined,
  );

  // Get provinces for emergency address
  const { data: emergencyProvinces = [] } = useGetProvinces(
    !isEmergencyNCR && addressRegion.emergency?.code
      ? addressRegion.emergency.code
      : undefined,
  );

  // Get cities for provincial address
  const { data: provincialCities = [], isLoading: isProvincialCitiesLoading } =
    useGetCities(
      addressRegion.provincial?.code || "",
      addressProvince.provincial?.code || "",
    );

  // Get cities for permanent address
  const {
    data: residentialCities = [],
    isLoading: isResidentialCitiesLoading,
  } = useGetCities(
    addressRegion.residential?.code || "",
    addressProvince.residential?.code || "",
  );

  // Get cities for emergency address
  const { data: emergencyCities = [], isLoading: isEmergencyCitiesLoading } =
    useGetCities(
      addressRegion.emergency?.code || "",
      addressProvince.emergency?.code || "",
    );

  // Get barangays for provincial address
  const {
    data: provincialBarangays = [],
    isLoading: isProvincialBarangaysLoading,
  } = useGetBarangays(addressCity.provincial?.code || "");

  // Get barangays for permanent address
  const {
    data: residentialBarangays = [],
    isLoading: isResidentialBarangaysLoading,
  } = useGetBarangays(addressCity.residential?.code || "");

  // Get barangays for emergency address
  const {
    data: emergencyBarangays = [],
    isLoading: isEmergencyBarangaysLoading,
  } = useGetBarangays(addressCity.emergency?.code || "");

  const getRuntimeSchema = (): FieldValidationSchema => {
    const schema: FieldValidationSchema = {
      ...personalInformationValidationSchema,
    };
    if ((studentInfo as any)?.personalInfo?.isEmployed) {
      schema["student.personalInfo.employerName"] = [
        commonRules.required("Employer name"),
      ];
      schema["student.personalInfo.employerAddress"] = [
        commonRules.required("Employer address"),
      ];
    }
    return schema;
  };
  const runtimeSchema = getRuntimeSchema();

  const validate = (
    step?: number,
  ): { isValid: boolean; errors: FormErrors } => {
    const runtimeSchema = getRuntimeSchema();
    const activeStep = step ?? subStep;

    // Filter schema to only include fields for the specified sub-step
    const filteredSchema: FieldValidationSchema = {};
    let targetFields = PERSONAL_SUBSTEP_FIELDS[activeStep] || [];

    if (isEditMode) {
      if (activeStep === 2) {
        targetFields = targetFields.filter(
          (field) =>
            ![
              "student.personalInfo.placeOfBirth",
              "student.personalInfo.highSchoolGWA",
              "student.personalInfo.heightM",
              "student.personalInfo.weightKg",
              "student.personalInfo.complexion",
            ].includes(field),
        );
      } else if (activeStep === 3) {
        targetFields = targetFields.filter(
          (field) => field !== "student.personalInfo.telephoneNumber",
        );
      }
    }

    targetFields.forEach((field) => {
      if (runtimeSchema[field]) {
        filteredSchema[field] = runtimeSchema[field];
      }
    });

    // If no step specified or invalid, validate nothing (or all if that's desired)
    // For specific sub-step transitions, we only care about visible fields.
    const sectionErrors = validateObject(
      { student: studentInfo },
      filteredSchema,
    );

    if (activeStep === 1 && !isEditMode) {
      const num = studentInfo?.personalInfo?.studentNumber || "";
      const isValidFormat = /^\d{4}-\d{5}-TG-[01]$/.test(num);
      if (isValidFormat) {
        if (studentNumberStatus === "taken") {
          sectionErrors["student.personalInfo.studentNumber"] =
            "Student number is already registered";
        } else if (studentNumberStatus === "checking") {
          sectionErrors["student.personalInfo.studentNumber"] =
            "Checking student number availability...";
        }
      }
    }

    setErrors((prev) => {
      const merged = { ...prev, ...sectionErrors };
      const numErr = sectionErrors["student.personalInfo.studentNumber"];
      if (numErr) {
        merged["student.personalInfo.studentNumber"] = numErr;
      } else {
        delete merged["student.personalInfo.studentNumber"];
      }
      return merged;
    });

    return {
      isValid: Object.keys(sectionErrors).length === 0,
      errors: sectionErrors,
    };
  };

  useImperativeHandle(ref, () => ({
    validate: (step?: number) => validate(step),
  }));

  const clearError = (field: string) => {
    setErrors((prev: FormErrors) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const handleInputChange = (fieldPath: string, value: any) => {
    onChange(fieldPath, value);

    // Instant validation
    const runtimeSchema = getRuntimeSchema();
    const fieldRules = runtimeSchema[fieldPath];
    if (fieldRules) {
      const error = validateField(value, fieldRules, { student: studentInfo });
      setErrors((prev: FormErrors) => {
        const updated = { ...prev };
        if (error) updated[fieldPath] = error;
        else delete updated[fieldPath];
        return updated;
      });
    }

    // Mark as touched instantly so it shows while active
    if (onFieldBlur) {
      onFieldBlur(fieldPath);
    }
  };

  /**
   * Helper to determine if error should be displayed for a field
   * Only show error if field is touched (or form submitted) AND has an error
   */
  const getFieldError = (fieldPath: string): string | undefined => {
    const hasError = errors[fieldPath];
    const showError = shouldShowError ? shouldShowError(fieldPath) : true;
    return hasError && showError ? errors[fieldPath] : undefined;
  };

  /**
   * Handle blur event for a field
   */
  const handleFieldBlur = (fieldPath: string) => {
    if (onFieldBlur) {
      onFieldBlur(fieldPath);
    }

    if (!isEditMode && fieldPath === "student.personalInfo.studentNumber") {
      const num = studentInfo?.personalInfo?.studentNumber || "";
      const isValidFormat = /^\d{4}-\d{5}-TG-[01]$/.test(num);
      if (isValidFormat && num !== checkedStudentNumber) {
        performUniquenessCheck(num);
      }
    }
  };

  const handlePhotoUpload = async (file?: File | null) => {
    if (!file) return;

    const fieldPath = "student.personalInfo.twoByTwoPhotoDataUrl";

    const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const errorMsg = "File is too large. Maximum size allowed is 5MB.";

      if (triggerToast) {
        triggerToast(errorMsg);
      }

      setErrors((prev: FormErrors) => ({
        ...prev,
        [fieldPath]: errorMsg,
      }));

      return;
    }

    try {
      const dataUrl = await createTwoByTwoPhotoDataUrl(file);
      handleInputChange(fieldPath, dataUrl);
      saveIIRTwoByTwoPhoto(dataUrl, {
        studentNumber: studentInfo?.personalInfo?.studentNumber || null,
        email: studentInfo?.basicInfo?.email || null,
      });
      clearError(fieldPath);
    } catch (error: any) {
      setErrors((prev: FormErrors) => ({
        ...prev,
        [fieldPath]:
          error?.message || "Unable to process the selected 2x2 photo.",
      }));
    }
  };

  const handlePhotoRemove = () => {
    const fieldPath = "student.personalInfo.twoByTwoPhotoDataUrl";
    handleInputChange(fieldPath, null);
    removeIIRTwoByTwoPhoto({
      studentNumber: studentInfo?.personalInfo?.studentNumber || null,
      email: studentInfo?.basicInfo?.email || null,
    });
    clearError(fieldPath);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Primary Information */}
      {subStep === 1 && (
        <SectionContainer
          title="Primary Information"
          description="Official academic identity and name"
          icon={User}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-6">
            <div className="md:col-span-6">
              <div
                className={cn(
                  "space-y-4 rounded-xl border border-border/70",
                  "bg-card/80 p-4 shadow-md",
                )}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-primary/40 bg-muted/50 shadow-md">
                      {twoByTwoPhotoDataUrl ? (
                        <img
                          src={twoByTwoPhotoDataUrl}
                          alt="Uploaded 2x2 student photo"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Camera className="h-9 w-9 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        2x2 Student Picture
                      </p>
                      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                        Upload a clear JPG, PNG, or WebP photo up to 5MB only.
                        The image is automatically cropped to a strict square
                        2x2 layout.
                      </p>
                      {getFieldError(
                        "student.personalInfo.twoByTwoPhotoDataUrl",
                      ) && (
                        <p className="mt-2 text-xs font-medium text-destructive">
                          {getFieldError(
                            "student.personalInfo.twoByTwoPhotoDataUrl",
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    className={cn(
                      "grid w-full grid-cols-1 gap-2 xl:w-auto",
                      twoByTwoPhotoDataUrl
                        ? "sm:grid-cols-2 xl:min-w-[18rem]"
                        : "sm:max-w-[14rem] xl:min-w-[14rem]",
                    )}
                  >
                    <label
                      htmlFor="iir-two-by-two-photo"
                      className={cn(
                        "inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap",
                        "rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-medium",
                        "text-primary shadow-md transition hover:bg-primary/15 hover:shadow-lg",
                        "focus-within:ring-2 focus-within:ring-primary/20",
                      )}
                    >
                      {twoByTwoPhotoDataUrl ? (
                        <Pencil className="h-4 w-4 shrink-0" />
                      ) : (
                        <Upload className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate text-center">
                        {twoByTwoPhotoDataUrl ? "Edit Photo" : "Upload Photo"}
                      </span>
                    </label>
                    <input
                      id="iir-two-by-two-photo"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(event) => {
                        void handlePhotoUpload(event.target.files?.[0]);
                        event.currentTarget.value = "";
                      }}
                    />
                    {twoByTwoPhotoDataUrl && (
                      <button
                        type="button"
                        onClick={handlePhotoRemove}
                        className={cn(
                          "inline-flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl",
                          "border border-destructive/30 px-4 text-sm font-medium text-destructive",
                          "shadow-md transition hover:bg-destructive/10",
                        )}
                      >
                        <X className="h-4 w-4 shrink-0" />
                        <span className="truncate">Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* PROFILE PICTURE GUIDELINES */}
              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
                <div className="mb-3 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-semibold text-blue-900 dark:text-blue-200">
                    Profile Picture Requirements
                  </h4>
                </div>
                <p className="mb-4 text-sm text-blue-800 dark:text-blue-300">
                  Please upload a <strong>formal 2x2 picture</strong>. Ensure
                  you are wearing appropriate professional or school attire
                  against a plain background. Avoid selfies, heavy filters, or
                  cluttered environments.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col items-center rounded-lg border border-emerald-200 bg-white/60 p-3 shadow-sm dark:border-emerald-800/50 dark:bg-emerald-950/40">
                    <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0" /> Upload this
                    </h5>
                    <div className="overflow-hidden rounded border border-emerald-200 shadow-sm dark:border-emerald-800">
                      <img
                        src={formalImage}
                        alt="Formal 2x2 Example"
                        className="h-32 w-32 object-cover mix-blend-multiply dark:mix-blend-normal"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-center rounded-lg border border-red-200 bg-white/60 p-3 shadow-sm dark:border-red-800/50 dark:bg-red-950/40">
                    <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
                      <X className="h-4 w-4 shrink-0" /> Do Not Upload
                    </h5>
                    <div className="overflow-hidden rounded border border-red-200 shadow-sm dark:border-red-800">
                      <img
                        src={notFormalImage}
                        alt="Non-Formal Example"
                        className="h-32 w-32 object-cover mix-blend-multiply dark:mix-blend-normal"
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* END PROFILE PICTURE GUIDELINES */}
            </div>

            <div className="md:col-span-2">
              <FormField
                label="First Name"
                value={studentInfo?.basicInfo?.firstName || ""}
                onChange={(val: any) =>
                  handleInputChange("student.basicInfo.firstName", val)
                }
                error={errors["student.basicInfo.firstName"]}
                placeholder={studentInfo?.basicInfo?.firstName || ""}
                required={isFieldRequired(
                  runtimeSchema,
                  "student.basicInfo.firstName",
                )}
                disabled
              />
            </div>
            <div className="md:col-span-2">
              <FormField
                label="Middle Name"
                value={
                  studentInfo?.basicInfo?.middleName == null ||
                  typeof studentInfo.basicInfo.middleName === "object"
                    ? ""
                    : studentInfo.basicInfo.middleName
                }
                onChange={(val: any) =>
                  handleInputChange("student.basicInfo.middleName", val)
                }
                placeholder={studentInfo?.basicInfo?.middleName || ""}
                disabled
              />
            </div>
            <div className="md:col-span-2">
              <FormField
                label="Last Name"
                value={studentInfo?.basicInfo?.lastName || ""}
                onChange={(val: any) =>
                  handleInputChange("student.basicInfo.lastName", val)
                }
                error={errors["student.basicInfo.lastName"]}
                placeholder={studentInfo?.basicInfo?.lastName || ""}
                required={isFieldRequired(
                  runtimeSchema,
                  "student.basicInfo.lastName",
                )}
                disabled
              />
            </div>

            <div className="md:col-span-1">
              <FormField
                label="Suffix"
                value={studentInfo?.personalInfo?.suffix || ""}
                onChange={(val: any) =>
                  handleInputChange("student.personalInfo.suffix", val)
                }
                placeholder="Jr/Sr/III"
                noSpecialCharacters={true}
                error={getFieldError("student.personalInfo.suffix")}
              />
            </div>
            <div className="md:col-span-2">
              <FormField
                label="Student Number"
                value={studentInfo?.personalInfo?.studentNumber || ""}
                onChange={(val: any) =>
                  handleInputChange("student.personalInfo.studentNumber", val)
                }
                onBlur={() =>
                  handleFieldBlur("student.personalInfo.studentNumber")
                }
                error={getFieldError("student.personalInfo.studentNumber")}
                placeholder="20XX-XXXXX-TG-X"
                required={isFieldRequired(
                  runtimeSchema,
                  "student.personalInfo.studentNumber",
                )}
                disabled={isEditMode}
              />
            </div>
            <div className="md:col-span-3">
              <SelectField
                formStyle
                label="Program"
                options={programs}
                value={studentInfo?.personalInfo?.program?.id || ""}
                onChange={(val: any) =>
                  handleInputChange("student.personalInfo.program", { id: val })
                }
                error={errors["student.personalInfo.program"]}
                required={isFieldRequired(
                  runtimeSchema,
                  "student.personalInfo.program",
                )}
                enabled={!isProgramsLoading}
              />
            </div>

            <div className="md:col-span-3">
              <FormField
                label="Year Level"
                type="number"
                inputMode="numeric"
                value={studentInfo?.personalInfo?.yearLevel || ""}
                onChange={(val: any) => {
                  const parsed = parseInt(val, 10);
                  handleInputChange(
                    "student.personalInfo.yearLevel",
                    isNaN(parsed) ? "" : parsed,
                  );
                }}
                onBlur={() => {
                  const val = studentInfo?.personalInfo?.yearLevel;
                  handleInputChange(
                    "student.personalInfo.yearLevel",
                    val == null ? null : Number(val),
                  );
                  handleFieldBlur("student.personalInfo.yearLevel");
                }}
                error={getFieldError("student.personalInfo.yearLevel")}
                placeholder="1, 2, 3..."
                required={isFieldRequired(
                  runtimeSchema,
                  "student.personalInfo.yearLevel",
                )}
              />
            </div>
            <div className="md:col-span-3">
              <FormField
                label="Section"
                type="number"
                inputMode="numeric"
                value={studentInfo?.personalInfo?.section || ""}
                onChange={(val: any) => {
                  const parsed = parseInt(val, 10);
                  handleInputChange(
                    "student.personalInfo.section",
                    isNaN(parsed) ? "" : parsed,
                  );
                }}
                onBlur={() => {
                  const val = studentInfo?.personalInfo?.section;
                  handleInputChange(
                    "student.personalInfo.section",
                    val == null ? null : Number(val),
                  );
                  handleFieldBlur("student.personalInfo.section");
                }}
                error={getFieldError("student.personalInfo.section")}
                placeholder="Section number"
                required={isFieldRequired(
                  runtimeSchema,
                  "student.personalInfo.section",
                )}
              />
            </div>
          </div>
        </SectionContainer>
      )}

      {/* 2. Personal Profile */}
      {subStep === 2 && (
        <SectionContainer
          title="Personal Profile"
          description="Detailed personal characteristics"
          icon={Activity}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-6">
            <div className="md:col-span-2">
              <SelectField
                formStyle
                label="Gender"
                options={genders}
                value={studentInfo?.personalInfo?.gender?.id || ""}
                onChange={(val: any) =>
                  handleInputChange("student.personalInfo.gender", { id: val })
                }
                error={errors["student.personalInfo.gender"]}
                required={isFieldRequired(
                  runtimeSchema,
                  "student.personalInfo.gender",
                )}
                enabled={!isEditMode}
              />
            </div>
            <div className="md:col-span-2">
              <SelectField
                formStyle
                label="Civil Status"
                options={civilStatuses}
                value={studentInfo?.personalInfo?.civilStatus?.id || ""}
                onChange={(val: any) =>
                  handleInputChange("student.personalInfo.civilStatus", {
                    id: val,
                  })
                }
                error={errors["student.personalInfo.civilStatus"]}
                required={isFieldRequired(
                  runtimeSchema,
                  "student.personalInfo.civilStatus",
                )}
              />
            </div>
            <div className="md:col-span-2">
              <SelectField
                formStyle
                label="Religion"
                options={religions}
                value={studentInfo?.personalInfo?.religion?.id || ""}
                onChange={(val: any) => {
                  const target = religions.find(
                    (r: any) => r.id === Number(val),
                  );
                  handleInputChange("student.personalInfo.religion", {
                    id: Number(val),
                    name: target?.name || "",
                  });
                  if (target?.name !== "Others") {
                    handleInputChange(
                      "student.personalInfo.otherReligionText",
                      "",
                    );
                    setErrors((prev: FormErrors) => {
                      const updated = { ...prev };
                      delete updated["student.personalInfo.otherReligionText"];
                      return updated;
                    });
                  }
                }}
                error={errors["student.personalInfo.religion"]}
                required={isFieldRequired(
                  runtimeSchema,
                  "student.personalInfo.religion",
                )}
              />
            </div>
            {studentInfo?.personalInfo?.religion?.name === "Others" && (
              <div className="md:col-span-2">
                <FormField
                  label="Specify Religion"
                  value={studentInfo?.personalInfo?.otherReligionText || ""}
                  onChange={(val: any) =>
                    handleInputChange(
                      "student.personalInfo.otherReligionText",
                      val,
                    )
                  }
                  error={errors["student.personalInfo.otherReligionText"]}
                  placeholder="Specify religion"
                  noSpecialCharacters={true}
                  required={isFieldRequired(
                    runtimeSchema,
                    "student.personalInfo.otherReligionText",
                    studentInfo,
                  )}
                />
              </div>
            )}

            <div className="md:col-span-3">
              <DatePicker
                label="Date of Birth"
                value={studentInfo?.personalInfo?.dateOfBirth || ""}
                onChange={(val: any) =>
                  handleInputChange("student.personalInfo.dateOfBirth", val)
                }
                error={errors["student.personalInfo.dateOfBirth"]}
                required={isFieldRequired(
                  runtimeSchema,
                  "student.personalInfo.dateOfBirth",
                )}
                disabled={isEditMode}
                maxDate={new Date()}
              />
            </div>
            {!isEditMode && (
              <>
                <div className="md:col-span-3">
                  <FormField
                    label="Place of Birth"
                    value={studentInfo?.personalInfo?.placeOfBirth || ""}
                    onChange={(val: any) =>
                      handleInputChange(
                        "student.personalInfo.placeOfBirth",
                        val,
                      )
                    }
                    error={errors["student.personalInfo.placeOfBirth"]}
                    placeholder="City/Municipality, Province"
                    noSpecialCharacters={true}
                    required={isFieldRequired(
                      runtimeSchema,
                      "student.personalInfo.placeOfBirth",
                    )}
                  />
                </div>

                <div className="md:col-span-2">
                  <FormField
                    label="High School GWA"
                    type="text"
                    inputMode="decimal"
                    value={studentInfo?.personalInfo?.highSchoolGWA || ""}
                    onChange={(val: any) =>
                      handleInputChange(
                        "student.personalInfo.highSchoolGWA",
                        String(val).replace(/[^0-9.]/g, ""),
                      )
                    }
                    onBlur={() => {
                      const val = studentInfo?.personalInfo?.highSchoolGWA;
                      handleInputChange(
                        "student.personalInfo.highSchoolGWA",
                        val === "" || val == null ? null : Number(val),
                      );
                      handleFieldBlur("student.personalInfo.highSchoolGWA");
                    }}
                    error={errors["student.personalInfo.highSchoolGWA"]}
                    placeholder="90.5"
                    required={isFieldRequired(
                      runtimeSchema,
                      "student.personalInfo.highSchoolGWA",
                    )}
                  />
                </div>
                <div className="md:col-span-2">
                  <FormField
                    label="Height (m)"
                    type="text"
                    inputMode="decimal"
                    value={studentInfo?.personalInfo?.heightM || ""}
                    onChange={(val: any) => {
                      handleInputChange(
                        "student.personalInfo.heightM",
                        String(val).replace(/[^0-9.]/g, ""),
                      );
                    }}
                    onBlur={() => {
                      const val = studentInfo?.personalInfo?.heightM;
                      handleInputChange(
                        "student.personalInfo.heightM",
                        val === "" ? null : Number(val),
                      );
                      handleFieldBlur("student.personalInfo.heightM");
                    }}
                    error={errors["student.personalInfo.heightM"]}
                    placeholder="1.5"
                    required={isFieldRequired(
                      runtimeSchema,
                      "student.personalInfo.heightM",
                    )}
                  />
                </div>
                <div className="md:col-span-2">
                  <FormField
                    label="Weight (kg.)"
                    type="text"
                    inputMode="decimal"
                    value={studentInfo?.personalInfo?.weightKg || ""}
                    onChange={(val: any) => {
                      handleInputChange(
                        "student.personalInfo.weightKg",
                        String(val).replace(/[^0-9.]/g, ""),
                      );
                    }}
                    onBlur={() => {
                      const val = studentInfo?.personalInfo?.weightKg;
                      handleInputChange(
                        "student.personalInfo.weightKg",
                        val === "" ? null : Number(val),
                      );
                      handleFieldBlur("student.personalInfo.weightKg");
                    }}
                    error={errors["student.personalInfo.weightKg"]}
                    placeholder="65"
                    required={isFieldRequired(
                      runtimeSchema,
                      "student.personalInfo.weightKg",
                    )}
                  />
                </div>

                <div className="md:col-span-6">
                  <SelectField
                    formStyle
                    label="Complexion"
                    options={COMPLEXIONS.map((c) => ({ id: c, name: c }))}
                    value={studentInfo?.personalInfo?.complexion || ""}
                    onChange={(val: any) =>
                      handleInputChange("student.personalInfo.complexion", val)
                    }
                    error={getFieldError("student.personalInfo.complexion")}
                    required={isFieldRequired(
                      runtimeSchema,
                      "student.personalInfo.complexion",
                    )}
                  />
                </div>
              </>
            )}
          </div>
        </SectionContainer>
      )}

      {/* 4. Employment Profile */}
      {subStep === 4 && (
        <SectionContainer
          title="Employment & Housing Profile"
          description="Current employment status and housing details"
          icon={Briefcase}
        >
          <div className="flex flex-col gap-8">
            <Checkbox
              id="isEmployed"
              label="Currently Employed"
              name="isEmployed"
              checked={studentInfo?.personalInfo?.isEmployed || false}
              onCheckedChange={(checked: boolean | "indeterminate") => {
                const isChecked = checked === true;
                handleInputChange("student.personalInfo.isEmployed", isChecked);
                if (!isChecked) {
                  onChange("student.personalInfo.employerName", null);
                  onChange("student.personalInfo.employerAddress", null);
                  onChange("student.personalInfo.employerContactNumber", null);
                  setErrors((prev: FormErrors) => {
                    const updated = { ...prev };
                    delete updated["student.personalInfo.employerName"];
                    delete updated["student.personalInfo.employerAddress"];
                    delete updated[
                      "student.personalInfo.employerContactNumber"
                    ];
                    return updated;
                  });
                }
              }}
              info={cn(
                "Mark this if you're currently working.",
                "Additional fields will appear below.",
              )}
            />

            {studentInfo?.personalInfo?.isEmployed && (
              <div
                className={cn(
                  "animate-fade-in grid grid-cols-1 gap-6 border-t",
                  "border-border/10 pt-6 md:grid-cols-3",
                )}
              >
                <div className="md:col-span-3">
                  <FormField
                    label="Employer Name"
                    value={studentInfo?.personalInfo?.employerName || ""}
                    onChange={(val: any) =>
                      handleInputChange(
                        "student.personalInfo.employerName",
                        val,
                      )
                    }
                    placeholder="Company name"
                    error={errors["student.personalInfo.employerName"]}
                    required={isFieldRequired(
                      runtimeSchema,
                      "student.personalInfo.employerName",
                    )}
                  />
                </div>
                <div className="md:col-span-2">
                  <FormField
                    label="Employer Address"
                    value={studentInfo?.personalInfo?.employerAddress || ""}
                    onChange={(val: any) =>
                      handleInputChange(
                        "student.personalInfo.employerAddress",
                        val,
                      )
                    }
                    placeholder="Company address"
                    error={errors["student.personalInfo.employerAddress"]}
                    required={isFieldRequired(
                      runtimeSchema,
                      "student.personalInfo.employerAddress",
                    )}
                  />
                </div>
                <div>
                  <FormField
                    label="Employer Contact Number"
                    value={
                      studentInfo?.personalInfo?.employerContactNumber || ""
                    }
                    onChange={(val: any) =>
                      handleInputChange(
                        "student.personalInfo.employerContactNumber",
                        val,
                      )
                    }
                    placeholder="Employer contact number"
                    error={errors["student.personalInfo.employerContactNumber"]}
                  />
                </div>
              </div>
            )}
          </div>
        </SectionContainer>
      )}

      {/* 5. Address & Contact Information */}
      {subStep === 3 && (
        <>
          <SectionContainer
            title="Address Information"
            description="Permanent and current permanent address"
            icon={MapPin}
          >
            <div className="space-y-8">
              {/* Permanent Address */}
              <FormDividerGroup
                title="City Address"
                className="border-t-0 pt-0"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <SelectField
                    formStyle
                    labelKey="name"
                    label="Region"
                    options={regions}
                    get="code"
                    identifier="code"
                    value={
                      addressRegion.residential?.code ||
                      ({ code: "" } as Region)
                    }
                    onChange={handleResidentialRegionChange}
                    error={errors["student.addresses.1.address.region"]}
                    required
                  />
                  {!isResidentialNCR && (
                    <SelectField
                      formStyle
                      labelKey="name"
                      label="Province"
                      options={residentialProvinces}
                      get="code"
                      identifier="code"
                      enabled={!!addressRegion.residential?.code}
                      value={
                        addressProvince.residential?.code ||
                        ({ code: "" } as Province)
                      }
                      onChange={handleResidentialProvinceChange}
                      error={errors["student.addresses.1.address.province"]}
                      required
                    />
                  )}
                  <SelectField
                    formStyle
                    labelKey="name"
                    label="City/Municipality"
                    options={residentialCities}
                    get="code"
                    identifier="code"
                    enabled={
                      isResidentialNCR
                        ? !!addressRegion.residential?.code &&
                          !isResidentialCitiesLoading
                        : !!addressProvince.residential?.code &&
                          !isResidentialCitiesLoading
                    }
                    value={
                      addressCity.residential?.code || ({ code: "" } as City)
                    }
                    onChange={handleResidentialCityChange}
                    lockedReason={
                      !addressRegion.residential?.code
                        ? "Select a Region first"
                        : ""
                    }
                    error={errors["student.addresses.1.address.city"]}
                    required
                  />
                  <SelectField
                    formStyle
                    labelKey="name"
                    label="Barangay"
                    options={residentialBarangays || []}
                    get="code"
                    identifier="code"
                    enabled={
                      !!addressCity.residential?.code &&
                      !isResidentialBarangaysLoading
                    }
                    value={
                      residentialAddr?.barangay?.code ||
                      ({ code: "" } as Barangay)
                    }
                    onChange={handleResidentialBarangayChange}
                    lockedReason={
                      !addressCity.residential?.code
                        ? "Select a City first"
                        : ""
                    }
                    error={errors["student.addresses.1.address.barangay"]}
                    required
                  />
                  <div className="md:col-span-2">
                    <FormField
                      label="Street / Landmark"
                      value={residentialAddr?.streetDetail || ""}
                      placeholder="e.g. Apt 4B, Bldg 2, 123 Street Name"
                      info={
                        "Include unit/room/bldg/apartment/dorm details if " +
                        "applicable"
                      }
                      onChange={handleResidentialStreetDetailChange}
                      noSpecialCharacters={true}
                    />
                  </div>
                </div>
              </FormDividerGroup>

              {/* Provincial Address */}
              <FormDividerGroup
                title="Provincial Address"
                action={
                  <Checkbox
                    id="provincialSameAsResidential"
                    label="Same as city address"
                    name="provincialSameAsResidential"
                    checked={provincialSync.isSynced}
                    onCheckedChange={(checked: any) =>
                      provincialSync.toggleSync(checked === true)
                    }
                    className="text-xs"
                  />
                }
              >
                <div
                  className={cn(
                    "grid grid-cols-1 gap-6 transition-opacity duration-300 md:grid-cols-2",
                    provincialSync.isReadOnly &&
                      "pointer-events-none opacity-60",
                  )}
                >
                  <SelectField
                    formStyle
                    labelKey="name"
                    label="Region"
                    options={regions}
                    get="code"
                    identifier="code"
                    value={
                      addressRegion.provincial?.code || ({ code: "" } as Region)
                    }
                    onChange={(val: any) => {
                      onChange(
                        `student.addresses.${PROVINCIAL_IDX}.address.region`,
                        { code: val },
                      );
                      onChange(
                        `student.addresses.${PROVINCIAL_IDX}.address.province`,
                        { code: "" } as Province,
                      );
                      onChange(
                        `student.addresses.${PROVINCIAL_IDX}.address.city`,
                        { code: "" } as City,
                      );
                      onChange(
                        `student.addresses.${PROVINCIAL_IDX}.address.barangay`,
                        { code: "" } as Barangay,
                      );
                      setErrors((prev: FormErrors) => {
                        const u = { ...prev };
                        delete u[
                          `student.addresses.${PROVINCIAL_IDX}.address.region`
                        ];
                        return u;
                      });
                    }}
                    error={
                      errors[
                        `student.addresses.${PROVINCIAL_IDX}.address.region`
                      ]
                    }
                    required
                    enabled={!provincialSync.isReadOnly}
                  />
                  {!isProvincialNCR && (
                    <SelectField
                      formStyle
                      labelKey="name"
                      label="Province"
                      options={provincialProvinces}
                      get="code"
                      identifier="code"
                      enabled={
                        !!addressRegion.provincial?.code &&
                        !provincialSync.isReadOnly
                      }
                      value={
                        addressProvince.provincial?.code ||
                        ({ code: "" } as Province)
                      }
                      onChange={(val: any) => {
                        onChange(
                          `student.addresses.${PROVINCIAL_IDX}.address.province`,
                          { code: val },
                        );
                        onChange(
                          `student.addresses.${PROVINCIAL_IDX}.address.city`,
                          { code: "" } as City,
                        );
                        onChange(
                          `student.addresses.${PROVINCIAL_IDX}.address.barangay`,
                          { code: "" } as Barangay,
                        );
                        setErrors((prev: FormErrors) => {
                          const u = { ...prev };
                          delete u[
                            `student.addresses.${PROVINCIAL_IDX}.address.province`
                          ];
                          return u;
                        });
                      }}
                      error={
                        errors[
                          `student.addresses.${PROVINCIAL_IDX}.address.province`
                        ]
                      }
                      required
                    />
                  )}
                  <SelectField
                    formStyle
                    labelKey="name"
                    label="City/Municipality"
                    options={provincialCities}
                    get="code"
                    identifier="code"
                    enabled={
                      (isProvincialNCR
                        ? !!addressRegion.provincial?.code &&
                          !isProvincialCitiesLoading
                        : !!addressProvince.provincial?.code &&
                          !isProvincialCitiesLoading) &&
                      !provincialSync.isReadOnly
                    }
                    value={
                      addressCity.provincial?.code || ({ code: "" } as City)
                    }
                    onChange={(val: any) => {
                      onChange(
                        `student.addresses.${PROVINCIAL_IDX}.address.city`,
                        { code: val },
                      );
                      onChange(
                        `student.addresses.${PROVINCIAL_IDX}.address.barangay`,
                        { code: "" } as Barangay,
                      );
                      setErrors((prev: FormErrors) => {
                        const u = { ...prev };
                        delete u[
                          `student.addresses.${PROVINCIAL_IDX}.address.city`
                        ];
                        return u;
                      });
                    }}
                    lockedReason={
                      provincialSync.isReadOnly
                        ? "Synced with Permanent Address"
                        : !addressRegion.provincial?.code
                          ? "Select a Region first"
                          : ""
                    }
                    error={
                      errors[`student.addresses.${PROVINCIAL_IDX}.address.city`]
                    }
                    required
                  />
                  <SelectField
                    formStyle
                    labelKey="name"
                    label="Barangay"
                    options={provincialBarangays}
                    get="code"
                    identifier="code"
                    enabled={
                      !!addressCity.provincial?.code &&
                      !isProvincialBarangaysLoading &&
                      !provincialSync.isReadOnly
                    }
                    value={
                      provincialAddr?.barangay?.code ||
                      ({ code: "" } as Barangay)
                    }
                    onChange={(val: any) => {
                      onChange(
                        `student.addresses.${PROVINCIAL_IDX}.address.barangay`,
                        { code: val },
                      );
                      setErrors((prev: FormErrors) => {
                        const u = { ...prev };
                        delete u[
                          `student.addresses.${PROVINCIAL_IDX}.address.barangay`
                        ];
                        return u;
                      });
                    }}
                    lockedReason={
                      provincialSync.isReadOnly
                        ? "Synced with Permanent Address"
                        : !addressCity.provincial?.code
                          ? "Select a City first"
                          : ""
                    }
                    error={
                      errors[
                        `student.addresses.${PROVINCIAL_IDX}.address.barangay`
                      ]
                    }
                    required
                  />
                  <div className="md:col-span-2">
                    <FormField
                      label="Street / Landmark"
                      value={provincialAddr?.streetDetail || ""}
                      placeholder="Street name, Lot, Blk, or House No."
                      onChange={(val: any) =>
                        onChange(
                          `student.addresses.${PROVINCIAL_IDX}.address.streetDetail`,
                          val,
                        )
                      }
                      disabled={provincialSync.isReadOnly}
                      noSpecialCharacters={true}
                    />
                  </div>
                </div>
              </FormDividerGroup>
            </div>
          </SectionContainer>

          <SectionContainer
            title="Contact Details"
            description="How we can reach you"
            icon={Phone}
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                label="Mobile Number"
                inputMode="tel"
                value={studentInfo?.personalInfo?.mobileNumber || ""}
                onChange={(val: any) =>
                  handleInputChange("student.personalInfo.mobileNumber", val)
                }
                onBlur={() =>
                  handleFieldBlur("student.personalInfo.mobileNumber")
                }
                error={getFieldError("student.personalInfo.mobileNumber")}
                placeholder="09XXXXXXXXX"
                required={isFieldRequired(
                  runtimeSchema,
                  "student.personalInfo.mobileNumber",
                )}
              />
              <FormField
                label="Telephone Number"
                inputMode="tel"
                value={studentInfo?.personalInfo?.telephoneNumber || ""}
                onChange={(val: any) =>
                  handleInputChange("student.personalInfo.telephoneNumber", val)
                }
                onBlur={() =>
                  handleFieldBlur("student.personalInfo.telephoneNumber")
                }
                error={getFieldError("student.personalInfo.telephoneNumber")}
                placeholder="e.g. 8-XXX-XXXX"
              />
              <div className="md:col-span-2">
                <FormField
                  label="Email Address"
                  value={studentInfo?.basicInfo?.email || ""}
                  onChange={() => {}}
                  placeholder="Email address"
                  disabled={true}
                />
              </div>
            </div>
          </SectionContainer>

          <SectionContainer
            title="Emergency Contact"
            description="Person to contact in case of emergency"
            icon={Phone}
          >
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField
                  label="Last Name"
                  value={
                    studentInfo?.personalInfo?.emergencyContact?.lastName || ""
                  }
                  onChange={(val: any) =>
                    handleInputChange(
                      "student.personalInfo.emergencyContact.lastName",
                      val,
                    )
                  }
                  error={
                    errors["student.personalInfo.emergencyContact.lastName"]
                  }
                  placeholder="Last name"
                  noSpecialCharacters={true}
                  required
                />
                <FormField
                  label="First Name"
                  value={
                    studentInfo?.personalInfo?.emergencyContact?.firstName || ""
                  }
                  onChange={(val: any) =>
                    handleInputChange(
                      "student.personalInfo.emergencyContact.firstName",
                      val,
                    )
                  }
                  error={
                    errors["student.personalInfo.emergencyContact.firstName"]
                  }
                  placeholder="First name"
                  noSpecialCharacters={true}
                  required
                />
                <FormField
                  label="Middle Name"
                  value={
                    studentInfo?.personalInfo?.emergencyContact?.middleName ||
                    ""
                  }
                  onChange={(val: any) =>
                    handleInputChange(
                      "student.personalInfo.emergencyContact.middleName",
                      val,
                    )
                  }
                  error={
                    errors["student.personalInfo.emergencyContact.middleName"]
                  }
                  placeholder="Middle name"
                  noSpecialCharacters={true}
                />
                <FormField
                  label="Contact Number"
                  inputMode="numeric"
                  value={
                    studentInfo?.personalInfo?.emergencyContact
                      ?.contactNumber || ""
                  }
                  onChange={(val: any) =>
                    handleInputChange(
                      "student.personalInfo.emergencyContact.contactNumber",
                      val.replace(/[^0-9]/g, ""),
                    )
                  }
                  error={
                    errors[
                      "student.personalInfo.emergencyContact.contactNumber"
                    ]
                  }
                  placeholder="Phone number"
                  required
                />
                <div className="md:col-span-2">
                  <SelectField
                    formStyle
                    label="Relationship"
                    options={studentRelationshipTypes}
                    value={
                      studentInfo?.personalInfo?.emergencyContact?.relationship
                        ?.id || ""
                    }
                    onChange={(val: any) =>
                      handleInputChange(
                        "student.personalInfo.emergencyContact.relationship",
                        { id: val },
                      )
                    }
                    error={
                      errors[
                        "student.personalInfo.emergencyContact.relationship"
                      ]
                    }
                    required
                  />
                </div>
              </div>

              <FormDividerGroup
                title="Contact Address"
                action={
                  <Checkbox
                    id="emergencySameAsResidential"
                    label="Same as city address"
                    name="emergencySameAsResidential"
                    checked={emergencySync.isSynced}
                    onCheckedChange={(checked: any) =>
                      emergencySync.toggleSync(checked === true)
                    }
                    className="text-xs"
                  />
                }
              >
                <div
                  className={cn(
                    "grid grid-cols-1 gap-6 transition-opacity duration-300",
                    "md:grid-cols-2",
                    emergencySync.isReadOnly &&
                      "pointer-events-none opacity-60",
                  )}
                >
                  <SelectField
                    formStyle
                    labelKey="name"
                    label="Region"
                    options={regions}
                    get="code"
                    identifier="code"
                    value={
                      addressRegion.emergency?.code || ({ code: "" } as Region)
                    }
                    onChange={(val: any) => {
                      onChange(
                        `student.personalInfo.emergencyContact.address.region`,
                        { code: val },
                      );
                      onChange(
                        `student.personalInfo.emergencyContact.address.province`,
                        { code: "" } as Province,
                      );
                      onChange(
                        `student.personalInfo.emergencyContact.address.city`,
                        { code: "" } as City,
                      );
                      onChange(
                        `student.personalInfo.emergencyContact.address.barangay`,
                        { code: "" } as Barangay,
                      );
                      setErrors((prev: FormErrors) => {
                        const u = { ...prev };
                        delete u[
                          `student.personalInfo.emergencyContact.address.region`
                        ];
                        return u;
                      });
                    }}
                    error={
                      errors[
                        `student.personalInfo.emergencyContact.address.region`
                      ]
                    }
                    required
                    enabled={!emergencySync.isReadOnly}
                  />
                  {!isEmergencyNCR && (
                    <SelectField
                      formStyle
                      labelKey="name"
                      label="Province"
                      options={emergencyProvinces}
                      get="code"
                      identifier="code"
                      enabled={
                        !!addressRegion.emergency?.code &&
                        !emergencySync.isReadOnly
                      }
                      value={
                        addressProvince.emergency?.code ||
                        ({ code: "" } as Province)
                      }
                      onChange={(val: any) => {
                        onChange(
                          `student.personalInfo.emergencyContact.address.province`,
                          { code: val },
                        );
                        onChange(
                          `student.personalInfo.emergencyContact.address.city`,
                          { code: "" } as City,
                        );
                        onChange(
                          `student.personalInfo.emergencyContact.address.barangay`,
                          { code: "" } as Barangay,
                        );
                        setErrors((prev: FormErrors) => {
                          const u = { ...prev };
                          delete u[
                            `student.personalInfo.emergencyContact.address.province`
                          ];
                          return u;
                        });
                      }}
                      error={
                        errors[
                          `student.personalInfo.emergencyContact.address.province`
                        ]
                      }
                      required
                    />
                  )}
                  <SelectField
                    formStyle
                    labelKey="name"
                    label="City/Municipality"
                    options={emergencyCities}
                    get="code"
                    identifier="code"
                    enabled={
                      (isEmergencyNCR
                        ? !!addressRegion.emergency?.code &&
                          !isEmergencyCitiesLoading
                        : !!addressProvince.emergency?.code &&
                          !isEmergencyCitiesLoading) &&
                      !emergencySync.isReadOnly
                    }
                    value={
                      addressCity.emergency?.code || ({ code: "" } as City)
                    }
                    onChange={(val: any) => {
                      onChange(
                        `student.personalInfo.emergencyContact.address.city`,
                        { code: val },
                      );
                      onChange(
                        `student.personalInfo.emergencyContact.address.barangay`,
                        { code: "" } as Barangay,
                      );
                      setErrors((prev: FormErrors) => {
                        const u = { ...prev };
                        delete u[
                          `student.personalInfo.emergencyContact.address.city`
                        ];
                        return u;
                      });
                    }}
                    lockedReason={
                      emergencySync.isReadOnly
                        ? "Synced with Permanent Address"
                        : !addressRegion.emergency?.code
                          ? "Select a Region first"
                          : ""
                    }
                    error={
                      errors[
                        `student.personalInfo.emergencyContact.address.city`
                      ]
                    }
                    required
                  />
                  <SelectField
                    formStyle
                    labelKey="name"
                    label="Barangay"
                    options={emergencyBarangays}
                    get="code"
                    identifier="code"
                    enabled={
                      !!addressCity.emergency?.code &&
                      !isEmergencyBarangaysLoading &&
                      !emergencySync.isReadOnly
                    }
                    value={
                      emergencyAddr?.barangay?.code ||
                      ({ code: "" } as Barangay)
                    }
                    onChange={(val: any) => {
                      onChange(
                        `student.personalInfo.emergencyContact.address.barangay`,
                        { code: val },
                      );
                      setErrors((prev: FormErrors) => {
                        const u = { ...prev };
                        delete u[
                          `student.personalInfo.emergencyContact.address.barangay`
                        ];
                        return u;
                      });
                    }}
                    lockedReason={
                      emergencySync.isReadOnly
                        ? "Synced with Permanent Address"
                        : !addressCity.emergency?.code
                          ? "Select a City first"
                          : ""
                    }
                    error={
                      errors[
                        `student.personalInfo.emergencyContact.address.barangay`
                      ]
                    }
                    required
                  />
                  <div className="md:col-span-2">
                    <FormField
                      label="Street / Landmark"
                      value={emergencyAddr?.streetDetail || ""}
                      placeholder="Street name, Lot, Blk, or House No."
                      onChange={(val: any) =>
                        onChange(
                          `student.personalInfo.emergencyContact.address.streetDetail`,
                          val,
                        )
                      }
                      disabled={emergencySync.isReadOnly}
                      noSpecialCharacters={true}
                    />
                  </div>
                </div>
              </FormDividerGroup>
            </div>
          </SectionContainer>
        </>
      )}
    </div>
  );
});
