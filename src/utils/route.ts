/**
 * Normalizes a URL path by stripping any trailing slash,
 * except for the root path "/".
 */
export function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/**
 * Checks if the given path is an authentication page.
 * Handles trailing slashes robustly.
 */
export function isAuthPath(pathname: string): boolean {
  const normalized = normalizePath(pathname);
  return (
    normalized === "/" ||
    normalized === "/login" ||
    normalized === "/register" ||
    normalized.startsWith("/auth")
  );
}
