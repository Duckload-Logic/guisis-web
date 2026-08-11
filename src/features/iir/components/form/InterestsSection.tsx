import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import {
  Star,
  Library,
  Users,
  Heart,
  Palette,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { Checkbox } from "@/components/form";
import { FormField } from "@/components/ui/form-field";
import { SelectField } from "@/components/ui/select-field";
import { SectionContainer } from "./SectionContainer";
import { validateObject, validateField } from "@/services/validationSchema";
import { interestsValidationSchema } from "@/features/iir/config/interestsValidationSchema";
import { useActivityOptions } from "@/features/iir/hooks/useLookups";
import { Activity, Hobby } from "@/features/iir/types";
import { cn } from "@/lib/utils";

interface FormErrors {
  [key: string]: string;
}

interface InterestsSectionRef {
  validate: (step?: number) => { isValid: boolean; errors: FormErrors };
}

const namesMatch = (name1: string = "", name2: string = "") =>
  (name1 || "").toLowerCase().trim() === (name2 || "").toLowerCase().trim();

const isOtherName = (name: string = "") => {
  const n = (name || "").toLowerCase().trim();
  return (
    n === "others" ||
    n === "other" ||
    n.includes("others") ||
    n.includes("other")
  );
};

const ACADEMIC_CLUBS = [
  "Math Club",
  "Science Club",
  "Debating Club",
  "Quizzer's Club",
];
const EXTRA_CURRICULAR_ORGS = [
  "Athletics",
  "Religious Organizations",
  "Glee Club",
  "Dramatics",
  "Chess Club",
  "Scouting",
];


const checkSubjectDuplicates = (preferences: any[]): FormErrors => {
  const localErrors: FormErrors = {};
  const normalized = (preferences || []).map((p, idx) => ({
    name: (p?.subjectName || "").toLowerCase().trim(),
    isFavorite: !!p?.isFavorite,
    index: idx,
    originalName: p?.subjectName || "",
  }));

  normalized.forEach((item1) => {
    if (!item1.name) return;

    normalized.forEach((item2) => {
      if (item1.index === item2.index || !item2.name) return;

      if (item1.name === item2.name) {
        const path = `interests.subjectPreferences.${item1.index}.subjectName`;
        if (item1.isFavorite === item2.isFavorite) {
          localErrors[path] =
            `"${item1.originalName}" is duplicated in this list.`;
        } else {
          localErrors[path] = `Cannot be both favorite and least liked.`;
        }
      }
    });
  });

  return localErrors;
};

const checkHobbySequence = (hobbies: any[]): FormErrors => {
  const localErrors: FormErrors = {};
  const rankMap: { [key: number]: string } = {};
  (hobbies || []).forEach((h) => {
    if (h && typeof h.priorityRank === "number") {
      rankMap[h.priorityRank] = (h.hobbyName || "").trim();
    }
  });

  for (let rank = 2; rank <= 4; rank++) {
    const currentVal = rankMap[rank];
    if (currentVal) {
      for (let prevRank = 1; prevRank < rank; prevRank++) {
        if (!rankMap[prevRank]) {
          localErrors[`interests.hobbies.${rank - 1}.hobbyName`] =
            `Cannot define preference #${rank} ` +
            "if previous preferences are empty.";
          break;
        }
      }
    }
  }

  return localErrors;
};


const isAcademicActivity = (a: any): boolean => {
  if (!a || !a.activityOption) return false;
  if (!a.activityOption.name || a.activityOption.id === 0) {
    return true;
  }
  if (a.activityOption.isAcademic !== undefined) {
    return !!a.activityOption.isAcademic;
  }
  const name = a.activityOption.name;
  const cat = (a.activityOption.category || "").toLowerCase();
  if (cat === "academic" || ACADEMIC_CLUBS.includes(name)) {
    return true;
  }
  if (cat === "extra_curricular" || EXTRA_CURRICULAR_ORGS.includes(name)) {
    return false;
  }
  if (cat === "both") {
    if (a.roleSpecification || (a.role && a.role !== "Member")) {
      return false;
    }
  }
  return true;
};

const checkActivitiesAndRoles = (interests: any): FormErrors => {
  const localErrors: FormErrors = {};
  const activities = interests?.activities || [];

  activities.forEach((a: any, index: number) => {
    const isAcademic = isAcademicActivity(a);
    const isOther = isOtherName(a.activityOption?.name);

    if (isOther) {
      const spec = (a.otherSpecification || "").trim();
      if (!spec) {
        localErrors[`interests.activities.${index}.otherSpecification`] =
          isAcademic
            ? "Please specify the academic club name."
            : "Please specify the organization details.";
      }
    }

    if (!isAcademic) {
      const role = (a.role || "").trim();
      if (!role) {
        localErrors[`interests.activities.${index}.role`] =
          "Please select your role.";
      } else if (role === "Other") {
        const roleSpec = (a.roleSpecification || "").trim();
        if (!roleSpec) {
          localErrors[`interests.activities.${index}.roleSpecification`] =
            "Please specify your role.";
        }
      }
    }
  });

  return localErrors;
};

export const InterestsSection = forwardRef<
  InterestsSectionRef,
  {
    interests: any;
    onChange: (path: string, value: any) => void;
    onFieldBlur?: (fieldPath: string) => void;
    shouldShowError?: (fieldPath: string) => boolean;
  }
>(function InterestsSection(
  { interests, onChange, onFieldBlur, shouldShowError },
  ref,
) {
  const [errors, setErrors] = useState<FormErrors>({});
  const { data: activityOptions = [] } = useActivityOptions();

  // Dynamically ensure isAcademic is set on all loaded activities
  useEffect(() => {
    const currentActivities = interests?.activities || [];
    if (currentActivities.length > 0) {
      const needsNormalization = currentActivities.some(
        (a: any) => a.activityOption.isAcademic === undefined,
      );
      if (needsNormalization) {
        let othersCount = 0;
        const normalized = currentActivities.map((a: any) => {
          if (a.activityOption.isAcademic !== undefined) return a;

          const name = a.activityOption.name;
          const cat = (a.activityOption.category || "").toLowerCase();

          let isAcademic = false;
          if (!name || a.activityOption.id === 0) {
            isAcademic = true;
          } else if (cat === "academic" || ACADEMIC_CLUBS.includes(name)) {
            isAcademic = true;
          } else if (
            cat === "extra_curricular" ||
            EXTRA_CURRICULAR_ORGS.includes(name)
          ) {
            isAcademic = false;
          } else if (cat === "both") {
            const allOthers = currentActivities.filter((act: any) =>
              isOtherName(act.activityOption.name),
            );
            if (allOthers.length === 2) {
              isAcademic = othersCount === 0;
              othersCount++;
            } else {
              if (a.roleSpecification || (a.role && a.role !== "Member")) {
                isAcademic = false;
              } else {
                const hasOtherAcademic = currentActivities.some(
                  (act: any) =>
                    act.activityOption.id !== a.activityOption.id &&
                    (act.activityOption.category === "academic" ||
                      ACADEMIC_CLUBS.includes(act.activityOption.name)),
                );
                const hasOtherExtra = currentActivities.some(
                  (act: any) =>
                    act.activityOption.id !== a.activityOption.id &&
                    (act.activityOption.category === "extra_curricular" ||
                      EXTRA_CURRICULAR_ORGS.includes(act.activityOption.name)),
                );
                if (hasOtherAcademic && !hasOtherExtra) {
                  isAcademic = true;
                } else if (hasOtherExtra && !hasOtherAcademic) {
                  isAcademic = false;
                } else {
                  isAcademic = true;
                }
              }
            }
          }

          return {
            ...a,
            activityOption: {
              ...a.activityOption,
              isAcademic,
            },
          };
        });

        onChange("interests.activities", normalized);
      }
    }
  }, [interests?.activities, onChange]);



  const validate = (
    step?: number,
  ): { isValid: boolean; errors: FormErrors } => {
    const sectionErrors = validateObject(
      { interests },
      interestsValidationSchema,
    );

    const duplicates = checkSubjectDuplicates(
      interests?.subjectPreferences || [],
    );
    Object.assign(sectionErrors, duplicates);

    const hobbySequence = checkHobbySequence(interests?.hobbies || []);
    Object.assign(sectionErrors, hobbySequence);

    const actErrors = checkActivitiesAndRoles(interests);
    Object.assign(sectionErrors, actErrors);

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
    const fieldRules = interestsValidationSchema[fieldPath];
    if (fieldRules) {
      const error = validateField(value, fieldRules, { interests });
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

  const categoryMatches = (optCategory: string = "", isAcademic: boolean) => {
    const cat = (optCategory || "").toLowerCase();
    if (!cat || cat === "both") return true;
    return isAcademic ? cat.includes("academic") : !cat.includes("academic");
  };

  const toggleActivity = (
    name: string,
    isAcademic: boolean,
    isOther: boolean = false,
  ) => {
    const currentActivities = [...(interests?.activities || [])];
    const existingIndex = currentActivities.findIndex((a) => {
      const optName = a.activityOption.name;

      if (isOther) {
        if (!isOtherName(optName)) return false;
        if (a.activityOption.isAcademic !== undefined) {
          return !!a.activityOption.isAcademic === isAcademic;
        }
        const optCategory = a.activityOption.category;
        if (optCategory) return categoryMatches(optCategory, isAcademic);
        return false;
      }
      return namesMatch(optName, name);
    });

    if (existingIndex > -1) {
      currentActivities.splice(existingIndex, 1);
    } else {
      let option = activityOptions.find((opt: any) => {
        const nameMatch = isOther
          ? isOtherName(opt.name)
          : namesMatch(opt.name, name);
        if (!nameMatch) return false;
        if (opt.category) return categoryMatches(opt.category, isAcademic);
        return true;
      });

      if (!option) {
        option = activityOptions.find((opt: any) =>
          isOther ? isOtherName(opt.name) : namesMatch(opt.name, name),
        );
      }

      if (option) {
        const extraActivities = currentActivities.filter(
          (a: Activity) => !isAcademicActivity(a),
        );
        const existingRole = extraActivities[0]?.role || "Member";
        const existingRoleSpec = extraActivities[0]?.roleSpecification || "";

        currentActivities.push({
          activityOption: { ...option, isAcademic },
          otherSpecification: "",
          role: isAcademic ? "Member" : existingRole,
          roleSpecification: isAcademic ? "" : existingRoleSpec,
        });
      }
    }
    handleInputChange("interests.activities", currentActivities);

    const actErrors = checkActivitiesAndRoles({
      ...interests,
      activities: currentActivities,
    });
    setErrors((prev: FormErrors) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        if (k.startsWith("interests.activities.")) {
          delete updated[k];
        }
      });
      return { ...updated, ...actErrors };
    });
  };

  const isActivityChecked = (
    name: string,
    isAcademic?: boolean,
    isOther: boolean = false,
  ) => {
    return !!(interests?.activities || []).some((a: Activity) => {
      const optName = a.activityOption.name;

      if (isOther) {
        if (!isOtherName(optName)) return false;
        return isAcademicActivity(a) === isAcademic;
      }
      return namesMatch(optName, name);
    });
  };

  const updateActivityRole = (
    activityOptionId: number,
    isAcademic: boolean,
    role: string,
  ) => {
    const currentActivities = (interests?.activities || []).map(
      (a: Activity) => {
        const isAcad = isAcademicActivity(a);
        if (a.activityOption.id === activityOptionId && isAcad === isAcademic) {
          return {
            ...a,
            role,
            roleSpecification: role === "Other" ? a.roleSpecification : "",
          };
        }
        return a;
      },
    );
    handleInputChange("interests.activities", currentActivities);

    const actErrors = checkActivitiesAndRoles({
      ...interests,
      activities: currentActivities,
    });
    setErrors((prev: FormErrors) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        if (k.startsWith("interests.activities.")) {
          delete updated[k];
        }
      });
      return { ...updated, ...actErrors };
    });
  };

  const updateActivityRoleSpecification = (
    activityOptionId: number,
    isAcademic: boolean,
    spec: string,
  ) => {
    const currentActivities = (interests?.activities || []).map(
      (a: Activity) => {
        const isAcad = isAcademicActivity(a);
        if (a.activityOption.id === activityOptionId && isAcad === isAcademic) {
          return { ...a, roleSpecification: spec };
        }
        return a;
      },
    );
    handleInputChange("interests.activities", currentActivities);

    const actErrors = checkActivitiesAndRoles({
      ...interests,
      activities: currentActivities,
    });
    setErrors((prev: FormErrors) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        if (k.startsWith("interests.activities.")) {
          delete updated[k];
        }
      });
      return { ...updated, ...actErrors };
    });
  };

  const updateActivityOtherSpecification = (
    activityOptionId: number,
    isAcademic: boolean,
    spec: string,
  ) => {
    const currentActivities = (interests?.activities || []).map(
      (a: Activity) => {
        const isAcad = isAcademicActivity(a);
        if (a.activityOption.id === activityOptionId && isAcad === isAcademic) {
          return { ...a, otherSpecification: spec };
        }
        return a;
      },
    );
    handleInputChange("interests.activities", currentActivities);

    const actErrors = checkActivitiesAndRoles({
      ...interests,
      activities: currentActivities,
    });
    setErrors((prev: FormErrors) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        if (k.startsWith("interests.activities.")) {
          delete updated[k];
        }
      });
      return { ...updated, ...actErrors };
    });
  };

  const updateAllExtracurricularRoles = (role: string) => {
    const currentActivities = (interests?.activities || []).map(
      (a: Activity) => {
        const isAcad = isAcademicActivity(a);
        if (!isAcad) {
          return {
            ...a,
            role,
            roleSpecification: role === "Other" ? a.roleSpecification : "",
          };
        }
        return a;
      },
    );
    handleInputChange("interests.activities", currentActivities);

    const actErrors = checkActivitiesAndRoles({
      ...interests,
      activities: currentActivities,
    });
    setErrors((prev: FormErrors) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        if (k.startsWith("interests.activities.")) {
          delete updated[k];
        }
      });
      return { ...updated, ...actErrors };
    });
  };

  const updateAllExtracurricularRoleSpecs = (spec: string) => {
    const currentActivities = (interests?.activities || []).map(
      (a: Activity) => {
        const isAcad = isAcademicActivity(a);
        if (!isAcad) {
          return { ...a, roleSpecification: spec };
        }
        return a;
      },
    );
    handleInputChange("interests.activities", currentActivities);

    const actErrors = checkActivitiesAndRoles({
      ...interests,
      activities: currentActivities,
    });
    setErrors((prev: FormErrors) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        if (k.startsWith("interests.activities.")) {
          delete updated[k];
        }
      });
      return { ...updated, ...actErrors };
    });
  };

  const getHobby = (rank: number) =>
    interests?.hobbies?.find((h: Hobby) => h.priorityRank === rank)
      ?.hobbyName || "";

  const updateHobby = (rank: number, name: string) => {
    const currentHobbies = [...(interests?.hobbies || [])];
    const index = currentHobbies.findIndex(
      (h: Hobby) => h.priorityRank === rank,
    );

    if (index > -1) {
      if (!name) {
        currentHobbies.splice(index, 1);
      } else {
        currentHobbies[index] = {
          ...currentHobbies[index],
          hobbyName: name,
          priorityRank: rank,
        };
      }
    } else if (name) {
      currentHobbies.push({ hobbyName: name, priorityRank: rank });
    }

    handleInputChange("interests.hobbies", currentHobbies);

    const sequenceErrors = checkHobbySequence(currentHobbies);
    setErrors((prev: FormErrors) => {
      const updated = { ...prev };

      for (let i = 0; i < 4; i++) {
        const path = `interests.hobbies.${i}.hobbyName`;
        delete updated[path];

        const fieldRules = interestsValidationSchema[path];
        const val =
          currentHobbies.find((h: Hobby) => h.priorityRank === i + 1)
            ?.hobbyName || "";
        if (fieldRules && val) {
          const error = validateField(val, fieldRules, {
            interests: {
              ...interests,
              hobbies: currentHobbies,
            },
          });
          if (error) updated[path] = error;
        }
      }

      Object.assign(updated, sequenceErrors);
      return updated;
    });
  };

  const getSubject = (isFavorite: boolean, slotIndex: number) => {
    // We map Favorites to indices 0,1,2 and Least Liked to 3,4,5
    const arrayIndex = isFavorite ? slotIndex : slotIndex + 3;
    return (interests?.subjectPreferences || [])[arrayIndex]?.subjectName || "";
  };

  const updateSubject = (
    isFavorite: boolean,
    slotIndex: number,
    name: string,
  ) => {
    const arrayIndex = isFavorite ? slotIndex : slotIndex + 3;
    const currentPreferences = [...(interests?.subjectPreferences || [])];

    while (currentPreferences.length <= arrayIndex) {
      currentPreferences.push({
        subjectName: "",
        isFavorite: currentPreferences.length < 3,
      });
    }

    currentPreferences[arrayIndex] = {
      ...currentPreferences[arrayIndex],
      subjectName: name,
      isFavorite: isFavorite,
    };

    handleInputChange("interests.subjectPreferences", currentPreferences);

    const duplicates = checkSubjectDuplicates(currentPreferences);
    setErrors((prev: FormErrors) => {
      const updated = { ...prev };

      for (let i = 0; i < 6; i++) {
        const path = `interests.subjectPreferences.${i}.subjectName`;
        delete updated[path];

        const fieldRules = interestsValidationSchema[path];
        const val = currentPreferences[i]?.subjectName || "";
        if (fieldRules && val) {
          const error = validateField(val, fieldRules, {
            interests: {
              ...interests,
              subjectPreferences: currentPreferences,
            },
          });
          if (error) updated[path] = error;
        }
      }

      Object.assign(updated, duplicates);
      return updated;
    });
  };

  const getSubjectFieldError = (isFavorite: boolean, slotIndex: number) => {
    const arrayIndex = isFavorite ? slotIndex : slotIndex + 3;
    const path = `interests.subjectPreferences.${arrayIndex}.subjectName`;
    const error = errors[path];
    if (!error) return undefined;

    const isDuplicateError =
      error.includes("duplicated") || error.includes("both favorite");
    if (isDuplicateError) return error;

    const showError = shouldShowError ? shouldShowError(path) : true;
    return showError ? error : undefined;
  };

  const getFieldError = (fieldPath: string): string | undefined => {
    const hasError = errors[fieldPath];
    const showError = shouldShowError ? shouldShowError(fieldPath) : true;
    return hasError && showError ? errors[fieldPath] : undefined;
  };

  const hasOrgsSelected = (interests?.activities || []).some(
    (a: Activity) => !isAcademicActivity(a),
  );

  const extraActivities = (interests?.activities || []).filter(
    (a: Activity) => !isAcademicActivity(a),
  );
  const firstExtraOrigIdx = (interests?.activities || []).findIndex(
    (a: Activity) => !isAcademicActivity(a),
  );
  const sharedRole = extraActivities[0]?.role || "Member";
  const sharedRoleSpec = extraActivities[0]?.roleSpecification || "";

  const otherExtraActivityItem = (interests?.activities || [])
    .map((activity: Activity, origIdx: number) => ({ activity, origIdx }))
    .find(
      (item: { activity: Activity; origIdx: number }) =>
        !isAcademicActivity(item.activity) &&
        isOtherName(item.activity.activityOption.name),
    );

  return (
    <SectionContainer
      title="Interests & Activities"
      description="Tell us about your passions and involvement"
      icon={Sparkles}
    >
      <div className="space-y-12">
        {/* A. Academic Section */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-primary" />
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              A. Academic Interests
            </h3>
          </div>

          <div
            className={cn(
              "bg-glass-bg/60 relative mb-8 border-glass-border",
              "overflow-hidden rounded-xl p-5 backdrop-blur-glass",
              "transition-all duration-300 sm:p-8",
            )}
          >
            <div
              className={cn(
                "pointer-events-none absolute right-0 top-0 -mr-16 -mt-16",
                "h-48 w-48 rounded-full bg-primary/5 blur-3xl",
              )}
            />

            <h4
              className={cn(
                "mb-6 flex items-center gap-2 text-sm font-bold uppercase",
                "tracking-widest text-primary sm:mb-8",
              )}
            >
              <Library size={16} />
              School Clubs & Organizations
            </h4>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {ACADEMIC_CLUBS.map((club, idx) => (
                <div
                  key={club}
                  className="flex items-center"
                >
                  <Checkbox
                    id={`academic-club-${idx}`}
                    name="academic_clubs"
                    label={club}
                    checked={isActivityChecked(club)}
                    onCheckedChange={() => toggleActivity(club, true)}
                  />
                </div>
              ))}
              <Checkbox
                id="academic-others-check"
                name="academic_clubs"
                label="Others (Specify)"
                checked={isActivityChecked("Others", true, true)}
                onCheckedChange={() => toggleActivity("Others", true, true)}
              />
            </div>

            {interests?.activities?.filter(
              (a: Activity) =>
                isAcademicActivity(a) && isOtherName(a.activityOption.name),
            ).length > 0 && (
              <div
                className={cn(
                  "mt-8 space-y-4 border-t border-glass-border/20 pt-6",
                  "animate-in fade-in duration-300",
                )}
              >
                {(interests.activities || [])
                  .map((activity: Activity, origIdx: number) => ({
                    activity,
                    origIdx,
                  }))
                  .filter(
                    (item: { activity: Activity; origIdx: number }) =>
                      isAcademicActivity(item.activity) &&
                      isOtherName(item.activity.activityOption.name),
                  )
                  .map((item: { activity: Activity; origIdx: number }) => {
                    const activity = item.activity;
                    const origIdx = item.origIdx;
                    return (
                      <div
                        key={activity.activityOption.id}
                        className="max-w-md"
                      >
                        <FormField
                          label="Please specify club name"
                          value={activity.otherSpecification || ""}
                          onChange={(val: string) =>
                            updateActivityOtherSpecification(
                              activity.activityOption.id,
                              true,
                              val,
                            )
                          }
                          noSpecialCharacters={true}
                          placeholder="e.g. Journalism Club"
                          error={getFieldError(
                            `interests.activities.${origIdx}` +
                              ".otherSpecification",
                          )}
                          required={true}
                        />
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
            <div
              className={cn(
                "bg-glass-bg/60 border-glass-border/40 rounded-xl border",
                "p-5 shadow-sm backdrop-blur-glass transition-all duration-300",
                "hover:border-primary/20 sm:p-6",
              )}
            >
              <h4
                className={cn(
                  "mb-6 flex items-center gap-2 text-xs uppercase",
                  "tracking-widest text-neutral-400 dark:text-neutral-500",
                )}
              >
                <Star
                  size={14}
                  className="text-primary"
                />
                Favorite Subjects
              </h4>
              <div className="space-y-4">
                {[0, 1, 2].map((slot) => (
                  <FormField
                    key={`fav-subject-${slot}`}
                    label=""
                    value={getSubject(true, slot)}
                    onChange={(val: string) => updateSubject(true, slot, val)}
                    noSpecialCharacters={true}
                    placeholder={`Subject #${slot + 1}`}
                    error={getSubjectFieldError(true, slot)}
                    prefix={(slot + 1).toString()}
                  />
                ))}
              </div>
            </div>
            <div
              className={cn(
                "bg-glass-bg/60 border-glass-border/40 rounded-xl border",
                "p-5 shadow-sm backdrop-blur-glass transition-all duration-300",
                "hover:border-primary/20 sm:p-6",
              )}
            >
              <h4
                className={cn(
                  "mb-6 flex items-center gap-2 text-xs uppercase",
                  "tracking-widest text-neutral-400 dark:text-neutral-500",
                )}
              >
                <Heart
                  size={14}
                  className="text-primary opacity-50"
                />
                Least Liked Subjects
              </h4>
              <div className="space-y-4">
                {[0, 1, 2].map((slot) => (
                  <FormField
                    key={`least-subject-${slot}`}
                    label=""
                    value={getSubject(false, slot)}
                    onChange={(val: string) => updateSubject(false, slot, val)}
                    noSpecialCharacters={true}
                    placeholder={`Subject #${slot + 1}`}
                    error={getSubjectFieldError(false, slot)}
                    prefix={(slot + 1).toString()}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* B. Extra-Curricular Section */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-primary" />
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              B. Extra-Curricular & Hobbies
            </h3>
          </div>

          <div className="space-y-6 sm:space-y-8">
            {/* Hobbies Card (Full Width) */}
            <div
              className={cn(
                "bg-glass-bg/60 border-glass-border/40 relative",
                "overflow-hidden rounded-xl border p-6 shadow-sm",
                "backdrop-blur-glass transition-all duration-300 sm:p-8",
              )}
            >
              <h4
                className={cn(
                  "mb-6 flex items-center gap-2 text-sm font-bold uppercase",
                  "tracking-widest text-primary",
                )}
              >
                <Palette size={16} />
                My Hobbies
              </h4>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {[1, 2, 3, 4].map((rank) => (
                  <FormField
                    key={rank}
                    label={`Hobby Preference #${rank}`}
                    value={getHobby(rank)}
                    onChange={(val: string) => updateHobby(rank, val)}
                    noSpecialCharacters={true}
                    placeholder="e.g. Reading, Sports, Painting"
                    error={getFieldError(
                      `interests.hobbies.${rank - 1}.hobbyName`,
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Organizations Card (Full Width) */}
            <div
              className={cn(
                "bg-glass-bg/60 border-glass-border/40 relative",
                "overflow-hidden rounded-xl border p-6 shadow-sm",
                "backdrop-blur-glass transition-all duration-300 sm:p-8",
              )}
            >
              <h4
                className={cn(
                  "mb-8 flex items-center gap-2 text-sm font-bold uppercase",
                  "tracking-widest text-primary",
                )}
              >
                <Users size={16} />
                Organizations Participated In
              </h4>

              <div
                className={cn(
                  "mb-8 grid grid-cols-1 gap-x-8 gap-y-6",
                  "sm:grid-cols-2 md:grid-cols-3",
                )}
              >
                {EXTRA_CURRICULAR_ORGS.map((org, idx) => (
                  <Checkbox
                    key={org}
                    id={`extra-org-${idx}`}
                    name="extra_orgs"
                    label={org}
                    checked={isActivityChecked(org)}
                    onCheckedChange={() => toggleActivity(org, false)}
                  />
                ))}
                <Checkbox
                  id="extra-others-check"
                  name="extra_orgs"
                  label="Other Organizations"
                  checked={isActivityChecked("Others", false, true)}
                  onCheckedChange={() => toggleActivity("Others", false, true)}
                />
              </div>

              {interests?.activities?.filter((a: Activity) =>
                !isAcademicActivity(a),
              ).length > 0 && (
                <div
                  className={cn(
                    "mt-8 space-y-6 border-t border-glass-border/20 pt-6",
                    "animate-in fade-in duration-300",
                  )}
                >
                  <h5
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      "text-neutral-400 dark:text-neutral-500",
                    )}
                  >
                    Organization Details & Role:
                  </h5>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Other Organization Input */}
                    {otherExtraActivityItem && (
                      <div
                        className={cn(
                          "rounded-xl border border-glass-border/40",
                          "bg-glass-bg/25 p-5",
                        )}
                      >
                        <FormField
                          label="Specify Other Organization"
                          value={
                            otherExtraActivityItem.activity
                              .otherSpecification || ""
                          }
                          onChange={(val: string) =>
                            updateActivityOtherSpecification(
                              otherExtraActivityItem.activity
                                .activityOption.id,
                              false,
                              val,
                            )
                          }
                          placeholder="e.g. Red Cross Youth"
                          error={getFieldError(
                            "interests.activities." +
                              `${otherExtraActivityItem.origIdx}` +
                              ".otherSpecification",
                          )}
                          required={true}
                        />
                      </div>
                    )}

                    {/* Single Shared Role Selection */}
                    <div
                      className={cn(
                        "rounded-xl border border-glass-border/40",
                        "bg-glass-bg/25 p-5 space-y-4",
                        !otherExtraActivityItem && "md:col-span-2",
                      )}
                    >
                      <div
                        className={cn(
                          "grid grid-cols-1 gap-4",
                          sharedRole === "Other"
                            ? "sm:grid-cols-2"
                            : "sm:grid-cols-1",
                        )}
                      >
                        <SelectField
                          label="Role"
                          options={[
                            { id: "Member", name: "Member" },
                            { id: "Officer", name: "Officer" },
                            { id: "Other", name: "Other (Specify)" },
                          ]}
                          value={sharedRole}
                          onChange={updateAllExtracurricularRoles}
                          error={
                            firstExtraOrigIdx !== -1
                              ? getFieldError(
                                  "interests.activities." +
                                    `${firstExtraOrigIdx}.role`,
                                )
                              : undefined
                          }
                          required={true}
                        />

                        {sharedRole === "Other" && (
                          <FormField
                            label="Specify Role"
                            value={sharedRoleSpec}
                            onChange={updateAllExtracurricularRoleSpecs}
                            placeholder="e.g. President"
                            error={
                              firstExtraOrigIdx !== -1
                                ? getFieldError(
                                    "interests.activities." +
                                      `${firstExtraOrigIdx}` +
                                      ".roleSpecification",
                                  )
                                : undefined
                            }
                            required={true}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </SectionContainer>
  );
});
