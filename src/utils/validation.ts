/**
 * Centralized Validation Utilities
 * DRY validation logic for forms and fields
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// invalidate inputs with special characters
// Matches anything that is NOT: alphanumeric, space, period, comma, or hyphen
export const SPECIAL_CHARS_REGEX = /[^a-zA-Z0-9\s.,'"?!()\/ -]/;

/**
 * Checks if a string contains special characters
 */
export const hasSpecialCharacters = (value: string): boolean => {
  return SPECIAL_CHARS_REGEX.test(value);
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (Philippine format)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+63|0)?[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/[-\s]/g, ""));
};

// Password validation
export const isValidPassword = (password: string, minLength = 6): boolean => {
  return password.length >= minLength;
};

// Username validation
export const isValidUsername = (
  username: string,
  minLength = 3,
  maxLength = 50,
): boolean => {
  return username.length >= minLength && username.length <= maxLength;
};

// Date of birth validation
export const isValidDateOfBirth = (dateString: string): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!dateString) {
    errors.push({
      field: "dateOfBirth",
      message: "Date of birth is required",
    });
    return { isValid: false, errors };
  }

  const date = new Date(dateString);
  const today = new Date();

  if (date > today) {
    errors.push({
      field: "dateOfBirth",
      message: "Date of birth cannot be in the future",
    });
    return { isValid: false, errors };
  }

  const age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    // Age hasn't been reached this year yet
    const adjustedAge = age - 1;
    if (adjustedAge < 16) {
      errors.push({
        field: "dateOfBirth",
        message: "You must be at least 16 years old",
      });
      return { isValid: false, errors };
    }
  } else if (age < 16) {
    errors.push({
      field: "dateOfBirth",
      message: "You must be at least 16 years old",
    });
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
};

// Field validation (generic)
export const validateField = (
  fieldName: string,
  value: unknown,
): ValidationError | null => {
  switch (fieldName) {
    case "email":
      if (!isValidEmail(String(value))) {
        return {
          field: fieldName,
          message: "Invalid email address",
        };
      }
      break;

    case "phone":
    case "mobileNo":
    case "mobileNumber":
      if (!isValidPhone(String(value))) {
        return {
          field: fieldName,
          message: "Invalid phone number",
        };
      }
      break;

    case "password":
      if (!isValidPassword(String(value))) {
        return {
          field: fieldName,
          message: "Password must be at least 6 characters",
        };
      }
      break;

    case "username":
      if (!isValidUsername(String(value))) {
        return {
          field: fieldName,
          message: "Username must be 3-50 characters",
        };
      }
      break;

    default:
      return null;
  }

  return null;
};

// Batch validation
export const validateFields = (
  data: Record<string, unknown>,
  requiredFields: string[],
): ValidationResult => {
  const errors: ValidationError[] = [];

  requiredFields.forEach((field) => {
    const value = data[field];

    // Check if required field is empty
    if (value === "" || value === null || value === undefined) {
      errors.push({
        field,
        message: `${field} is required`,
      });
      return;
    }

    // Validate field-specific rules
    const fieldError = validateField(field, value);
    if (fieldError) {
      errors.push(fieldError);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Calculate form completion
export const calculateFormCompletion = (
  formData: Record<string, unknown>,
  totalFields: number,
): number => {
  if (totalFields === 0) return 0;

  const filledFields = Object.values(formData).filter(
    (value) => value !== "" && value !== null && value !== undefined,
  ).length;

  return Math.round((filledFields / totalFields) * 100);
};

// Format validation errors for display
export const formatErrorMessage = (error: ValidationError): string => {
  return `${error.field}: ${error.message}`;
};
