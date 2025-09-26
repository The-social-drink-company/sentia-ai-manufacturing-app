/**
 * Utility for combining class names
 * Handles conditional classes, removes duplicates, and merges Tailwind classes properly
 */
export function cn(...inputs) {
  const classes = inputs.filter(Boolean).join(' ')

  // Remove duplicate classes
  const uniqueClasses = [...new Set(classes.split(' '))].join(' ')

  return uniqueClasses.trim()
}