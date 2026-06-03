import {
  FieldValidationSchema,
  commonRules,
  ValidationRule,
} from "@/services/validationSchema";
export const requireAtLeastOne = (message: string): ValidationRule => ({
  type: "requireAtLeastOne",
  validate: (value: any) => {
    if (!value || typeof value !== "object") return false;
    return Object.values(value).some(Boolean);
  },
  message,
});
export const familyValidationSchema: FieldValidationSchema = {
  "family.background.parentalStatus": [
    {
      type: "required",
      validate: (value: any) => {
        return (
          value?.id !== undefined && value?.id !== null && value?.id !== ""
        );
      },
      message: "Parental status is required",
    },
  ],

  "family.background.roomSharingDetails": [
    {
      type: "required",
      validate: (value: any, rootData: any) => {
        if (rootData?.family?.background?.isSharingRoom === true) {
          return value && String(value).trim().length > 2;
        }
        return true;
      },
      message: "Please specify who you share a room with",
    },
    commonRules.noSpecialChars("Room sharing details"),
    commonRules.minLength(2),
    commonRules.maxLength(100),
  ],

  "family.finance.monthlyFamilyIncomeRange": [
    {
      type: "required",
      validate: (value: any) => {
        return (
          value?.id !== undefined && value?.id !== null && value?.id !== ""
        );
      },
      message: "Monthly family income range is required",
    },
  ],
  "family.finance.monthlyFamilyIncomeRange.otherSpecification": [
    {
      type: "required",
      validate: (value: any, rootData: any) => {
        if (
          rootData?.family?.finance?.monthlyFamilyIncomeRange?.id === "others"
        ) {
          return value && String(value).trim().length > 0;
        }
        return true;
      },
      message: "Please specify the income range",
    },
    commonRules.noSpecialChars("Income range"),
  ],
  "family.finance.weeklyAllowance": [
    commonRules.required("Weekly allowance"),
    commonRules.positiveNumber(),
    commonRules.maxValue(50000),
  ],
  "family.background.brothers": [
    commonRules.required("Number of brothers"),
    commonRules.minValue(0),
  ],
  "family.background.sisters": [
    commonRules.required("Number of sisters"),
    commonRules.minValue(0),
  ],
  "family.background.employedSiblings": [
    commonRules.required("Number of gainfully employed"),
    commonRules.minValue(0),
    commonRules.siblingCount(
      "family.background.brothers",
      "family.background.sisters",
    ),
  ],
  "family.background.ordinalPosition": [
    commonRules.required("Ordinal position"),
    commonRules.minValue(1),
    commonRules.ordinalPosition(
      "family.background.brothers",
      "family.background.sisters",
    ),
  ],
  "family.background.haveQuietPlaceToStudy": [
    commonRules.required("Quiet place to study"),
  ],
  "family.background.isSharingRoom": [commonRules.required("Shares room")],
  "family.background.natureOfResidence": [
    {
      type: "required",
      validate: (value: any) => {
        return (
          value?.id !== undefined && value?.id !== null && value?.id !== ""
        );
      },
      message: "Nature of residence is required",
    },
  ],
  "family.finance.financialSupportTypes": [
    {
      type: "required",
      validate: (value: any) => {
        return Array.isArray(value) && value.length > 0;
      },
      message: "Please select at least one financing source",
    },
  ],
  "family.background.siblingSupportTypes": [],
};

// Add related persons (Father, Mother, Guardian)
const RELATIONS = [
  { prefix: "family.relatedPersons.0", label: "Father" },
  { prefix: "family.relatedPersons.1", label: "Mother" },
  { prefix: "family.relatedPersons.2", label: "Guardian" },
];

const isParentSectionEmpty = (person: any): boolean => {
  if (!person) return true;
  const isEduEmpty =
    !person.educationalAttainment ||
    person.educationalAttainment.id === undefined ||
    person.educationalAttainment.id === null ||
    Number(person.educationalAttainment.id) === 0;
  return (
    !person.firstName?.trim() &&
    !person.lastName?.trim() &&
    !person.middleName?.trim() &&
    !person.dateOfBirth?.trim() &&
    isEduEmpty &&
    (!person.occupation || person.occupation.trim() === "") &&
    !person.employerName?.trim() &&
    !person.employerAddress?.trim()
  );
};

const hasParentData = (rootData: any, idx: number) => {
  if (!rootData) return false;
  let person = rootData?.family?.relatedPersons?.[idx];
  if (!person && rootData?.relatedPersons) {
    person = rootData.relatedPersons[idx];
  }
  if (!person) return false;
  return !isParentSectionEmpty(person);
};

RELATIONS.forEach(({ prefix, label }, idx) => {
  familyValidationSchema[`${prefix}.firstName`] = [
    {
      type: "required",
      validate: (value: any, rootData: any) => {
        if ((idx === 0 || idx === 1) && !hasParentData(rootData, idx)) {
          return true;
        }
        return !!value && String(value).trim().length > 0;
      },
      message: `${label} first name is required`,
    },
    commonRules.minLength(2),
    commonRules.nameFormat(),
    commonRules.noSpecialChars(`${label} first name`),
  ];

  familyValidationSchema[`${prefix}.lastName`] = [
    {
      type: "required",
      validate: (value: any, rootData: any) => {
        if ((idx === 0 || idx === 1) && !hasParentData(rootData, idx)) {
          return true;
        }
        return !!value && String(value).trim().length > 0;
      },
      message: `${label} last name is required`,
    },
    commonRules.minLength(2),
    commonRules.nameFormat(),
    commonRules.noSpecialChars(`${label} last name`),
  ];

  familyValidationSchema[`${prefix}.middleName`] = [
    commonRules.nameFormat(),
    commonRules.noSpecialChars(`${label} middle name`),
  ];

  familyValidationSchema[`${prefix}.dateOfBirth`] = [
    {
      type: "required",
      validate: (value: any, rootData: any) => {
        if ((idx === 0 || idx === 1) && !hasParentData(rootData, idx)) {
          return true;
        }
        const person = rootData?.family?.relatedPersons?.[idx];
        if (idx === 0 || idx === 2 || person?.isLiving !== false) {
          return !!value && String(value).trim().length > 0;
        }
        return true;
      },
      message: `${label} date of birth is required`,
    },
    commonRules.validDate(),
  ];

  familyValidationSchema[`${prefix}.educationalAttainment`] = [
    {
      type: "required",
      validate: (value: any, rootData: any) => {
        if ((idx === 0 || idx === 1) && !hasParentData(rootData, idx)) {
          return true;
        }
        const person = rootData?.family?.relatedPersons?.[idx];
        const id = value?.id || value;
        if (idx === 0 || idx === 2 || person?.isLiving !== false) {
          return !!id && Number(id) > 0;
        }
        return true;
      },
      message: `${label} educational attainment is required`,
    },
  ];

  familyValidationSchema[`${prefix}.occupation`] = [
    {
      type: "required",
      validate: (value: any, rootData: any) => {
        if ((idx === 0 || idx === 1) && !hasParentData(rootData, idx)) {
          return true;
        }
        const person = rootData?.family?.relatedPersons?.[idx];
        if (idx === 0 || idx === 2 || person?.isLiving !== false) {
          return !!value && String(value).trim().length > 0;
        }
        return true;
      },
      message: `${label} occupation is required`,
    },
    commonRules.noSpecialChars(`${label} occupation`),
  ];

  familyValidationSchema[`${prefix}.employerName`] = [
    commonRules.noSpecialChars(`${label} employer name`),
  ];

  familyValidationSchema[`${prefix}.employerAddress`] = [
    commonRules.noSpecialChars(`${label} employer address`),
  ];

  if (idx !== 2) {
    familyValidationSchema[`${prefix}.isLiving`] = [
      {
        type: "required",
        validate: (value: any, rootData: any) => {
          if (!hasParentData(rootData, idx)) {
            return true;
          }
          return value !== undefined && value !== null && value !== "";
        },
        message: `${label} status (Living/Deceased) is required`,
      },
    ];
  }

  familyValidationSchema[`${prefix}.relationship`] = [
    {
      type: "required",
      validate: (value: any, rootData: any) => {
        if ((idx === 0 || idx === 1) && !hasParentData(rootData, idx)) {
          return true;
        }
        const id = value?.id || value;
        return !!id && Number(id) > 0;
      },
      message: `${label} relationship is required`,
    },
  ];
});
