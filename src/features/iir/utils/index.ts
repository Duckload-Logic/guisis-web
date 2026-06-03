import { NOT_SPECIFIED } from "../constants";
import { Address } from "../types";

export function asText(value: unknown) {
  if (value === null || value === undefined || value === "")
    return NOT_SPECIFIED;

  return String(value);
}

export function renderAddress(address: Address | undefined) {
  if (!address) return NOT_SPECIFIED;
  const parts = [
    address.streetDetail,
    address.barangay.name,
    address.city.name,
    address.region.name,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : NOT_SPECIFIED;
}

export function formatCurrency(value: unknown) {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return NOT_SPECIFIED;

  return `Php ${numeric.toLocaleString()}`;
}

export function getOptionLabel(value: any) {
  if (!value) return NOT_SPECIFIED;
  if (typeof value === "string") return value;

  return value.name || value.text || value.code || NOT_SPECIFIED;
}
