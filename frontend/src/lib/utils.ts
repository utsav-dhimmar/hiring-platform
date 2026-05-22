import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a string to Title Case.
 * Handles underscore and hyphen separators.
 */
export function toTitleCase(str: string): string {
  if (!str) return str;
  return str
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word) => capitalize(word.toLowerCase()))
    .join(" ");
}
