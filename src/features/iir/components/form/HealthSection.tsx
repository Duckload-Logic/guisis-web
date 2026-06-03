import { forwardRef, useImperativeHandle, useState } from "react";
import {
  Activity,
  Eye,
  Ear,
  MessageSquare,
  HeartPulse,
  Brain,
  User,
  Users,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  validateObject,
  isFieldRequired,
  validateField,
} from "@/services/validationSchema";
import { healthValidationSchema } from "@/features/iir/config/healthValidationSchema";
import { FormInput, Radio, DatePicker } from "@/components/form";
import { SectionContainer } from "./SectionContainer";

interface FormErrors {
  [key: string]: string;
}

interface HealthSectionRef {
  validate: (step?: number) => { isValid: boolean; errors: FormErrors };
}

export const HealthSection = forwardRef<
  HealthSectionRef,
  {
    health: any;
    onChange: (path: string, value: any) => void;
    onFieldBlur?: (fieldPath: string) => void;
    shouldShowError?: (fieldPath: string) => boolean;
    isEditMode?: boolean;
  }
>(function HealthSection(
  { health, onChange, onFieldBlur, shouldShowError, isEditMode = false },
  ref,
) {
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (
    step?: number,
  ): { isValid: boolean; errors: FormErrors } => {
    // Helper to map consultations by type for easy access in rules
    const _consultations = (health?.consultations || []).reduce(
      (acc: any, c: any) => {
        acc[c.professionalType] = c;
        return acc;
      },
      {},
    );

    const sectionErrors = validateObject(
      { health, _consultations },
      healthValidationSchema,
    );
    setErrors(sectionErrors);
    return {
      isValid: Object.keys(sectionErrors).length === 0,
      errors: sectionErrors,
    };
  };

  useImperativeHandle(ref, () => ({
    validate: (step?: number) => validate(step),
  }));

  const clearError = (field: string) => {
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const handleInputChange = (fieldPath: string, value: any) => {
    onChange(fieldPath, value);

    // Instant validation
    const fieldRules = healthValidationSchema[fieldPath];
    if (fieldRules) {
      const _consultations = (health?.consultations || []).reduce(
        (acc: any, c: any) => {
          acc[c.professionalType] = c;
          return acc;
        },
        {},
      );

      const error = validateField(value, fieldRules, {
        health,
        _consultations,
      });
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

  const handleConsultationChange = (
    professionalType: string,
    field: "consulted" | "whenDate" | "forWhat",
    value: any,
  ) => {
    const consultations = Array.isArray(health?.consultations)
      ? [...health.consultations]
      : [];

    const existingIndex = consultations.findIndex(
      (c: any) => c.professionalType === professionalType,
    );

    if (existingIndex >= 0) {
      // Update existing consultation
      consultations[existingIndex] = {
        ...consultations[existingIndex],
        [field === "consulted" ? "hasConsulted" : field]: value,
      };
    } else if (field === "consulted" || (value !== "" && value !== null)) {
      // Create a new record for any consulted click (yes or no)
      // or non-empty text fields
      consultations.push({
        professionalType,
        hasConsulted: field === "consulted" ? value : false,
        whenDate: field === "whenDate" ? value : null,
        forWhat: field === "forWhat" ? value : null,
      });
    }

    onChange("health.consultations", consultations);

    // Instant validation for the specific field
    const isConsulted = field === "consulted";
    const fieldName = isConsulted ? "hasConsulted" : field;
    const errorField = `_consultations.${professionalType}.${fieldName}`;
    const fieldRules = healthValidationSchema[errorField];
    if (fieldRules) {
      // Re-map consultations for current context
      const _consultationsMap = consultations.reduce((acc: any, c: any) => {
        acc[c.professionalType] = c;
        return acc;
      }, {});

      // val is already correct
      const val = value;
      const error = validateField(value, fieldRules, {
        health,
        _consultations: _consultationsMap,
      });

      setErrors((prev: FormErrors) => {
        const updated = { ...prev };
        if (error) updated[errorField] = error;
        else delete updated[errorField];
        return updated;
      });
    }

    if (onFieldBlur) {
      onFieldBlur(errorField);
    }
  };

  // Array of physical health items for A. Physical
  const physicalItems = [
    {
      label: "Your Vision",
      icon: Eye,
      yesKey: "health.healthRecord.visionHasProblem",
      detailsKey: "health.healthRecord.visionDetails",
      yesValue: health?.healthRecord?.visionHasProblem,
      detailsValue: health?.healthRecord?.visionDetails || "",
    },
    {
      label: "Your Hearing",
      icon: Ear,
      yesKey: "health.healthRecord.hearingHasProblem",
      detailsKey: "health.healthRecord.hearingDetails",
      yesValue: health?.healthRecord?.hearingHasProblem,
      detailsValue: health?.healthRecord?.hearingDetails || "",
    },
    {
      label: "Your Speech",
      icon: MessageSquare,
      yesKey: "health.healthRecord.speechHasProblem",
      detailsKey: "health.healthRecord.speechDetails",
      yesValue: health?.healthRecord?.speechHasProblem,
      detailsValue: health?.healthRecord?.speechDetails || "",
    },
    {
      label: "Your General Health",
      icon: HeartPulse,
      yesKey: "health.healthRecord.generalHealthHasProblem",
      detailsKey: "health.healthRecord.generalHealthDetails",
      yesValue: health?.healthRecord?.generalHealthHasProblem,
      detailsValue: health?.healthRecord?.generalHealthDetails || "",
    },
    ...(isEditMode
      ? [
          {
            label: "Mental / Emotional Health",
            icon: Brain,
            yesKey: "health.healthRecord.mentalEmotionalHasProblem",
            detailsKey: "health.healthRecord.mentalEmotionalDetails",
            yesValue: health?.healthRecord?.mentalEmotionalHasProblem,
            detailsValue: health?.healthRecord?.mentalEmotionalDetails || "",
          },
        ]
      : []),
  ];

  // Array of psychological consultation types
  const professionalTypes = ["Psychiatrist", "Psychologist", "Counselor"];

  const consultationTypes = professionalTypes.map((type) => {
    const consultation = Array.isArray(health?.consultations)
      ? health.consultations.find((c: any) => c.professionalType === type)
      : null;

    return {
      label: type,
      type: type,
      icon:
        type === "Psychiatrist"
          ? Brain
          : type === "Psychologist"
            ? User
            : Users,
      consulted: consultation?.hasConsulted,
      when: consultation?.whenDate || "",
      forWhat: consultation?.forWhat || "",
    };
  });

  const getFieldError = (fieldPath: string): string | undefined => {
    const hasError = errors[fieldPath];
    const showError = shouldShowError ? shouldShowError(fieldPath) : true;
    return hasError && showError ? errors[fieldPath] : undefined;
  };

  return (
    <SectionContainer
      title="Health Information"
      description="Physical and Psychological Well-being"
      icon={Activity}
    >
      <div className="space-y-12">
        {/* A. Physical Health */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-primary" />
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              A. Physical Health
            </h3>
          </div>
          <p className="mb-6 text-sm font-medium text-neutral-500">
            Do you have any existing or previous problems with:
          </p>

          <div className="flex flex-col gap-6">
            {physicalItems.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-col gap-4 pb-6",
                  "border-glass-border/20 border-b last:border-b-0",
                )}
              >
                <div
                  className={cn(
                    "flex flex-col gap-3",
                    "sm:flex-row sm:items-center sm:justify-between",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 shrink-0 text-primary" />
                    <span className="font-semibold text-foreground">
                      {item.label}
                    </span>
                  </div>
                  <div className="w-full sm:w-auto">
                    <Radio
                      label=""
                      name={item.yesKey}
                      // required={isFieldRequired(
                      //   healthValidationSchema,
                      //   item.yesKey,
                      // )}
                      options={[
                        { id: "yes", name: "Yes" },
                        { id: "no", name: "No" },
                      ]}
                      value={
                        item.yesValue === true
                          ? "yes"
                          : item.yesValue === false
                            ? "no"
                            : ""
                      }
                      onChange={(val) => {
                        handleInputChange(item.yesKey, val === "yes");
                      }}
                      columns={2}
                    />
                  </div>
                </div>

                {item.yesValue === true && (
                  <div
                    className={cn(
                      "pl-8 duration-300",
                      "animate-in fade-in slide-in-from-top-2",
                    )}
                  >
                    <FormInput
                      label="Please specify details"
                      type="textbox"
                      maxChars={100}
                      placeholder="Type details here..."
                      value={item.detailsValue}
                      onChange={(val: string) =>
                        handleInputChange(item.detailsKey, val)
                      }
                      noSpecialCharacters={true}
                      error={getFieldError(item.detailsKey)}
                      required={isFieldRequired(
                        healthValidationSchema,
                        item.detailsKey,
                      )}
                    />
                  </div>
                )}
                {getFieldError(item.yesKey) && (
                  <p
                    className={cn(
                      "mt-2 flex items-center gap-1 pl-8",
                      "text-[11px] font-bold text-primary",
                    )}
                  >
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    {getFieldError(item.yesKey)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* B. Psychological */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-primary" />
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              B. Psychological Consultations
            </h3>
          </div>
          <p className="mb-6 text-sm font-medium text-neutral-500">
            Have you ever consulted a:
          </p>

          <div className="flex flex-col gap-6">
            {consultationTypes.map((type, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-col gap-4 pb-6",
                  "border-glass-border/20 border-b last:border-b-0",
                )}
              >
                <div
                  className={cn(
                    "flex flex-col gap-3",
                    "sm:flex-row sm:items-center sm:justify-between",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <type.icon className="h-5 w-5 shrink-0 text-primary" />
                    <span className="font-semibold text-foreground">
                      {type.label}
                    </span>
                  </div>
                  <div className="w-full sm:w-auto">
                    <Radio
                      label=""
                      name={type.type}
                      // required={isFieldRequired(
                      //   healthValidationSchema,
                      //   `_consultations.${type.type}.hasConsulted`,
                      // )}
                      options={[
                        { id: "yes", name: "Yes" },
                        { id: "no", name: "No" },
                      ]}
                      value={
                        type.consulted === true
                          ? "yes"
                          : type.consulted === false
                            ? "no"
                            : ""
                      }
                      onChange={(val) => {
                        handleConsultationChange(
                          type.type,
                          "consulted",
                          val === "yes",
                        );
                      }}
                      columns={2}
                    />
                  </div>
                </div>

                {type.consulted === true && (
                  <div
                    className={cn(
                      "pl-8 duration-300",
                      "animate-in fade-in slide-in-from-top-2",
                      "grid grid-cols-1 gap-4 sm:grid-cols-2",
                    )}
                  >
                    <DatePicker
                      label="When"
                      value={type.when}
                      onChange={(val: string) =>
                        handleConsultationChange(type.type, "whenDate", val)
                      }
                      error={getFieldError(
                        `_consultations.${type.type}.whenDate`,
                      )}
                      required={isFieldRequired(
                        healthValidationSchema,
                        `_consultations.${type.type}.whenDate`,
                      )}
                    />
                    <FormInput
                      label="For What"
                      placeholder="Specify reason..."
                      value={type.forWhat}
                      onChange={(val: string) =>
                        handleConsultationChange(type.type, "forWhat", val)
                      }
                      noSpecialCharacters={true}
                      error={getFieldError(
                        `_consultations.${type.type}.forWhat`,
                      )}
                      required={isFieldRequired(
                        healthValidationSchema,
                        `_consultations.${type.type}.forWhat`,
                      )}
                    />
                  </div>
                )}
                {getFieldError(`_consultations.${type.type}.hasConsulted`) && (
                  <p
                    className={cn(
                      "mt-2 flex items-center gap-1 pl-8",
                      "text-[11px] font-bold text-primary",
                    )}
                  >
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    {getFieldError(`_consultations.${type.type}.hasConsulted`)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </SectionContainer>
  );
});
