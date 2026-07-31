'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, ClipboardCheck, Scale, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { PerformanceReviewCycle, PerformanceReview, Employee } from '@/lib/types';

interface Props {
  tenantId: string;
}

const CYCLE_STATUS_TONE: Record<PerformanceReviewCycle['status'], 'info' | 'warning' | 'success'> = {
  open: 'info',
  calibrating: 'warning',
  closed: 'success',
};

export function PerformanceReviewsSection({ tenantId }: Props) {
  const [cycles, setCycles] = useState<PerformanceReviewCycle[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCycleForm, setShowCycleForm] = useState(false);
  const [cycleName, setCycleName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [savingCycle, setSavingCycle] = useState(false);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewEmployeeId, setReviewEmployeeId] = useState('');
  const [reviewerId, setReviewerId] = useState('');
  const [reviewerType, setReviewerType] = useState<PerformanceReview['reviewer_type']>('manager');
  const [rating, setRating] = useState('3');
  const [comments, setComments] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const selectedCycle = cycles.find((c) => c.id === selectedCycleId);

  function employeeLabel(id: string) {
    return employees.find((e) => e.id === id)?.name ?? id;
  }

  function load() {
    setLoading(true);
    Promise.all([api.getReviewCycles(tenantId), api.getEmployees(tenantId)])
      .then(([c, e]) => {
        setCycles(c);
        setEmployees(e);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load performance reviews'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  useEffect(() => {
    if (!selectedCycleId) {
      setReviews([]);
      return;
    }
    api.getReviewsForCycle(selectedCycleId).then(setReviews).catch(() => setReviews([]));
  }, [selectedCycleId]);

  async function handleCreateCycle(e: FormEvent) {
    e.preventDefault();
    setSavingCycle(true);
    setError(null);
    try {
      await api.createReviewCycle({ tenant_id: tenantId, cycle_name: cycleName, start_date: startDate, end_date: endDate });
      setCycleName('');
      setStartDate('');
      setEndDate('');
      setShowCycleForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create cycle');
    } finally {
      setSavingCycle(false);
    }
  }

  async function handleStartCalibration() {
    if (!selectedCycleId) return;
    try {
      await api.startCalibration(selectedCycleId);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to start calibration');
    }
  }

  async function handleCloseCycle() {
    if (!selectedCycleId) return;
    try {
      await api.closeReviewCycle(selectedCycleId);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to close cycle');
    }
  }

  async function handleCreateReview(e: FormEvent) {
    e.preventDefault();
    if (!selectedCycleId) return;
    setSavingReview(true);
    setError(null);
    try {
      await api.createPerformanceReview({
        tenant_id: tenantId,
        cycle_id: selectedCycleId,
        employee_id: reviewEmployeeId,
        reviewer_id: reviewerId,
        reviewer_type: reviewerType,
        rating: Number(rating),
        comments: comments || undefined,
      });
      setReviewEmployeeId('');
      setReviewerId('');
      setComments('');
      setShowReviewForm(false);
      const updated = await api.getReviewsForCycle(selectedCycleId);
      setReviews(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit review');
    } finally {
      setSavingReview(false);
    }
  }

  async function handleCalibrate(reviewId: string, value: string) {
    try {
      await api.calibrateReview(reviewId, Number(value));
      if (selectedCycleId) setReviews(await api.getReviewsForCycle(selectedCycleId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to calibrate review');
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Review Cycles"
        action={
          <Button onClick={() => setShowCycleForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> New Cycle
          </Button>
        }
      >
        {showCycleForm && (
          <form onSubmit={handleCreateCycle} className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Cycle Name</label>
              <input required value={cycleName} onChange={(e) => setCycleName(e.target.value)} placeholder="H1 2026 Review" className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Start Date</label>
              <input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">End Date</label>
              <input required type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" disabled={savingCycle}>{savingCycle ? 'Saving…' : 'Save Cycle'}</Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : cycles.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No review cycles yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cycles.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCycleId(c.id === selectedCycleId ? '' : c.id)}
                className={`rounded-card border p-4 text-left transition-colors ${selectedCycleId === c.id ? 'border-accent bg-accent-light' : 'border-border hover:bg-canvas'}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <ClipboardCheck size={18} className="text-accent" />
                  <Badge tone={CYCLE_STATUS_TONE[c.status]}>{c.status}</Badge>
                </div>
                <div className="font-medium text-text-primary">{c.cycle_name}</div>
                <div className="text-caption text-text-secondary">{c.start_date} → {c.end_date}</div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {selectedCycle && (
        <Card
          title={`Reviews — ${selectedCycle.cycle_name}`}
          action={
            <div className="flex items-center gap-2">
              {selectedCycle.status === 'open' && (
                <Button onClick={() => setShowReviewForm((s) => !s)} className="flex items-center gap-1.5">
                  <Plus size={16} /> Add Review
                </Button>
              )}
              {selectedCycle.status === 'open' && (
                <Button variant="secondary" onClick={handleStartCalibration} className="flex items-center gap-1.5">
                  <Scale size={14} /> Start Calibration
                </Button>
              )}
              {selectedCycle.status === 'calibrating' && (
                <Button variant="secondary" onClick={handleCloseCycle} className="flex items-center gap-1.5">
                  <Lock size={14} /> Close Cycle
                </Button>
              )}
            </div>
          }
        >
          {showReviewForm && (
            <form onSubmit={handleCreateReview} className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-5">
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Employee</label>
                <select required value={reviewEmployeeId} onChange={(e) => setReviewEmployeeId(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body">
                  <option value="">Select</option>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Reviewer</label>
                <select required value={reviewerId} onChange={(e) => setReviewerId(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body">
                  <option value="">Select</option>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Reviewer Type</label>
                <select value={reviewerType} onChange={(e) => setReviewerType(e.target.value as PerformanceReview['reviewer_type'])} className="w-full rounded-button border border-border px-3 py-2 text-body">
                  <option value="self">Self</option>
                  <option value="peer">Peer</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Rating (1–5)</label>
                <input required type="number" min={1} max={5} value={rating} onChange={(e) => setRating(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
              </div>
              <div>
                <label className="mb-1 block text-caption text-text-secondary">Comments</label>
                <input value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Optional" className="w-full rounded-button border border-border px-3 py-2 text-body" />
              </div>
              <div className="sm:col-span-5">
                <Button type="submit" disabled={savingReview}>{savingReview ? 'Saving…' : 'Submit Review'}</Button>
              </div>
            </form>
          )}

          {reviews.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">No reviews submitted for this cycle yet.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-caption text-text-secondary">
                  <th className="py-2 pr-4 font-medium">Employee</th>
                  <th className="py-2 pr-4 font-medium">Reviewer</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Rating</th>
                  <th className="py-2 pr-4 font-medium">Calibrated</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 font-medium text-text-primary">{employeeLabel(r.employee_id)}</td>
                    <td className="py-3 pr-4 text-body text-text-secondary">{employeeLabel(r.reviewer_id)}</td>
                    <td className="py-3 pr-4 text-body capitalize text-text-secondary">{r.reviewer_type}</td>
                    <td className="py-3 pr-4 text-body text-text-secondary">{r.rating} / 5</td>
                    <td className="py-3 pr-4">
                      {selectedCycle.status === 'calibrating' ? (
                        <select
                          defaultValue={r.calibrated_rating ?? ''}
                          onChange={(e) => e.target.value && handleCalibrate(r.id, e.target.value)}
                          className="rounded-button border border-border px-2 py-1 text-caption"
                        >
                          <option value="">Set…</option>
                          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      ) : (
                        <span className="text-body text-text-secondary">{r.calibrated_rating != null ? `${r.calibrated_rating} / 5` : '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}