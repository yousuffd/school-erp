'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import {
  AcademicYear,
  Driver,
  Route,
  RouteAssignment,
  RouteStop,
  SchoolClass,
  Student,
  StudentTransportAssignment,
  StudentTransportOptOut,
  Vehicle,
} from '@/lib/types';
import { StudentMultiPicker } from '@/components/library/StudentMultiPicker';

interface Props {
  tenantId: string;
}

export function AssignmentsSection({ tenantId }: Props) {
  const [routeAssignments, setRouteAssignments] = useState<RouteAssignment[]>([]);
  const [studentAssignments, setStudentAssignments] = useState<StudentTransportAssignment[]>([]);
  const [optOuts, setOptOuts] = useState<StudentTransportOptOut[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Route assignment form
  const [showRaForm, setShowRaForm] = useState(false);
  const [raRouteId, setRaRouteId] = useState('');
  const [raVehicleId, setRaVehicleId] = useState('');
  const [raDriverId, setRaDriverId] = useState('');
  const [savingRa, setSavingRa] = useState(false);

  // Student assignment form
  const [showSaForm, setShowSaForm] = useState(false);
  const [saStudentIds, setSaStudentIds] = useState<string[]>([]);
  const [saRouteId, setSaRouteId] = useState('');
  const [saStopId, setSaStopId] = useState('');
  const [saStops, setSaStops] = useState<RouteStop[]>([]);
  const [savingSa, setSavingSa] = useState(false);

  const currentYear = useMemo(
    () => academicYears.find((y) => y.is_current) ?? academicYears[0],
    [academicYears],
  );

  const optedOutStudentIds = useMemo(() => {
    if (!currentYear) return new Set<string>();
    return new Set(optOuts.filter((o) => o.academic_year_id === currentYear.id).map((o) => o.student_id));
  }, [optOuts, currentYear]);

  function load() {
    setLoading(true);
    Promise.all([
      api.getRouteAssignments(tenantId),
      api.getStudentTransportAssignments(tenantId),
      api.getRoutes(tenantId),
      api.getVehicles(tenantId),
      api.getDrivers(tenantId),
      api.getAcademicYears(tenantId),
      api.getStudents(tenantId),
      api.getClasses(tenantId),
      api.getStudentTransportOptOuts(tenantId),
    ])
      .then(([ra, sa, r, v, d, y, s, c, oo]) => {
        setRouteAssignments(ra);
        setStudentAssignments(sa);
        setRoutes(r);
        setVehicles(v);
        setDrivers(d);
        setAcademicYears(y);
        setStudents(s);
        setClasses(c);
        setOptOuts(oo);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  // Load stops for whichever route is selected in the student-assignment form.
  useEffect(() => {
    if (!saRouteId) {
      setSaStops([]);
      setSaStopId('');
      return;
    }
    api
      .getRouteStops(saRouteId)
      .then(setSaStops)
      .catch(() => setSaStops([]));
    setSaStopId('');
  }, [saRouteId]);

  function routeName(id: string) {
    return routes.find((r) => r.id === id)?.name ?? '—';
  }
  function vehicleReg(id: string) {
    return vehicles.find((v) => v.id === id)?.registration_number ?? '—';
  }
  function driverName(id: string) {
    return drivers.find((d) => d.id === id)?.name ?? '—';
  }
  function studentName(id: string) {
    const s = students.find((st) => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : '—';
  }
  function stopName(routeId: string, stopId: string) {
    // Only resolvable for the route currently loaded into saStops; falls
    // back to the id itself for rows belonging to other routes — good
    // enough for this list view, a full per-row stop lookup isn't worth
    // the extra round trips here.
    return saRouteId === routeId ? (saStops.find((s) => s.id === stopId)?.name ?? stopId) : stopId;
  }

  function resetRaForm() {
    setShowRaForm(false);
    setRaRouteId('');
    setRaVehicleId('');
    setRaDriverId('');
  }

  async function handleCreateRouteAssignment(e: FormEvent) {
    e.preventDefault();
    if (!currentYear) {
      setError('No academic year exists yet — create one under Settings first.');
      return;
    }
    setSavingRa(true);
    setError(null);
    try {
      await api.createRouteAssignment({
        tenant_id: tenantId,
        route_id: raRouteId,
        vehicle_id: raVehicleId,
        driver_id: raDriverId,
        academic_year_id: currentYear.id,
      });
      resetRaForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create route assignment');
    } finally {
      setSavingRa(false);
    }
  }

  async function handleDeleteRouteAssignment(id: string) {
    setError(null);
    try {
      await api.deleteRouteAssignment(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete route assignment');
    }
  }

  function resetSaForm() {
    setShowSaForm(false);
    setSaStudentIds([]);
    setSaRouteId('');
    setSaStopId('');
  }

  async function handleCreateStudentAssignment(e: FormEvent) {
    e.preventDefault();
    if (!currentYear) {
      setError('No academic year exists yet — create one under Settings first.');
      return;
    }
    if (saStudentIds.length === 0) {
      setError('Select at least one student.');
      return;
    }
    setSavingSa(true);
    setError(null);

    const failures: { studentId: string; message: string }[] = [];
    for (const studentId of saStudentIds) {
      try {
        await api.createStudentTransportAssignment({
          tenant_id: tenantId,
          student_id: studentId,
          route_id: saRouteId,
          stop_id: saStopId,
          academic_year_id: currentYear.id,
        });
      } catch (err) {
        failures.push({
          studentId,
          message: err instanceof ApiError ? err.message : 'Failed to assign',
        });
      }
    }

    setSavingSa(false);

    if (failures.length === 0) {
      resetSaForm();
    } else {
      const succeeded = saStudentIds.length - failures.length;
      const failureText = failures.map((f) => `${studentName(f.studentId)} (${f.message})`).join('; ');
      setError(
        succeeded > 0
          ? `Assigned ${succeeded} of ${saStudentIds.length} students. Failed: ${failureText}`
          : `Failed to assign: ${failureText}`,
      );
      // Leave only the failed students selected so the form can be retried
      // without re-picking everyone who already succeeded.
      setSaStudentIds(failures.map((f) => f.studentId));
    }
    load();
  }

  async function handleDeleteStudentAssignment(id: string) {
    setError(null);
    try {
      await api.deleteStudentTransportAssignment(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete student assignment');
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Route Assignments (Vehicle + Driver)"
        action={
          <Button onClick={() => setShowRaForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> Assign
          </Button>
        }
      >
        {showRaForm && (
          <form
            onSubmit={handleCreateRouteAssignment}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3"
          >
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Route</label>
              <select
                required
                value={raRouteId}
                onChange={(e) => setRaRouteId(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                <option value="">Select…</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Vehicle</label>
              <select
                required
                value={raVehicleId}
                onChange={(e) => setRaVehicleId(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                <option value="">Select…</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration_number}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Driver</label>
              <select
                required
                value={raDriverId}
                onChange={(e) => setRaDriverId(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                <option value="">Select…</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 sm:col-span-3">
              <Button type="submit" disabled={savingRa}>
                {savingRa ? 'Saving…' : 'Assign'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetRaForm} disabled={savingRa}>
                Cancel
              </Button>
            </div>
            <p className="text-caption text-text-secondary sm:col-span-3">
              One vehicle+driver per route per academic year — assigning a route that's already covered this year
              will be rejected.
            </p>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : routeAssignments.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No route assignments yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Route</th>
                  <th className="py-2 px-3 font-medium">Vehicle</th>
                  <th className="py-2 px-3 font-medium">Driver</th>
                  <th className="py-2 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {routeAssignments.map((ra) => (
                  <tr key={ra.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 text-body font-medium text-text-primary">{routeName(ra.route_id)}</td>
                    <td className="py-2 px-3 font-mono text-body text-text-primary">{vehicleReg(ra.vehicle_id)}</td>
                    <td className="py-2 px-3 text-body text-text-primary">{driverName(ra.driver_id)}</td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => handleDeleteRouteAssignment(ra.id)}
                        className="text-text-secondary hover:text-danger"
                        title="Remove assignment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="Student Transport Assignments"
        action={
          <Button onClick={() => setShowSaForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> Assign Students
          </Button>
        }
      >
        {showSaForm && (
          <form
            onSubmit={handleCreateStudentAssignment}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3"
          >
            <div className="sm:col-span-3">
              <label className="mb-1 block text-caption text-text-secondary">Students</label>
              <StudentMultiPicker
                students={students}
                classes={classes}
                value={saStudentIds}
                onChange={setSaStudentIds}
                excludeStudentIds={optedOutStudentIds}
                required
              />
              <p className="mt-1 text-caption text-text-secondary">
                Students opted out of transport by a parent don't appear here.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Route</label>
              <select
                required
                value={saRouteId}
                onChange={(e) => setSaRouteId(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                <option value="">Select…</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Stop</label>
              <select
                required
                value={saStopId}
                onChange={(e) => setSaStopId(e.target.value)}
                disabled={!saRouteId}
                className="w-full rounded-button border border-border px-3 py-2 text-body disabled:opacity-50"
              >
                <option value="">{saRouteId ? 'Select…' : 'Pick a route first'}</option>
                {saStops.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.sequence_order} {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 sm:col-span-3">
              <Button type="submit" disabled={savingSa}>
                {savingSa ? 'Saving…' : `Assign ${saStudentIds.length || ''} Student${saStudentIds.length === 1 ? '' : 's'}`}
              </Button>
              <Button type="button" variant="secondary" onClick={resetSaForm} disabled={savingSa}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : studentAssignments.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No student assignments yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Student</th>
                  <th className="py-2 px-3 font-medium">Route</th>
                  <th className="py-2 px-3 font-medium">Stop</th>
                  <th className="py-2 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {studentAssignments.map((sa) => (
                  <tr key={sa.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 text-body font-medium text-text-primary">
                      {studentName(sa.student_id)}
                    </td>
                    <td className="py-2 px-3 text-body text-text-primary">{routeName(sa.route_id)}</td>
                    <td className="py-2 px-3 text-body text-text-secondary">{stopName(sa.route_id, sa.stop_id)}</td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => handleDeleteStudentAssignment(sa.id)}
                        className="text-text-secondary hover:text-danger"
                        title="Remove assignment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
