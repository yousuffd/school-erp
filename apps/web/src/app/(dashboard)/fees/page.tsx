'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Receipt, Users2 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { FeeStructure, SchoolClass } from '@/lib/types';
import { FeesSelfServiceView } from '@/components/fees/FeesSelfServiceView';

interface ComponentRow {
  name: string;
  amount: string;
}
interface InstallmentRow {
  label: string;
  due_date: string;
  amount: string;
}

export default function FeesPage() {
  const user = auth.getUser();
  const isSelfService = user?.role === 'Parent';
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [components, setComponents] = useState<ComponentRow[]>([{ name: '', amount: '' }]);
  const [installments, setInstallments] = useState<InstallmentRow[]>([
    { label: '', due_date: '', amount: '' },
  ]);

  const [bulkAssignFor, setBulkAssignFor] = useState<string | null>(null);
  const [bulkClassId, setBulkClassId] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  function load() {
    if (!user) return;
    setLoading(true);
    Promise.all([api.getFeeStructures(user.tenantId!), api.getClasses(user.tenantId!)])
      .then(([s, c]) => {
        setStructures(s);
        setClasses(c);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user?.tenantId]);

  const componentTotal = components.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const installmentTotal = installments.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
  const totalsMatch = Math.abs(componentTotal - installmentTotal) < 0.01;

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const years = await api.getAcademicYears(user.tenantId!);
      const currentYear = years.find((y) => y.is_current) ?? years[0];
      if (!currentYear) {
        setError('No academic year exists yet — create one under Settings first.');
        setSaving(false);
        return;
      }
      await api.createFeeStructure({
        tenant_id: user.tenantId!,
        academic_year_id: currentYear.id,
        grade_level: gradeLevel,
        name,
        components: components.filter((c) => c.name && c.amount),
        installments: installments.filter((i) => i.label && i.due_date && i.amount),
      });
      setShowForm(false);
      setName('');
      setGradeLevel('');
      setComponents([{ name: '', amount: '' }]);
      setInstallments([{ label: '', due_date: '', amount: '' }]);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create fee structure');
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkAssign(structureId: string) {
    if (!bulkClassId) return;
    setBulkAssigning(true);
    setBulkResult(null);
    try {
      const result = await api.bulkAssignFee(bulkClassId, structureId);
      setBulkResult(`Assigned to ${result.assigned} student(s), skipped ${result.skipped} already assigned.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to bulk-assign fee structure');
    } finally {
      setBulkAssigning(false);
    }
  }

  if (isSelfService) {
    return (
      <>
        <TopBar
          title="Fees & Payments"
          description="View your child's fee balance, installments, and payment history."
        />
        <div className="p-6">
          <FeesSelfServiceView />
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Fees & Payments"
        description="Fee structures (templates) get applied to students or whole classes — individual payments are recorded on each student's profile."
      />

      <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
            {error}
          </div>
        )}

        <Card
          title="Fee Structures"
          action={
            <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
              <Plus size={16} /> New Fee Structure
            </Button>
          }
        >
          {showForm && (
            <form onSubmit={handleCreate} className="mb-5 space-y-4 rounded-card border border-border bg-canvas p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-caption text-text-secondary">Structure Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Grade 5 Fees 2026-27"
                    className="w-full rounded-button border border-border px-3 py-2 text-body"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-caption text-text-secondary">Grade Level</label>
                  <input
                    required
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    placeholder="Grade 5"
                    className="w-full rounded-button border border-border px-3 py-2 text-body"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-caption font-medium text-text-secondary">
                    Fee Components (total: {componentTotal.toFixed(2)})
                  </label>
                  <button
                    type="button"
                    onClick={() => setComponents([...components, { name: '', amount: '' }])}
                    className="text-caption text-accent hover:underline"
                  >
                    + Add component
                  </button>
                </div>
                {components.map((c, i) => (
                  <div key={i} className="mb-2 flex gap-2">
                    <input
                      value={c.name}
                      onChange={(e) => {
                        const next = [...components];
                        next[i] = { ...next[i], name: e.target.value };
                        setComponents(next);
                      }}
                      placeholder="Tuition"
                      className="flex-1 rounded-button border border-border px-3 py-2 text-body"
                    />
                    <input
                      value={c.amount}
                      onChange={(e) => {
                        const next = [...components];
                        next[i] = { ...next[i], amount: e.target.value };
                        setComponents(next);
                      }}
                      placeholder="30000"
                      className="w-32 rounded-button border border-border px-3 py-2 font-mono text-body"
                    />
                  </div>
                ))}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-caption font-medium text-text-secondary">
                    Installment Plan (total: {installmentTotal.toFixed(2)})
                  </label>
                  <button
                    type="button"
                    onClick={() => setInstallments([...installments, { label: '', due_date: '', amount: '' }])}
                    className="text-caption text-accent hover:underline"
                  >
                    + Add installment
                  </button>
                </div>
                {installments.map((inst, i) => (
                  <div key={i} className="mb-2 flex gap-2">
                    <input
                      value={inst.label}
                      onChange={(e) => {
                        const next = [...installments];
                        next[i] = { ...next[i], label: e.target.value };
                        setInstallments(next);
                      }}
                      placeholder="Term 1"
                      className="flex-1 rounded-button border border-border px-3 py-2 text-body"
                    />
                    <input
                      type="date"
                      value={inst.due_date}
                      onChange={(e) => {
                        const next = [...installments];
                        next[i] = { ...next[i], due_date: e.target.value };
                        setInstallments(next);
                      }}
                      className="rounded-button border border-border px-3 py-2 text-body"
                    />
                    <input
                      value={inst.amount}
                      onChange={(e) => {
                        const next = [...installments];
                        next[i] = { ...next[i], amount: e.target.value };
                        setInstallments(next);
                      }}
                      placeholder="15000"
                      className="w-32 rounded-button border border-border px-3 py-2 font-mono text-body"
                    />
                  </div>
                ))}
                {!totalsMatch && (
                  <p className="text-caption text-danger">
                    Installments ({installmentTotal.toFixed(2)}) must add up to the same total as components (
                    {componentTotal.toFixed(2)}).
                  </p>
                )}
              </div>

              <Button type="submit" disabled={saving || !totalsMatch}>
                {saving ? 'Saving…' : 'Save Fee Structure'}
              </Button>
            </form>
          )}

          {loading ? (
            <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
          ) : structures.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">No fee structures yet.</p>
          ) : (
            <div className="space-y-4">
              {structures.map((s) => {
                const total = s.components.reduce((sum, c) => sum + parseFloat(c.amount), 0);
                return (
                  <div key={s.id} className="rounded-card border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 font-medium text-text-primary">
                          <Receipt size={16} className="text-accent" />
                          {s.name}
                        </div>
                        <p className="text-caption text-text-secondary">
                          {s.grade_level} · Total: {total.toFixed(2)} · {s.installments.length} installment(s)
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => setBulkAssignFor(bulkAssignFor === s.id ? null : s.id)}
                        className="flex items-center gap-1.5"
                      >
                        <Users2 size={14} /> Assign to Class
                      </Button>
                    </div>

                    {bulkAssignFor === s.id && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-button bg-canvas p-3">
                        <select
                          value={bulkClassId}
                          onChange={(e) => setBulkClassId(e.target.value)}
                          className="rounded-button border border-border px-2 py-1.5 text-body"
                        >
                          <option value="">Select a class…</option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.grade_level}
                              {c.section ? ` - ${c.section}` : ''}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="secondary"
                          disabled={!bulkClassId || bulkAssigning}
                          onClick={() => handleBulkAssign(s.id)}
                        >
                          {bulkAssigning ? 'Assigning…' : 'Assign'}
                        </Button>
                        {bulkResult && <span className="text-caption text-text-secondary">{bulkResult}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
