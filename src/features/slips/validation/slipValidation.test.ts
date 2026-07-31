import { describe, it, expect } from "vitest";

// Re-implementation of UploadSection.tsx's validateFiles logic
export interface FileValidationResult {
  validFiles: File[];
  errors: string[];
}

export const validateSlipFiles = (
  files: File[] | null,
): FileValidationResult => {
  if (!files) return { validFiles: [], errors: [] };

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
  const errors: string[] = [];

  const validFiles = files.filter((file) => {
    const isValidSize = file.size <= MAX_SIZE;
    const isValidType = ALLOWED_TYPES.includes(file.type);

    if (!isValidSize) {
      errors.push(`File "${file.name}" exceeds the 5MB limit.`);
    } else if (!isValidType) {
      errors.push(`File "${file.name}" has an unsupported format.`);
    }

    return isValidSize && isValidType;
  });

  return { validFiles, errors };
};

describe("Admission Slip file validation logic", () => {
  const createMockFile = (name: string, size: number, type: string): File => {
    const file = new File([], name, { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
  };

  it("should return empty results if files list is null", () => {
    const res = validateSlipFiles(null);
    expect(res.validFiles.length).toBe(0);
    expect(res.errors.length).toBe(0);
  });

  it("should pass for valid PDF, PNG, and JPEG files under 5MB", () => {
    const files = [
      createMockFile("doc.pdf", 1024 * 1024, "application/pdf"),
      createMockFile("image.png", 2 * 1024 * 1024, "image/png"),
      createMockFile("photo.jpg", 3 * 1024 * 1024, "image/jpeg"),
    ];
    const res = validateSlipFiles(files);
    expect(res.validFiles.length).toBe(3);
    expect(res.errors.length).toBe(0);
  });

  it("should fail for files exceeding 5MB limit", () => {
    const files = [
      createMockFile("huge.pdf", 6 * 1024 * 1024, "application/pdf"),
    ];
    const res = validateSlipFiles(files);
    expect(res.validFiles.length).toBe(0);
    expect(res.errors.length).toBe(1);
    expect(res.errors[0]).toContain("exceeds the 5MB limit");
  });

  it("should fail for files with unsupported MIME types", () => {
    const files = [createMockFile("notes.txt", 1000, "text/plain")];
    const res = validateSlipFiles(files);
    expect(res.validFiles.length).toBe(0);
    expect(res.errors.length).toBe(1);
    expect(res.errors[0]).toContain("has an unsupported format");
  });
});
