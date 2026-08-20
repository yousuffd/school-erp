/**
 * Formats a Date as a local YYYY-MM-DD string, using the Date object's own
 * local calendar fields rather than `.toISOString().slice(0, 10)`.
 *
 * See apps/api/src/common/utils/local-date.util.ts for the full explanation
 * of the bug this fixes — in short, `.toISOString()` converts to UTC, which
 * silently shifts dates back a day for any timezone ahead of UTC (including
 * India, UTC+5:30). This was the root cause of a real bug: a "1 staff
 * member on leave today" dashboard alert whose "today" and the attendance
 * page's "today" disagreed by one day.
 */
export function toLocalDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Today's date as a local YYYY-MM-DD string — the correct replacement for
 * `new Date().toISOString().slice(0, 10)` used as a "today" default. */
export function todayLocalDateStr(): string {
  return toLocalDateStr(new Date());
}