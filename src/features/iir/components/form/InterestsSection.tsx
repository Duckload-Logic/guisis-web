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
import { FormInput, Checkbox } from "@/components/form";
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
const ROLE_OPTIONS = ["Officer", "Member"];

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
  if (cat === "both" || isOtherName(name)) {
    if (a.roleSpecification || (a.role && a.role !== "Member")) {
      return false;
    }
  }
  return true;
};

const checkActivitiesAndRoles = (interests: any): FormErrors => {
  const localErrors: FormErrors = {};

  const activities = interests?.activities || [];
  const academicOthers = activities.find(
    (a: any) => isAcademicActivity(a) && isOtherName(a.activityOption?.name),
  );
  if (academicOthers) {
    const spec = (academicOthers.otherSpecification || "").trim();
    if (!spec) {
      localErrors["interests.academicOthersSpecification"] =
        "Please specify the academic club name.";
    }
  }

  const extraOthers = activities.find(
    (a: any) => !isAcademicActivity(a) && isOtherName(a.activityOption?.name),
  );
  if (extraOthers) {
    const spec = (extraOthers.otherSpecification || "").trim();
    if (!spec) {
      localErrors["interests.extraOthersSpecification"] =
        "Please specify the organization details.";
    }
  }

  const hasOrgsSelected = activities.some((a: any) => !isAcademicActivity(a));

  if (hasOrgsSelected) {
    const tempRole = (interests?._tempRole || "").trim();
    if (!tempRole) {
      localErrors["interests._tempRole"] =
        "Please select your organizational role.";
    } else if (tempRole.includes("Other")) {
      const spec = (interests?._tempRoleSpecification || "").trim();
      if (!spec) {
        localErrors["interests._tempRoleSpecification"] =
          "Please specify your role.";
      }
    }
  }

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
          } else if (cat === "both" || isOtherName(name)) {
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

  // Initialize temporary role values when loaded
  useEffect(() => {
    if (interests && !interests._tempRole) {
      const extraActivity = (interests.activities || []).find(
        (a: any) => !isAcademicActivity(a),
      );
      if (extraActivity) {
        if (extraActivity.role) {
          onChange("interests._tempRole", extraActivity.role);
        }
        if (extraActivity.roleSpecification) {
          onChange(
            "interests._tempRoleSpecification",
            extraActivity.roleSpecification,
          );
        }
      }
    }
  }, [interests?.activities, interests?._tempRole, onChange]);

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
        currentActivities.push({
          activityOption: { ...option, isAcademic },
          otherSpecification: "",
          role: isAcademic ? "Member" : interests?._tempRole || "",
          roleSpecification:
            !isAcademic && (interests?._tempRole || "").includes("Other")
              ? interests?._tempRoleSpecification || ""
              : "",
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
      delete updated["interests.academicOthersSpecification"];
      delete updated["interests.extraOthersSpecification"];
      delete updated["interests._tempRole"];
      delete updated["interests._tempRoleSpecification"];
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

  const getOtherSpecification = (isAcademic: boolean) => {
    return (
      (interests?.activities || []).find((a: Activity) => {
        const optName = a.activityOption.name;
        if (!isOtherName(optName)) return false;
        return isAcademicActivity(a) === isAcademic;
      })?.otherSpecification || ""
    );
  };

  const updateOtherSpecification = (isAcademic: boolean, value: string) => {
    const currentActivities = [...(interests?.activities || [])];
    const index = currentActivities.findIndex((a) => {
      const optName = a.activityOption.name;
      if (!isOtherName(optName)) return false;
      return isAcademicActivity(a) === isAcademic;
    });
    if (index > -1) {
      currentActivities[index] = {
        ...currentActivities[index],
        otherSpecification: value,
      };
      handleInputChange("interests.activities", currentActivities);

      const actErrors = checkActivitiesAndRoles({
        ...interests,
        activities: currentActivities,
      });
      setErrors((prev: FormErrors) => {
        const updated = { ...prev };
        delete updated["interests.academicOthersSpecification"];
        delete updated["interests.extraOthersSpecification"];
        delete updated["interests._tempRole"];
        delete updated["interests._tempRoleSpecification"];
        return { ...updated, ...actErrors };
      });
    }
  };

  const toggleRole = (role: string) => {
    const currentRoles = (interests?._tempRole || "")
      .split(", ")
      .filter(Boolean);
    const index = currentRoles.findIndex((r: string) => namesMatch(r, role));
    let newRoles = [...currentRoles];

    if (index > -1) {
      newRoles.splice(index, 1);
    } else {
      if (role === "Officer") {
        newRoles = newRoles.filter(
          (r) => !namesMatch(r, "Member") && !namesMatch(r, "Other"),
        );
      } else if (role === "Member") {
        newRoles = newRoles.filter(
          (r) => !namesMatch(r, "Officer") && !namesMatch(r, "Other"),
        );
      } else if (role === "Other") {
        newRoles = newRoles.filter(
          (r) => !namesMatch(r, "Officer") && !namesMatch(r, "Member"),
        );
      }
      newRoles.push(role);
    }

    const roleStr = newRoles.join(", ");
    handleInputChange("interests._tempRole", roleStr);

    const currentActivities = (interests?.activities || []).map(
      (a: Activity) => ({
        ...a,
        role: a.activityOption.isAcademic ? "Member" : roleStr,
        roleSpecification:
          !a.activityOption.isAcademic && roleStr.includes("Other")
            ? interests?._tempRoleSpecification || ""
            : "",
      }),
    );
    handleInputChange("interests.activities", currentActivities);

    const actErrors = checkActivitiesAndRoles({
      ...interests,
      _tempRole: roleStr,
      activities: currentActivities,
    });
    setErrors((prev: FormErrors) => {
      const updated = { ...prev };
      delete updated["interests.academicOthersSpecification"];
      delete updated["interests.extraOthersSpecification"];
      delete updated["interests._tempRole"];
      delete updated["interests._tempRoleSpecification"];
      return { ...updated, ...actErrors };
    });
  };

  const isRoleChecked = (role: string) => {
    return (interests?._tempRole || "")
      .split(", ")
      .some((r: string) => namesMatch(r, role));
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

            {isActivityChecked("Others", true, true) && (
              <div
                className={cn(
                  "border-glass-border/20 animate-in fade-in",
                  "slide-in-from-top-4 mt-6 border-t pt-6 duration-300 sm:mt-8",
                  "sm:pt-8",
                )}
              >
                <FormInput
                  label="Please specify club name"
                  value={getOtherSpecification(true)}
                  onChange={(val: string) =>
                    updateOtherSpecification(true, val)
                  }
                  noSpecialCharacters={true}
                  placeholder="e.g. Journalism Club"
                  error={getFieldError("interests.academicOthersSpecification")}
                  required={isActivityChecked("Others", true, true)}
                />
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
                  <FormInput
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
                  <FormInput
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

          <div className="mb-12 grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
            {/* Hobbies Card */}
            <div
              className={cn(
                "bg-glass-bg/60 border-glass-border/40 group relative h-fit",
                "overflow-hidden rounded-xl border p-6 shadow-sm",
                "backdrop-blur-glass transition-all duration-300 sm:p-8",
                "lg:col-span-1",
              )}
            >
              <div
                className={cn(
                  "absolute -bottom-10 -right-10 h-32 w-32 rounded-full",
                  "bg-primary/10 blur-3xl transition-transform duration-700",
                  "group-hover:scale-150",
                )}
              />

              <h4
                className={cn(
                  "mb-2 flex items-center gap-2 text-sm font-bold uppercase",
                  "tracking-widest text-primary",
                )}
              >
                <Palette size={16} />
                My Hobbies
              </h4>
              <p
                className={cn(
                  "mb-8 text-[10px] font-bold uppercase",
                  "text-neutral-400 dark:text-neutral-500",
                )}
              >
                Rank by preference
              </p>

              <div className="space-y-5 sm:space-y-6">
                {[1, 2, 3, 4].map((rank) => (
                  <div
                    key={rank}
                    className="group relative"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center",
                          "rounded-xl text-xs",
                          rank <= 2
                            ? "bg-primary text-white shadow-sm"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        {rank}
                      </div>
                      <div className="w-full">
                        <FormInput
                          label=""
                          value={getHobby(rank)}
                          onChange={(val: string) => updateHobby(rank, val)}
                          noSpecialCharacters={true}
                          placeholder={`Preference #${rank}`}
                          error={getFieldError(
                            `interests.hobbies.${rank - 1}.hobbyName`,
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Organizations Card */}
            <div
              className={cn(
                "bg-glass-bg/60 border-glass-border/40 relative h-fit",
                "overflow-hidden rounded-xl border p-6 shadow-sm",
                "backdrop-blur-glass transition-all duration-300 sm:p-8",
                "lg:col-span-2",
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

              <div className="mb-8 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
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

              {isActivityChecked("Others", false, true) && (
                <FormInput
                  label="Please specify details"
                  type="textbox"
                  maxChars={50}
                  value={getOtherSpecification(false)}
                  onChange={(val: string) =>
                    updateOtherSpecification(false, val)
                  }
                  placeholder="e.g. Community Volunteers"
                  error={getFieldError("interests.extraOthersSpecification")}
                  required={isActivityChecked("Others", false, true)}
                />
              )}

              {/* Roles Section Sub-Card */}
              {hasOrgsSelected && (
                <div
                  className={cn(
                    "relative mt-2 overflow-hidden rounded-xl border",
                    "border-primary/10 bg-primary/5 p-5",
                  )}
                >
                  <div className="absolute right-0 top-0 p-3 opacity-10">
                    <Briefcase
                      size={64}
                      className="text-primary"
                    />
                  </div>
                  <h5 className="mb-6 text-[10px] uppercase tracking-[0.2em] text-primary sm:mb-8">
                    Occupational Role/Position:
                  </h5>
                  <div className="grid grid-cols-1 items-start gap-5 sm:gap-6 md:grid-cols-2">
                    {ROLE_OPTIONS.map((role, idx) => (
                      <Checkbox
                        key={role}
                        id={`role-${idx}`}
                        name="occupational_role"
                        label={role}
                        checked={isRoleChecked(role)}
                        onCheckedChange={() => toggleRole(role)}
                      />
                    ))}
                    <div className="space-y-4">
                      <Checkbox
                        id="role-others-check"
                        name="occupational_role"
                        label="Others (Specify)"
                        checked={isRoleChecked("Other")}
                        onCheckedChange={() => toggleRole("Other")}
                      />
                      {isRoleChecked("Other") && (
                        <div
                          className={cn(
                            "animate-in fade-in slide-in-from-top-2",
                            "duration-300",
                          )}
                        >
                          <FormInput
                            label=""
                            value={interests?._tempRoleSpecification || ""}
                            onChange={(val: string) => {
                              handleInputChange(
                                "interests._tempRoleSpecification",
                                val,
                              );
                              const actErrors = checkActivitiesAndRoles({
                                ...interests,
                                _tempRoleSpecification: val,
                              });
                              setErrors((prev: FormErrors) => {
                                const updated = { ...prev };
                                delete updated[
                                  "interests._tempRoleSpecification"
                                ];
                                if (
                                  actErrors["interests._tempRoleSpecification"]
                                ) {
                                  updated["interests._tempRoleSpecification"] =
                                    actErrors[
                                      "interests._tempRoleSpecification"
                                    ];
                                }
                                return updated;
                              });
                            }}
                            onBlur={() => {
                              const currentActivities = (
                                interests?.activities || []
                              ).map((a: Activity) => ({
                                ...a,
                                roleSpecification: a.activityOption.isAcademic
                                  ? ""
                                  : interests?._tempRoleSpecification || "",
                              }));
                              handleInputChange(
                                "interests.activities",
                                currentActivities,
                              );
                            }}
                            placeholder="Specify your role"
                            error={getFieldError(
                              "interests._tempRoleSpecification",
                            )}
                            required={isRoleChecked("Other")}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {getFieldError("interests._tempRole") && (
                    <p className="animate-in fade-in mt-4 text-xs font-medium text-destructive duration-200">
                      {getFieldError("interests._tempRole")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </SectionContainer>
  );
});
