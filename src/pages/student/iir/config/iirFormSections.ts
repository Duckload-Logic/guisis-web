export type IIRFormSection = {
  title: string;
  id: number;
  key: string;
  main: number;
};

export interface MacroStage {
  id: number;
  title: string;
  shortTitle: string;
  description: string;
  sectionIds: number[];
}

export const FORM_SECTIONS: IIRFormSection[] = [
  { title: "Basic Info", id: 1, key: "personal_basic", main: 1 },
  { title: "Personal Profile", id: 2, key: "personal_profile", main: 1 },
  { title: "Address & Contact", id: 3, key: "personal_address", main: 1 },
  { title: "Employment", id: 4, key: "personal_employment", main: 1 },
  { title: "Educational Background", id: 5, key: "education", main: 2 },
  { title: "Home Environment", id: 6, key: "family_background", main: 3 },
  { title: "Father's Information", id: 7, key: "family_father", main: 3 },
  { title: "Mother's Information", id: 8, key: "family_mother", main: 3 },
  { title: "Guardian & Siblings", id: 9, key: "family_others", main: 3 },
  { title: "Health Information", id: 10, key: "health", main: 4 },
  { title: "Interests & Hobbies", id: 11, key: "interests", main: 5 },
];

export const MACRO_STAGES: MacroStage[] = [
  {
    id: 1,
    title: "Personal Information",
    shortTitle: "Personal",
    description: "Basic info, profile, address, and employment",
    sectionIds: [1, 2, 3, 4],
  },
  {
    id: 2,
    title: "Educational Background",
    shortTitle: "Education",
    description: "Academic history and qualifications",
    sectionIds: [5],
  },
  {
    id: 3,
    title: "Family Background",
    shortTitle: "Family",
    description: "Home environment, parents, and guardians",
    sectionIds: [6, 7, 8, 9],
  },
  {
    id: 4,
    title: "Health Information",
    shortTitle: "Health",
    description: "Physical health and medical history",
    sectionIds: [10],
  },
  {
    id: 5,
    title: "Interests & Hobbies",
    shortTitle: "Interests",
    description: "Extracurricular interests and leisure activities",
    sectionIds: [11],
  },
];

export function getActiveIIRSections(_isEditMode?: boolean) {
  return FORM_SECTIONS;
}

export function getStageForSection(sectionId: number): MacroStage {
  const found = MACRO_STAGES.find((s) => s.sectionIds.includes(sectionId));
  return found || MACRO_STAGES[0];
}

export function getSectionById(sectionId: number): IIRFormSection | undefined {
  return FORM_SECTIONS.find((s) => s.id === sectionId);
}

export function getNextSection(
  currentSectionId: number,
  sections: IIRFormSection[] = FORM_SECTIONS,
): IIRFormSection | undefined {
  const currentIndex = sections.findIndex((s) => s.id === currentSectionId);
  if (currentIndex >= 0 && currentIndex < sections.length - 1) {
    return sections[currentIndex + 1];
  }
  return undefined;
}
