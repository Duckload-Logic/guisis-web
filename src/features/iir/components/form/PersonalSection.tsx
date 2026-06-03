import { forwardRef, useImperativeHandle, useState, useCallback } from "react";
import { Dropdown, FormInput, Checkbox, DatePicker } from "@/components/form";
import { SectionContainer } from "./SectionContainer";
import { User, MapPin, Phone, Briefcase, Activity } from "lucide-react";
import {
  useCourses,
  useGenders,
  useCivilStatuses,
  useReligions,
  useStudentRelationshipTypes,
  useAddressSync,
} from "@/features/iir/hooks";
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

import { PERSONAL_SUBSTEP_FIELDS } from "@/features/iir/config/subStepFields";

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
  const { data: courses = [], isLoading: isCoursesLoading } = useCourses();
  const { data: genders = [] } = useGenders();
  const { data: civilStatuses = [] } = useCivilStatuses();
  const { data: religions = [] } = useReligions();
  const { data: studentRelationshipTypes = [] } = useStudentRelationshipTypes();
  const { data: regions = [] } = useGetRegions();
  const [errors, setErrors] = useState<FormErrors>({});

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

    setErrors((prev) => ({ ...prev, ...sectionErrors }));
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
            <div className="md:col-span-2">
              <FormInput
                label="First Name"
                value={studentInfo?.basicInfo?.firstName || ""}
                onChange={(val: any) =>
                  handleInputChange("student.basicInfo.firstName", val)
                }
                error={errors["student.basicInfo.firstName"]}
                placeholder="First name"
                required={isFieldRequired(
                  runtimeSchema,
                  "student.basicInfo.firstName",
                )}
                disabled
              />
            </div>
            <div className="md:col-span-2">
              <FormInput
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
                placeholder="Middle name"
                disabled
              />
            </div>
            <div className="md:col-span-2">
              <FormInput
                label="Last Name"
                value={studentInfo?.basicInfo?.lastName || ""}
                onChange={(val: any) =>
                  handleInputChange("student.basicInfo.lastName", val)
                }
                error={errors["student.basicInfo.lastName"]}
                placeholder="Last name"
                required={isFieldRequired(
                  runtimeSchema,
                  "student.basicInfo.lastName",
                )}
                disabled
              />
            </div>

            <div className="md:col-span-1">
              <FormInput
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
              <FormInput
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
              <Dropdown
                formStyle
                label="Course"
                options={courses}
                value={studentInfo?.personalInfo?.course?.id || ""}
                onChange={(val: any) =>
                  handleInputChange("student.personalInfo.course", { id: val })
                }
                error={errors["student.personalInfo.course"]}
                required={isFieldRequired(
                  runtimeSchema,
                  "student.personalInfo.course",
                )}
                enabled={!isCoursesLoading}
              />
            </div>

            <div className="md:col-span-3">
              <FormInput
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
              <FormInput
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
              <Dropdown
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
              <Dropdown
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
              <Dropdown
                formStyle
                label="Religion"
                options={religions}
                value={studentInfo?.personalInfo?.religion?.id || ""}
                onChange={(val: any) =>
                  handleInputChange("student.personalInfo.religion", {
                    id: val,
                  })
                }
                error={errors["student.personalInfo.religion"]}
                required={isFieldRequired(
                  runtimeSchema,
                  "student.personalInfo.religion",
                )}
              />
            </div>

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
              />
            </div>
            {!isEditMode && (
              <>
                <div className="md:col-span-3">
                  <FormInput
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
                  <FormInput
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
                  <FormInput
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
                    placeholder="5.7"
                    required={isFieldRequired(
                      runtimeSchema,
                      "student.personalInfo.heightM",
                    )}
                  />
                </div>
                <div className="md:col-span-2">
                  <FormInput
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
                  <Dropdown
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
                  <FormInput
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
                  <FormInput
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
                  <FormInput
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
            <div className="flex flex-col gap-10">
              {/* Permanent Address */}
              <div>
                <h4 className="mb-6 flex items-center gap-2 text-sm font-bold text-foreground/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Permanent Address
                </h4>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Dropdown
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
                    <Dropdown
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
                  <Dropdown
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
                  <Dropdown
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
                    <FormInput
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
              </div>

              {/* Provincial Address */}
              <div className="border-t border-glass-border pt-8">
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-foreground/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Provincial Address
                  </h4>
                  <Checkbox
                    id="provincialSameAsResidential"
                    label="Same as permanent address"
                    name="provincialSameAsResidential"
                    checked={provincialSync.isSynced}
                    onCheckedChange={(checked: any) =>
                      provincialSync.toggleSync(checked === true)
                    }
                    className="text-xs"
                  />
                </div>

                <div
                  className={cn(
                    "grid grid-cols-1 gap-6 transition-opacity duration-300 md:grid-cols-2",
                    provincialSync.isReadOnly &&
                      "pointer-events-none opacity-60",
                  )}
                >
                  <Dropdown
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
                    <Dropdown
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
                  <Dropdown
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
                  <Dropdown
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
                    <FormInput
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
              </div>
            </div>
          </SectionContainer>

          <SectionContainer
            title="Contact Details"
            description="How we can reach you"
            icon={Phone}
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormInput
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
              <FormInput
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
                <FormInput
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
                <FormInput
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
                <FormInput
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
                <FormInput
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
                <FormInput
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
                  <Dropdown
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

              <div className="border-t border-glass-border pt-8">
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-foreground/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Contact Address
                  </h4>
                  <Checkbox
                    id="emergencySameAsResidential"
                    label="Same as permanent address"
                    name="emergencySameAsResidential"
                    checked={emergencySync.isSynced}
                    onCheckedChange={(checked: any) =>
                      emergencySync.toggleSync(checked === true)
                    }
                    className="text-xs"
                  />
                </div>

                <div
                  className={cn(
                    "grid grid-cols-1 gap-6 transition-opacity duration-300",
                    "md:grid-cols-2",
                    emergencySync.isReadOnly &&
                      "pointer-events-none opacity-60",
                  )}
                >
                  <Dropdown
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
                    <Dropdown
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
                  <Dropdown
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
                  <Dropdown
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
                    <FormInput
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
              </div>
            </div>
          </SectionContainer>
        </>
      )}
    </div>
  );
});
