'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardCheck, ClipboardList, Mail, Phone } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { Admission, AdmissionStage } from '@/lib/types';

const STAGE_TONE: Record<AdmissionStage, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  inquiry: 'neutral',
  application_submitted: 'info',
  under_review: 'warning',
  waitlisted: 'warning',
  approved: 'success',
  rejected: 'danger',
  enrolled: 'success',
  withdrawn: 'neutral',
};

// Mirrors the backend's ALLOWED_TRANSITIONS exactly — the backend is the
// real enforcement (see admissions.service.ts), this just keeps the UI from
// offering a transition that would be rejected anyway.
const STAGE_TRANSITIONS: Record<AdmissionStage, AdmissionStage[]> = {
  inquiry: ['application_submitted', 'withdrawn'],
  application_submitted: ['under_review', 'withdrawn'],
  under_review: ['waitlisted', 'approved', 'rejected'],
  waitlisted: ['approved', 'rejected'],
  approved: ['withdrawn'],
  rejected: [],
  enrolled: [],
  withdrawn: [],
};

export default function AdmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [admission, setAdmission] = useState<Admission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [section, setSection] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  function load() {
    setLoading(true);
    api
      .getAdmission(id)
      .then(setAdmission)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load admission'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function handleStageChange(next: AdmissionStage) {
    setUpdating(true);
    setError(null);
    try {
      await api.changeAdmissionStage(id, next);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update stage');
    } finally {
      setUpdating(false);
    }
  }

  async function handleEnroll(e: FormEvent) {
    e.preventDefault();
    setEnrolling(true);
    setError(null);
    try {
      const { student } = await api.enrollAdmission(id, {
        admission_number: admissionNumber,
        section: section || undefined,
      });
      // Enrollment is the whole point of this pipeline — go straight to the
      // new student's profile rather than staying on the (now-terminal)
      // admission record.
      router.push(`/students/${student.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to enroll student');
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <>
        <TopBar title="Admission" />
        <div className="p-6">
          <p className="text-body text-text-secondary">Loading…</p>
        </div>
      </>
    );
  }

  if (error && !admission) {
    return (
      <>
        <TopBar title="Admission" />
        <div className="p-6">
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
            {error}
          </div>
        </div>
      </>
    );
  }

  if (!admission) return null;

  const nextStages = STAGE_TRANSITIONS[admission.stage];

  return (
    <>
      <TopBar
        title={`${admission.applicant_first_name} ${admission.applicant_last_name}`}
        description="Admission application"
      />

      <div className="space-y-6 p-6">
        <button
          onClick={() => router.push('/admissions')}
          className="flex items-center gap-1.5 text-body text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={16} /> Back to Admissions
        </button>

        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-accent-light text-accent">
                <ClipboardList size={36} />
              </div>
              <h2 className="text-card-title font-bold text-text-primary">
                {admission.applicant_first_name} {admission.applicant_last_name}
              </h2>
              <p className="text-body text-text-secondary">Applying for {admission.desired_grade_level}</p>
              <div className="mt-3">
                <Badge tone={STAGE_TONE[admission.stage]}>{admission.stage.replace(/_/g, ' ')}</Badge>
              </div>

              {admission.stage === 'approved' && (
                <div className="mt-4 w-full border-t border-border pt-4">
                  {!showEnrollForm ? (
                    <Button onClick={() => setShowEnrollForm(true)} className="flex w-full items-center justify-center gap-1.5">
                      <ClipboardCheck size={16} /> Enroll Student
                    </Button>
                  ) : (
                    <form onSubmit={handleEnroll} className="space-y-3 text-left">
                      <div>
                        <label className="mb-1 block text-caption text-text-secondary">Admission Number</label>
                        <input
                          required
                          value={admissionNumber}
                          onChange={(e) => setAdmissionNumber(e.target.value)}
                          placeholder="ADM-2026-001"
                          className="w-full rounded-button border border-border px-3 py-2 font-mono text-body"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-caption text-text-secondary">Section (optional)</label>
                        <input
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                          placeholder="A"
                          className="w-full rounded-button border border-border px-3 py-2 text-body"
                        />
                      </div>
                      <Button type="submit" disabled={enrolling} className="w-full">
                        {enrolling ? 'Enrolling…' : 'Confirm Enrollment'}
                      </Button>
                    </form>
                  )}
                </div>
              )}

              {nextStages.length > 0 && admission.stage !== 'approved' && (
                <div className="mt-4 w-full space-y-2 border-t border-border pt-4">
                  <p className="text-caption text-text-secondary">Move to next stage</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {nextStages.map((next) => (
                      <Button
                        key={next}
                        variant="secondary"
                        disabled={updating}
                        onClick={() => handleStageChange(next)}
                      >
                        {next.replace(/_/g, ' ')}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {admission.stage === 'approved' && (
                <div className="mt-3 w-full space-y-2">
                  <Button
                    variant="secondary"
                    disabled={updating}
                    onClick={() => handleStageChange('withdrawn')}
                    className="w-full"
                  >
                    withdrawn
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card title="Applicant Information" className="lg:col-span-2">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-caption text-text-secondary">Date of Birth</dt>
                <dd className="font-mono text-body text-text-primary">{admission.date_of_birth}</dd>
              </div>
              <div>
                <dt className="text-caption text-text-secondary">Source</dt>
                <dd className="text-body capitalize text-text-primary">{admission.source.replace(/_/g, ' ')}</dd>
              </div>
              <div>
                <dt className="text-caption text-text-secondary">Guardian</dt>
                <dd className="text-body text-text-primary">{admission.guardian_name}</dd>
              </div>
              <div>
                <dt className="text-caption text-text-secondary">Guardian Phone</dt>
                <dd className="flex items-center gap-1.5 font-mono text-body text-text-primary">
                  <Phone size={14} className="text-text-secondary" />
                  {admission.guardian_phone}
                </dd>
              </div>
              {admission.guardian_email && (
                <div>
                  <dt className="text-caption text-text-secondary">Guardian Email</dt>
                  <dd className="flex items-center gap-1.5 text-body text-text-primary">
                    <Mail size={14} className="text-text-secondary" />
                    {admission.guardian_email}
                  </dd>
                </div>
              )}
            </dl>
            {admission.notes && (
              <div className="mt-4 rounded-button bg-canvas p-3 text-body text-text-primary">
                <span className="font-medium text-text-secondary">Notes: </span>
                {admission.notes}
              </div>
            )}
          </Card>

          <Card title="Coming Later" className="lg:col-span-3">
            <p className="text-body text-text-secondary">
              Document upload/verification, entrance exam and interview scheduling, and seat/quota rules
              will appear here once those pieces are built — not shown now rather than filled with
              placeholder data.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
