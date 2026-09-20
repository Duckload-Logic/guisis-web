import { IIRForm } from "../types";

export interface PrintEligibilityResult {
  hasElementary: boolean;
  hasFather: boolean;
  hasMother: boolean;
  missingFields: string[];
  isPrintDisabled: boolean;
  tooltip: string;
}

export const MISSING_ELEMENTARY =
  "Elementary School under Educational Background";
export const MISSING_BOTH_PARENTS =
  "Father and Mother information under Family Background";
export const MISSING_FATHER = "Father's information under Family Background";
export const MISSING_MOTHER = "Mother's information under Family Background";

export function checkIIRPrintEligibility(
  studentData?: IIRForm | null,
  isDownloading?: boolean,
): PrintEligibilityResult {
  if (!studentData) {
    return {
      hasElementary: false,
      hasFather: false,
      hasMother: false,
      missingFields: [],
      isPrintDisabled: true,
      tooltip: isDownloading ? "Generating PDF..." : "Loading record...",
    };
  }

  const hasElementary = Boolean(
    studentData.education?.schools?.some(
      (s) => s.educationalLevel?.name?.trim().toLowerCase() === "elementary",
    ),
  );

  const persons = studentData.family?.relatedPersons || [];

  const hasFather = persons.some((p) => {
    const relName = p.relationship?.name?.trim().toLowerCase();
    if (relName === "mother" || p.relationship?.id === 2) {
      return false;
    }
    const isFather =
      relName === "father" ||
      p.relationship?.id === 1 ||
      (p.isParent && (!relName || relName.includes("father")));
    const isNamed = Boolean(p.firstName?.trim() && p.lastName?.trim());
    return isFather && isNamed;
  });

  const hasMother = persons.some((p) => {
    const relName = p.relationship?.name?.trim().toLowerCase();
    if (relName === "father" || p.relationship?.id === 1) {
      return false;
    }
    const isMother =
      relName === "mother" ||
      p.relationship?.id === 2 ||
      (p.isParent && (!relName || relName.includes("mother")));
    const isNamed = Boolean(p.firstName?.trim() && p.lastName?.trim());
    return isMother && isNamed;
  });

  const missingFields: string[] = [];
  if (!hasElementary) {
    missingFields.push(MISSING_ELEMENTARY);
  }
  if (!hasFather && !hasMother) {
    missingFields.push(MISSING_BOTH_PARENTS);
  } else if (!hasFather) {
    missingFields.push(MISSING_FATHER);
  } else if (!hasMother) {
    missingFields.push(MISSING_MOTHER);
  }

  const isPrintDisabled = missingFields.length > 0;

  let tooltip = "Download PDF";
  if (isDownloading) {
    tooltip = "Generating PDF...";
  } else if (isPrintDisabled) {
    tooltip = `Printing disabled: Missing ${missingFields.join(" and ")}`;
  }

  return {
    hasElementary,
    hasFather,
    hasMother,
    missingFields,
    isPrintDisabled,
    tooltip,
  };
}
