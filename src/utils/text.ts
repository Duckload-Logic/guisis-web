export function truncateText(text: string, maxLength: number): string {
  if (typeof text !== "string") return "";
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + "...";
  }
  return text;
}

export function capitalizeFirstLetter(text: string): string {
  if (typeof text !== "string" || !text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function capitalizeWords(text: string): string {
  if (typeof text !== "string" || !text) return text;
  return text
    .split(" ")
    .map((word) => word.toLowerCase())
    .map(capitalizeFirstLetter)
    .join(" ");
}
