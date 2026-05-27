import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Compose and normalize CSS class names, resolving Tailwind CSS conflicts.
 *
 * Accepts any number of `ClassValue` inputs (strings, arrays, objects, etc.), composes them into a single class string, and merges Tailwind-specific conflicting classes.
 *
 * @param inputs - Class values to be combined (strings, arrays, objects, conditional entries, etc.)
 * @returns The resulting class string with duplicates and conflicting Tailwind classes resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
