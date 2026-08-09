import {
  FieldValidationSchema,
  commonRules,
} from "@/services/validationSchema";

export const interestsValidationSchema: FieldValidationSchema = {
  "interests.hobbies.0.hobbyName": [commonRules.noSpecialChars("First hobby")],
  "interests.hobbies.1.hobbyName": [commonRules.noSpecialChars("Second hobby")],
  "interests.hobbies.2.hobbyName": [commonRules.noSpecialChars("Third hobby")],
  "interests.hobbies.3.hobbyName": [
    commonRules.noSpecialChars("Fourth hobby"),
  ],
  "interests.subjectPreferences.0.subjectName": [
    commonRules.noSpecialChars("First favorite"),
  ],
  "interests.subjectPreferences.1.subjectName": [
    commonRules.noSpecialChars("Second favorite"),
  ],
  "interests.subjectPreferences.2.subjectName": [
    commonRules.noSpecialChars("Third favorite"),
  ],
  "interests.subjectPreferences.3.subjectName": [
    commonRules.noSpecialChars("First least liked"),
  ],
  "interests.subjectPreferences.4.subjectName": [
    commonRules.noSpecialChars("Second least liked"),
  ],
  "interests.subjectPreferences.5.subjectName": [
    commonRules.noSpecialChars("Third least liked"),
  ],
};
