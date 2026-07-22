import { getProfilePictureUrl } from "@/lib/profilePicture";
import type { IIRForm, StudentSection } from "../types";

export const TWO_BY_TWO_PHOTO_FIELD = "twoByTwoPhotoDataUrl";

const STORAGE_PREFIX = "guisis_iir_two_by_two_photo";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const OUTPUT_SIZE = 600;

const isPhotoValue = (value?: string | null) => {
  const trimmed = String(value || "").trim();
  return (
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("uploads/")
  );
};

export const normalizeTwoByTwoPhotoUrl = (value?: string | null) => {
  const trimmed = String(value || "").trim();
  if (!isPhotoValue(trimmed)) return "";
  if (trimmed.startsWith("data:image/")) return trimmed;
  return getProfilePictureUrl(trimmed);
};

type TwoByTwoPhotoIdentity = {
  iirId?: string | number | null;
  userId?: string | number | null;
  studentNumber?: string | null;
  email?: string | null;
};

type PhotoSource =
  | IIRForm
  | { student?: StudentSection | null }
  | StudentSection
  | null
  | undefined;

const normalizeKeyPart = (value?: string | number | null) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-");

const getStorageKeys = (identity?: TwoByTwoPhotoIdentity) => {
  const keys = [
    identity?.iirId ? `${STORAGE_PREFIX}:iir:${normalizeKeyPart(identity.iirId)}` : "",
    identity?.userId
      ? `${STORAGE_PREFIX}:user:${normalizeKeyPart(identity.userId)}`
      : "",
    identity?.studentNumber
      ? `${STORAGE_PREFIX}:student:${normalizeKeyPart(identity.studentNumber)}`
      : "",
    identity?.email
      ? `${STORAGE_PREFIX}:email:${normalizeKeyPart(identity.email)}`
      : "",
  ].filter(Boolean);

  return Array.from(new Set(keys));
};

const getPhotoFromSource = (source?: PhotoSource) => {
  if (!source) return "";

  const student = "student" in source ? source.student : source;
  const personalInfo = (student as StudentSection | undefined)?.personalInfo;
  const photo = personalInfo?.twoByTwoPhotoDataUrl;

  return normalizeTwoByTwoPhotoUrl(photo);
};

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read the selected image."));
    };

    image.src = objectUrl;
  });

export async function createTwoByTwoPhotoDataUrl(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload a valid image file for the 2x2 photo.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("The 2x2 photo must be 5MB or smaller.");
  }

  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Your browser could not process the image.");
  }

  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = Math.max((image.naturalWidth - sourceSize) / 2, 0);
  const sourceY = Math.max((image.naturalHeight - sourceSize) / 2, 0);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  return canvas.toDataURL("image/jpeg", 0.92);
}

const dataUrlToFile = (dataUrl: string, fileName: string) => {
  const [metadata, base64Data] = dataUrl.split(",");
  const mimeType = metadata.match(/data:(.*?);/)?.[1] || "image/jpeg";
  const binaryString = window.atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new File([bytes], fileName, { type: mimeType });
};

const buildTwoByTwoPhotoFileName = (originalName: string) => {
  const safeBaseName = originalName
    .replace(/\.[^/.]+$/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "student-photo";

  return `${safeBaseName}-2x2.jpg`;
};

export async function createTwoByTwoPhotoFile(file: File) {
  const dataUrl = await createTwoByTwoPhotoDataUrl(file);

  return {
    dataUrl,
    file: dataUrlToFile(dataUrl, buildTwoByTwoPhotoFileName(file.name)),
  };
}

export function saveIIRTwoByTwoPhoto(
  dataUrl: string | null | undefined,
  identity?: TwoByTwoPhotoIdentity,
) {
  const photoUrl = normalizeTwoByTwoPhotoUrl(dataUrl);
  if (typeof window === "undefined" || !photoUrl) return;

  getStorageKeys(identity).forEach((key) => {
    localStorage.setItem(key, photoUrl);
  });
}

export function removeIIRTwoByTwoPhoto(identity?: TwoByTwoPhotoIdentity) {
  if (typeof window === "undefined") return;

  getStorageKeys(identity).forEach((key) => {
    localStorage.removeItem(key);
  });
}

export function getIIRTwoByTwoPhoto(
  identity?: TwoByTwoPhotoIdentity,
  source?: PhotoSource,
) {
  const sourcePhoto = getPhotoFromSource(source);
  if (sourcePhoto) return sourcePhoto;

  if (typeof window === "undefined") return "";

  for (const key of getStorageKeys(identity)) {
    const value = normalizeTwoByTwoPhotoUrl(localStorage.getItem(key));
    if (value) return value;
  }

  return "";
}

export function getTwoByTwoPhotoIdentityFromForm(
  formData?: IIRForm | null,
  userId?: string | number | null,
  iirId?: string | number | null,
): TwoByTwoPhotoIdentity {
  return {
    iirId: iirId || (formData as any)?.id || null,
    userId,
    studentNumber: formData?.student?.personalInfo?.studentNumber || null,
    email: formData?.student?.basicInfo?.email || null,
  };
}

export function getTwoByTwoPhotoIdentityFromStudent(
  student?: StudentSection | null,
  iirId?: string | number | null,
): TwoByTwoPhotoIdentity {
  return {
    iirId,
    studentNumber: student?.personalInfo?.studentNumber || null,
    email: student?.basicInfo?.email || null,
  };
}
