import { describe, it, expect } from "vitest";
import {
  checkIIRPrintEligibility,
  MISSING_ELEMENTARY,
  MISSING_BOTH_PARENTS,
  MISSING_FATHER,
  MISSING_MOTHER,
} from "./printEligibility";
import { IIRForm } from "../types";

describe("checkIIRPrintEligibility", () => {
  const completeProfile: IIRForm = {
    student: {} as any,
    health: {} as any,
    interests: {} as any,
    education: {
      natureOfSchooling: "Continuous",
      interruptedDetails: null,
      schools: [
        {
          educationalLevel: { id: 1, name: "Elementary" },
          schoolName: "PUP Lab Elementary",
          schoolAddress: "Sta. Mesa",
          schoolType: "Public",
          yearStarted: "2010",
          yearCompleted: "2016",
          awards: "",
        },
      ],
    },
    family: {
      background: {} as any,
      finance: {} as any,
      relatedPersons: [
        {
          firstName: "Juan",
          lastName: "Dela Cruz",
          middleName: null,
          dateOfBirth: "1970-01-01",
          educationalAttainment: { id: 1, name: "College Graduate" },
          occupation: "Driver",
          employerName: null,
          employerAddress: null,
          relationship: { id: 1, name: "Father" },
          isParent: true,
          isGuardian: false,
          isLiving: true,
        },
        {
          firstName: "Maria",
          lastName: "Dela Cruz",
          middleName: null,
          dateOfBirth: "1972-02-02",
          educationalAttainment: { id: 1, name: "College Graduate" },
          occupation: "Teacher",
          employerName: null,
          employerAddress: null,
          relationship: { id: 2, name: "Mother" },
          isParent: true,
          isGuardian: false,
          isLiving: true,
        },
      ],
    },
  };

  it("allows printing when Elementary, Father, and Mother are present", () => {
    const result = checkIIRPrintEligibility(completeProfile);
    expect(result.isPrintDisabled).toBe(false);
    expect(result.hasElementary).toBe(true);
    expect(result.hasFather).toBe(true);
    expect(result.hasMother).toBe(true);
    expect(result.missingFields).toHaveLength(0);
    expect(result.tooltip).toBe("Download PDF");
  });

  it("disables printing and reports missing Elementary", () => {
    const profile: IIRForm = {
      ...completeProfile,
      education: {
        ...completeProfile.education,
        schools: [
          {
            educationalLevel: { id: 2, name: "Junior High School" },
            schoolName: "PUP High",
            schoolAddress: "Sta. Mesa",
            schoolType: "Public",
            yearStarted: "2016",
            yearCompleted: "2020",
            awards: "",
          },
        ],
      },
    };
    const result = checkIIRPrintEligibility(profile);
    expect(result.isPrintDisabled).toBe(true);
    expect(result.hasElementary).toBe(false);
    expect(result.missingFields).toContain(MISSING_ELEMENTARY);
    expect(result.tooltip).toContain(MISSING_ELEMENTARY);
  });

  it("disables printing and specifically reports missing Father", () => {
    const profile: IIRForm = {
      ...completeProfile,
      family: {
        ...completeProfile.family,
        relatedPersons: [completeProfile.family.relatedPersons[1]], // Mother only
      },
    };
    const result = checkIIRPrintEligibility(profile);
    expect(result.isPrintDisabled).toBe(true);
    expect(result.hasFather).toBe(false);
    expect(result.hasMother).toBe(true);
    expect(result.missingFields).toContain(MISSING_FATHER);
    expect(result.missingFields).not.toContain(MISSING_MOTHER);
    expect(result.tooltip).toContain(MISSING_FATHER);
  });

  it("disables printing and specifically reports missing Mother", () => {
    const profile: IIRForm = {
      ...completeProfile,
      family: {
        ...completeProfile.family,
        relatedPersons: [completeProfile.family.relatedPersons[0]], // Father only
      },
    };
    const result = checkIIRPrintEligibility(profile);
    expect(result.isPrintDisabled).toBe(true);
    expect(result.hasFather).toBe(true);
    expect(result.hasMother).toBe(false);
    expect(result.missingFields).toContain(MISSING_MOTHER);
    expect(result.missingFields).not.toContain(MISSING_FATHER);
    expect(result.tooltip).toContain(MISSING_MOTHER);
  });

  it("disables printing and reports missing both Father and Mother", () => {
    const profile: IIRForm = {
      ...completeProfile,
      family: {
        ...completeProfile.family,
        relatedPersons: [],
      },
    };
    const result = checkIIRPrintEligibility(profile);
    expect(result.isPrintDisabled).toBe(true);
    expect(result.hasFather).toBe(false);
    expect(result.hasMother).toBe(false);
    expect(result.missingFields).toContain(MISSING_BOTH_PARENTS);
  });

  it("reports missing Elementary AND missing parents together", () => {
    const profile: IIRForm = {
      ...completeProfile,
      education: { ...completeProfile.education, schools: [] },
      family: { ...completeProfile.family, relatedPersons: [] },
    };
    const result = checkIIRPrintEligibility(profile);
    expect(result.isPrintDisabled).toBe(true);
    expect(result.missingFields).toContain(MISSING_ELEMENTARY);
    expect(result.missingFields).toContain(MISSING_BOTH_PARENTS);
  });
});
