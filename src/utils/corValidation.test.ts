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

  it("should fail if signature does not match PDF", async () => {
    const file = createMockFile(
      "cor.pdf",
      100,
      "application/pdf",
      new Uint8Array([1, 2, 3, 4]),
    );
    const res = await validateCorFile(file);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("does not appear to be a valid PDF");
  });

  it("should fail if signature does not match PNG", async () => {
    const file = createMockFile(
      "cor.png",
      100,
      "image/png",
      new Uint8Array([1, 2, 3, 4]),
    );
    const res = await validateCorFile(file);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("does not appear to be a valid PNG");
  });

  it("should fail if signature does not match JPEG", async () => {
    const file = createMockFile(
      "cor.jpg",
      100,
      "image/jpeg",
      new Uint8Array([1, 2, 3, 4]),
    );
    const res = await validateCorFile(file);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("does not appear to be a valid JPG");
  });

  it("should pass for a valid PNG file with COR keyword", async () => {
    const pngHeader = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    const file = createMockFile(
      "my_cor_file.png",
      100,
      "image/png",
      pngHeader,
    );
    const res = await validateCorFile(file);
    expect(res.isValid).toBe(true);
  });

  it("should pass for a valid JPEG file with COR keyword", async () => {
    const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);
    const file = createMockFile(
      "certificate_registration.jpg",
      100,
      "image/jpeg",
      jpegHeader,
    );
    const res = await validateCorFile(file);
    expect(res.isValid).toBe(true);
  });

  it("should pass for a valid PDF file with COR keyword", async () => {
    const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00]);
    const file = createMockFile(
      "cor.pdf",
      100,
      "application/pdf",
      pdfHeader,
    );
    const res = await validateCorFile(file);
    expect(res.isValid).toBe(true);
  });

  it("should fail if no keywords in name or PDF header", async () => {
    const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00]);
    const file = createMockFile(
      "random.pdf",
      100,
      "application/pdf",
      pdfHeader,
    );
    const res = await validateCorFile(file);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("could not be verified as a COR");
  });

  it("should pass if filename has no keyword but PDF header does", async () => {
    const signature = [0x25, 0x50, 0x44, 0x46];
    const textBytes = Array.from(
      "some text certificate of registration more text",
    ).map((c) => c.charCodeAt(0));
    const pdfHeader = new Uint8Array([...signature, ...textBytes]);
    const file = createMockFile(
      "random.pdf",
      200,
      "application/pdf",
      pdfHeader,
    );
    const res = await validateCorFile(file);
    expect(res.isValid).toBe(true);
  });
});
