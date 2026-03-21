import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.startsWith('02')) {
    if (digits.length <= 9)
      return digits.replace(/(\d{2})(\d{0,3})(\d{0,4})/, (_, a, b, c) => [a, b, c].filter(Boolean).join('-'));
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, a, b, c) => [a, b, c].filter(Boolean).join('-'));
  }
  if (digits.length <= 10)
    return digits.replace(/(\d{3})(\d{0,3})(\d{0,4})/, (_, a, b, c) => [a, b, c].filter(Boolean).join('-'));
  return digits.replace(/(\d{3})(\d{4})(\d{0,4})/, (_, a, b, c) => [a, b, c].filter(Boolean).join('-'));
}
