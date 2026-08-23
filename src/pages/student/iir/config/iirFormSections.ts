export type IIRFormSection = {
  title: string;
  id: number;
  key: string;
  main: number;
};

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

export function getActiveIIRSections(isEditMode: boolean) {
  return FORM_SECTIONS;
}
