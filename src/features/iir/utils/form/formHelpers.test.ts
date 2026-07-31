import { describe, it, expect } from "vitest";
import {
  updateNestedField,
  countFilledField,
  getOverallCompletion,
  getSectionStatus,
  createResetFormData,
  initializeFormData,
} from "./formHelpers";
import { EMPTY_IIR_FORM, COMPLETE_IIR_FORM } from "../../constants";

describe("formHelpers", () => {
  describe("updateNestedField", () => {
    it("should return the same data if path is empty", () => {
      const data = { test: 1 } as any;
      expect(updateNestedField(data, [], "value")).toBe(data);
    });

    it("should return null if data is null", () => {
      expect(updateNestedField(null, ["test"], "value")).toBeNull();
    });

    it("should update a nested field immutably", () => {
      const data = {
        student: { basicInfo: { firstName: "John" } },
      } as any;
      const updated = updateNestedField(
        data,
        ["student", "basicInfo", "firstName"],
        "Jane",
      );
      expect(updated?.student.basicInfo.firstName).toBe("Jane");
      expect(data.student.basicInfo.firstName).toBe("John");
    });

    it("should initialize arrays if key is numeric", () => {
      const data = {} as any;
      const updated = updateNestedField(
        data,
        ["schools", "0", "name"],
        "S1",
      ) as any;
      expect(Array.isArray(updated?.schools)).toBe(true);
      expect(updated?.schools[0].name).toBe("S1");
    });
  });

  describe("countFilledField", () => {
    it("should return false for falsy values", () => {
      expect(countFilledField(null)).toBe(false);
      expect(countFilledField(undefined)).toBe(false);
      expect(countFilledField("")).toBe(false);
    });

    it("should check arrays", () => {
      expect(countFilledField([])).toBe(false);
      expect(countFilledField([1])).toBe(true);
    });

    it("should check objects for valid ID", () => {
      expect(countFilledField({})).toBe(false);
      expect(countFilledField({ id: null })).toBe(false);
      expect(countFilledField({ id: "" })).toBe(false);
      expect(countFilledField({ id: 1 })).toBe(true);
    });

    it("should return true for basic values", () => {
      expect(countFilledField("hello")).toBe(true);
      expect(countFilledField(123)).toBe(true);
      expect(countFilledField(false)).toBe(true);
    });
  });

  describe("getOverallCompletion", () => {
    it("should return correct overall completion percentage", () => {
      const mockCalc = (idx: number) => {
        if (idx === 1) return 100;
        if (idx === 2) return 50;
        return 0;
      };
      const res = getOverallCompletion(null, 3, mockCalc);
      expect(res).toBe(50); // (100 + 50 + 0) / 3 = 50
    });
  });

  describe("getSectionStatus", () => {
    it("should return correct status based on percentage", () => {
      const mockCalc = (idx: number) => {
        if (idx === 1) return 100;
        if (idx === 2) return 40;
        return 0;
      };
      expect(getSectionStatus(1, mockCalc)).toBe("complete");
      expect(getSectionStatus(2, mockCalc)).toBe("partial");
      expect(getSectionStatus(3, mockCalc)).toBe("empty");
    });
  });

  describe("createResetFormData", () => {
    it("should clean form but keep user basic info", () => {
      const me = {
        firstName: "Jane",
        middleName: "Marie",
        lastName: "Doe",
        email: "jane@example.com",
      };
      const res = createResetFormData(EMPTY_IIR_FORM, me);
      expect(res.student.basicInfo.firstName).toBe("Jane");
      expect(res.student.basicInfo.middleName).toBe("Marie");
      expect(res.student.basicInfo.lastName).toBe("Doe");
      expect(res.student.basicInfo.email).toBe("jane@example.com");
      expect(res.education.natureOfSchooling).toBe("");
    });
  });

  describe("initializeFormData", () => {
    it("should fallback to me info if source is null", () => {
      const me = {
        firstName: "Jane",
        middleName: "Marie",
        lastName: "Doe",
        email: "jane@example.com",
      };
      const res = initializeFormData(null, EMPTY_IIR_FORM, me);
      expect(res.student.basicInfo.firstName).toBe("Jane");
      expect(res.student.basicInfo.email).toBe("jane@example.com");
    });

    it("should preserve existing basic info in edit mode", () => {
      const me = { firstName: "Jane" };
      const source: any = {
        ...COMPLETE_IIR_FORM,
        student: {
          ...COMPLETE_IIR_FORM.student,
          basicInfo: {
            firstName: "John",
            middleName: "A",
            lastName: "Smith",
            email: "john@example.com",
          },
        },
      };
      const res = initializeFormData(source, EMPTY_IIR_FORM, me, {
        preserveBasicInfoFromSource: true,
      });
      expect(res.student.basicInfo.firstName).toBe("John");
      expect(res.student.basicInfo.lastName).toBe("Smith");
    });

    it("should strip time component from ISO8601 birthdate string", () => {
      const source: any = {
        ...COMPLETE_IIR_FORM,
        student: {
          ...COMPLETE_IIR_FORM.student,
          personalInfo: {
            ...COMPLETE_IIR_FORM.student.personalInfo,
            dateOfBirth: "2000-01-01T00:00:00Z",
          },
        },
      };
      const res = initializeFormData(source, EMPTY_IIR_FORM, null);
      expect(res.student.personalInfo.dateOfBirth).toBe("2000-01-01");
    });

    it("should normalize year fields to blank if 0 or '0'", () => {
      const source: any = {
        ...COMPLETE_IIR_FORM,
        education: {
          ...COMPLETE_IIR_FORM.education,
          schools: [
            {
              educationalLevel: { id: 2 },
              yearStarted: 0,
              yearCompleted: "0",
              schoolName: "Elem",
            },
          ],
        },
      };
      const res = initializeFormData(source, EMPTY_IIR_FORM, null);
      const elemSchool = res.education.schools.find(
        (s) => s.educationalLevel.id === 2,
      );
      expect(elemSchool?.yearStarted).toBe("");
      expect(elemSchool?.yearCompleted).toBe("");
    });

    it("should correctly initialize parent/guardian index matching", () => {
      const source: any = {
        ...COMPLETE_IIR_FORM,
        family: {
          ...COMPLETE_IIR_FORM.family,
          relatedPersons: [
            {
              firstName: "MyFather",
              isParent: true,
              relationship: { id: 1, relationshipName: "Father" },
              isLiving: true,
            },
            {
              firstName: "MyMother",
              isParent: true,
              relationship: { id: 2, relationshipName: "Mother" },
              isLiving: true,
            },
            {
              firstName: "MyGuardian",
              isGuardian: true,
              relationship: { id: 3, relationshipName: "Aunt" },
              isLiving: true,
            },
          ],
        },
      };
      const res = initializeFormData(source, EMPTY_IIR_FORM, null);
      const father = res.family?.relatedPersons[0];
      const mother = res.family?.relatedPersons[1];
      const guardian = res.family?.relatedPersons[2];

      expect(father?.firstName).toBe("MyFather");
      expect(father?.isParent).toBe(true);
      expect(mother?.firstName).toBe("MyMother");
      expect(mother?.isParent).toBe(true);
      expect(guardian?.firstName).toBe("MyGuardian");
      expect(guardian?.isGuardian).toBe(true);
    });

    it("should fallback to empty arrays if elements are missing", () => {
      const source: any = {
        ...COMPLETE_IIR_FORM,
        student: {
          ...COMPLETE_IIR_FORM.student,
          addresses: null as any,
        },
        health: {
          ...COMPLETE_IIR_FORM.health,
          consultations: null as any,
        },
        interests: {
          activities: null as any,
          subjectPreferences: null as any,
          hobbies: null as any,
        },
      } as any;
      const res = initializeFormData(source, EMPTY_IIR_FORM, null);
      expect(res.student.addresses).toEqual([]);
      expect(res.health.consultations).toEqual([]);
      expect(res.interests.activities).toEqual([]);
    });
  });
});
