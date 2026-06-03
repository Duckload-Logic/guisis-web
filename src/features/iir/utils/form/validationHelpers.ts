/**
 * Validation helper utilities for IIR Form
 * Extracted from IIRForm component
 */


export interface SectionValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ValidationSummary {
  hasErrors: boolean;
  errorMessages: string[];
  sectionsWithErrors: number[];
  incompleteCompletionSections: number[];
  incompleteCompletionMessages: string[];
  rawErrors: Record<string, string>;
}

/**
 * Validates all sections and returns a summary
 * @param sectionRefs - Object containing refs to all section components
 * @param formSections - Array of form section definitions
 * @param calculateSectionCompletion - Function to calculate section completion
 * @param currentSection - Current active section
 * @returns Validation summary
 */
export function validateAllSections(
  sectionRefs: Record<number, any>,
  formSections: Array<{ title: string; id: number; key: string }>,
  calculateSectionCompletion: (sectionIndex: number) => number,
  currentSection: number,
): ValidationSummary {
  const result: ValidationSummary = {
    hasErrors: false,
    errorMessages: [],
    sectionsWithErrors: [],
    incompleteCompletionSections: [],
    incompleteCompletionMessages: [],
    rawErrors: {},
  };

  for (const sec of formSections) {
    const i = sec.id;
    const sectionRef = sectionRefs[i];

    // Validate fields strictly to pull out raw field errors
    if (sectionRef?.current?.validate) {
      // Pass the current index 'i' as the specific sub-step to validate
      // For PersonalSection (1-4), it will validate sub-steps 1, 2, 3, 4
      // For FamilySection (6-9), we need to pass the relative sub-step
      const stepToValidate = i >= 6 && i <= 9 ? i - 5 : i;
      const validation = sectionRef.current.validate(stepToValidate);
      if (!validation.isValid) {
        result.hasErrors = true;
        if (!result.sectionsWithErrors.includes(i)) {
          result.sectionsWithErrors.push(i);
        }
        Object.assign(result.rawErrors, validation.errors);
      }
    }

    // Also check completion
    const completion = calculateSectionCompletion(i);
    if (completion < 100) {
      result.incompleteCompletionSections.push(i);
      result.incompleteCompletionMessages.push(
        `${sec.title} — ${completion}% complete (required 100%)`,
      );

      if (!result.hasErrors) {
        result.hasErrors = true;
        if (!result.sectionsWithErrors.includes(i)) {
          result.sectionsWithErrors.push(i);
        }
      }
    }
  }

  return result;
}

/**
 * Validates a single section
 * @param sectionRef - Ref to the section component
 * @returns Validation result
 */
export function validateSection(sectionRef: any): SectionValidationResult {
  if (sectionRef?.current?.validate) {
    return sectionRef.current.validate();
  }
  return { isValid: true, errors: {} };
}
