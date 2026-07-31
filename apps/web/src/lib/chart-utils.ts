export interface CountDatum {
  name: string;
  value: number;
}

/**
 * Groups a list of items by a derived category label and counts them —
 * used throughout the role-specific dashboards (session 26) to turn a raw
 * list endpoint's response into chart-ready data, without needing to know
 * a field's exact enum values in advance (several of the types used here —
 * AdmissionStage, ProcurementRequestStatus — weren't confirmed while
 * building the dashboards; grouping by whatever value actually appears in
 * the real data sidesteps that entirely). Falls back to 'Unspecified' for
 * a null/empty/undefined category rather than silently dropping those
 * items from the chart.
 */
export function groupCounts<T>(items: T[], keyFn: (item: T) => string | null | undefined): CountDatum[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item) || 'Unspecified';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
}
