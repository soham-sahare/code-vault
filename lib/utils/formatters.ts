/**
 * Shared formatting and UI helper utilities.
 */

export function getInitials(
  user?: { name?: string | null; username?: string | null; email?: string | null } | string | null
): string {
  if (!user) return "U";
  const name = typeof user === "string" ? user : user.username || user.name || user.email || "User";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (name.length >= 2) {
    return name.substring(0, 2).toUpperCase();
  }
  return name.charAt(0).toUpperCase() || "U";
}

export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Fast synchronous platform detection from URL (0ms latency, zero network)
 */
export function detectSourcePlatform(url: string): string {
  if (!url) return "other";
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("leetcode.com")) return "leetcode";
  if (lowerUrl.includes("codeforces.com")) return "codeforces";
  if (lowerUrl.includes("hackerrank.com")) return "hackerrank";
  if (lowerUrl.includes("geeksforgeeks.org")) return "gfg";
  return "other";
}
