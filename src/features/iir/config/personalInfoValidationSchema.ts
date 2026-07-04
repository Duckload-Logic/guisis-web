/**
 * Validation schema for PersonalSection form
 * Defines all field validation rules declaratively
 */

import {
  FieldValidationSchema,
  commonRules,
} from "@/services/validationSchema";
import { COMPLEXIONS } from "../constants";

export const personalInformationValidationSchema: FieldValidationSchema = {
  // Basic Information
  "student.basicInfo.firstName": [
    commonRules.required("First name"),
    commonRules.minLength(2),
    commonRules.nameFormat(),
    commonRules.noSpecialChars("First name"),
  ],
  "student.basicInfo.lastName": [
    commonRules.required("Last name"),
    commonRules.minLength(2),
    commonRules.nameFormat(),
    commonRules.noSpecialChars("Last name"),
  ],
  "student.basicInfo.email": [
    commonRules.required("Email"),
    commonRules.email(),
  ],
  "student.personalInfo.twoByTwoPhotoDataUrl": [
    commonRules.required("2x2 profile photo"),
  ],

  // Personal Details
  "student.personalInfo.studentNumber": [
    commonRules.required("Student number"),
    commonRules.studentNumber(),
  ],
  "student.personalInfo.suffix": [commonRules.suffixFormat()],
  "student.personalInfo.dateOfBirth": [
    commonRules.required("Date of birth"),
    commonRules.validDate(),
  ],
  "student.personalInfo.placeOfBirth": [
    commonRules.required("Place of birth"),
    commonRules.minLength(2),
    commonRules.noSpecialChars("Place of birth"),
  ],
  "student.personalInfo.gender": [commonRules.required("Gender")],
  "student.personalInfo.civilStatus": [commonRules.required("Civil status")],
  "student.personalInfo.religion": [commonRules.required("Religion")],
  "student.personalInfo.otherReligionText": [
    {
      type: "required",
      validate: (val: any, root: any) => {
        const rel = root?.student?.personalInfo?.religion;
        if (rel?.name === "Others") {
          return val && String(val).trim().length > 0;
        }
        return true;
      },
      message: "Please specify your religion",
    },
    commonRules.noSpecialChars("Religion specification"),
  ],
  "student.personalInfo.course": [commonRules.required("Course")],
  "student.personalInfo.yearLevel": [
    commonRules.required("Year level"),
    commonRules.minValue(1),
    commonRules.maxValue(4),
  ],
  "student.personalInfo.section": [
    commonRules.required("Section"),
    commonRules.numeric(),
    commonRules.minValue(1),
    commonRules.maxValue(5),
  ],
  "student.personalInfo.complexion": [
    commonRules.required("Complexion"),
    commonRules.noSpecialChars("Complexion"),
    commonRules.minLength(2),
    commonRules.inList(COMPLEXIONS, "Complexion"),
    commonRules.complexionFormat(),
  ],
  "student.personalInfo.highSchoolGWA": [
    commonRules.required("High school GWA"),
    commonRules.numeric(),
    commonRules.minValue(60),
    commonRules.maxValue(100),
  ],
  "student.personalInfo.heightM": [
    commonRules.required("Height"),
    commonRules.positiveNumber(),
    commonRules.maxValue(8),
    commonRules.decimalPlaces(2),
  ],
  "student.personalInfo.weightKg": [
    commonRules.required("Weight"),
    commonRules.positiveNumber(),
    commonRules.maxValue(300),
    commonRules.decimalPlaces(2),
  ],
  "student.personalInfo.mobileNumber": [
    commonRules.required("Mobile number"),
    commonRules.phone(),
  ],
  "student.personalInfo.telephoneNumber": [commonRules.telephone()],
  "student.personalInfo.isEmployed": [
    {
      type: "required",
      validate: (value: any) => value !== undefined && value !== null,
      message: "Please indicate if you are currently employed",
    },
  ],
  "student.personalInfo.employerName": [
    {
      type: "required",
      validate: (value: any, rootData: any) => {
        if (rootData?.student?.personalInfo?.isEmployed === true) {
          return value && String(value).trim().length > 0;
        }
        return true;
      },
      message: "Employer name is required if employed",
    },
    commonRules.noSpecialChars("Employer name"),
  ],
  "student.personalInfo.employerAddress": [
    {
      type: "required",
      validate: (value: any, rootData: any) => {
        if (rootData?.student?.personalInfo?.isEmployed === true) {
          return value && String(value).trim().length > 0;
        }
        return true;
      },
      message: "Employer address is required if employed",
    },
  ],
  "student.personalInfo.employerContactNumber": [commonRules.phone()],

  // Emergency Contact
  "student.personalInfo.emergencyContact.firstName": [
    commonRules.required("Emergency contact first name"),
    commonRules.minLength(2),
    commonRules.nameFormat(),
  ],
  "student.personalInfo.emergencyContact.lastName": [
    commonRules.required("Emergency contact last name"),
    commonRules.minLength(2),
    commonRules.nameFormat(),
  ],
  "student.personalInfo.emergencyContact.contactNumber": [
    commonRules.required("Emergency contact number"),
    commonRules.phone(),
  ],
  "student.personalInfo.emergencyContact.relationship": [
    commonRules.required("Relationship"),
  ],
  "student.personalInfo.emergencyContact.address.region": [
    commonRules.required("Region (Emergency)"),
  ],
  "student.personalInfo.emergencyContact.address.province": [
    {
      type: "required",
      validate: (value: any, rootData: any) => {
        const regionCode =
          rootData?.student?.personalInfo?.emergencyContact?.address?.region
            ?.code;
        if (regionCode && String(regionCode) !== "1300000000") {
          return (
            (value?.id !== undefined && value?.id !== "") ||
            (value?.code !== undefined && value?.code !== "")
          );
        }
        return true;
      },
      message: "Province (Emergency) is required",
    },
  ],
  "student.personalInfo.emergencyContact.address.city": [
    commonRules.required("City/Municipality (Emergency)"),
  ],
  "student.personalInfo.emergencyContact.address.barangay": [
    commonRules.required("Barangay (Emergency)"),
  ],

  // Addresses – Provincial
  "student.addresses.0.address.region": [
    commonRules.required("Region (Provincial)"),
  ],
  "student.addresses.0.address.province": [
    {
      type: "required",
      validate: (value: any, rootData: any) => {
        const regionCode =
          rootData?.student?.addresses?.[0]?.address?.region?.code;
        if (regionCode && String(regionCode) !== "1300000000") {
          return (
            (value?.id !== undefined && value?.id !== "") ||
            (value?.code !== undefined && value?.code !== "")
          );
        }
        return true;
      },
      message: "Province (Provincial) is required",
    },
  ],
  "student.addresses.0.address.city": [
    commonRules.required("City/Municipality (Provincial)"),
  ],
  "student.addresses.0.address.barangay": [
    commonRules.required("Barangay (Provincial)"),
  ],
  "student.addresses.0.address.streetDetail": [
    commonRules.noSpecialChars("Street (Provincial)"),
  ],

  // Addresses – Residential
  "student.addresses.1.address.region": [
    commonRules.required("Region (Permanent)"),
  ],
  "student.addresses.1.address.province": [
    {
      type: "required",
      validate: (value: any, rootData: any) => {
        const regionCode =
          rootData?.student?.addresses?.[1]?.address?.region?.code;
        if (regionCode && String(regionCode) !== "1300000000") {
          return (
            (value?.id !== undefined && value?.id !== "") ||
            (value?.code !== undefined && value?.code !== "")
          );
        }
        return true;
      },
      message: "Province (Permanent) is required",
    },
  ],
  "student.addresses.1.address.city": [
    commonRules.required("City/Municipality (Permanent)"),
  ],
  "student.addresses.1.address.barangay": [
    commonRules.required("Barangay (Permanent)"),
  ],
  "student.addresses.1.address.streetDetail": [
    commonRules.noSpecialChars("Street (Permanent)"),
  ],
};
