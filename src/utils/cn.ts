/**
 * Utility function for conditional classNames
 */
export function cn(...classes: Array<string | boolean | undefined | null>): string {
  return classes.filter(Boolean).join(' ');
}
