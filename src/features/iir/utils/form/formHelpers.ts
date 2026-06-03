/**
 * Form helper utilities for IIR Form
 * Extracted from IIRForm component for better maintainability
 */

import { IIRForm } from "../../types";

type InitializeFormOptions = {
  preserveBasicInfoFromSource?: boolean;
};

function cloneValue<T>(value: T): T {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}

/**
 * Strips the time component from an ISO8601 datetime string returned
 * by the Go backend (e.g. "2000-01-01T00:00:00Z" → "2000-01-01").
 * Returns an empty string for any falsy input.
 * The backend's validateDate expects strictly "YYYY-MM-DD".
 */
function toDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  // Fast path: already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  return dateStr.split("T")[0];
}

/**
 * Updates a nested field in the form data immutably
 * @param formData - Current form data
 * @param path - Array of keys representing the path to the field
 * @param value - New value to set
 * @returns Updated form data
 */
export function updateNestedField(
  formData: IIRForm | null,
  path: string[],
  value: any,
): IIRForm | null {
  if (!formData || path.length === 0) return formData;

  const updateAtPath = (current: any, index: number): any => {
    const key = path[index];
    const isLast = index === path.length - 1;
    const currentValue = current ?? (Number.isInteger(Number(key)) ? [] : {});
    const copy = Array.isArray(currentValue)
      ? [...currentValue]
      : { ...currentValue };

    copy[key] = isLast ? value : updateAtPath(copy[key], index + 1);
    return copy;
  };

  return updateAtPath(formData, 0) as IIRForm;
}

/**
 * Checks if a field value is filled
 * @param val - Value to check
 * @returns True if field is filled
 */
export function countFilledField(val: any): boolean {
  if (val === null || val === undefined || val === "") return false;
  if (typeof val === "object") {
    if (Array.isArray(val)) return val.length > 0;
    // For objects, check if they have an id (indicating it's been selected)
    return val?.id !== undefined && val?.id !== null && val?.id !== "";
  }
  return true;
}

/**
 * Gets the overall completion percentage across all sections
 * @param formData - Current form data
 * @param sectionCount - Total number of sections
 * @param calculateSectionCompletion - Function to calculate individual section completion
 * @returns Overall completion percentage (0-100)
 */
export function getOverallCompletion(
  formData: IIRForm | null,
  sectionCount: number,
  calculateSectionCompletion: (sectionIndex: number) => number,
): number {
  let totalPercentage = 0;
  for (let i = 1; i <= sectionCount; i++) {
    totalPercentage += calculateSectionCompletion(i);
  }
  return Math.round(totalPercentage / sectionCount);
}

/**
 * Gets the status of a section based on completion percentage
 * @param sectionIndex - Section index (1-based)
 * @param calculateSectionCompletion - Function to calculate section completion
 * @returns Section status: 'complete', 'partial', or 'empty'
 */
export function getSectionStatus(
  sectionIndex: number,
  calculateSectionCompletion: (sectionIndex: number) => number,
): "complete" | "partial" | "empty" {
  const percentage = calculateSectionCompletion(sectionIndex);
  if (percentage === 100) return "complete";
  if (percentage > 0) return "partial";
  return "empty";
}

/**
 * Creates a reset form data object preserving basic info
 * @param emptyForm - Empty form template
 * @param me - Current user data
 * @returns Reset form data with preserved basic info
 */
export function createResetFormData(emptyForm: IIRForm, me: any): IIRForm {
  const empty = cloneValue(emptyForm);

  return {
    ...empty,
    student: {
      ...empty.student,
      basicInfo: {
        firstName: me?.firstName || "",
        middleName:
          me?.middleName && typeof me?.middleName === "string"
            ? me?.middleName
            : "",
        lastName: me?.lastName || "",
        email: me?.email || "",
      },
    },
  };
}

/**
 * Initializes form data from draft, profile data, or empty template
 * @param source - Draft/profile data from API
 * @param emptyForm - Empty form template
 * @param me - Current user data
 * @param options - Set preserveBasicInfoFromSource=true for edit mode
 * @returns Initialized form data
 */
export function initializeFormData(
  source: IIRForm | null,
  emptyForm: IIRForm,
  me: any,
  options: InitializeFormOptions = {},
): IIRForm {
  const baseData = cloneValue(source || emptyForm);
  const emptyData = cloneValue(emptyForm);
  const preserveBasicInfo = options.preserveBasicInfoFromSource === true;

  const existingBasicInfo = baseData.student?.basicInfo || {};

  return {
    ...baseData,
    student: {
      ...emptyData.student,
      ...baseData.student,
      basicInfo: preserveBasicInfo
        ? {
            ...emptyData.student.basicInfo,
            ...existingBasicInfo,
          }
        : {
            ...existingBasicInfo,
            firstName: me?.firstName || "",
            middleName:
              me?.middleName && typeof me?.middleName === "string"
                ? me?.middleName
                : "",
            lastName: me?.lastName || "",
            email: me?.email || "",
          },
      personalInfo: {
        ...emptyData.student?.personalInfo,
        ...baseData.student?.personalInfo,
        dateOfBirth: toDateOnly(baseData.student?.personalInfo?.dateOfBirth),
      },
      addresses: Array.isArray(baseData.student?.addresses)
        ? baseData.student.addresses
        : emptyData.student.addresses,
    },
    education: {
      ...emptyData.education,
      ...baseData.education,
      schools: [2, 3, 4, 5, 6].map((id, idx) => {
        const levelNames = [
          "Elementary",
          "Junior High School",
          "Senior High School",
          "Vocational",
          "College",
        ];
        const existing = (baseData.education?.schools || []).find(
          (s: any) => s.educationalLevel?.id === id,
        ) || {
          schoolName: "",
          schoolAddress: "",
          schoolType: "",
          yearStarted: "",
          yearCompleted: "",
          awards: "",
        };
        return {
          ...existing,
          educationalLevel: { id, name: levelNames[idx] },
        } as any;
      }),
    },
    family: baseData.family
      ? {
          ...emptyData.family,
          ...baseData.family,
          background: {
            ...emptyData.family.background,
            ...baseData.family.background,
          },
          finance: {
            ...emptyData.family.finance,
            ...baseData.family.finance,
          },
          relatedPersons: [0, 1, 2].map((idx) => {
            const template = emptyData.family.relatedPersons[idx];
            let existing: any = {};
            if (idx === 0) {
              existing =
                (baseData.family?.relatedPersons || []).find(
                  (p: any) =>
                    p.isParent &&
                    (p.relationship?.id === 1 ||
                      p.relationship?.relationshipName === "Father" ||
                      p.relationship?.name === "Father"),
                ) || {};
            } else if (idx === 1) {
              existing =
                (baseData.family?.relatedPersons || []).find(
                  (p: any) =>
                    p.isParent &&
                    (p.relationship?.id === 2 ||
                      p.relationship?.relationshipName === "Mother" ||
                      p.relationship?.name === "Mother"),
                ) || {};
            } else {
              existing =
                (baseData.family?.relatedPersons || []).find(
                  (p: any) => p.isGuardian,
                ) || {};
            }

            return {
              ...template,
              ...existing,
              dateOfBirth: toDateOnly(existing.dateOfBirth),
              relationship:
                existing.relationship?.id && existing.relationship.id > 0
                  ? existing.relationship
                  : template.relationship,
              // Ensure correct flags for Father/Mother/Guardian
              isParent: idx < 2,
              isGuardian: idx === 2,
            };
          }),
        }
      : emptyData.family,
    health: {
      ...emptyData.health,
      ...baseData.health,
      healthRecord: {
        ...emptyData.health.healthRecord,
        ...baseData.health?.healthRecord,
      },
      consultations: Array.isArray(baseData.health?.consultations)
        ? baseData.health.consultations
        : emptyData.health.consultations,
    },
    interests: {
      ...emptyData.interests,
      ...baseData.interests,
      activities: Array.isArray(baseData.interests?.activities)
        ? baseData.interests.activities
        : emptyData.interests.activities,
      subjectPreferences: Array.isArray(baseData.interests?.subjectPreferences)
        ? baseData.interests.subjectPreferences
        : emptyData.interests.subjectPreferences,
      hobbies: Array.isArray(baseData.interests?.hobbies)
        ? baseData.interests.hobbies
        : emptyData.interests.hobbies,
    },
  };
}
