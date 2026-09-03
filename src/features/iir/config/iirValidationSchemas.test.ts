import { describe, it, expect } from "vitest";
import { validateObject } from "../../../services/validationSchema";
import { personalInformationValidationSchema } from "./personalInfoValidationSchema";
import { educationValidationSchema } from "./educationValidationSchema";
import { familyValidationSchema } from "./familyValidationSchema";
import { healthValidationSchema } from "./healthValidationSchema";
import { interestsValidationSchema } from "./interestsValidationSchema";
import { COMPLETE_IIR_FORM } from "../constants";

const getValidSchools = () => [
  {
    schoolName: "Elem School",
    schoolAddress: "Address",
    schoolType: "Public",
    yearStarted: "2008",
    yearCompleted: "2014",
  },
  {
    schoolName: "Junior HS",
    schoolAddress: "Address",
    schoolType: "Public",
    yearStarted: "2014",
    yearCompleted: "2018",
  },
  {
    schoolName: "Senior HS",
    schoolAddress: "Address",
    schoolType: "Public",
    yearStarted: "2018",
    yearCompleted: "2020",
  },
  {
    schoolName: "",
    schoolAddress: "",
    schoolType: "",
    yearStarted: "",
    yearCompleted: "",
  },
  {
    schoolName: "",
    schoolAddress: "",
    schoolType: "",
    yearStarted: "",
    yearCompleted: "",
  },
];

describe("iirValidationSchemas", () => {
  describe("personalInformationValidationSchema", () => {
    it("should pass for a valid personal info form", () => {
      const data = {
        ...COMPLETE_IIR_FORM,
        student: {
          ...COMPLETE_IIR_FORM.student,
          personalInfo: {
            ...COMPLETE_IIR_FORM.student.personalInfo,
            twoByTwoPhotoDataUrl: "data:image/png;base64,123",
          },
        },
      };
      const errors = validateObject(
        data,
        personalInformationValidationSchema,
      );
      expect(Object.keys(errors).length).toBe(0);
    });

    it("should fail for invalid student number format", () => {
      const data = {
        student: {
          personalInfo: {
            studentNumber: "2022-00001",
          },
        },
      };
      const errors = validateObject(
        data,
        personalInformationValidationSchema,
      );
      expect(
        errors["student.personalInfo.studentNumber"],
      ).toContain("Format must be");
    });

    it("should fail for student number with year exceeding max academic year", () => {
      const futureYear = new Date().getFullYear() + 5;
      const data = {
        student: {
          personalInfo: {
            studentNumber: `${futureYear}-00001-TG-0`,
          },
        },
      };
      const errors = validateObject(
        data,
        personalInformationValidationSchema,
      );
      expect(
        errors["student.personalInfo.studentNumber"],
      ).toContain("Format must be");
    });

    it("should fail for future birthdate", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 5);
      const yyyy = futureDate.getFullYear();
      const mm = String(futureDate.getMonth() + 1).padStart(2, "0");
      const dd = String(futureDate.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const data = {
        student: {
          personalInfo: {
            dateOfBirth: dateStr,
          },
        },
      };
      const errors = validateObject(
        data,
        personalInformationValidationSchema,
      );
      expect(errors["student.personalInfo.dateOfBirth"]).toBe(
        "Must be a valid past or present date (since 1900)",
      );
    });
  });

  describe("educationValidationSchema", () => {
    it("should pass for valid schools sequence", () => {
      const data = {
        education: {
          natureOfSchooling: "Continuous",
          schools: getValidSchools(),
        },
      };
      const errors = validateObject(data, educationValidationSchema);
      expect(Object.keys(errors).length).toBe(0);
    });

    it("should fail if yearCompleted is before yearStarted", () => {
      const schools = getValidSchools();
      schools[1].yearStarted = "2014";
      schools[1].yearCompleted = "2008"; // completed before started

      const data = {
        education: {
          natureOfSchooling: "Continuous",
          schools,
        },
      };
      const errors = validateObject(data, educationValidationSchema);
      expect(errors["education.schools.1.yearCompleted"]).toBe(
        "Year completed cannot be before year started",
      );
    });

    it("should fail if JHS starts before Elem completed", () => {
      const schools = getValidSchools();
      schools[0].yearStarted = "2008";
      schools[0].yearCompleted = "2014";
      schools[1].yearStarted = "2013"; // JHS starts before Elem completed
      schools[1].yearCompleted = "2018";

      const data = {
        education: {
          natureOfSchooling: "Continuous",
          schools,
        },
      };
      const errors = validateObject(data, educationValidationSchema);
      expect(errors["education.schools.1.yearStarted"]).toBe(
        "Year started cannot overlap with previous school level",
      );
    });
  });

  describe("familyValidationSchema", () => {
    it("should pass for complete family information", () => {
      const data = {
        family: {
          ...COMPLETE_IIR_FORM.family,
          finance: {
            ...COMPLETE_IIR_FORM.family.finance,
            financialSupportTypes: [{ id: 1 }],
          },
        },
      };
      const errors = validateObject(data, familyValidationSchema);
      const filtered = Object.keys(errors).filter(
        (k) => !k.includes("relatedPersons.2"), // ignore guardian
      );
      expect(filtered.length).toBe(0);
    });

    it("should fail if employedSiblings exceeds total siblings", () => {
      const data = {
        family: {
          background: {
            brothers: 1,
            sisters: 1,
            employedSiblings: 3, // invalid!
          },
        },
      };
      const errors = validateObject(data, familyValidationSchema);
      expect(errors["family.background.employedSiblings"]).toBe(
        "Number of employed siblings cannot exceed total siblings",
      );
    });

    it("should fail if ordinalPosition exceeds total children", () => {
      const data = {
        family: {
          background: {
            brothers: 1,
            sisters: 1,
            ordinalPosition: 4, // 1 + 1 + 1 (student) = 3. 4 invalid!
          },
        },
      };
      const errors = validateObject(data, familyValidationSchema);
      expect(errors["family.background.ordinalPosition"]).toBe(
        "Ordinal position cannot exceed total number of children",
      );
    });
  });

  describe("healthValidationSchema", () => {
    it("should pass for basic health structure", () => {
      const data = {
        health: {
          healthRecord: {
            visionHasProblem: false,
            hearingHasProblem: false,
            speechHasProblem: false,
            generalHealthHasProblem: false,
            mentalEmotionalHasProblem: false,
          },
        },
        _consultations: {
          Psychiatrist: { hasConsulted: false },
          Psychologist: { hasConsulted: false },
          Counselor: { hasConsulted: false },
        },
      };
      const errors = validateObject(data, healthValidationSchema);
      expect(Object.keys(errors).length).toBe(0);
    });

    it("should require details if hasProblem is true", () => {
      const data = {
        health: {
          healthRecord: {
            visionHasProblem: false,
            hearingHasProblem: false,
            speechHasProblem: false,
            generalHealthHasProblem: false,
            mentalEmotionalHasProblem: true,
            mentalEmotionalDetails: "",
          },
        },
      };
      const errors = validateObject(data, healthValidationSchema);
      expect(errors["health.healthRecord.mentalEmotionalDetails"]).toBe(
        "Please specify the details",
      );
    });

    it("should fail on special chars when problem is true", () => {
      const data = {
        health: {
          healthRecord: {
            visionHasProblem: false,
            hearingHasProblem: false,
            speechHasProblem: false,
            generalHealthHasProblem: false,
            mentalEmotionalHasProblem: true,
            mentalEmotionalDetails: "Invalid % character",
          },
        },
      };
      const errors = validateObject(data, healthValidationSchema);
      expect(errors["health.healthRecord.mentalEmotionalDetails"]).toBe(
        "Mental health details contains invalid special characters",
      );
    });

    it("should ignore invalid details when hasProblem is false", () => {
      const data = {
        health: {
          healthRecord: {
            visionHasProblem: false,
            hearingHasProblem: false,
            speechHasProblem: false,
            generalHealthHasProblem: false,
            mentalEmotionalHasProblem: false,
            mentalEmotionalDetails: "Invalid % character",
          },
        },
      };
      const errors = validateObject(data, healthValidationSchema);
      expect(
        errors["health.healthRecord.mentalEmotionalDetails"],
      ).toBeUndefined();
    });
  });

  describe("interestsValidationSchema", () => {
    it("should pass for empty interests", () => {
      const data = {
        interests: {
          activities: [],
          subjectPreferences: [],
          hobbies: [],
        },
      };
      const errors = validateObject(data, interestsValidationSchema);
      expect(Object.keys(errors).length).toBe(0);
    });
  });
});
