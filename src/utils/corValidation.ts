export const ALLOWED_COR_EXTENSIONS = ["pdf", "png", "jpg", "jpeg"] as const;
export const ALLOWED_COR_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;

export interface CorValidationOptions {
  maxSizeBytes?: number;
}

export interface CorValidationResult {
  isValid: boolean;
  error?: string;
}

const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const getFileExtension = (fileName: string) => {
  const extension = fileName.split(".").pop()?.trim().toLowerCase();
  return extension || "";
};

const fileTypeMatchesExtension = (file: File, extension: string) => {
  if (!file.type) return true;
  if (!ALLOWED_COR_MIME_TYPES.includes(file.type as any)) return false;

  if (extension === "pdf") return file.type === "application/pdf";
  if (extension === "png") return file.type === "image/png";
  return file.type === "image/jpeg";
};

export const validateCorFile = async (
  file: File,
  options: CorValidationOptions = {},
): Promise<CorValidationResult> => {
  if (!file) {
    return {
      isValid: false,
      error: "Please select a COR file to upload.",
    };
  }

  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
  const extension = getFileExtension(file.name);

  if (file.size <= 0) {
    return {
      isValid: false,
      error: `File "${file.name}" is empty.`,
    };
  }

  if (file.size > maxSizeBytes) {
    const maxSizeMb = Math.round(maxSizeBytes / (1024 * 1024));
    return {
      isValid: false,
      error: `File "${file.name}" exceeds the ${maxSizeMb}MB limit.`,
    };
  }

  if (!ALLOWED_COR_EXTENSIONS.includes(extension as any)) {
    return {
      isValid: false,
      error:
        `File "${file.name}" must be a PDF, PNG, JPG, or JPEG ` +
        "file.",
    };
  }

  if (!fileTypeMatchesExtension(file, extension)) {
    return {
      isValid: false,
      error:
        `File "${file.name}" has a file type that does not match ` +
        "its extension.",
    };
  }

  return { isValid: true };
};

