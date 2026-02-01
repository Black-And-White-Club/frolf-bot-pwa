import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * A utility function to merge Tailwind CSS classes conditionally.
 * It combines the functionality of clsx and tailwind-merge.
 * @param inputs - A list of class values (strings, objects, arrays).
 * @returns A string of merged and optimized class names.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
