/**
 * @file utils.ts
 * @description Utilidad para combinar clases de Tailwind CSS usando clsx y twMerge.
 * @author MeteoMap Team
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";


/**
 * Combina múltiples clases de Tailwind CSS, eliminando duplicados y resolviendo conflictos.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
