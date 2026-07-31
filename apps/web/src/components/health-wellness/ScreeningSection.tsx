'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { SchoolClass, ScreeningCampaign, ScreeningResult, ScreeningType, Student } from '@/lib/types';
import { StudentPicker } from '@/components/library/StudentPicker';

interface Props {
  tenantId: string;
  canEdit: boolean;
}

const SCREENING_TYPES: ScreeningType[] = ['vision', 'dental', 'bmi', 'other'];

export function ScreeningSection({ tenantId, canEdit }: Props) {
  const [campaigns, setCampaigns] = useState<ScreeningCampaign[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState<ScreeningType>('vision');
  const [campaignDate, setCampaignDate] = useState('');

  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [results, setResults] = useState<ScreeningResult[]>([]);
  const [showResultForm, setShowResultForm] = useState(false);
  const [resultStudentId, setResultStudentId] = useState('');
  const [resultSummary, setResultSummary] = useState('');
  const [resultFlagged, setResultFlagged] = useState(false);
  const [savingResult, setSavingResult] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([api.getScreeningCampaigns(tenantId), api.getStudents(tenantId), api.getClasses(tenantId)])
      .then(([c, s, cl]) => {
        setCampaigns(c);
        setStudents(s);
        setClasses(cl);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  function resetCampaignForm() {
    setShowCampaignForm(false);
    setCampaignName('');
    setCampaignType('vision');
    setCampaignDate('');
  }

  async function handleCreateCampaign(e: FormEvent) {
    e.preventDefault();
    setSavingCampaign(true);
    setError(null);
    try {
      await api.createScreeningCampaign({
        tenant_id: tenantId,
        name: campaignName,
        screening_type: campaignType,
        campaign_date: campaignDate,
      });
      resetCampaignForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create campaign');
    } finally {
      setSavingCampaign(false);
    }
  }

  async function handleSelectCampaign(campaign: ScreeningCampaign) {
    setSelectedCampaignId(campaign.id);
    setShowResultForm(false);
    try {
      const r = await api.getScreeningResultsForCampaign(campaign.id, tenantId);
      setResults(r);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load results');
    }
  }

  function resetResultForm() {
    setShowResultForm(false);
    setResultStudentId('');
    setResultSummary('');
    setResultFlagged(false);
  }

  async function handleCreateResult(e: FormEvent) {
    e.preventDefault();
    setSavingResult(true);
    setError(null);
    try {
      await api.createScreeningResult({
        tenant_id: tenantId,
        campaign_id: selectedCampaignId,
        student_id: resultStudentId,
        result_summary: resultSummary || undefined,
        flagged_for_followup: resultFlagged,
      });
      resetResultForm();
      const r = await api.getScreeningResultsForCampaign(selectedCampaignId, tenantId);
      setResults(r);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to record result');
    } finally {
      setSavingResult(false);
    }
  }

  function studentName(id: string) {
    const s = students.find((st) => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : '—';
  }

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Screening Campaigns"
        action={
          canEdit ? (
            <Button onClick={() => setShowCampaignForm((s) => !s)} className="flex items-center gap-1.5">
              <Plus size={16} /> New Campaign
            </Button>
          ) : undefined
        }
      >
        {canEdit && showCampaignForm && (
          <form
            onSubmit={handleCreateCampaign}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3"
          >
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Campaign Name</label>
              <input
                required
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Vision Screening Nov 2026"
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Type</label>
              <select
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value as ScreeningType)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                {SCREENING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Date</label>
              <input
                required
                type="date"
                value={campaignDate}
                onChange={(e) => setCampaignDate(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div className="flex gap-2 sm:col-span-3">
              <Button type="submit" disabled={savingCampaign}>
                {savingCampaign ? 'Saving…' : 'Create Campaign'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetCampaignForm} disabled={savingCampaign}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : campaigns.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No screening campaigns yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Name</th>
                  <th className="py-2 px-3 font-medium">Type</th>
                  <th className="py-2 px-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => handleSelectCampaign(c)}
                    className={
                      selectedCampaignId === c.id
                        ? 'cursor-pointer border-b border-border bg-accent-light last:border-0'
                        : 'cursor-pointer border-b border-border last:border-0 hover:bg-canvas'
                    }
                  >
                    <td className="py-2 px-3 text-body font-medium text-text-primary">{c.name}</td>
                    <td className="py-2 px-3 text-body text-text-secondary">{c.screening_type}</td>
                    <td className="py-2 px-3 font-mono text-caption text-text-secondary">{c.campaign_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedCampaign && (
        <Card
          title={`Results — ${selectedCampaign.name}`}
          action={
            canEdit ? (
              <Button
                variant="secondary"
                onClick={() => setShowResultForm((s) => !s)}
                className="flex items-center gap-1.5"
              >
                <Plus size={16} /> Record Result
              </Button>
            ) : undefined
          }
        >
          {canEdit && showResultForm && (
            <form
              onSubmit={handleCreateResult}
              className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-2"
            >
              <div className="sm:col-span-2">
                <label className="mb-1 block text-caption text-text-secondary">Student</label>
                <StudentPicker
                  students={students}
                  classes={classes}
                  value={resultStudentId}
                  onChange={setResultStudentId}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-caption text-text-secondary">Result Summary</label>
                <textarea
                  value={resultSummary}
                  onChange={(e) => setResultSummary(e.target.value)}
                  rows={2}
                  className="w-full rounded-button border border-border px-3 py-2 text-body"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-body text-text-primary">
                  <input
                    type="checkbox"
                    checked={resultFlagged}
                    onChange={(e) => setResultFlagged(e.target.checked)}
                  />
                  Flag for follow-up
                </label>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={savingResult}>
                  {savingResult ? 'Saving…' : 'Record Result'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetResultForm} disabled={savingResult}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {results.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">No results recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {results.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-card border border-border p-3">
                  <div>
                    <span className="text-body font-medium text-text-primary">{studentName(r.student_id)}</span>
                    {r.result_summary && (
                      <span className="ml-2 text-caption text-text-secondary">{r.result_summary}</span>
                    )}
                  </div>
                  {r.flagged_for_followup && (
                    <Badge tone="danger">
                      <span className="flex items-center gap-1">
                        <AlertTriangle size={12} /> Follow-up
                      </span>
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
