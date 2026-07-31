'use client';

import { useEffect, useState } from 'react';
import { GlanceCard } from '@/components/ui/GlanceCard';
import { api, ApiError } from '@/lib/api';

interface Props {
  tenantId: string;
}

/**
 * "Overview" tab — a quick-glance summary using the same list endpoints
 * VehiclesSection/DriversSection/RoutesSection/AssignmentsSection already
 * call elsewhere in this module. No new backend endpoints, just one more
 * caller of what's already there.
 */
export function OverviewSection({ tenantId }: Props) {
  const [vehicleCount, setVehicleCount] = useState(0);
  const [driverCount, setDriverCount] = useState(0);
  const [routeCount, setRouteCount] = useState(0);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getVehicles(tenantId),
      api.getDrivers(tenantId),
      api.getRoutes(tenantId),
      api.getStudentTransportAssignments(tenantId),
    ])
      .then(([vehicles, drivers, routes, assignments]) => {
        setVehicleCount(vehicles.length);
        setDriverCount(drivers.length);
        setRouteCount(routes.length);
        setAssignmentCount(assignments.length);
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
        title="Transportation, at a glance"
        subtitle="Across every route and vehicle this year"
        loading={loading}
        rows={[
          { label: 'Vehicles', value: vehicleCount },
          { label: 'Drivers', value: driverCount },
          { label: 'Routes', value: routeCount },
          { label: 'Students assigned to a route', value: assignmentCount },
        ]}
      />
    </div>
  );
}
