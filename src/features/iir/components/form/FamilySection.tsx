import { forwardRef, useImperativeHandle, useState, useRef, memo } from "react";
import {
  Users,
  CircleDollarSign,
  Check,
  Home,
  Heart,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Checkbox, Radio } from "@/components/form";
import { FormField } from "@/components/ui/form-field";
import { SelectField } from "@/components/ui/select-field";
import { SectionContainer } from "./SectionContainer";
import {
  validateObject,
  isFieldRequired,
  validateField,
} from "@/services/validationSchema";
import { familyValidationSchema } from "@/features/iir/config/familyValidationSchema";
import {
  useIncomeRanges,
  useNatureOfResidenceTypes,
  useParentalStatusTypes,
  useSiblingSupportTypes,
  useStudentSupportTypes,
  useStudentRelationshipTypes,
  useEducationalAttainments,
} from "../../hooks";
import { cn } from "@/lib/utils";
import { FAMILY_SUBSTEP_FIELDS } from "@/features/iir/config/subStepFields";
import { DatePicker } from "@/components/ui/date-picker";

interface FormErrors {
  [key: string]: string;
}

interface FamilySectionRef {
  validate: (step?: number) => { isValid: boolean; errors: FormErrors };
}

const FATHER_IDX = 0;
const MOTHER_IDX = 1;
const GUARDIAN_IDX = 2;

interface ParentInformationCardProps {
  title: string;
  idx: number;
  family: any;
  handleInputChange: (path: string, value: any) => void;
  handleFieldBlur: (path: string) => void;
  getFieldError: (path: string) => string | undefined;
  attainmentOptions: any[];
  isEditMode?: boolean;
  onClear: () => void;
}

const ParentInformationCard = memo(
  ({
    title,
    idx,
    family,
    handleInputChange,
    handleFieldBlur,
    getFieldError,
    attainmentOptions,
    isEditMode = false,
    onClear,
  }: ParentInformationCardProps) => {
    const person = family?.relatedPersons?.[idx] || {};
    const calculateAge = (dobString: string) => {
      if (!dobString) return "";
      const dob = new Date(dobString);
      if (isNaN(dob.getTime())) return "";
      const diffMs = Date.now() - dob.getTime();
      const ageDate = new Date(diffMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    };
    const isNameDisabled =
      isEditMode && (idx === FATHER_IDX || idx === MOTHER_IDX);
    const isNA =
      person.occupation?.trim().toLowerCase() === "not applicable" ||
      person.occupation?.trim().toLowerCase() === "n/a";

    return (
      <SectionContainer
        title={title}
        description={`If any information is unknown, just leave it blank. Fill only the ${title.toLowerCase().replace("'s information", "")} details you know.`}
        icon={User}
      >
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClear}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-[10px]",
                "font-bold uppercase transition-all duration-300",
                "border-neutral-200/50 bg-neutral-100/30 text-neutral-500",
                "hover:bg-destructive/15 hover:text-destructive",
                "hover:border-destructive/50",
                "dark:border-white/10 dark:bg-white/5 dark:text-neutral-400",
                "dark:hover:bg-destructive/20",
                "dark:hover:text-destructive-foreground",
              )}
            >
              Clear Info
            </button>

            {["Living", "Deceased"].map((status) => {
              const isLiving = status === "Living";
              const isSelected = person.isLiving === isLiving;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    handleInputChange(
                      `family.relatedPersons.${idx}.isLiving`,
                      isLiving,
                    )
                  }
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-[10px]",
                    "font-bold uppercase transition-all duration-300",
                    isSelected
                      ? isLiving
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
                        : "border-rose-500/50 bg-rose-500/10 text-rose-600"
                      : "border-glass-border/20 bg-glass-bg/40 text-muted-foreground",
                  )}
                >
                  {status}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:gap-8 md:grid-cols-3">
            <FormField
              name={`family.relatedPersons.${idx}.firstName`}
              label="First Name"
              required={isFieldRequired(
                familyValidationSchema,
                `family.relatedPersons.${idx}.firstName`,
                { family },
              )}
              value={person.firstName || ""}
              onChange={(val) =>
                handleInputChange(`family.relatedPersons.${idx}.firstName`, val)
              }
              onBlur={() =>
                handleFieldBlur(`family.relatedPersons.${idx}.firstName`)
              }
              placeholder="First name"
              disabled={isNameDisabled}
              error={getFieldError(`family.relatedPersons.${idx}.firstName`)}
            />
            <FormField
              name={`family.relatedPersons.${idx}.middleName`}
              label="Middle Name"
              value={person.middleName || ""}
              onChange={(val) =>
                handleInputChange(
                  `family.relatedPersons.${idx}.middleName`,
                  val,
                )
              }
              onBlur={() =>
                handleFieldBlur(`family.relatedPersons.${idx}.middleName`)
              }
              placeholder="Middle name"
              disabled={isNameDisabled}
              error={getFieldError(`family.relatedPersons.${idx}.middleName`)}
            />
            <FormField
              name={`family.relatedPersons.${idx}.lastName`}
              label="Last Name"
              required={isFieldRequired(
                familyValidationSchema,
                `family.relatedPersons.${idx}.lastName`,
                { family },
              )}
              value={person.lastName || ""}
              onChange={(val) =>
                handleInputChange(`family.relatedPersons.${idx}.lastName`, val)
              }
              onBlur={() =>
                handleFieldBlur(`family.relatedPersons.${idx}.lastName`)
              }
              placeholder="Last name"
              disabled={isNameDisabled}
              error={getFieldError(`family.relatedPersons.${idx}.lastName`)}
            />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="grid grid-cols-1 gap-4">
              <div className="sm:col-span-1">
                <DatePicker
                  label="Date of Birth"
                  required={isFieldRequired(
                    familyValidationSchema,
                    `family.relatedPersons.${idx}.dateOfBirth`,
                    { family },
                  )}
                  value={person.dateOfBirth || ""}
                  onChange={(val) =>
                    handleInputChange(
                      `family.relatedPersons.${idx}.dateOfBirth`,
                      val,
                    )
                  }
                  onBlur={() =>
                    handleFieldBlur(`family.relatedPersons.${idx}.dateOfBirth`)
                  }
                  error={getFieldError(
                    `family.relatedPersons.${idx}.dateOfBirth`,
                  )}
                  disabled={isEditMode}
                />
              </div>
            </div>
            <SelectField
              name={`family.relatedPersons.${idx}.educationalAttainment`}
              label="Educational Attainment"
              required={isFieldRequired(
                familyValidationSchema,
                `family.relatedPersons.${idx}.educationalAttainment`,
                { family },
              )}
              value={person.educationalAttainment?.id || ""}
              onChange={(val) =>
                handleInputChange(
                  `family.relatedPersons.${idx}.educationalAttainment`,
                  { id: Number(val) },
                )
              }
              onBlur={() =>
                handleFieldBlur(
                  `family.relatedPersons.${idx}.educationalAttainment`,
                )
              }
              options={attainmentOptions}
              error={getFieldError(
                `family.relatedPersons.${idx}.educationalAttainment`,
              )}
            />

            <div className="relative">
              <FormField
                name={`family.relatedPersons.${idx}.occupation`}
                label="Occupation"
                required={isFieldRequired(
                  familyValidationSchema,
                  `family.relatedPersons.${idx}.occupation`,
                  { family },
                )}
                value={person.occupation || ""}
                onChange={(val) => {
                  handleInputChange(
                    `family.relatedPersons.${idx}.occupation`,
                    val,
                  );
                  const normalized = val.trim().toLowerCase();
                  if (normalized === "not applicable" || normalized === "n/a") {
                    handleInputChange(
                      `family.relatedPersons.${idx}.employerName`,
                      null,
                    );
                    handleInputChange(
                      `family.relatedPersons.${idx}.employerAddress`,
                      null,
                    );
                  }
                }}
                onBlur={() =>
                  handleFieldBlur(`family.relatedPersons.${idx}.occupation`)
                }
                placeholder="e.g. Engineer"
                error={getFieldError(`family.relatedPersons.${idx}.occupation`)}
                className="mb-4"
              />
              <Checkbox
                id={`family.relatedPersons.${idx}` + `.occupation_na`}
                name={`family.relatedPersons.${idx}` + `.occupation_na`}
                label="Not applicable (unemployed / retired)"
                checked={isNA}
                onCheckedChange={(checked) => {
                  if (checked === true) {
                    handleInputChange(
                      `family.relatedPersons.${idx}.occupation`,
                      "Not applicable",
                    );
                    handleInputChange(
                      `family.relatedPersons.${idx}.employerName`,
                      null,
                    );
                    handleInputChange(
                      `family.relatedPersons.${idx}.employerAddress`,
                      null,
                    );
                  } else {
                    handleInputChange(
                      `family.relatedPersons.${idx}.occupation`,
                      "",
                    );
                  }
                }}
                className="mt-1"
              />
            </div>
            <FormField
              name={`family.relatedPersons.${idx}.employerName`}
              label="Name of Employer"
              required={isFieldRequired(
                familyValidationSchema,
                `family.relatedPersons.${idx}.employerName`,
                { family },
              )}
              value={person.employerName || ""}
              onChange={(val) =>
                handleInputChange(
                  `family.relatedPersons.${idx}.employerName`,
                  val,
                )
              }
              onBlur={() =>
                handleFieldBlur(`family.relatedPersons.${idx}.employerName`)
              }
              placeholder={isNA ? "Not applicable" : "Company name"}
              disabled={isNA}
              error={getFieldError(`family.relatedPersons.${idx}.employerName`)}
            />

            <div className="md:col-span-2">
              <FormField
                name={`family.relatedPersons.${idx}.employerAddress`}
                label="Address of Employer"
                value={person.employerAddress || ""}
                onChange={(val) =>
                  handleInputChange(
                    `family.relatedPersons.${idx}.employerAddress`,
                    val,
                  )
                }
                onBlur={() =>
                  handleFieldBlur(
                    `family.relatedPersons.${idx}.employerAddress`,
                  )
                }
                placeholder={isNA ? "Not applicable" : "Company address"}
                disabled={isNA}
                error={getFieldError(
                  `family.relatedPersons.${idx}.employerAddress`,
                )}
              />
            </div>
          </div>
        </div>
      </SectionContainer>
    );
  },
);

export const FamilySection = forwardRef<
  FamilySectionRef,
  {
    family: any;
    onChange: (path: string, value: any) => void;
    onFieldBlur?: (fieldPath: string) => void;
    shouldShowError?: (fieldPath: string) => boolean;
    subStep?: number;
    isEditMode?: boolean;
  }
>(function FamilySection(
  {
    family,
    onChange,
    onFieldBlur,
    shouldShowError,
    subStep = 1,
    isEditMode = false,
  },
  ref,
) {
  const { data: parentalStatusOptions } = useParentalStatusTypes();
  const { data: natureOfResidenceOptions } = useNatureOfResidenceTypes();
  const { data: monthlyFamilyIncomeRanges } = useIncomeRanges();
  const { data: siblingSupportTypesOptions } = useSiblingSupportTypes();
  const { data: studentSupportTypesOptions } = useStudentSupportTypes();
  const { data: relationshipOptions } = useStudentRelationshipTypes();
  const { data: attainmentOptions } = useEducationalAttainments();

  const isSiblingNA =
    family?.background?.brothers === 0 &&
    family?.background?.sisters === 0 &&
    family?.background?.employedSiblings === 0 &&
    family?.background?.ordinalPosition === 1;

  const handleToggleSiblingNA = (
    checked: boolean | "indeterminate",
  ) => {
    if (checked === true) {
      handleInputChange("family.background.brothers", 0);
      handleInputChange("family.background.sisters", 0);
      handleInputChange("family.background.employedSiblings", 0);
      handleInputChange("family.background.ordinalPosition", 1);
      handleInputChange("family.background.siblingSupportTypes", []);
      setErrors((prev: FormErrors) => {
        const updated = { ...prev };
        delete updated["family.background.brothers"];
        delete updated["family.background.sisters"];
        delete updated["family.background.employedSiblings"];
        delete updated["family.background.ordinalPosition"];
        delete updated["family.background.siblingSupportTypes"];
        return updated;
      });
    } else {
      handleInputChange("family.background.brothers", "");
      handleInputChange("family.background.sisters", "");
      handleInputChange("family.background.employedSiblings", "");
      handleInputChange("family.background.ordinalPosition", "");
    }
  };

  const [errors, setErrors] = useState<FormErrors>({});
  const [otherTouched, setOtherTouched] = useState(false);
  const otherInputRef = useRef<HTMLInputElement | null>(null);

  const guardian = family?.relatedPersons?.[GUARDIAN_IDX] || {};
  const isGuardianNA =
    guardian.occupation?.trim().toLowerCase() === "not applicable" ||
    guardian.occupation?.trim().toLowerCase() === "n/a";

  const validate = (
    step?: number,
  ): { isValid: boolean; errors: FormErrors } => {
    const activeStep = step ?? subStep;

    // Filter schema to only include fields for the specified sub-step
    const filteredSchema: any = {};
    let targetFields = FAMILY_SUBSTEP_FIELDS[activeStep] || [];

    if (isEditMode && activeStep === 4) {
      targetFields = targetFields.filter((field) =>
        field.startsWith("family.relatedPersons.2."),
      );
    }

    targetFields.forEach((field) => {
      if (familyValidationSchema[field]) {
        filteredSchema[field] = familyValidationSchema[field];
      }
    });

    const sectionErrors = validateObject({ family }, filteredSchema);
    setErrors((prev) => ({ ...prev, ...sectionErrors }));
    return {
      isValid: Object.keys(sectionErrors).length === 0,
      errors: sectionErrors,
    };
  };

  useImperativeHandle(ref, () => ({
    validate: (step?: number) => validate(step),
  }));

  const handleInputChange = (fieldPath: string, value: any) => {
    onChange(fieldPath, value);

    const fieldRules = familyValidationSchema[fieldPath];
    if (fieldRules) {
      const error = validateField(value, fieldRules, { family });
      setErrors((prev: FormErrors) => {
        const updated = { ...prev };
        if (error) updated[fieldPath] = error;
        else delete updated[fieldPath];
        return updated;
      });
    }

    if (onFieldBlur) {
      onFieldBlur(fieldPath);
    }
  };

  const handleClearParent = (idx: number) => {
    const prefix = `family.relatedPersons.${idx}`;
    handleInputChange(`${prefix}.firstName`, "");
    handleInputChange(`${prefix}.middleName`, "");
    handleInputChange(`${prefix}.lastName`, "");
    handleInputChange(`${prefix}.dateOfBirth`, "");
    handleInputChange(
      `${prefix}.educationalAttainment`,
      { id: 0, name: "" },
    );
    handleInputChange(`${prefix}.occupation`, "");
    handleInputChange(`${prefix}.employerName`, null);
    handleInputChange(`${prefix}.employerAddress`, null);
    handleInputChange(`${prefix}.isLiving`, null);

    setErrors((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        if (key.startsWith(prefix)) {
          delete updated[key];
        }
      });
      return updated;
    });
  };

  const getFieldError = (fieldPath: string): string | undefined => {
    const hasError = errors[fieldPath];
    const showError = shouldShowError ? shouldShowError(fieldPath) : true;
    return hasError && showError ? errors[fieldPath] : undefined;
  };

  const handleFieldBlur = (fieldPath: string) => {
    if (onFieldBlur) {
      onFieldBlur(fieldPath);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Parental Status & Living Situation (subStep 1) */}
      {subStep === 1 && (
        <>
          <SectionContainer
            title="Parental Status"
            description="Marital and legal status of your parents"
            icon={Heart}
          >
            <Radio
              label=""
              name="parentalStatus"
              options={parentalStatusOptions || []}
              value={family?.background?.parentalStatus?.id || ""}
              onChange={(val) => {
                handleInputChange("family.background.parentalStatus", {
                  id: Number(val),
                });
                const selected = parentalStatusOptions?.find(
                  (opt: any) => String(opt.id) === String(val),
                );
                const isOther =
                  selected?.name?.toLowerCase() === "other" ||
                  selected?.text?.toLowerCase() === "other";
                if (!isOther) {
                  onChange("family.background.parentalStatusOther", "");
                  setErrors((prev: FormErrors) => {
                    const updated = { ...prev };
                    delete updated["family.background.parentalStatusOther"];
                    return updated;
                  });
                }
              }}
              columns={2}
            />
            {(() => {
              const selectedOption = parentalStatusOptions?.find(
                (opt: any) =>
                  String(opt.id) ===
                  String(family?.background?.parentalStatus?.id || ""),
              );
              const isOther =
                selectedOption?.name?.toLowerCase() === "other" ||
                selectedOption?.text?.toLowerCase() === "other";

              return (
                isOther && (
                  <div className="animate-fade-in mt-4 px-1">
                    <FormField
                      name="family.background.parentalStatusOther"
                      label="Please Specify"
                      value={family?.background?.parentalStatusOther || ""}
                      onChange={(val) =>
                        handleInputChange(
                          "family.background.parentalStatusOther",
                          val,
                        )
                      }
                      placeholder="Please specify..."
                      error={errors["family.background.parentalStatusOther"]}
                      required
                    />
                  </div>
                )
              );
            })()}
            {errors["family.background.parentalStatus"] && (
              <p className="ml-1 mt-4 flex animate-bounce items-center gap-1.5 text-xs font-bold text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors["family.background.parentalStatus"]}
              </p>
            )}
          </SectionContainer>

          <SectionContainer
            title="Living Situation"
            description="Environment and nature of your current residence"
            icon={Home}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                <div
                  className={cn(
                    "bg-glass-bg/40 border-glass-border/20 rounded-xl border",
                    "p-6 backdrop-blur-sm transition-all duration-300 sm:p-8",
                    "hover:bg-glass-bg/60 h-fit",
                  )}
                >
                  <Radio
                    label="Do you have a quiet place to study?"
                    name="haveQuietPlaceToStudy"
                    options={[
                      { id: "yes", name: "Yes" },
                      { id: "no", name: "No" },
                    ]}
                    value={
                      family?.background?.haveQuietPlaceToStudy === true
                        ? "yes"
                        : family?.background?.haveQuietPlaceToStudy === false
                          ? "no"
                          : ""
                    }
                    onChange={(val) => {
                      handleInputChange(
                        "family.background.haveQuietPlaceToStudy",
                        val === "yes",
                      );
                    }}
                    columns={2}
                  />
                </div>

                <div
                  className={cn(
                    "bg-glass-bg/40 border-glass-border/20 rounded-xl border",
                    "p-6 backdrop-blur-sm transition-all duration-300 sm:p-8",
                    "hover:bg-glass-bg/60",
                  )}
                >
                  <Radio
                    label="Do you share your room with anyone?"
                    name="isSharingRoom"
                    options={[
                      { id: "yes", name: "Yes" },
                      { id: "no", name: "No" },
                    ]}
                    value={
                      family?.background?.isSharingRoom === true
                        ? "yes"
                        : family?.background?.isSharingRoom === false
                          ? "no"
                          : ""
                    }
                    onChange={(val) => {
                      const isYes = val === "yes";
                      handleInputChange(
                        "family.background.isSharingRoom",
                        isYes,
                      );
                      if (!isYes) {
                        onChange("family.background.roomSharingDetails", "");
                        setErrors((prev: FormErrors) => {
                          const updated = { ...prev };
                          delete updated[
                            "family.background.roomSharingDetails"
                          ];
                          return updated;
                        });
                      }
                    }}
                    columns={2}
                  />
                  {family?.background?.isSharingRoom && (
                    <div className="animate-fade-in mt-4">
                      <FormField
                        name="family.background.roomSharingDetails"
                        label="Share room with whom?"
                        value={family?.background?.roomSharingDetails || ""}
                        onChange={(val) =>
                          handleInputChange(
                            "family.background.roomSharingDetails",
                            val,
                          )
                        }
                        placeholder="e.g. siblings, parents..."
                        error={getFieldError(
                          "family.background.roomSharingDetails",
                        )}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "bg-glass-bg/40 border-glass-border/20 rounded-xl border",
                  "p-6 backdrop-blur-sm transition-all duration-300 sm:p-8",
                  "hover:bg-glass-bg/60",
                )}
              >
                <Radio
                  label="Nature of Residence"
                  name="natureOfResidence"
                  options={natureOfResidenceOptions || []}
                  value={family?.background?.natureOfResidence?.id || ""}
                  onChange={(val) => {
                    handleInputChange("family.background.natureOfResidence", {
                      id: Number(val),
                    });
                  }}
                  columns={3}
                />
              </div>
            </div>
          </SectionContainer>
        </>
      )}

      {subStep === 2 && (
        <ParentInformationCard
          title="Father's Information"
          idx={FATHER_IDX}
          family={family}
          handleInputChange={handleInputChange}
          handleFieldBlur={handleFieldBlur}
          getFieldError={getFieldError}
          attainmentOptions={attainmentOptions || []}
          isEditMode={isEditMode}
          onClear={() => handleClearParent(FATHER_IDX)}
        />
      )}
      {subStep === 3 && (
        <ParentInformationCard
          title="Mother's Information"
          idx={MOTHER_IDX}
          family={family}
          handleInputChange={handleInputChange}
          handleFieldBlur={handleFieldBlur}
          getFieldError={getFieldError}
          attainmentOptions={attainmentOptions || []}
          isEditMode={isEditMode}
          onClear={() => handleClearParent(MOTHER_IDX)}
        />
      )}

      {subStep === 4 && (
        <div className="flex flex-col gap-6">
          <SectionContainer
            title="Guardian's Information"
            description={
              "Person who assumes responsibility if " +
              "parents are unavailable."
            }
            icon={User}
          >
            <div className="flex flex-col gap-8">
              <div className="max-w-xs">
                <SelectField
                  name={`family.relatedPersons.${GUARDIAN_IDX}.relationship`}
                  label="Relationship to Student"
                  options={relationshipOptions || []}
                  required
                  value={
                    family?.relatedPersons?.[GUARDIAN_IDX]?.relationship?.id ||
                    ""
                  }
                  onChange={(val) =>
                    handleInputChange(
                      `family.relatedPersons.${GUARDIAN_IDX}.relationship`,
                      { id: Number(val) },
                    )
                  }
                  onBlur={() =>
                    handleFieldBlur(
                      `family.relatedPersons.${GUARDIAN_IDX}.relationship`,
                    )
                  }
                  error={getFieldError(
                    `family.relatedPersons.${GUARDIAN_IDX}.relationship`,
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField
                  name={`family.relatedPersons.${GUARDIAN_IDX}.firstName`}
                  label="First Name"
                  required={isFieldRequired(
                    familyValidationSchema,
                    `family.relatedPersons.${GUARDIAN_IDX}.firstName`,
                    { family },
                  )}
                  value={
                    family?.relatedPersons?.[GUARDIAN_IDX]?.firstName || ""
                  }
                  onChange={(val) =>
                    handleInputChange(
                      `family.relatedPersons.${GUARDIAN_IDX}.firstName`,
                      val,
                    )
                  }
                  onBlur={() =>
                    handleFieldBlur(
                      `family.relatedPersons.${GUARDIAN_IDX}.firstName`,
                    )
                  }
                  placeholder="First name"
                  error={getFieldError(
                    `family.relatedPersons.${GUARDIAN_IDX}.firstName`,
                  )}
                />
                <FormField
                  name={`family.relatedPersons.${GUARDIAN_IDX}.middleName`}
                  label="Middle Name"
                  value={
                    family?.relatedPersons?.[GUARDIAN_IDX]?.middleName || ""
                  }
                  onChange={(val) =>
                    handleInputChange(
                      `family.relatedPersons.${GUARDIAN_IDX}.middleName`,
                      val,
                    )
                  }
                  onBlur={() =>
                    handleFieldBlur(
                      `family.relatedPersons.${GUARDIAN_IDX}.middleName`,
                    )
                  }
                  placeholder="Middle name"
                  error={getFieldError(
                    `family.relatedPersons.${GUARDIAN_IDX}.middleName`,
                  )}
                />
                <FormField
                  name={`family.relatedPersons.${GUARDIAN_IDX}.lastName`}
                  label="Last Name"
                  required={isFieldRequired(
                    familyValidationSchema,
                    `family.relatedPersons.${GUARDIAN_IDX}.lastName`,
                    { family },
                  )}
                  value={family?.relatedPersons?.[GUARDIAN_IDX]?.lastName || ""}
                  onChange={(val) =>
                    handleInputChange(
                      `family.relatedPersons.${GUARDIAN_IDX}.lastName`,
                      val,
                    )
                  }
                  onBlur={() =>
                    handleFieldBlur(
                      `family.relatedPersons.${GUARDIAN_IDX}.lastName`,
                    )
                  }
                  placeholder="Last name"
                  error={getFieldError(
                    `family.relatedPersons.${GUARDIAN_IDX}.lastName`,
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="grid grid-cols-1 gap-4">
                  <div className="sm:col-span-1">
                    <DatePicker
                      label="Date of Birth"
                      required={isFieldRequired(
                        familyValidationSchema,
                        `family.relatedPersons.${GUARDIAN_IDX}.dateOfBirth`,
                        { family },
                      )}
                      value={
                        family?.relatedPersons?.[GUARDIAN_IDX]?.dateOfBirth ||
                        ""
                      }
                      onChange={(val) =>
                        handleInputChange(
                          `family.relatedPersons.${GUARDIAN_IDX}.dateOfBirth`,
                          val,
                        )
                      }
                      onBlur={() =>
                        handleFieldBlur(
                          `family.relatedPersons.${GUARDIAN_IDX}.dateOfBirth`,
                        )
                      }
                      error={getFieldError(
                        `family.relatedPersons.${GUARDIAN_IDX}.dateOfBirth`,
                      )}
                    />
                  </div>
                </div>
                <SelectField
                  name={`family.relatedPersons.${GUARDIAN_IDX}.educationalAttainment`}
                  label="Educational Attainment"
                  required={isFieldRequired(
                    familyValidationSchema,
                    `family.relatedPersons.${GUARDIAN_IDX}.educationalAttainment`,
                    { family },
                  )}
                  value={
                    family?.relatedPersons?.[GUARDIAN_IDX]
                      ?.educationalAttainment?.id || ""
                  }
                  onChange={(val) =>
                    handleInputChange(
                      `family.relatedPersons.${GUARDIAN_IDX}.educationalAttainment`,
                      { id: Number(val) },
                    )
                  }
                  onBlur={() =>
                    handleFieldBlur(
                      `family.relatedPersons.${GUARDIAN_IDX}.educationalAttainment`,
                    )
                  }
                  options={attainmentOptions || []}
                  error={getFieldError(
                    `family.relatedPersons.${GUARDIAN_IDX}.educationalAttainment`,
                  )}
                />
                <div className="relative">
                  <FormField
                    name={`family.relatedPersons.${GUARDIAN_IDX}.occupation`}
                    label="Occupation"
                    required={isFieldRequired(
                      familyValidationSchema,
                      `family.relatedPersons.${GUARDIAN_IDX}.occupation`,
                      { family },
                    )}
                    value={
                      family?.relatedPersons?.[GUARDIAN_IDX]?.occupation || ""
                    }
                    onChange={(val) => {
                      handleInputChange(
                        `family.relatedPersons.${GUARDIAN_IDX}.occupation`,
                        val,
                      );
                      const normalized = val.trim().toLowerCase();
                      if (
                        normalized === "not applicable" ||
                        normalized === "n/a"
                      ) {
                        handleInputChange(
                          `family.relatedPersons.${GUARDIAN_IDX}.employerName`,
                          null,
                        );
                        handleInputChange(
                          `family.relatedPersons.${GUARDIAN_IDX}.employerAddress`,
                          null,
                        );
                      }
                    }}
                    onBlur={() =>
                      handleFieldBlur(
                        `family.relatedPersons.${GUARDIAN_IDX}.occupation`,
                      )
                    }
                    placeholder="e.g. Engineer"
                    error={getFieldError(
                      `family.relatedPersons.${GUARDIAN_IDX}.occupation`,
                    )}
                  />
                  <Checkbox
                    id={
                      `family.relatedPersons.${GUARDIAN_IDX}` + `.occupation_na`
                    }
                    name={
                      `family.relatedPersons.${GUARDIAN_IDX}` + `.occupation_na`
                    }
                    label="Not applicable (unemployed / retired)"
                    checked={isGuardianNA}
                    onCheckedChange={(checked) => {
                      if (checked === true) {
                        handleInputChange(
                          `family.relatedPersons.${GUARDIAN_IDX}.occupation`,
                          "Not applicable",
                        );
                        handleInputChange(
                          `family.relatedPersons.${GUARDIAN_IDX}.employerName`,
                          null,
                        );
                        handleInputChange(
                          `family.relatedPersons.${GUARDIAN_IDX}.employerAddress`,
                          null,
                        );
                      } else {
                        handleInputChange(
                          `family.relatedPersons.${GUARDIAN_IDX}.occupation`,
                          "",
                        );
                      }
                    }}
                    className="mt-1"
                  />
                </div>
                <FormField
                  name={`family.relatedPersons.${GUARDIAN_IDX}.employerName`}
                  label="Name of Employer"
                  required={isFieldRequired(
                    familyValidationSchema,
                    `family.relatedPersons.${GUARDIAN_IDX}.employerName`,
                    { family },
                  )}
                  value={
                    family?.relatedPersons?.[GUARDIAN_IDX]?.employerName || ""
                  }
                  onChange={(val) =>
                    handleInputChange(
                      `family.relatedPersons.${GUARDIAN_IDX}.employerName`,
                      val,
                    )
                  }
                  onBlur={() =>
                    handleFieldBlur(
                      `family.relatedPersons.${GUARDIAN_IDX}.employerName`,
                    )
                  }
                  placeholder={isGuardianNA ? "Not applicable" : "Company name"}
                  disabled={isGuardianNA}
                  error={getFieldError(
                    `family.relatedPersons.${GUARDIAN_IDX}.employerName`,
                  )}
                />
                <div className="md:col-span-2">
                  <FormField
                    name={`family.relatedPersons.${GUARDIAN_IDX}.employerAddress`}
                    label="Address of Employer"
                    value={
                      family?.relatedPersons?.[GUARDIAN_IDX]?.employerAddress ||
                      ""
                    }
                    onChange={(val) =>
                      handleInputChange(
                        `family.relatedPersons.${GUARDIAN_IDX}.employerAddress`,
                        val,
                      )
                    }
                    onBlur={() =>
                      handleFieldBlur(
                        `family.relatedPersons.${GUARDIAN_IDX}.employerAddress`,
                      )
                    }
                    placeholder={
                      isGuardianNA ? "Not applicable" : "Company address"
                    }
                    disabled={isGuardianNA}
                    error={getFieldError(
                      `family.relatedPersons.${GUARDIAN_IDX}.employerAddress`,
                    )}
                  />
                </div>
              </div>
            </div>
          </SectionContainer>

          {!isEditMode && (
            <>
              <SectionContainer
                title="Sibling Information"
                description="Family composition and support structure"
                icon={Users}
              >
                <div className="mb-6">
                  <Checkbox
                    id="sibling-na"
                    name="siblingNA"
                    label="Not Applicable (Only Child)"
                    checked={isSiblingNA}
                    onCheckedChange={handleToggleSiblingNA}
                  />
                </div>

                <div
                  className={cn(
                    "mb-8 grid grid-cols-1 gap-4",
                    "sm:grid-cols-2 sm:gap-6 lg:grid-cols-4",
                  )}
                >
                  <FormField
                    name="family.background.brothers"
                    label="Brothers"
                    type="number"
                    required={!isSiblingNA}
                    disabled={isSiblingNA}
                    value={family?.background?.brothers ?? ""}
                    onChange={(val) =>
                      handleInputChange(
                        "family.background.brothers",
                        val === "" ? "" : Number(val),
                      )
                    }
                    placeholder="0"
                    error={getFieldError("family.background.brothers")}
                  />
                  <FormField
                    name="family.background.sisters"
                    label="Sisters"
                    type="number"
                    required={!isSiblingNA}
                    disabled={isSiblingNA}
                    value={family?.background?.sisters ?? ""}
                    onChange={(val) =>
                      handleInputChange(
                        "family.background.sisters",
                        val === "" ? "" : Number(val),
                      )
                    }
                    placeholder="0"
                    error={getFieldError("family.background.sisters")}
                  />
                  <FormField
                    name="family.background.employedSiblings"
                    label="Employed Siblings"
                    type="number"
                    required={!isSiblingNA}
                    disabled={isSiblingNA}
                    value={family?.background?.employedSiblings ?? ""}
                    onChange={(val) =>
                      handleInputChange(
                        "family.background.employedSiblings",
                        val === "" ? "" : Number(val),
                      )
                    }
                    placeholder="0"
                    error={getFieldError("family.background.employedSiblings")}
                  />
                  <FormField
                    name="family.background.ordinalPosition"
                    label="Your Birth Order"
                    type="number"
                    required={!isSiblingNA}
                    disabled={isSiblingNA}
                    value={family?.background?.ordinalPosition ?? ""}
                    onChange={(val) =>
                      handleInputChange(
                        "family.background.ordinalPosition",
                        val === "" ? "" : Number(val),
                      )
                    }
                    placeholder="e.g. 1"
                    error={getFieldError("family.background.ordinalPosition")}
                  />
                </div>

                <div className="space-y-4">
                  <label
                    className={cn(
                      "flex items-center gap-2 text-sm",
                      "font-bold text-foreground",
                    )}
                  >
                    Is your brother/sister who is gainfully employed providing
                    support to your:
                  </label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {siblingSupportTypesOptions?.map((option: any) => {
                      const isChecked =
                        family?.background?.siblingSupportTypes?.some(
                          (item: any) =>
                            String(item.id) === String(option.id),
                        );
                      return (
                        <Checkbox
                          key={option.id}
                          id={`sibling-support-${option.id}`}
                          name="siblingSupportTypes"
                          label={option.name || option.text || option.code}
                          checked={!!isChecked}
                          disabled={isSiblingNA}
                          onCheckedChange={() => {
                            const currentTypes =
                              family?.background?.siblingSupportTypes || [];
                            const newTypes = !isChecked
                              ? [...currentTypes, { id: Number(option.id) }]
                              : currentTypes.filter(
                                  (item: any) =>
                                    String(item.id) !== String(option.id),
                                );
                            handleInputChange(
                              "family.background.siblingSupportTypes",
                              newTypes,
                            );
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 border-t border-white/40 pt-8">
                  <label className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
                    Who finances your schooling?
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {studentSupportTypesOptions?.map((option: any) => {
                      const isChecked =
                        family?.finance?.financialSupportTypes?.some(
                          (item: any) => String(item.id) === String(option.id),
                        );
                      return (
                        <Checkbox
                          key={option.id}
                          id={`student-support-${option.id}`}
                          name="financialSupportTypes"
                          label={option.name || option.text || option.code}
                          checked={!!isChecked}
                          onCheckedChange={() => {
                            const currentTypes =
                              family?.finance?.financialSupportTypes || [];
                            const newTypes = !isChecked
                              ? [...currentTypes, { id: Number(option.id) }]
                              : currentTypes.filter(
                                  (item: any) =>
                                    String(item.id) !== String(option.id),
                                );
                            handleInputChange(
                              "family.finance.financialSupportTypes",
                              newTypes,
                            );
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </SectionContainer>

              <SectionContainer
                title="Financial Information"
                description="Monthly household income and allowance"
                icon={CircleDollarSign}
              >
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-4">
                    <SelectField
                      label="Parents' Combined Monthly Income"
                      name="family.finance.monthlyFamilyIncomeRange"
                      value={
                        family?.finance?.monthlyFamilyIncomeRange?.id || ""
                      }
                      onChange={(val) => {
                        handleInputChange(
                          "family.finance.monthlyFamilyIncomeRange",
                          { id: val },
                        );
                        if (val !== "others") {
                          handleInputChange(
                            "family.finance.monthlyFamilyIncomeRange" +
                              ".otherSpecification",
                            "",
                          );
                          setOtherTouched(false);
                          setErrors((prev: FormErrors) => {
                            const updated = { ...prev };
                            delete updated[
                              "family.finance.monthlyFamilyIncomeRange" +
                                ".otherSpecification"
                            ];
                            return updated;
                          });
                        } else {
                          setTimeout(
                            () => otherInputRef.current?.focus(),
                            0,
                          );
                        }
                      }}
                      options={monthlyFamilyIncomeRanges}
                      required
                    />
                    {family?.finance?.monthlyFamilyIncomeRange?.id ===
                      "others" && (
                      <div className="animate-in fade-in slide-in-from-top-2 pt-2 duration-300">
                        <FormField
                          ref={otherInputRef}
                          name="family.finance.monthlyFamilyIncomeRange.otherSpecification"
                          label="Specify Income Range"
                          required
                          value={
                            family?.finance?.monthlyFamilyIncomeRange
                              ?.otherSpecification || ""
                          }
                          onChange={(val) =>
                            handleInputChange(
                              "family.finance.monthlyFamilyIncomeRange.otherSpecification",
                              val,
                            )
                          }
                          onBlur={() => setOtherTouched(true)}
                          placeholder="Enter income range..."
                          error={
                            otherTouched &&
                            !family?.finance?.monthlyFamilyIncomeRange
                              ?.otherSpecification
                              ? "Please specify"
                              : errors[
                                  "family.finance.monthlyFamilyIncomeRange.otherSpecification"
                                ]
                          }
                        />
                      </div>
                    )}
                  </div>

                  <FormField
                    name="family.finance.weeklyAllowance"
                    label="Weekly Allowance (PHP)"
                    type="text"
                    inputMode="decimal"
                    required={isFieldRequired(
                      familyValidationSchema,
                      "family.finance.weeklyAllowance",
                    )}
                    value={family?.finance?.weeklyAllowance ?? ""}
                    onChange={(val) =>
                      handleInputChange(
                        "family.finance.weeklyAllowance",
                        String(val).replace(/[^0-9.]/g, ""),
                      )
                    }
                    onBlur={() => {
                      const wa = family?.finance?.weeklyAllowance;
                      if (wa !== undefined && wa !== null && wa !== "")
                        handleInputChange(
                          "family.finance.weeklyAllowance",
                          Number(wa),
                        );
                      else if (wa === "")
                        handleInputChange(
                          "family.finance.weeklyAllowance",
                          null,
                        );
                      handleFieldBlur("family.finance.weeklyAllowance");
                    }}
                    placeholder="0.00"
                    error={getFieldError("family.finance.weeklyAllowance")}
                  />
                </div>
              </SectionContainer>
            </>
          )}
        </div>
      )}
    </div>
  );
});
