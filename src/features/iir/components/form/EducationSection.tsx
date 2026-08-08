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
  const [expandedSections, setExpandedSections] = useState<
    Record<number, boolean>
  >({
    1: true, // Junior High School (Required)
    2: true, // Senior High School (Required)
  });

  const validate = (
    step?: number,
  ): { isValid: boolean; errors: FormErrors } => {
    const sectionErrors = validateObject(
      { education },
      educationValidationSchema,
    );
    setErrors(sectionErrors);

    const errorIndices: Record<number, boolean> = {};
    Object.keys(sectionErrors).forEach((key) => {
      const match = key.match(/^education\.schools\.(\d+)\./);
      if (match) {
        const idx = parseInt(match[1], 10);
        errorIndices[idx] = true;
      }
    });

    if (Object.keys(errorIndices).length > 0) {
      setExpandedSections((prev) => ({
        ...prev,
        ...errorIndices,
      }));
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
      for (let i = 0; i < 5; i++) {
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

    const isRequiredSlot = idx === 1 || idx === 2; // Junior & Senior High

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
      <div className="my-4 space-y-4">
        {[
          { name: "Elementary" },
          { name: "Junior High School" },
          { name: "Senior High School" },
          { name: "Vocational" },
          { name: "College" },
        ].map((level: any, idx: number) => {
          const school = education?.schools?.[idx] || {};
          const status = getCompletionStatus(idx);
          const StatusIcon = status.icon;
          const isExpanded = !!expandedSections[idx];
          const hasData = [
            "schoolName",
            "schoolAddress",
            "schoolType",
            "yearStarted",
            "yearCompleted",
            "awards",
          ].some((field) => !!school[field]?.toString().trim());

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
                  setExpandedSections((prev) => ({
                    ...prev,
                    [idx]: !prev[idx],
                  }))
                }
                className={cn(
                  "bg-glass-bg/40 border-glass-border/20 flex flex-wrap",
                  "items-center justify-between gap-3 px-5 py-4 sm:px-8",
                  "cursor-pointer select-none sm:py-5",
                  isExpanded && "border-b",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      "bg-primary/10 text-primary shadow-sm",
                    )}
                  >
                    <School className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {level.name}{" "}
                      <span
                        className={cn(
                          "text-xs font-normal",
                          "text-muted-foreground",
                        )}
                      >
                        {idx === 1 || idx === 2 ? "(Required)" : "(Optional)"}
                      </span>
                    </h3>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${status.color}`}
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
                <div className="flex items-center gap-3">
                  {hasData && (
                    <button
                      type="button"
                      onClick={(e) => handleClearSection(idx, e)}
                      className={cn(
                        "mr-2 rounded-lg px-2.5 py-1 text-xs font-bold",
                        "bg-destructive/10 text-destructive",
                        "transition-all hover:bg-destructive/20",
                        "duration-200",
                      )}
                    >
                      Clear
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
                      "h-5 w-5 text-muted-foreground transition-transform duration-300",
                      isExpanded && "rotate-180",
                    )}
                  />
                </div>
              </div>

              {isExpanded && (
                <div className="p-5 sm:p-8">
                  <div className="grid grid-cols-1 gap-5 sm:gap-8 md:grid-cols-2">
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
                        placeholder="e.g. Philippine Science High School"
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

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                        placeholder="e.g. With Honors, Academic Excellence..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
});
