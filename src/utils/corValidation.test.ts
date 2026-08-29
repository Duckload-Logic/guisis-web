import { describe, it, expect } from "vitest";
import { validateCorFile } from "./corValidation";

describe("validateCorFile", () => {
  const createMockFile = (
    name: string,
    size: number,
    type: string,
    content: Uint8Array,
  ): File => {
    const blob = new Blob([content as any], { type });
    const file = new File([blob], name, { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
  };

  it("should fail if file is missing", async () => {
    const res = await validateCorFile(null as any);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("Please select a COR file");
  });

  it("should fail if file size is zero or empty", async () => {
    const file = createMockFile(
      "cor.pdf",
      0,
      "application/pdf",
      new Uint8Array(),
    );
    const res = await validateCorFile(file);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("is empty");
  });

  it("should fail if file size exceeds limit", async () => {
    const file = createMockFile(
      "cor.pdf",
      20 * 1024 * 1024,
      "application/pdf",
      new Uint8Array(),
    );
    const res = await validateCorFile(file, {
      maxSizeBytes: 10 * 1024 * 1024,
    });
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("exceeds the");
  });

  it("should fail for unsupported extensions", async () => {
    const file = createMockFile(
      "cor.txt",
      100,
      "text/plain",
      new Uint8Array([1, 2, 3]),
    );
    const res = await validateCorFile(file);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("must be a PDF, PNG, JPG, or JPEG");
  });

  it("should fail if mime type does not match extension", async () => {
    const file = createMockFile(
      "cor.pdf",
      100,
      "image/png",
      new Uint8Array([1, 2, 3]),
    );
    const res = await validateCorFile(file);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("does not match its extension");
  });

});
