/**
 * Validation schemas for IIR Form
 * Uses Zod for runtime validation
 */

import { z } from "zod";
import { COMPLEXIONS } from "../../constants";

/**
 * Helper validator for numeric string fields
 */
const numericString = z
  .string()
  .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Must be a positive number",
  });

/**
 * Helper validator for optional numeric string fields
 */
const optionalNumericString = z
  .string()
  .refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) > 0), {
    message: "Must be a positive number or empty",
  });

/**
 * Helper validator for date strings
 */
const dateString = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" });

/**
 * Helper validator for optional date strings
 */
const optionalDateString = z
  .string()
  .refine((val) => val === "" || !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  })
  .optional();

/**
 * Address validation schema
 */
const addressSchema = z.object({
  id: z.number().optional(),
  region: z.object({
    id: z.number(),
    name: z.string().optional(),
  }),
  city: z.object({
    id: z.number(),
    name: z.string().optional(),
    regionId: z.number().optional(),
  }),
  barangay: z.object({
    id: z.number(),
    name: z.string().optional(),
    cityId: z.number().optional(),
  }),
  streetDetail: z.string().optional().nullable(),
});

/**
 * Emergency contact validation schema
 */
const emergencyContactSchema = z.object({
  id: z.number().optional(),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().nullable(),
  lastName: z.string().min(1, "Last name is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  relationship: z.object({
    id: z.number(),
    name: z.string().optional(),
  }),
  address: addressSchema,
});

/**
 * Basic info validation schema
 */
const basicInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().nullable(),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

/**
 * Personal info validation schema
 */
const personalInfoSchema = z.object({
  id: z.number().optional(),
  studentNumber: z.string().min(1, "Student number is required"),
  gender: z.object({
    id: z.number(),
    name: z.string().optional(),
  }),
  civilStatus: z.object({
    id: z.number(),
    name: z.string().optional(),
  }),
  religion: z.object({
    id: z.number(),
    name: z.string().optional(),
  }),
  heightM: numericString,
  weightKg: numericString,
  complexion: z.string().refine(
    (val) => COMPLEXIONS.some((c) => c.toLowerCase() === val.toLowerCase()),
    { message: `Must be one of: ${COMPLEXIONS.join(", ")}` },
  ),
  highSchoolGWA: numericString,
  course: z.object({
    id: z.number(),
    name: z.string().optional(),
    code: z.string().optional(),
  }),
  yearLevel: z.number().min(1, "Year level is required"),
  section: numericString,
  dateOfBirth: dateString,
  placeOfBirth: z.string().min(1, "Place of birth is required"),
  mobileNumber: z.string().min(1, "Mobile number is required"),
  telephoneNumber: z.string().nullable(),
  isEmployed: z.boolean(),
  employerName: z.string().nullable(),
  employerAddress: z.string().nullable(),
  employerContactNumber: z.string().nullable(),

  emergencyContact: emergencyContactSchema,
});

/**
 * Student address validation schema
 */
const studentAddressSchema = z.object({
  id: z.number().optional(),
  addressType: z.string().min(1, "Address type is required"),
  address: addressSchema,
});

/**
 * School details validation schema
 */
const schoolDetailsSchema = z.object({
  id: z.number().optional(),
  educationalLevel: z.object({
    id: z.number(),
    name: z.string().optional(),
  }),
  schoolName: z.string().min(1, "School name is required"),
  schoolAddress: z.string(),
  schoolType: z.string().min(1, "School type is required"),
  yearStarted: optionalNumericString,
  yearCompleted: numericString,
  awards: z.string(),
});

/**
 * Education section validation schema
 */
const educationSchema = z.object({
  id: z.number().optional(),
  natureOfSchooling: z.string().min(1, "Nature of schooling is required"),
  interruptedDetails: z.string().nullable(),
  schools: z
    .array(schoolDetailsSchema)
    .min(1, "At least one school is required"),
});

/**
 * Family background validation schema
 */
const familyBackgroundSchema = z.object({
  id: z.number().optional(),
  parentalStatus: z.object({
    id: z.number(),
    name: z.string().optional(),
  }),
  parentalStatusDetails: z.string().nullable(),
  brothers: z.number().min(0, "Must be 0 or greater"),
  sisters: z.number().min(0, "Must be 0 or greater"),
  employedSiblings: z.number().min(0, "Must be 0 or greater"),
  ordinalPosition: z.number().min(1, "Must be 1 or greater"),
  haveQuietPlaceToStudy: z.boolean(),
  siblingSupportTypes: z.array(
    z.object({
      id: z.number(),
      name: z.string().optional(),
    }),
  ),
  isSharingRoom: z.boolean(),
  roomSharingDetails: z.string().nullable(),
  natureOfResidence: z.object({
    id: z.number(),
    name: z.string().optional(),
  }),
});

/**
 * Related person validation schema
 */
const relatedPersonSchema = z.object({
  id: z.number().optional(),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().nullable(),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string(),
  educationalAttainment: z.object({
    id: z.number().min(1, "Educational attainment is required"),
    name: z.string().optional(),
  }),
  occupation: z.string().nullable(),
  employerName: z.string().nullable(),
  employerAddress: z.string().nullable(),
  relationship: z.object({
    id: z.number(),
    name: z.string().optional(),
  }),
  isParent: z.boolean(),
  isGuardian: z.boolean(),
  isLiving: z.boolean(),
});

/**
 * Financial info validation schema
 */
const financialInfoSchema = z.object({
  id: z.number().optional(),
  monthlyFamilyIncomeRange: z.object({
    id: z.number(),
    text: z.string().optional(),
  }),
  otherIncomeDetails: z.string().nullable(),
  financialSupportTypes: z.array(
    z.object({
      id: z.number(),
      name: z.string().optional(),
    }),
  ),
  weeklyAllowance: numericString,
});

/**
 * Health record validation schema
 */
const healthRecordSchema = z.object({
  id: z.number().optional(),
  visionHasProblem: z.boolean(),
  visionDetails: z.string().nullable(),
  hearingHasProblem: z.boolean(),
  hearingDetails: z.string().nullable(),
  speechHasProblem: z.boolean(),
  speechDetails: z.string().nullable(),
  generalHealthHasProblem: z.boolean(),
  generalHealthDetails: z.string().nullable(),
  mentalEmotionalHasProblem: z.boolean(),
  mentalEmotionalDetails: z.string().nullable(),
});

/**
 * Consultation record validation schema
 */
const consultationRecordSchema = z.object({
  id: z.number().optional(),
  professionalType: z.string().min(1, "Professional type is required"),
  hasConsulted: z.boolean(),
  whenDate: z.string().nullable(),
  forWhat: z.string().nullable(),
});

/**
 * Activity validation schema
 */
const activitySchema = z.object({
  id: z.number().optional(),
  activityOptions: z.array(
    z.object({
      id: z.number(),
      name: z.string().optional(),
      category: z.string().optional(),
      isAcademic: z.boolean().optional(),
    }),
  ),
  role: z.string().min(1, "Role is required"),
});

/**
 * Subject preference validation schema
 */
const subjectPreferenceSchema = z.object({
  id: z.number().optional(),
  subjectName: z.string().min(1, "Subject name is required"),
  isFavorite: z.boolean(),
});

/**
 * Hobby validation schema
 */
const hobbySchema = z.object({
  id: z.number().optional(),
  hobbyName: z.string().min(1, "Hobby name is required"),
  priorityRanking: z.number().min(1, "Priority ranking is required"),
});

/**
 * Main IIR form validation schema
 */
export const iirFormSchema = z.object({
  id: z.number().optional(),
  student: z.object({
    basicInfo: basicInfoSchema,
    personalInfo: personalInfoSchema,
    addresses: z
      .array(studentAddressSchema)
      .min(1, "At least one address is required"),
  }),
  education: educationSchema,
  family: z.object({
    background: familyBackgroundSchema,
    relatedPersons: z.array(relatedPersonSchema),
    finance: financialInfoSchema,
  }),
  health: z.object({
    healthRecord: healthRecordSchema,
    consultations: z.array(consultationRecordSchema),
  }),
  interests: z.object({
    activities: z.array(activitySchema),
    subjectPreferences: z.array(subjectPreferenceSchema),
    hobbies: z.array(hobbySchema),
  }),
});

export type IIRFormData = z.infer<typeof iirFormSchema>;
