/**
 * Payload transformation utilities for IIR Form
 * Converts frontend form state to backend DTO format
 */

import {
  IIRForm,
  StudentAddress,
  SchoolDetails,
  RelatedPerson,
  ConsultationRecord,
  Activity,
  SubjectPreference,
  Hobby,
} from "../../types";

/**
 * Validates that numeric string fields contain valid numbers
 * Returns array of error messages for invalid fields
 */
export function validateNumericFields(formData: IIRForm): string[] {
  const errors: string[] = [];

  const { heightM, weightKg, highSchoolGWA, section } =
    formData.student.personalInfo;

  if (isNaN(parseFloat(heightM)) || parseFloat(heightM) <= 0) {
    errors.push("Height must be a valid positive number");
  }
  if (isNaN(parseFloat(weightKg)) || parseFloat(weightKg) <= 0) {
    errors.push("Weight must be a valid positive number");
  }
  if (isNaN(parseFloat(highSchoolGWA)) || parseFloat(highSchoolGWA) <= 0) {
    errors.push("High School GWA must be a valid positive number");
  }
  if (isNaN(parseInt(section, 10)) || parseInt(section, 10) <= 0) {
    errors.push("Section must be a valid positive number");
  }

  const { weeklyAllowance } = formData.family.finance;
  if (isNaN(parseFloat(weeklyAllowance)) || parseFloat(weeklyAllowance) < 0) {
    errors.push("Weekly allowance must be a valid number");
  }

  formData.education.schools.forEach((school: SchoolDetails, index: number) => {
    if (
      school.yearStarted &&
      (isNaN(parseInt(school.yearStarted, 10)) ||
        parseInt(school.yearStarted, 10) <= 0)
    ) {
      errors.push(`School ${index + 1}: Year started must be a valid number`);
    }
    if (
      isNaN(parseInt(school.yearCompleted, 10)) ||
      parseInt(school.yearCompleted, 10) <= 0
    ) {
      errors.push(`School ${index + 1}: Year completed must be a valid number`);
    }
  });

  return errors;
}

/**
 * Transforms frontend IIR form data to backend payload format
 * Handles type conversions:
 * - String numbers to actual numbers (heightM, weightKg, etc.)
 * - Empty strings to null for nullable fields
 * - Date formatting to ISO 8601
 * - Activity structure (single activityOption, not array)
 * - Hobby priorityRank (not priorityRanking)
 */
export function transformFormToPayload(formData: IIRForm): any {
  return {
    iirId: formData.id ?? "",
    isCompleted: formData.isCompleted ?? true,
    student: {
      basicInfo: {
        email: formData.student.basicInfo.email,
        firstName: formData.student.basicInfo.firstName,
        middleName: handleNullableString(formData.student.basicInfo.middleName),
        lastName: formData.student.basicInfo.lastName,
      },
      personalInfo: {
        id: formData.student.personalInfo.id,
        iirId: formData.id,
        studentNumber: formData.student.personalInfo.studentNumber,
        gender: formData.student.personalInfo.gender,
        civilStatus: formData.student.personalInfo.civilStatus,
        religion: formData.student.personalInfo.religion,
        otherReligionText: handleNullableString(
          formData.student.personalInfo.otherReligionText,
        ),
        twoByTwoPhotoDataUrl:
          formData.student.personalInfo.twoByTwoPhotoDataUrl || undefined,
        heightM: parseNumberSafely(formData.student.personalInfo.heightM),
        weightKg: parseNumberSafely(formData.student.personalInfo.weightKg),
        complexion: formData.student.personalInfo.complexion,
        highSchoolGWA: parseNumberSafely(
          formData.student.personalInfo.highSchoolGWA,
        ),
        program: formData.student.personalInfo.program,
        yearLevel: formData.student.personalInfo.yearLevel,
        section: parseNumberSafely(formData.student.personalInfo.section),
        placeOfBirth: formData.student.personalInfo.placeOfBirth,
        dateOfBirth: formatDateForBackend(
          formData.student.personalInfo.dateOfBirth,
        ),
        isEmployed: formData.student.personalInfo.isEmployed,
        employerName: handleNullableString(
          formData.student.personalInfo.employerName,
        ),
        employerAddress: handleNullableString(
          formData.student.personalInfo.employerAddress,
        ),
        mobileNumber: formData.student.personalInfo.mobileNumber,
        telephoneNumber: handleNullableString(
          formData.student.personalInfo.telephoneNumber,
        ),
        employerContactNumber: handleNullableString(
          formData.student.personalInfo.employerContactNumber,
        ),

        emergencyContact: {
          id: formData.student.personalInfo.emergencyContact.id,
          firstName: formData.student.personalInfo.emergencyContact.firstName,
          middleName: handleNullableString(
            formData.student.personalInfo.emergencyContact.middleName,
          ),
          lastName: formData.student.personalInfo.emergencyContact.lastName,
          contactNumber:
            formData.student.personalInfo.emergencyContact.contactNumber,
          relationship:
            formData.student.personalInfo.emergencyContact.relationship,
          address: {
            ...formData.student.personalInfo.emergencyContact.address,
            regionCode: parseNullSafely(
              formData.student.personalInfo.emergencyContact.address.region
                ?.code,
            ),
            provinceCode: parseNullSafely(
              formData.student.personalInfo.emergencyContact.address.province
                ?.code,
            ),
            cityCode: parseNullSafely(
              formData.student.personalInfo.emergencyContact.address.city?.code,
            ),
            barangayCode: parseNullSafely(
              formData.student.personalInfo.emergencyContact.address.barangay
                ?.code,
            ),
          },
        },
      },
      addresses: (formData.student.addresses || []).map(
        (addr: StudentAddress, index: number) => ({
          id: addr.id,
          addressType: index === 0 ? "Provincial" : "Residential",
        address: {
          ...addr.address,
          regionCode: parseNullSafely(addr.address.region?.code),
          provinceCode: parseNullSafely(addr.address.province?.code),
          cityCode: parseNullSafely(addr.address.city?.code),
          barangayCode: parseNullSafely(addr.address.barangay?.code),
        },
      })),
    },
    education: {
      id: formData.education.id,
      natureOfSchooling: formData.education.natureOfSchooling,
      interruptedDetails: handleNullableString(
        formData.education.interruptedDetails,
      ),
      schools: (formData.education.schools || []).map((school: SchoolDetails) => ({
        id: school.id,
        educationalLevel: school.educationalLevel,
        schoolName: school.schoolName,
        schoolAddress: school.schoolAddress,
        schoolType: school.schoolType,
        yearStarted: parseNumberSafely(school.yearStarted),
        yearCompleted: parseNumberSafely(school.yearCompleted),
        awards: handleNullableString(school.awards),
      })),
    },
    family: {
      background: {
        id: formData.family.background.id,
        parentalStatus: formData.family.background.parentalStatus,
        parentalStatusDetails: handleNullableString(
          formData.family.background.parentalStatusDetails,
        ),
        brothers: parseNumberSafely(formData.family.background.brothers),
        sisters: parseNumberSafely(formData.family.background.sisters),
        employedSiblings: parseNumberSafely(
          formData.family.background.employedSiblings,
        ),
        ordinalPosition: parseNumberSafely(
          formData.family.background.ordinalPosition,
        ),
        haveQuietPlaceToStudy: formData.family.background.haveQuietPlaceToStudy,
        siblingSupportTypes: formData.family.background.siblingSupportTypes,
        isSharingRoom: formData.family.background.isSharingRoom,
        roomSharingDetails: handleNullableString(
          formData.family.background.roomSharingDetails,
        ),
        natureOfResidence: formData.family.background.natureOfResidence,
      },
      relatedPersons: (formData.family.relatedPersons || []).map(
        (person: RelatedPerson, index: number) => {
          return {
            id: person.id,
            lastName: person.lastName,
            firstName: person.firstName,
            middleName: handleNullableString(person.middleName),
            dateOfBirth: person.dateOfBirth
              ? formatDateForBackend(person.dateOfBirth)
              : undefined,
            educationalAttainment: {
              id: person.educationalAttainment?.id || 0,
            },
            occupation: handleNullableString(person.occupation),
            employerName: handleNullableString(person.employerName),
            employerAddress: handleNullableString(person.employerAddress),
            relationship:
              person.relationship?.id && person.relationship.id > 0
                ? person.relationship
                : { id: index + 1 },
            isParent: index < 2 ? true : person.isParent,
            isGuardian: index === 2 ? true : person.isGuardian,
            isLiving: index === 2 ? true : person.isLiving,
          };
        },
      ),
      finance: {
        id: formData.family.finance.id,
        monthlyFamilyIncomeRange:
          formData.family.finance.monthlyFamilyIncomeRange,
        otherIncomeDetails: handleNullableString(
          formData.family.finance.otherIncomeDetails,
        ),
        financialSupportTypes: formData.family.finance.financialSupportTypes,
        weeklyAllowance: parseNumberSafely(
          formData.family.finance.weeklyAllowance,
        ),
      },
    },
    health: {
      healthRecord: {
        id: formData.health.healthRecord.id,
        visionHasProblem: formData.health.healthRecord.visionHasProblem,
        visionDetails: handleNullableString(
          formData.health.healthRecord.visionDetails,
        ),
        hearingHasProblem: formData.health.healthRecord.hearingHasProblem,
        hearingDetails: handleNullableString(
          formData.health.healthRecord.hearingDetails,
        ),
        speechHasProblem: formData.health.healthRecord.speechHasProblem,
        speechDetails: handleNullableString(
          formData.health.healthRecord.speechDetails,
        ),
        generalHealthHasProblem:
          formData.health.healthRecord.generalHealthHasProblem,
        generalHealthDetails: handleNullableString(
          formData.health.healthRecord.generalHealthDetails,
        ),
        mentalEmotionalHasProblem:
          !!formData.health.healthRecord.mentalEmotionalHasProblem,
        mentalEmotionalDetails: handleNullableString(
          formData.health.healthRecord.mentalEmotionalDetails,
        ),
      },
      consultations: (formData.health.consultations || []).map(
        (consultation: ConsultationRecord) => ({
          id: consultation.id,
          professionalType: consultation.professionalType,
          hasConsulted: consultation.hasConsulted,
          whenDate: handleNullableString(consultation.whenDate),
          forWhat: handleNullableString(consultation.forWhat),
        }),
      ),
    },
    interests: {
      activities: (formData.interests.activities || [])
        .filter(
          (activity: Activity) =>
            activity.activityOption &&
            activity.activityOption.id &&
            activity.activityOption.id !== 0,
        )
        .map((activity: Activity) => ({
          id: activity.id,
          activityOption: activity.activityOption,
          otherSpecification: handleNullableString(
            activity.otherSpecification,
          ),
          role: activity.role,
          roleSpecification: handleNullableString(
            activity.roleSpecification,
          ),
        })),
      subjectPreferences: (formData.interests.subjectPreferences || []).map(
        (pref: SubjectPreference) => ({
          id: pref.id,
          subjectName: pref.subjectName,
          isFavorite: pref.isFavorite,
        }),
      ),
      hobbies: (formData.interests.hobbies || []).map((hobby: Hobby) => ({
        id: hobby.id,
        hobbyName: hobby.hobbyName,
        priorityRank: hobby.priorityRank,
      })),
    },
  };
}

/**
 * Converts empty strings to null for nullable fields
 */
function handleNullableString(value: string | null | undefined): string | null {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }
  return String(value);
}

/**
 * Safely parses a given entity into a continuous scalar skipping empty.
 */
function parseNumberSafely(
  val: string | number | null | undefined,
): number | undefined {
  if (val === null || val === undefined || val === "") return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}

/**
 * Converts empty strings to null for nullable fields
 */
function parseNullSafely(val: string | null | undefined): string | null {
  return val && String(val).trim() !== "" ? val : null;
}

/**
 * Formats a date for backend submission (ISO 8601)
 */
function formatDateForBackend(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

// Export legacy function name for backward compatibility
export const transformFormToDTO = transformFormToPayload;

