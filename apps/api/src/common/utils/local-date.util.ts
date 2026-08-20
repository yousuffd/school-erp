/**
 * Formats a Date as a local YYYY-MM-DD string, using the Date object's own
 * local calendar fields (getFullYear/getMonth/getDate) rather than
 * `.toISOString().slice(0, 10)`.
 *
 * The bug this fixes: `new Date(year, month, day)` builds a LOCAL midnight
 * instant. `.toISOString()` then converts that instant to UTC — and for any
 * timezone ahead of UTC (India is UTC+5:30), local midnight falls on the
 * PREVIOUS UTC calendar day. `.toISOString().slice(0, 10)` on such a Date
 * silently returns yesterday's date, every time, regardless of the hour —
 * not an edge case, a permanent off-by-one for any UTC+ deployment. Found
 * via a real "1 staff member on leave today" exception card pointing to a
 * page where every record showed as unset, because the seed data's "today"
 * and the dashboard's "today" boundary disagreed by exactly one day.
 *
 * `toLocalDateStr(new Date())` is also safe for "right now" — the narrower
 * variant of this bug (`new Date().toISOString().slice(0,10)`) is only
 * wrong during the ~5.5 hour window between local midnight and UTC
 * midnight, but this function sidesteps that too by never touching UTC.
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