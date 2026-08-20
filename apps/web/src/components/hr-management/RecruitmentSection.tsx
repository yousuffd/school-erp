'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Briefcase, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { JobOpening, Applicant } from '@/lib/types';
import { todayLocalDateStr } from '@/lib/local-date';

interface Props {
  tenantId: string;
}

const STAGE_TONE: Record<Applicant['stage'], 'info' | 'warning' | 'success' | 'danger'> = {
  applied: 'info',
  screening: 'info',
  interview: 'warning',
  offered: 'warning',
  hired: 'success',
  rejected: 'danger',
};

export function RecruitmentSection({ tenantId }: Props) {
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showJobForm, setShowJobForm] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDepartment, setJobDepartment] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [savingJob, setSavingJob] = useState(false);

  const [showApplicantForm, setShowApplicantForm] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [savingApplicant, setSavingApplicant] = useState(false);

  const [hiringId, setHiringId] = useState<string | null>(null);
  const [hireDepartment, setHireDepartment] = useState('');
  const [hireDesignation, setHireDesignation] = useState('');
  const [hireDate, setHireDate] = useState(new Date().toISOString().slice(0, 10));
  const [hiring, setHiring] = useState(false);

  function jobLabel(id: string) {
    return jobOpenings.find((j) => j.id === id)?.title ?? id;
  }

  function load() {
    setLoading(true);
    Promise.all([api.getJobOpenings(tenantId), api.getApplicants(tenantId)])
      .then(([jobs, apps]) => {
        setJobOpenings(jobs);
        setApplicants(apps);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load recruitment data'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  async function handleCreateJob(e: FormEvent) {
    e.preventDefault();
    setSavingJob(true);
    setError(null);
    try {
      await api.createJobOpening({ tenant_id: tenantId, title: jobTitle, department: jobDepartment, description: jobDescription || undefined });
      setJobTitle('');
      setJobDepartment('');
      setJobDescription('');
      setShowJobForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create job opening');
    } finally {
      setSavingJob(false);
    }
  }

  async function handleToggleJobStatus(job: JobOpening) {
    try {
      await api.updateJobOpeningStatus(job.id, job.status === 'open' ? 'closed' : 'open');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update job opening');
    }
  }

  async function handleCreateApplicant(e: FormEvent) {
    e.preventDefault();
    if (!selectedJobId) return;
    setSavingApplicant(true);
    setError(null);
    try {
      await api.createApplicant({
        tenant_id: tenantId,
        job_opening_id: selectedJobId,
        name: applicantName,
        email: applicantEmail,
        phone: applicantPhone || undefined,
      });
      setApplicantName('');
      setApplicantEmail('');
      setApplicantPhone('');
      setShowApplicantForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add applicant');
    } finally {
      setSavingApplicant(false);
    }
  }

  async function handleAdvanceStage(applicant: Applicant, stage: Applicant['stage']) {
    try {
      await api.updateApplicantStage(applicant.id, stage);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update stage');
    }
  }

  function startHire(applicant: Applicant) {
    setHiringId(applicant.id);
    setHireDepartment(jobOpenings.find((j) => j.id === applicant.job_opening_id)?.department ?? '');
    setHireDesignation('');
    setHireDate(new Date().toISOString().slice(0, 10));
  }

  async function handleHire(e: FormEvent) {
    e.preventDefault();
    if (!hiringId) return;
    setHiring(true);
    setError(null);
    try {
      await api.hireApplicant(hiringId, {
        department: hireDepartment,
        designation: hireDesignation,
        date_of_joining: hireDate,
      });
      setHiringId(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to hire applicant');
    } finally {
      setHiring(false);
    }
  }

  const filteredApplicants = selectedJobId ? applicants.filter((a) => a.job_opening_id === selectedJobId) : applicants;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Job Openings"
        action={
          <Button onClick={() => setShowJobForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> New Opening
          </Button>
        }
      >
        {showJobForm && (
          <form onSubmit={handleCreateJob} className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Title</label>
              <input required value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Department</label>
              <input required value={jobDepartment} onChange={(e) => setJobDepartment(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Description</label>
              <input value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Optional" className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" disabled={savingJob}>{savingJob ? 'Saving…' : 'Save Opening'}</Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : jobOpenings.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No job openings yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobOpenings.map((j) => (
              <button
                key={j.id}
                onClick={() => setSelectedJobId(j.id === selectedJobId ? '' : j.id)}
                className={`rounded-card border p-4 text-left transition-colors ${selectedJobId === j.id ? 'border-accent bg-accent-light' : 'border-border hover:bg-canvas'}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <Briefcase size={18} className="text-accent" />
                  <Badge tone={j.status === 'open' ? 'success' : undefined}>{j.status}</Badge>
                </div>
                <div className="font-medium text-text-primary">{j.title}</div>
                <div className="text-caption text-text-secondary">{j.department}</div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleToggleJobStatus(j); }}
                  className="mt-2 text-caption text-accent hover:opacity-80"
                >
                  Mark {j.status === 'open' ? 'Closed' : 'Open'}
                </button>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card
        title={selectedJobId ? `Applicants — ${jobLabel(selectedJobId)}` : 'All Applicants'}
        action={
          selectedJobId && (
            <Button onClick={() => setShowApplicantForm((s) => !s)} className="flex items-center gap-1.5">
              <Plus size={16} /> Add Applicant
            </Button>
          )
        }
      >
        {!selectedJobId && (
          <p className="mb-4 text-caption text-text-secondary">Select a job opening above to add applicants to it.</p>
        )}

        {showApplicantForm && selectedJobId && (
          <form onSubmit={handleCreateApplicant} className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Name</label>
              <input required value={applicantName} onChange={(e) => setApplicantName(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Email</label>
              <input required type="email" value={applicantEmail} onChange={(e) => setApplicantEmail(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Phone</label>
              <input value={applicantPhone} onChange={(e) => setApplicantPhone(e.target.value)} placeholder="Optional" className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" disabled={savingApplicant}>{savingApplicant ? 'Saving…' : 'Add Applicant'}</Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : filteredApplicants.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No applicants yet.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-caption text-text-secondary">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Opening</th>
                <th className="py-2 pr-4 font-medium">Stage</th>
                <th className="py-2 pr-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplicants.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-text-primary">{a.name}</div>
                    <div className="text-caption text-text-secondary">{a.email}</div>
                  </td>
                  <td className="py-3 pr-4 text-body text-text-secondary">{jobLabel(a.job_opening_id)}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={STAGE_TONE[a.stage]}>{a.stage}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    {a.stage !== 'hired' && a.stage !== 'rejected' && (
                      <div className="flex justify-end gap-2">
                        {a.stage !== 'offered' && (
                          <select
                            value=""
                            onChange={(e) => e.target.value && handleAdvanceStage(a, e.target.value as Applicant['stage'])}
                            className="rounded-button border border-border px-2 py-1 text-caption"
                          >
                            <option value="">Move to…</option>
                            {['screening', 'interview', 'offered', 'rejected'].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}
                        <Button variant="secondary" onClick={() => startHire(a)} className="flex items-center gap-1.5">
                          <UserCheck size={14} /> Hire
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {hiringId && (
          <form onSubmit={handleHire} className="mt-5 grid grid-cols-1 gap-4 rounded-card border border-accent/30 bg-accent-light p-4 sm:grid-cols-4">
            <div className="sm:col-span-4 text-caption font-medium text-text-primary">
              Hiring {applicants.find((a) => a.id === hiringId)?.name}
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Department</label>
              <input required value={hireDepartment} onChange={(e) => setHireDepartment(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Designation</label>
              <input required value={hireDesignation} onChange={(e) => setHireDesignation(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Date of Joining</label>
              <input required type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={hiring}>{hiring ? 'Hiring…' : 'Confirm Hire'}</Button>
              <Button type="button" variant="secondary" onClick={() => setHiringId(null)}>Cancel</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}