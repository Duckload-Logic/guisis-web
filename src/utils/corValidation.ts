export const ALLOWED_COR_EXTENSIONS = ["pdf", "png", "jpg", "jpeg"] as const;
export const ALLOWED_COR_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;

const COR_FILENAME_KEYWORDS = [
  "cor",
  "certificateofregistration",
  "certificate-registration",
  "certificate_registration",
  "certificate registration",
  "registrationform",
  "registration-form",
  "registration_form",
  "registration form",
  "registration",
  "enrollment",
  "enrolment",
];

const PDF_COR_TEXT_KEYWORDS = [
  "certificate of registration",
  "certificateofregistration",
  "registration form",
  "registrationform",
  "student registration",
  "studentregistration",
  "cor",
  "enrollment",
  "enrolment",
];

export interface CorValidationOptions {
  maxSizeBytes?: number;
}

export interface CorValidationResult {
  isValid: boolean;
  error?: string;
}

const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024;

const getFileExtension = (fileName: string) => {
  const extension = fileName.split(".").pop()?.trim().toLowerCase();
  return extension || "";
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\s_]+/g, " ")
    .replace(/[^a-z0-9. -]/g, "")
    .trim();

const normalizeCompactText = (value: string) =>
  normalizeText(value).replace(/[\s.-]+/g, "");

const hasCorKeyword = (value: string) => {
  const normalized = normalizeText(value);
  const compact = normalizeCompactText(value);

  return COR_FILENAME_KEYWORDS.some((keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    const compactKeyword = normalizeCompactText(keyword);

    return (
      normalized.includes(normalizedKeyword) || compact.includes(compactKeyword)
    );
  });
};

const readFileHeader = async (file: File, length = 4096) => {
  const buffer = await file.slice(0, length).arrayBuffer();
  return new Uint8Array(buffer);
};

const isPdfHeader = (header: Uint8Array) => {
  const signature = [0x25, 0x50, 0x44, 0x46]; // %PDF
  return signature.every((byte, index) => header[index] === byte);
};

const isPngHeader = (header: Uint8Array) => {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return signature.every((byte, index) => header[index] === byte);
};

const isJpegHeader = (header: Uint8Array) =>
  header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;

const hasMatchingFileSignature = (extension: string, header: Uint8Array) => {
  if (extension === "pdf") return isPdfHeader(header);
  if (extension === "png") return isPngHeader(header);
  if (extension === "jpg" || extension === "jpeg") return isJpegHeader(header);
  return false;
};

const fileTypeMatchesExtension = (file: File, extension: string) => {
  if (!file.type) return true;
  if (!ALLOWED_COR_MIME_TYPES.includes(file.type as any)) return false;

  if (extension === "pdf") return file.type === "application/pdf";
  if (extension === "png") return file.type === "image/png";
  if (extension === "jpg" || extension === "jpeg") return file.type === "image/jpeg";

  return false;
};

const pdfHeaderHasCorKeyword = (header: Uint8Array) => {
  const text = Array.from(header)
    .map((byte) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : " "))
    .join("");
  const normalized = normalizeText(text);
  const compact = normalizeCompactText(text);

  return PDF_COR_TEXT_KEYWORDS.some((keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    const compactKeyword = normalizeCompactText(keyword);

    return (
      normalized.includes(normalizedKeyword) || compact.includes(compactKeyword)
    );
  });
};

export const validateCorFile = async (
  file: File,
  options: CorValidationOptions = {},
): Promise<CorValidationResult> => {
  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
  const extension = getFileExtension(file.name);

  if (!file) {
    return { isValid: false, error: "Please select a COR file to upload." };
  }

  if (file.size <= 0) {
    return { isValid: false, error: `File "${file.name}" is empty.` };
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
      error: `File "${file.name}" must be a PDF, PNG, JPG, or JPEG file.`,
    };
  }

  if (!fileTypeMatchesExtension(file, extension)) {
    return {
      isValid: false,
      error: `File "${file.name}" has a file type that does not match its extension.`,
    };
  }

  const header = await readFileHeader(file);

  if (!hasMatchingFileSignature(extension, header)) {
    return {
      isValid: false,
      error: `File "${file.name}" does not appear to be a valid ${extension.toUpperCase()} file.`,
    };
  }

  const nameLooksLikeCor = hasCorKeyword(file.name);
  const pdfMetadataLooksLikeCor = extension === "pdf" && pdfHeaderHasCorKeyword(header);

  if (!nameLooksLikeCor && !pdfMetadataLooksLikeCor) {
    return {
      isValid: false,
      error:
        `File "${file.name}" could not be verified as a COR. ` +
        "Rename the file to include COR or Certificate of Registration, or upload the official COR document.",
    };
  }

  return { isValid: true };
};
