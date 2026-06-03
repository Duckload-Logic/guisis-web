/**
 * Section completion calculation utilities
 * Dynamic logic based on required fields in validation schemas
 */

import { IIRForm } from "../../types";
import {
  FieldValidationSchema,
  getValueByPath,
} from "@/services/validationSchema";
import { personalInformationValidationSchema } from "../../config/personalInfoValidationSchema";
import { educationValidationSchema } from "../../config/educationValidationSchema";
import { familyValidationSchema } from "../../config/familyValidationSchema";
import { healthValidationSchema } from "../../config/healthValidationSchema";
import { interestsValidationSchema } from "../../config/interestsValidationSchema";
import { PERSONAL_SUBSTEP_FIELDS, FAMILY_SUBSTEP_FIELDS } from "../../config/subStepFields";

/**
 * Calculate completion from a schema by identifying "active" required fields
 */
function calculateCompletionFromSchema(
  schema: FieldValidationSchema,
  data: any,
  allowedFields?: string[],
): number {
  let totalCount = 0;
  let filledCount = 0;

  Object.entries(schema).forEach(([fieldPath, rules]) => {
    // If allowedFields is provided, skip fields not in the list
    if (allowedFields && !allowedFields.includes(fieldPath)) return;

    // A field is "active required" if the required rule is present
    // AND passes when the field is empty (meaning it's technically optional under current conditions)
    const requiredRule = rules.find((r) => r.type === "required");
    if (!requiredRule) return;

    const isActive = !requiredRule.validate(null, data);

    if (isActive) {
      totalCount++;
      // Check if it's currently valid against ALL rules
      const value = getValueByPath(data, fieldPath);
      const isValid = rules.every((r) => r.validate(value, data));
      if (isValid) {
        filledCount++;
      }
    }
  });

  return totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 100;
}

/**
 * Calculate completion percentage for a specific section
 * @param sectionIndex - Section index (1-based)
 * @param formData - Current form data
 * @returns Completion percentage (0-100)
 */
export function calculateSectionCompletion(
  sectionIndex: number,
  formData: IIRForm | null,
  isEditMode?: boolean,
): number {
  if (!formData) return 0;

  switch (sectionIndex) {
    case 1:
    case 2:
    case 3:
    case 4: {
      // Personal Information sub-steps
      let allowed = PERSONAL_SUBSTEP_FIELDS[sectionIndex];
      if (isEditMode) {
        if (sectionIndex === 2) {
          allowed = allowed.filter(
            (field) =>
              ![
                "student.personalInfo.placeOfBirth",
                "student.personalInfo.highSchoolGWA",
                "student.personalInfo.heightM",
                "student.personalInfo.weightKg",
                "student.personalInfo.complexion",
              ].includes(field),
          );
        } else if (sectionIndex === 3) {
          allowed = allowed.filter(
            (field) => field !== "student.personalInfo.telephoneNumber",
          );
        }
      }
      return calculateCompletionFromSchema(
        personalInformationValidationSchema,
        formData,
        allowed,
      );
    }

    case 5:
      // Education
      return calculateCompletionFromSchema(educationValidationSchema, formData);

    case 6:
    case 7:
    case 8:
    case 9: {
      // Family Background sub-steps
      let allowed = FAMILY_SUBSTEP_FIELDS[sectionIndex - 5];
      if (isEditMode && sectionIndex === 9) {
        allowed = allowed.filter((field) =>
          field.startsWith("family.relatedPersons.2.")
        );
      }
      return calculateCompletionFromSchema(
        familyValidationSchema,
        formData,
        allowed,
      );
    }

    case 10: {
      // Health Information
      // Helper to map consultations by type for easy access in rules
      const _consultations = (formData.health?.consultations || []).reduce(
        (acc: any, c: any) => {
          acc[c.professionalType] = c;
          return acc;
        },
        {},
      );
      return calculateCompletionFromSchema(healthValidationSchema, {
        ...formData,
        _consultations,
      });
    }

    case 11:
      // Interests and Hobbies
      return calculateCompletionFromSchema(interestsValidationSchema, formData);

    default:
      return 0;
  }
}
