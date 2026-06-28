import { format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { addDays } from "date-fns";

const IST_TZ = "Asia/Kolkata";

/**
 * Formats a UTC date/string to: "05-JUN-2026 00:30 IST"
 */
export function formatIST(utcDate: Date | string | null | undefined): string {
  if (!utcDate) return "";
  const d = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  const ist = toZonedTime(d, IST_TZ);
  return format(ist, "dd-MMM-yyyy HH:mm 'IST'").toUpperCase();
}

/**
 * Formats a UTC date/string to date-only: "05-JUN-2026"
 * Used for SRS timeline node labels.
 */
export function formatISTDate(utcDate: Date | string | null | undefined): string {
  if (!utcDate) return "";
  const d = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  const ist = toZonedTime(d, IST_TZ);
  return format(ist, "dd-MMM-yyyy").toUpperCase();
}

/**
 * Compute SRS due date: solvedAt + intervalDays, at IST midnight.
 */
export function computeDueDate(solvedAtUtc: Date, intervalDays: number): Date {
  const solvedIST = toZonedTime(solvedAtUtc, IST_TZ);
  const dueIST = addDays(solvedIST, intervalDays);
  // Set to midnight IST on due day
  dueIST.setHours(0, 0, 0, 0);
  return fromZonedTime(dueIST, IST_TZ);  // returns UTC Date for DB storage
}
