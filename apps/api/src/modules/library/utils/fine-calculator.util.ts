export const LIBRARY_FINE_RATE_PER_DAY_INR = 10;

/**
 * Flat-rate overdue fine (Blueprint Part 2, Module 12 — "Reservations &
 * fines"). Returns a string suitable for the numeric(6,2) fine_amount
 * column, or undefined if returned on or before the due date (no fine).
 * Rate is a hardcoded tenant-wide constant for this pass — per-tenant
 * configurable rates are a documented follow-up, not built now.
 */
export function calculateOverdueFine(dueDate: string, returnDate: string): string | undefined {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLate = Math.floor((returned.getTime() - due.getTime()) / msPerDay);
  if (daysLate <= 0) return undefined;
  return (daysLate * LIBRARY_FINE_RATE_PER_DAY_INR).toFixed(2);
}
