/**
 * Formats and normalizes team member experience string to include "Years"
 * E.g., "20+" -> "20+ Years", "15" -> "15 Years", "20+ Years" -> "20+ Years", "15+ yrs" -> "15+ Years"
 * Prevents duplicates like "20+ Years Years"
 */
export function formatExperience(val?: string | null): string {
  if (!val) return "";
  let trimmed = val.trim();
  if (!trimmed) return "";

  // Strip any existing repeated "years" or "yrs" suffix
  trimmed = trimmed.replace(/(\s*(years?|yrs?))+$/i, "");

  if (!trimmed) return "";
  return `${trimmed} Years`;
}

/**
 * Normalizes photo URLs so they always use lowercase /uploads/ and handle edge cases
 */
export function normalizePhotoUrl(url?: string | null): string {
  if (!url) return "/images/about/founder-vineet-gupta.png";
  const trimmed = url.trim();
  if (/^\/?uploads\//i.test(trimmed)) {
    return trimmed.replace(/^\/?uploads\//i, "/uploads/");
  }
  return trimmed;
}
