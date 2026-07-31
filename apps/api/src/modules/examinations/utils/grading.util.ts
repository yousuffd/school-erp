/**
 * Fixed percentage-to-letter-grade scale. The blueprint marks "configurable
 * grading schemes per board/curriculum" as an Advanced/Premium feature — this
 * is deliberately a single fixed scale, not a per-tenant configurable system.
 * A real school on a different grading standard (IB, GPA-based, etc.) isn't
 * served by this yet; that's the tradeoff of shipping something usable now
 * versus building the full configurable system.
 */
const GRADE_BANDS: Array<{ min: number; grade: string }> = [
  { min: 90, grade: 'A+' },
  { min: 80, grade: 'A' },
  { min: 70, grade: 'B' },
  { min: 60, grade: 'C' },
  { min: 50, grade: 'D' },
  { min: 0, grade: 'F' },
];

export function calculateGrade(percentage: number): string {
  const band = GRADE_BANDS.find((b) => percentage >= b.min);
  return band?.grade ?? 'F';
}

export function calculatePercentage(marksObtained: number, maxMarks: number): number {
  if (maxMarks === 0) return 0;
  return (marksObtained / maxMarks) * 100;
}
