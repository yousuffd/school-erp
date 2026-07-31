'use client';

import { useEffect, useState } from 'react';
import { GlanceCard } from '@/components/ui/GlanceCard';
import { api, ApiError } from '@/lib/api';

interface Props {
  tenantId: string;
}

/**
 * "Overview" tab — reuses getHostelRooms, the same call RoomsSection
 * already makes elsewhere in this module, summed client-side for a total
 * bed capacity figure. No new backend endpoints.
 */
export function OverviewSection({ tenantId }: Props) {
  const [roomCount, setRoomCount] = useState(0);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [dormitoryCount, setDormitoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getHostelRooms(tenantId)
      .then((rooms) => {
        setRoomCount(rooms.length);
        setTotalCapacity(rooms.reduce((sum, r) => sum + r.capacity, 0));
        setDormitoryCount(rooms.filter((r) => r.room_type === 'dormitory').length);
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
        title="Hostel, at a glance"
        subtitle="Across every building and room"
        loading={loading}
        rows={[
          { label: 'Rooms', value: roomCount },
          { label: 'Total bed capacity', value: totalCapacity },
          { label: 'Dormitory-style rooms', value: dormitoryCount },
        ]}
      />
    </div>
  );
}
