'use client';

import { useEffect, useState } from 'react';
import { GlanceCard } from '@/components/ui/GlanceCard';
import { api, ApiError } from '@/lib/api';

interface Props {
  tenantId: string;
}

/**
 * "Overview" tab — reuses getBooks and getBookIssues, the same calls
 * BooksView/IssuesView already make elsewhere in this module. No new
 * backend endpoints.
 */
export function OverviewSection({ tenantId }: Props) {
  const [bookCount, setBookCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getBooks(tenantId), api.getBookIssues(tenantId, { overdueOnly: true })])
      .then(([books, overdueIssues]) => {
        setBookCount(books.length);
        setOverdueCount(overdueIssues.length);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load overview'))
      .finally(() => setLoading(false));
  }, [tenantId]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}
      <GlanceCard
        title="Library, at a glance"
        subtitle="Across the whole catalog"
        loading={loading}
        rows={[
          { label: 'Titles in the catalog', value: bookCount },
          { label: 'Overdue right now', value: overdueCount },
        ]}
      />
    </div>
  );
}
