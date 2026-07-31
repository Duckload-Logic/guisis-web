import { describe, it, expect } from "vitest";

// Re-implementation of Form.tsx's internal isFormValid logic
export const isAppointmentFormValid = (data: any): boolean => {
  return (
    !!data.whenDate &&
    !!data.timeSlot?.id &&
    !!data.appointmentCategory?.id &&
    !!data.reason?.trim()
  );
};

// Re-implementation of ConfirmModal and RescheduleModal reason validations
export const validateReason = (reason: string | null | undefined): boolean => {
  return !!reason && reason.trim().length > 0;
};

describe("Appointment validation logic", () => {
  describe("isFormValid", () => {
    it("should return true when all fields are present and valid", () => {
      const data = {
        whenDate: "2026-08-01",
        timeSlot: { id: 1 },
        appointmentCategory: { id: 2 },
        reason: "Need general counseling",
      };
      expect(isAppointmentFormValid(data)).toBe(true);
    });

    it("should return false if date is missing", () => {
      const data = {
        timeSlot: { id: 1 },
        appointmentCategory: { id: 2 },
        reason: "Need general counseling",
      };
      expect(isAppointmentFormValid(data)).toBe(false);
    });

    it("should return false if timeSlot id is missing", () => {
      const data = {
        whenDate: "2026-08-01",
        appointmentCategory: { id: 2 },
        reason: "Need general counseling",
      };
      expect(isAppointmentFormValid(data)).toBe(false);
    });

    it("should return false if category id is missing", () => {
      const data = {
        whenDate: "2026-08-01",
        timeSlot: { id: 1 },
        reason: "Need general counseling",
      };
      expect(isAppointmentFormValid(data)).toBe(false);
    });

    it("should return false if reason is empty or whitespace", () => {
      const data = {
        whenDate: "2026-08-01",
        timeSlot: { id: 1 },
        appointmentCategory: { id: 2 },
        reason: "    ",
      };
      expect(isAppointmentFormValid(data)).toBe(false);
    });
  });

  describe("modal reason validation", () => {
    it("should return true for valid reasons", () => {
      expect(validateReason("Sick leave")).toBe(true);
      expect(validateReason("  Personal reason  ")).toBe(true);
    });

    it("should return false for empty or whitespace reasons", () => {
      expect(validateReason("")).toBe(false);
      expect(validateReason("   ")).toBe(false);
      expect(validateReason(null)).toBe(false);
      expect(validateReason(undefined)).toBe(false);
    });
  });
});
