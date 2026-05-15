/**
 * @file utils.ts
 * @description Utilidad para combinar clases de Tailwind CSS usando clsx y twMerge.
 * @author MeteoMap Team
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind CSS resolviendo conflictos y removiendo duplicados
 * @param {...ClassValue[]} inputs - Clases CSS a combinar
 * @returns {string} String de clases combinadas sin conflictos
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
