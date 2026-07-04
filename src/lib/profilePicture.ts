const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080/api/v1";

const stripTrailingSlashes = (value: string) => value.replace(/\/+$/, "");

export function getProfilePictureUrl(url?: string | null) {
  if (!url) return "";

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return "";

  if (/^https?:\/\//i.test(trimmedUrl) || trimmedUrl.startsWith("data:image/")) {
    return trimmedUrl;
  }

  const normalizedBase = stripTrailingSlashes(API_BASE_URL);

  if (trimmedUrl.startsWith("/api/v1/")) {
    const origin = normalizedBase.replace(/\/api\/v1$/, "");
    return `${origin}${trimmedUrl}`;
  }

  if (trimmedUrl.startsWith("/uploads/")) {
    const apiBase = normalizedBase.endsWith("/api/v1")
      ? normalizedBase
      : `${normalizedBase}/api/v1`;
    return `${apiBase}${trimmedUrl}`;
  }

  return `${normalizedBase}/${trimmedUrl.replace(/^\/+/, "")}`;
}
