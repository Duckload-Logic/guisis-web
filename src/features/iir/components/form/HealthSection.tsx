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
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  validateObject,
  isFieldRequired,
  validateField,
  commonRules,
} from "@/services/validationSchema";
import { healthValidationSchema } from "@/features/iir/config/healthValidationSchema";
import { Radio } from "@/components/form";
import { FormField } from "@/components/ui/form-field";
import { SectionContainer } from "./SectionContainer";
import { DatePicker } from "@/components/ui/date-picker";

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
    const _consultationsMap = (health?.consultations || []).reduce(
      (acc: any, c: any) => {
        if (!acc[c.professionalType]) {
          acc[c.professionalType] = [];
        }
        acc[c.professionalType].push(c);
        return acc;
      },
      {} as any,
    );

    const dynamicSchema = { ...healthValidationSchema };

    ["Psychiatrist", "Psychologist", "Counselor"].forEach((type) => {
      delete dynamicSchema[`_consultations.${type}.hasConsulted`];
      delete dynamicSchema[`_consultations.${type}.whenDate`];
      delete dynamicSchema[`_consultations.${type}.forWhat`];

      dynamicSchema[`_consultations.${type}.hasConsulted`] = [
        {
          type: "required",
          validate: () => {
            const list = _consultationsMap[type] || [];
            return list.length > 0;
          },
          message: `Please select Yes or No`,
        },
      ];

      const sessions = _consultationsMap[type] || [];
      sessions.forEach((session: any, idx: number) => {
        if (session.hasConsulted) {
          dynamicSchema[`_consultations.${type}.${idx}.whenDate`] = [
            {
              type: "required",
              validate: (val: any) =>
                val && String(val).trim().length > 0,
              message: `Please specify when`,
            },
            commonRules.pattern(
              /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
              "Must be a valid date (YYYY-MM-DD)",
            ),
          ];

          dynamicSchema[`_consultations.${type}.${idx}.forWhat`] = [
            {
              type: "required",
              validate: (val: any) =>
                val && String(val).trim().length > 0,
              message: `Please specify reason`,
            },
            commonRules.noSpecialChars(`Reason for consultation`),
          ];
        }
      });
    });

    const sectionErrors = validateObject(
      { health, _consultations: _consultationsMap },
      dynamicSchema,
    );
    delete sectionErrors["health.healthRecord.mentalEmotionalHasProblem"];
    delete sectionErrors["health.healthRecord.mentalEmotionalDetails"];
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

    if (fieldPath.endsWith("HasProblem") && value === false) {
      const detailsKey = fieldPath.replace("HasProblem", "Details");
      onChange(detailsKey, "");
      setErrors((prev: FormErrors) => {
        const updated = { ...prev };
        delete updated[detailsKey];
        return updated;
      });
    }

    const fieldRules = healthValidationSchema[fieldPath];
    if (fieldRules) {
      const _consultations = (health?.consultations || []).reduce(
        (acc: any, c: any) => {
          if (!acc[c.professionalType]) {
            acc[c.professionalType] = [];
          }
          acc[c.professionalType].push(c);
          return acc;
        },
        {} as any,
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
    field: "consulted",
    value: boolean,
  ) => {
    const consultations = Array.isArray(health?.consultations)
      ? [...health.consultations]
      : [];

    const filtered = consultations.filter(
      (c: any) => c.professionalType !== professionalType,
    );

    if (value) {
      filtered.push({
        professionalType,
        hasConsulted: true,
        whenDate: "",
        forWhat: "",
      });
    } else {
      filtered.push({
        professionalType,
        hasConsulted: false,
        whenDate: null,
        forWhat: null,
      });
    }

    onChange("health.consultations", filtered);

    setErrors((prev: FormErrors) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        if (key.startsWith(`_consultations.${professionalType}`)) {
          delete updated[key];
        }
      });
      return updated;
    });

    if (onFieldBlur) {
      onFieldBlur(`_consultations.${professionalType}.hasConsulted`);
    }
  };

  const getDynamicRule = (field: "whenDate" | "forWhat") => {
    if (field === "whenDate") {
      return [
        {
          type: "required",
          validate: (value: any) => value && String(value).trim().length > 0,
          message: `Please specify when`,
        },
        commonRules.pattern(
          /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
          "Must be a valid date (YYYY-MM-DD)",
        ),
      ];
    } else {
      return [
        {
          type: "required",
          validate: (value: any) => value && String(value).trim().length > 0,
          message: `Please specify reason`,
        },
        commonRules.noSpecialChars(`Reason for consultation`),
      ];
    }
  };

  const handleSessionFieldChange = (
    originalIndex: number,
    field: "whenDate" | "forWhat",
    value: any,
  ) => {
    const consultations = Array.isArray(health?.consultations)
      ? [...health.consultations]
      : [];
    if (originalIndex >= 0 && originalIndex < consultations.length) {
      consultations[originalIndex] = {
        ...consultations[originalIndex],
        [field]: value,
      };
      onChange("health.consultations", consultations);

      const type = consultations[originalIndex].professionalType;
      const typeYesSessions = consultations.filter(
        (c: any) => c.professionalType === type && c.hasConsulted === true,
      );
      const relativeIndex = typeYesSessions.indexOf(
        consultations[originalIndex],
      );

      const errorField = `_consultations.${type}.${relativeIndex}.${field}`;
      const fieldRules = getDynamicRule(field);
      if (fieldRules) {
        const _consultationsMap = consultations.reduce(
          (acc: any, c: any) => {
            if (!acc[c.professionalType]) {
              acc[c.professionalType] = [];
            }
            acc[c.professionalType].push(c);
            return acc;
          },
          {} as any,
        );

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
    }
  };

  const addSession = (professionalType: string) => {
    const consultations = Array.isArray(health?.consultations)
      ? [...health.consultations]
      : [];
    consultations.push({
      professionalType,
      hasConsulted: true,
      whenDate: "",
      forWhat: "",
    });
    onChange("health.consultations", consultations);
  };

  const deleteSession = (originalIndex: number, professionalType: string) => {
    const consultations = Array.isArray(health?.consultations)
      ? [...health.consultations]
      : [];
    if (originalIndex >= 0 && originalIndex < consultations.length) {
      consultations.splice(originalIndex, 1);
      onChange("health.consultations", consultations);

      setTimeout(() => validate(), 0);
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
  ];

  // Array of psychological consultation types
  const professionalTypes = ["Psychiatrist", "Psychologist", "Counselor"];

  const consultationTypes = professionalTypes.map((type) => {
    const consultations = Array.isArray(health?.consultations)
      ? health.consultations.filter((c: any) => c.professionalType === type)
      : [];

    const hasYes = consultations.some((c: any) => c.hasConsulted === true);
    const hasNo = consultations.some((c: any) => c.hasConsulted === false);
    const yesSessions = consultations.filter(
      (c: any) => c.hasConsulted === true,
    );

    return {
      label: type,
      type: type,
      icon:
        type === "Psychiatrist"
          ? Brain
          : type === "Psychologist"
            ? User
            : Users,
      consulted: hasYes ? true : hasNo ? false : undefined,
      sessions: yesSessions
        .map((s: any) => ({
          originalIndex: health.consultations.indexOf(s),
          when: s.whenDate || "",
          forWhat: s.forWhat || "",
        }))
        .sort((a: any, b: any) => {
          if (!a.when) return 1;
          if (!b.when) return -1;
          return a.when.localeCompare(b.when);
        }),
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
                        const isYes = val === "yes";
                        handleInputChange(item.yesKey, isYes);
                        if (!isYes) {
                          onChange(item.detailsKey, "");
                          setErrors((prev: FormErrors) => {
                            const updated = { ...prev };
                            delete updated[item.detailsKey];
                            return updated;
                          });
                        }
                      }}
                      columns={2}
                    />
                  </div>
                </div>

                {item.yesValue === true && (
                  <div
                    className={cn(
                      "pl-0 duration-300 sm:pl-8",
                      "animate-in fade-in slide-in-from-top-2",
                    )}
                  >
                    <FormField
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
                      "mt-2 flex items-center gap-1 pl-0 sm:pl-8",
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
        {/* B. Psychological */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-primary" />
            <h3 className={cn(
              "text-xl font-bold",
              "text-neutral-900 dark:text-white"
            )}>
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
                      "pl-0 duration-300 sm:pl-8 space-y-6",
                      "animate-in fade-in slide-in-from-top-2",
                    )}
                  >
                    {type.sessions.map((session: any, sIdx: number) => {
                      const whenDateKey =
                        `_consultations.${type.type}.` +
                        `${sIdx}.whenDate`;
                      const forWhatKey =
                        `_consultations.${type.type}.` +
                        `${sIdx}.forWhat`;

                      return (
                        <div
                          key={sIdx}
                          className={cn(
                            "p-4 rounded-xl border",
                            "border-glass-border/10 bg-glass-bg/5",
                            "space-y-4 relative",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                "text-xs font-bold text-primary",
                                "uppercase tracking-wider",
                              )}
                            >
                              Session #{sIdx + 1}
                            </span>
                            {type.sessions.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  deleteSession(
                                    session.originalIndex,
                                    type.type,
                                  )
                                }
                                className={cn(
                                  "text-xs font-semibold text-primary",
                                  "hover:text-primary-hover",
                                  "flex items-center gap-1",
                                  "transition-colors",
                                )}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove
                              </button>
                            )}
                          </div>

                          <div className={cn(
                            "grid grid-cols-1 gap-4",
                            "sm:grid-cols-2"
                          )}>
                            <DatePicker
                              label="When"
                              value={session.when}
                              onChange={(val: string) =>
                                handleSessionFieldChange(
                                  session.originalIndex,
                                  "whenDate",
                                  val,
                                )
                              }
                              error={getFieldError(whenDateKey)}
                              required={true}
                            />
                            <FormField
                              label="For What"
                              placeholder="Specify reason..."
                              value={session.forWhat}
                              onChange={(val: string) =>
                                handleSessionFieldChange(
                                  session.originalIndex,
                                  "forWhat",
                                  val,
                                )
                              }
                              noSpecialCharacters={true}
                              error={getFieldError(forWhatKey)}
                              required={true}
                            />
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => addSession(type.type)}
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2",
                        "text-xs font-bold text-primary bg-primary/5",
                        "hover:bg-primary/10 rounded-lg border",
                        "border-primary/15 transition-all",
                      )}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Another Session
                    </button>
                  </div>
                )}
                {getFieldError(
                  `_consultations.${type.type}.hasConsulted`,
                ) && (
                  <p
                    className={cn(
                      "mt-2 flex items-center gap-1 pl-0 sm:pl-8",
                      "text-[11px] font-bold text-primary",
                    )}
                  >
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    {getFieldError(
                      `_consultations.${type.type}.hasConsulted`,
                    )}
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
