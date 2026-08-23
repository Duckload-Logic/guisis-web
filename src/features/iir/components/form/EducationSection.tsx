import { forwardRef, useImperativeHandle, useState } from "react";
import {
  GraduationCap,
  School,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { SelectField } from "@/components/ui/select-field";
import { SectionContainer } from "./SectionContainer";
import {
  validateObject,
  isFieldRequired,
  validateField,
} from "@/services/validationSchema";
import { educationValidationSchema } from "@/features/iir/config/educationValidationSchema";
import { cn } from "@/lib/utils";
import { useToast } from "@/context";

interface FormErrors {
  [key: string]: string;
}

interface EducationSectionRef {
  validate: (step?: number) => { isValid: boolean; errors: FormErrors };
}

export const EducationSection = forwardRef<
  EducationSectionRef,
  {
    education: any;
    onChange: (path: string, value: any) => void;
    onFieldBlur?: (path: string) => void;
    shouldShowError?: (fieldPath: string) => boolean;
  }
>(function EducationSection(
  { education, onChange, onFieldBlur, shouldShowError },
  ref,
) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const { triggerToast } = useToast();

  const validate = (
    step?: number,
  ): { isValid: boolean; errors: FormErrors } => {
    const sectionErrors = validateObject(
      { education },
      educationValidationSchema,
    );
    setErrors(sectionErrors);

    const errIndices = Object.keys(sectionErrors)
      .map((key) => {
        const match = key.match(/^education\.schools\.(\d+)\./);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((idx): idx is number => idx !== null);

    if (errIndices.length > 0) {
      const firstErrIdx = Math.min(...errIndices);
      setExpandedIndex(firstErrIdx);
    }

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

  const handleClearSection = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const fields = [
      "schoolName",
      "schoolAddress",
      "schoolType",
      "yearStarted",
      "yearCompleted",
      "awards",
    ];
    fields.forEach((field) => {
      onChange(`education.schools.${idx}.${field}`, "");
      setErrors((prev: FormErrors) => {
        const updated = { ...prev };
        delete updated[`education.schools.${idx}.${field}`];
        return updated;
      });
    });
  };

  const handleInputChange = (fieldPath: string, value: any) => {
    onChange(fieldPath, value);

    // Simulate next state because onChange is asynchronous
    const updatedEducation = { ...education };
    const pathParts = fieldPath.split(".");
    if (pathParts[0] === "education") {
      let current = updatedEducation;
      for (let i = 1; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        const nextPart = pathParts[i + 1];
        const isNextArray = !isNaN(Number(nextPart));
        if (isNextArray) {
          if (!Array.isArray(current[part])) {
            current[part] = [];
          }
        } else {
          if (typeof current[part] !== "object" || current[part] === null) {
            current[part] = {};
          }
        }
        current[part] = isNextArray ? [...current[part]] : { ...current[part] };
        current = current[part];
      }
      const lastPart = pathParts[pathParts.length - 1];
      const isLastArray = !isNaN(Number(lastPart));
      if (isLastArray) {
        current[Number(lastPart)] = value;
      } else {
        current[lastPart] = value;
      }
    }

    // Instant validation
    const fieldRules = educationValidationSchema[fieldPath];
    let newErrors = { ...errors };

    if (fieldRules) {
      const error = validateField(value, fieldRules, {
        education: updatedEducation,
      });
      if (error) {
        newErrors[fieldPath] = error;
      } else {
        delete newErrors[fieldPath];
      }
    }

    // Re-validate the entire school slot to properly track empty/optional states
    const match = fieldPath.match(/^education\.schools\.(\d+)\./);
    if (match) {
      const idx = parseInt(match[1], 10);
      const schoolFields = [
        "schoolName",
        "schoolAddress",
        "schoolType",
        "yearStarted",
        "yearCompleted",
        "awards",
      ];
      schoolFields.forEach((field) => {
        const path = `education.schools.${idx}.${field}`;
        const val = updatedEducation?.schools?.[idx]?.[field];
        const rules = educationValidationSchema[path];
        if (rules) {
          const err = validateField(val, rules, { education: updatedEducation });
          if (err) {
            newErrors[path] = err;
          } else {
            delete newErrors[path];
          }
        }
      });
    }

    // Re-validate all years to handle cross-field / cross-level changes
    const isYearField =
      fieldPath.endsWith(".yearStarted") ||
      fieldPath.endsWith(".yearCompleted");

    if (isYearField) {
      const schoolsLen = updatedEducation?.schools?.length || 0;
      for (let i = 0; i < schoolsLen; i++) {
        const startPath = `education.schools.${i}.yearStarted`;
        const compPath = `education.schools.${i}.yearCompleted`;

        const startVal = updatedEducation?.schools?.[i]?.yearStarted;
        const compVal = updatedEducation?.schools?.[i]?.yearCompleted;

        const startRules = educationValidationSchema[startPath];
        const compRules = educationValidationSchema[compPath];

        if (startRules) {
          const err = validateField(startVal, startRules, {
            education: updatedEducation,
          });
          if (err) {
            newErrors[startPath] = err;
            if (onFieldBlur) onFieldBlur(startPath);
          } else {
            delete newErrors[startPath];
          }
        }
        if (compRules) {
          const err = validateField(compVal, compRules, {
            education: updatedEducation,
          });
          if (err) {
            newErrors[compPath] = err;
            if (onFieldBlur) onFieldBlur(compPath);
          } else {
            delete newErrors[compPath];
          }
        }
      }
    }

    setErrors(newErrors);

    if (onFieldBlur) {
      onFieldBlur(fieldPath);
    }
  };

  const getFieldError = (fieldPath: string): string | undefined => {
    const hasError = errors[fieldPath];
    const showError = shouldShowError ? shouldShowError(fieldPath) : true;
    return hasError && showError ? errors[fieldPath] : undefined;
  };

  const getCompletionStatus = (idx: number) => {
    const school = education?.schools?.[idx] || {};
    const requiredFields = [
      "schoolName",
      "schoolAddress",
      "schoolType",
      "yearStarted",
      "yearCompleted",
    ];

    const isFieldFilled = (field: string) => {
      const val = school[field];
      if (val === null || val === undefined) return false;
      const str = val.toString().trim();
      return str !== "" && str !== "0";
    };

    const hasData = [...requiredFields, "awards"].some(isFieldFilled);

    const filledCount = requiredFields.filter(isFieldFilled).length;

    // Check if any field in this school slot has a validation error
    const hasError = Object.keys(errors).some((path) =>
      path.startsWith(`education.schools.${idx}.`),
    );

    const levelId = school.educationalLevel?.id;
    const isRequiredSlot =
      levelId === 2 || levelId === 3 || levelId === 4;

    if (!hasData) {
      if (isRequiredSlot) {
        return { color: "bg-amber-500", text: "Incomplete", icon: AlertCircle };
      }
      return { color: "bg-muted", text: "Empty", icon: null };
    }

    // Incomplete if not all fields filled OR there's a validation error anywhere in the slot
    if (filledCount < requiredFields.length || hasError)
      return { color: "bg-amber-500", text: "Incomplete", icon: AlertCircle };

    return { color: "bg-emerald-500", text: "Complete", icon: CheckCircle2 };
  };

  const schoolTypes = [
    { id: "Public", name: "Public" },
    { id: "Private", name: "Private" },
  ];

  const handleAddSchool = (levelId: number, levelName: string) => {
    const currentSchools = [...(education?.schools || [])];

    const levelSchools = currentSchools.filter(
      (s: any) => s.educationalLevel?.id === levelId,
    );

    if (levelSchools.length > 0) {
      const lastSchool = levelSchools[levelSchools.length - 1];
      const isFieldFilled = (val: any) => {
        if (val === null || val === undefined) return false;
        return val.toString().trim() !== "";
      };

      const hasDetails = [
        lastSchool.schoolName,
        lastSchool.schoolAddress,
        lastSchool.schoolType,
        lastSchool.yearStarted,
        lastSchool.yearCompleted,
      ].some(isFieldFilled);

      if (!hasDetails) {
        triggerToast(
          "Please fill out the details of the preceding school first.",
        );
        return;
      }
    }

    let insertIndex = -1;
    for (let i = currentSchools.length - 1; i >= 0; i--) {
      if (currentSchools[i].educationalLevel?.id === levelId) {
        insertIndex = i + 1;
        break;
      }
    }
    if (insertIndex === -1) {
      for (let i = 0; i < currentSchools.length; i++) {
        if (currentSchools[i].educationalLevel?.id > levelId) {
          insertIndex = i;
          break;
        }
      }
    }
    if (insertIndex === -1) {
      insertIndex = currentSchools.length;
    }
    const newSchool = {
      schoolName: "",
      schoolAddress: "",
      schoolType: "",
      yearStarted: "",
      yearCompleted: "",
      awards: "",
      educationalLevel: { id: levelId, name: levelName },
    };
    currentSchools.splice(insertIndex, 0, newSchool);
    onChange("education.schools", currentSchools);
    setExpandedIndex(insertIndex);
  };

  const handleRemoveSchool = (originalIdx: number) => {
    const currentSchools = [...(education?.schools || [])];
    currentSchools.splice(originalIdx, 1);
    onChange("education.schools", currentSchools);

    if (expandedIndex === originalIdx) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > originalIdx) {
      setExpandedIndex(expandedIndex - 1);
    }

    setErrors((prev: FormErrors) => {
      const updated: FormErrors = {};
      Object.entries(prev).forEach(([key, val]) => {
        const match = key.match(/^education\.schools\.(\d+)\.(.+)$/);
        if (match) {
          const idx = parseInt(match[1], 10);
          const field = match[2];
          if (idx < originalIdx) {
            updated[key] = val;
          } else if (idx > originalIdx) {
            updated[`education.schools.${idx - 1}.${field}`] = val;
          }
        } else {
          updated[key] = val;
        }
      });
      return updated;
    });
  };

  return (
    <>
      <SectionContainer
        title="Educational Background"
        description="Your academic journey from primary to recent schooling"
        icon={GraduationCap}
      >
        <div className="space-y-12">
          {/* Nature of Schooling */}
          <div
            className={cn(
              "bg-glass-bg",
              "shadow-sm backdrop-blur-glass transition-all duration-300",
              "",
            )}
          >
            <label
              className={`mb-6 flex items-center gap-2 text-sm font-bold transition-colors duration-300 ${getFieldError("education.natureOfSchooling") ? "text-destructive" : "text-foreground/80"}`}
            >
              Nature of Schooling
              <span className="text-primary">*</span>
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <button
                type="button"
                onClick={() => {
                  handleInputChange(
                    "education.natureOfSchooling",
                    "Continuous",
                  );
                  onChange("education.interruptedDetails", "");
                  setErrors((prev: FormErrors) => {
                    const updated = { ...prev };
                    delete updated["education.interruptedDetails"];
                    return updated;
                  });
                }}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-4",
                  "transition-all duration-300",
                  education?.natureOfSchooling === "Continuous"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : getFieldError("education.natureOfSchooling")
                      ? cn(
                          "border-destructive/50 bg-destructive/5",
                          "shadow-[0_0_10px_rgba(var(--destructive),0.05)]",
                        )
                      : cn(
                          "bg-glass-bg/60 border-glass-border/20",
                          "hover:bg-glass-bg/80 hover:border-primary/20",
                        ),
                )}
              >
                <span
                  className={cn(
                    "text-sm font-bold",
                    education?.natureOfSchooling === "Continuous"
                      ? "text-primary"
                      : getFieldError("education.natureOfSchooling")
                        ? "text-destructive/80"
                        : "text-foreground/70",
                  )}
                >
                  Continuous
                </span>
                {education?.natureOfSchooling === "Continuous" && (
                  <CheckCircle2 className="h-5 w-5 stroke-[2.5] text-primary" />
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleInputChange(
                    "education.natureOfSchooling",
                    "Interrupted",
                  )
                }
                className={cn(
                  "flex items-center justify-between rounded-xl border p-4",
                  "transition-all duration-300",
                  education?.natureOfSchooling === "Interrupted"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : getFieldError("education.natureOfSchooling")
                      ? cn(
                          "border-destructive/50 bg-destructive/5",
                          "shadow-[0_0_10px_rgba(var(--destructive),0.05)]",
                        )
                      : cn(
                          "bg-glass-bg/60 border-glass-border/20",
                          "hover:bg-glass-bg/80 hover:border-primary/20",
                        ),
                )}
              >
                <span
                  className={cn(
                    "text-sm font-bold",
                    education?.natureOfSchooling === "Interrupted"
                      ? "text-primary"
                      : getFieldError("education.natureOfSchooling")
                        ? "text-destructive/80"
                        : "text-foreground/70",
                  )}
                >
                  Interrupted
                </span>
                {education?.natureOfSchooling === "Interrupted" && (
                  <CheckCircle2 className="h-5 w-5 stroke-[2.5] text-primary" />
                )}
              </button>
            </div>

            {getFieldError("education.natureOfSchooling") && (
              <p className="ml-1 mt-2 text-xs font-medium text-destructive">
                {getFieldError("education.natureOfSchooling")}
              </p>
            )}

            {education?.natureOfSchooling === "Interrupted" && (
              <div className="animate-fade-in mt-6">
                <FormField
                  name="education.interruptedDetails"
                  label="Reason for Interruption"
                  isTextarea
                  required={isFieldRequired(
                    educationValidationSchema,
                    "education.interruptedDetails",
                  )}
                  value={
                    typeof education?.interruptedDetails === "string"
                      ? education?.interruptedDetails
                      : ""
                  }
                  onChange={(val) =>
                    handleInputChange("education.interruptedDetails", val)
                  }
                  noSpecialCharacters={true}
                  placeholder={cn(
                    "Please describe why your",
                    "schooling was interrupted...",
                  )}
                  error={getFieldError("education.interruptedDetails")}
                  maxChars={100}
                />
              </div>
            )}
          </div>
        </div>
      </SectionContainer>
      {/* School Levels */}
      <SectionContainer
        title="School History"
        description="Record each level of your educational background"
        icon={School}
      >
        <div className="space-y-8">
          {[
            { id: 2, name: "Elementary" },
            { id: 3, name: "Junior High School" },
            { id: 4, name: "Senior High School" },
            { id: 5, name: "Vocational" },
            { id: 6, name: "College" },
          ].map((level: any) => {
            const levelSchools = (education?.schools || [])
              .map((s: any, idx: number) => ({ s, idx }))
              .filter(
                (item: any) => item.s.educationalLevel?.id === level.id,
              );
            const isRequired =
              level.id === 2 || level.id === 3 || level.id === 4;

            return (
              <div
                key={level.id}
                className="space-y-4 border-b border-glass-border/10 pb-6 last:border-b-0"
              >
                <div
                  className={cn(
                    "flex flex-wrap items-center justify-between border-b",
                    "border-glass-border/20 pb-2 gap-2",
                  )}
                >
                  <h3
                    className={cn(
                      "text-base font-bold text-foreground",
                      "flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0",
                    )}
                  >
                    <School className="h-5 w-5 text-primary/80 shrink-0" />
                    <span className="truncate">{level.name}</span>
                    <span
                      className={cn(
                        "text-xs font-normal text-muted-foreground shrink-0",
                        "whitespace-nowrap",
                      )}
                    >
                      {isRequired ? "(Required)" : "(Optional)"}
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleAddSchool(level.id, level.name)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-bold shrink-0",
                      "bg-primary/10 text-primary hover:bg-primary/20",
                      "transition-all duration-200",
                    )}
                  >
                    + Add School
                  </button>
                </div>

                {levelSchools.length === 0 ? (
                  <p
                    className={cn(
                      "text-xs text-muted-foreground italic",
                      "pl-0 sm:pl-7",
                    )}
                  >
                    No schools added for this level.
                  </p>
                ) : (
                  <div className="space-y-4 pl-0 sm:pl-7">
                    {levelSchools.map(
                      (
                        { s: school, idx }: { s: any; idx: number },
                        subIdx: number,
                      ) => {
                        const status = getCompletionStatus(idx);
                      const StatusIcon = status.icon;
                      const isExpanded = expandedIndex === idx;
                      const hasData = [
                        "schoolName",
                        "schoolAddress",
                        "schoolType",
                        "yearStarted",
                        "yearCompleted",
                        "awards",
                      ].some((field) => !!school[field]?.toString().trim());

                      const canRemove = isRequired
                        ? levelSchools.length > 1
                        : true;

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "bg-glass-bg/60 border-glass-border/40 group overflow-hidden",
                            "rounded-xl border shadow-sm backdrop-blur-glass",
                            "transition-all duration-300 hover:shadow-md",
                          )}
                        >
                          <div
                            onClick={() =>
                              setExpandedIndex((prev) =>
                                prev === idx ? null : idx,
                              )
                            }
                            className={cn(
                              "bg-glass-bg/40 border-glass-border/20",
                              "flex flex-col sm:flex-row",
                              "sm:items-center justify-between gap-3",
                              "px-4 py-3.5 sm:px-8 sm:py-5",
                              "cursor-pointer select-none",
                              isExpanded && "border-b",
                            )}
                          >
                            {/* Top row: School Info & Mobile Icons */}
                            <div
                              className={cn(
                                "flex items-center justify-between",
                                "gap-3 min-w-0 w-full sm:w-auto",
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={cn(
                                    "flex h-8 w-8 items-center shrink-0",
                                    "justify-center rounded-lg",
                                    "bg-primary/10 text-primary shadow-sm",
                                  )}
                                >
                                  <span className="text-xs font-bold">
                                    #{subIdx + 1}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <h4
                                    className={cn(
                                      "text-sm font-bold text-foreground",
                                      "break-words sm:truncate",
                                    )}
                                  >
                                    {school.schoolName || "New School"}
                                  </h4>
                                  <div
                                    className={cn(
                                      "mt-0.5 flex items-center gap-2",
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "h-1.5 w-1.5 rounded-full",
                                        status.color,
                                      )}
                                    />
                                    <span
                                      className={cn(
                                        "text-[10px] font-bold uppercase",
                                        "text-muted-foreground",
                                      )}
                                    >
                                      {status.text}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Mobile Icons */}
                              <div
                                className={cn(
                                  "flex sm:hidden items-center",
                                  "gap-2 shrink-0",
                                )}
                              >
                                {StatusIcon && (
                                  <StatusIcon
                                    className={cn(
                                      "h-5 w-5",
                                      status.color.replace("bg-", "text-"),
                                    )}
                                  />
                                )}
                                <ChevronDown
                                  className={cn(
                                    "h-5 w-5 text-muted-foreground",
                                    "transition-transform duration-300",
                                    isExpanded && "rotate-180",
                                  )}
                                />
                              </div>
                            </div>

                            {/* Mobile Buttons */}
                            {(hasData || canRemove) && (
                              <div
                                className={cn(
                                  "flex sm:hidden items-center",
                                  "gap-2 pl-11 mt-1",
                                )}
                              >
                                {hasData && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleClearSection(idx, e)}
                                    className={cn(
                                      "rounded-lg px-2 py-1 font-bold",
                                      "text-[11px] bg-destructive/10",
                                      "text-destructive transition-all",
                                      "hover:bg-destructive/20 duration-200",
                                    )}
                                  >
                                    Clear
                                  </button>
                                )}
                                {canRemove && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveSchool(idx);
                                    }}
                                    className={cn(
                                      "rounded-lg px-2 py-1 font-bold",
                                      "text-[11px] bg-destructive/10",
                                      "text-destructive transition-all",
                                      "hover:bg-destructive/20 duration-200",
                                    )}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Desktop Controls */}
                            <div
                              className={cn(
                                "hidden sm:flex items-center",
                                "gap-3 shrink-0",
                              )}
                            >
                              {hasData && (
                                <button
                                  type="button"
                                  onClick={(e) => handleClearSection(idx, e)}
                                  className={cn(
                                    "rounded-lg px-2.5 py-1 text-xs",
                                    "font-bold bg-destructive/10",
                                    "text-destructive transition-all",
                                    "hover:bg-destructive/20 duration-200",
                                  )}
                                >
                                  Clear
                                </button>
                              )}
                              {canRemove && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveSchool(idx);
                                  }}
                                  className={cn(
                                    "rounded-lg px-2.5 py-1 text-xs",
                                    "font-bold bg-destructive/10",
                                    "text-destructive transition-all",
                                    "hover:bg-destructive/20 duration-200",
                                  )}
                                >
                                  Remove
                                </button>
                              )}
                              {StatusIcon && (
                                <StatusIcon
                                  className={cn(
                                    "h-5 w-5",
                                    status.color.replace("bg-", "text-"),
                                  )}
                                />
                              )}
                              <ChevronDown
                                className={cn(
                                  "h-5 w-5 text-muted-foreground",
                                  "transition-transform duration-300",
                                  isExpanded && "rotate-180",
                                )}
                              />
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-6 sm:p-8">
                              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="md:col-span-2">
                                  <FormField
                                    name={`education.schools.${idx}.schoolName`}
                                    label="School Name"
                                    required={isFieldRequired(
                                      educationValidationSchema,
                                      `education.schools.${idx}.schoolName`,
                                    )}
                                    value={school.schoolName || ""}
                                    onChange={(val) =>
                                      handleInputChange(
                                        `education.schools.${idx}.schoolName`,
                                        val,
                                      )
                                    }
                                    noSpecialCharacters={true}
                                    placeholder="e.g. Philippine Science High"
                                    error={getFieldError(
                                      `education.schools.${idx}.schoolName`,
                                    )}
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <FormField
                                    name={`education.schools.${idx}.schoolAddress`}
                                    label="School Address"
                                    required={isFieldRequired(
                                      educationValidationSchema,
                                      `education.schools.${idx}.schoolAddress`,
                                    )}
                                    value={school.schoolAddress || ""}
                                    onChange={(val) =>
                                      handleInputChange(
                                        `education.schools.${idx}.schoolAddress`,
                                        val,
                                      )
                                    }
                                    noSpecialCharacters={true}
                                    placeholder="Street, City, Province"
                                    error={getFieldError(
                                      `education.schools.${idx}.schoolAddress`,
                                    )}
                                  />
                                </div>

                                <SelectField
                                  formStyle
                                  label="School Type"
                                  options={schoolTypes}
                                  value={school.schoolType || ""}
                                  onChange={(val: any) =>
                                    handleInputChange(
                                      `education.schools.${idx}.schoolType`,
                                      val,
                                    )
                                  }
                                  error={getFieldError(
                                    `education.schools.${idx}.schoolType`,
                                  )}
                                  required={isFieldRequired(
                                    educationValidationSchema,
                                    `education.schools.${idx}.schoolType`,
                                  )}
                                />

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                  <FormField
                                    name={`education.schools.${idx}.yearStarted`}
                                    label="Year Started"
                                    inputMode="numeric"
                                    required={isFieldRequired(
                                      educationValidationSchema,
                                      `education.schools.${idx}.yearStarted`,
                                    )}
                                    value={school.yearStarted || ""}
                                    onChange={(val) =>
                                      handleInputChange(
                                        `education.schools.${idx}.yearStarted`,
                                        val.replace(/[^0-9]/g, ""),
                                      )
                                    }
                                    placeholder="YYYY"
                                    error={getFieldError(
                                      `education.schools.${idx}.yearStarted`,
                                    )}
                                  />
                                  <FormField
                                    name={`education.schools.${idx}.yearCompleted`}
                                    label="Year Graduated"
                                    inputMode="numeric"
                                    required={isFieldRequired(
                                      educationValidationSchema,
                                      `education.schools.${idx}.yearCompleted`,
                                    )}
                                    value={school.yearCompleted || ""}
                                    onChange={(val) =>
                                      handleInputChange(
                                        `education.schools.${idx}.yearCompleted`,
                                        val.replace(/[^0-9]/g, ""),
                                      )
                                    }
                                    placeholder="YYYY"
                                    error={getFieldError(
                                      `education.schools.${idx}.yearCompleted`,
                                    )}
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <FormField
                                    name={`education.schools.${idx}.awards`}
                                    label="Awards/Honors"
                                    value={school.awards || ""}
                                    onChange={(val) =>
                                      handleInputChange(
                                        `education.schools.${idx}.awards`,
                                        val,
                                      )
                                    }
                                    noSpecialCharacters={true}
                                    placeholder="e.g. With Honors..."
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionContainer>
    </>
  );
});
