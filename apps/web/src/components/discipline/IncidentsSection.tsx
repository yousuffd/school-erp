'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Gauge, ClipboardCheck, HeartHandshake } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import {
  BehaviorIncident,
  IncidentType,
  IncidentStatus,
  PointsBalance,
  CorrectiveAction,
  CounselingReferral,
  Student,
  SchoolClass,
  User,
} from '@/lib/types';
import { StudentPicker } from '@/components/library/StudentPicker';

const TYPE_LABELS: Record<IncidentType, string> = { merit: 'Merit', demerit: 'Demerit' };
const STATUS_LABELS: Record<IncidentStatus, string> = { open: 'Open', resolved: 'Resolved', escalated: 'Escalated' };

function typeTone(t: IncidentType): 'success' | 'danger' {
  return t === 'merit' ? 'success' : 'danger';
}
function statusTone(s: IncidentStatus): 'warning' | 'success' | 'danger' {
  if (s === 'resolved') return 'success';
  if (s === 'escalated') return 'danger';
  return 'warning';
}

export function IncidentsSection() {
  const user = auth.getUser();
  const canCreate = hasPermission(user, 'discipline', 'create');
  const canEdit = hasPermission(user, 'discipline', 'edit');
  const canDelete = hasPermission(user, 'discipline', 'delete');

  const [incidents, setIncidents] = useState<BehaviorIncident[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStudentId, setFilterStudentId] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentType, setIncidentType] = useState<IncidentType>('merit');
  const [points, setPoints] = useState('1');
  const [description, setDescription] = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [balance, setBalance] = useState<PointsBalance | null>(null);
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [referrals, setReferrals] = useState<CounselingReferral[]>([]);

  const [showActionForm, setShowActionForm] = useState(false);
  const [actionDescription, setActionDescription] = useState('');
  const [actionAssignedTo, setActionAssignedTo] = useState('');
  const [actionDueDate, setActionDueDate] = useState('');

  const [showReferralForm, setShowReferralForm] = useState(false);
  const [referralTo, setReferralTo] = useState('');
  const [referralReason, setReferralReason] = useState('');

  function load() {
    if (!user) return;
    setLoading(true);
    Promise.all([
      api.getIncidents(user.tenantId!, filterStudentId || undefined),
      api.getStudents(user.tenantId!),
      api.getClasses(user.tenantId!),
      api.getUsers(user.tenantId!),
    ])
      .then(([i, s, c, u]) => {
        setIncidents(i);
        setStudents(s);
        setClasses(c);
        setStaff(u.filter((usr) => !usr.student_id));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user?.tenantId, filterStudentId]);

  function resetForm() {
    setShowForm(false);
    setStudentId('');
    setIncidentDate('');
    setIncidentType('merit');
    setPoints('1');
    setDescription('');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await api.createIncident({
        tenant_id: user.tenantId!,
        student_id: studentId,
        incident_date: incidentDate,
        incident_type: incidentType,
        points: incidentType === 'merit' ? Math.abs(Number(points)) : -Math.abs(Number(points)),
        description,
      });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create incident');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteIncident(id: string) {
    setError(null);
    try {
      await api.deleteIncident(id);
      if (expandedId === id) setExpandedId(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete incident');
    }
  }

  async function handleStatusChange(id: string, status: IncidentStatus) {
    setError(null);
    try {
      await api.updateIncidentStatus(id, status);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status');
    }
  }

  async function toggleExpand(incident: BehaviorIncident) {
    if (expandedId === incident.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(incident.id);
    setShowActionForm(false);
    setShowReferralForm(false);
    try {
      const [b, a, r] = await Promise.all([
        api.getPointsBalance(incident.student_id),
        api.getCorrectiveActions(incident.id),
        api.getCounselingReferrals(incident.id),
      ]);
      setBalance(b);
      setActions(a);
      setReferrals(r);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load incident detail');
    }
  }

  async function handleAddAction(incidentId: string) {
    if (!user) return;
    setError(null);
    try {
      await api.createCorrectiveAction(incidentId, {
        tenant_id: user.tenantId!,
        description: actionDescription,
        assigned_to: actionAssignedTo,
        due_date: actionDueDate,
      });
      setActionDescription('');
      setActionAssignedTo('');
      setActionDueDate('');
      setShowActionForm(false);
      setActions(await api.getCorrectiveActions(incidentId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add corrective action');
    }
  }

  async function handleCompleteAction(id: string, incidentId: string) {
    setError(null);
    try {
      await api.completeCorrectiveAction(id, new Date().toISOString().slice(0, 10));
      setActions(await api.getCorrectiveActions(incidentId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to complete action');
    }
  }

  async function handleDeleteAction(id: string, incidentId: string) {
    setError(null);
    try {
      await api.deleteCorrectiveAction(id);
      setActions(await api.getCorrectiveActions(incidentId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete action');
    }
  }

  async function handleAddReferral(incidentId: string) {
    if (!user) return;
    setError(null);
    try {
      await api.createCounselingReferral(incidentId, {
        tenant_id: user.tenantId!,
        referred_to: referralTo,
        reason: referralReason,
      });
      setReferralTo('');
      setReferralReason('');
      setShowReferralForm(false);
      setReferrals(await api.getCounselingReferrals(incidentId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add counseling referral');
    }
  }

  async function handleDeleteReferral(id: string, incidentId: string) {
    setError(null);
    try {
      await api.deleteCounselingReferral(id);
      setReferrals(await api.getCounselingReferrals(incidentId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete referral');
    }
  }

  function studentName(id: string) {
    const s = students.find((st) => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : id;
  }
  function staffName(id: string) {
    const s = staff.find((u) => u.id === id);
    return s ? s.name : id;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Behavior Incidents"
        action={
          canCreate ? (
            <Button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="flex items-center gap-1.5">
              <Plus size={16} /> Log Incident
            </Button>
          ) : undefined
        }
      >
        <div className="mb-4 max-w-sm">
          <label className="mb-1 block text-caption text-text-secondary">Filter by Student</label>
          <StudentPicker students={students} classes={classes} value={filterStudentId} onChange={setFilterStudentId} />
        </div>

        {canCreate && showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Student</label>
              <StudentPicker students={students} classes={classes} value={studentId} onChange={setStudentId} />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Date</label>
              <input required type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Type</label>
              <select value={incidentType} onChange={(e) => setIncidentType(e.target.value as IncidentType)} className="w-full rounded-button border border-border px-3 py-2 text-body">
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Points ({incidentType === 'merit' ? '+' : '-'})</label>
              <input required type="number" min={1} value={points} onChange={(e) => setPoints(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-caption text-text-secondary">Description</label>
              <input required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-body" />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving || !studentId}>{saving ? 'Saving…' : 'Log Incident'}</Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>Cancel</Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : incidents.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No incidents recorded.</p>
        ) : (
          <div className="space-y-2">
            {incidents.map((inc) => (
              <div key={inc.id} className="rounded-card border border-border">
                <div className="flex items-center justify-between p-3">
                  <button onClick={() => toggleExpand(inc)} className="flex flex-1 items-center gap-2 text-left">
                    {expandedId === inc.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="text-body font-medium text-text-primary">{studentName(inc.student_id)}</span>
                    <Badge tone={typeTone(inc.incident_type)}>
                      {TYPE_LABELS[inc.incident_type]} ({inc.points > 0 ? '+' : ''}{inc.points})
                    </Badge>
                    <Badge tone={statusTone(inc.status)}>{STATUS_LABELS[inc.status]}</Badge>
                    <span className="text-caption text-text-secondary">{inc.incident_date}</span>
                  </button>
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <select
                        value={inc.status}
                        onChange={(e) => handleStatusChange(inc.id, e.target.value as IncidentStatus)}
                        className="rounded-button border border-border px-2 py-1 text-caption"
                      >
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDeleteIncident(inc.id)} className="text-text-secondary hover:text-danger" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <p className="px-3 pb-3 text-body text-text-secondary">{inc.description}</p>

                {expandedId === inc.id && (
                  <div className="space-y-4 border-t border-border p-3">
                    {balance && (
                      <div className="flex items-center gap-2 rounded-card bg-canvas p-3">
                        <Gauge size={16} className="text-accent" />
                        <span className="text-body text-text-primary">
                          Points balance: <span className="font-semibold">{balance.pointsBalance}</span>
                        </span>
                        <span className="text-caption text-text-secondary">({balance.incidentCount} total incidents)</span>
                      </div>
                    )}

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-caption font-medium text-text-secondary">
                          <ClipboardCheck size={14} /> Corrective Actions
                        </p>
                        {canEdit && (
                          <Button onClick={() => setShowActionForm((s) => !s)} variant="secondary" className="!py-1 !px-2 text-caption">
                            <Plus size={12} /> Add
                          </Button>
                        )}
                      </div>
                      {canEdit && showActionForm && (
                        <div className="mb-3 grid grid-cols-1 gap-2 rounded-card border border-border bg-canvas p-3 sm:grid-cols-3">
                          <input
                            placeholder="Description"
                            value={actionDescription}
                            onChange={(e) => setActionDescription(e.target.value)}
                            className="rounded-button border border-border px-3 py-2 text-body sm:col-span-3"
                          />
                          <select
                            value={actionAssignedTo}
                            onChange={(e) => setActionAssignedTo(e.target.value)}
                            className="rounded-button border border-border px-3 py-2 text-body"
                          >
                            <option value="">Assign to…</option>
                            {staff.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                          <input
                            type="date"
                            value={actionDueDate}
                            onChange={(e) => setActionDueDate(e.target.value)}
                            className="rounded-button border border-border px-3 py-2 text-body"
                          />
                          <Button
                            onClick={() => handleAddAction(inc.id)}
                            disabled={!actionDescription || !actionAssignedTo || !actionDueDate}
                          >
                            Save
                          </Button>
                        </div>
                      )}
                      {actions.length === 0 ? (
                        <p className="text-body text-text-secondary">No corrective actions yet.</p>
                      ) : (
                        <ul className="space-y-1">
                          {actions.map((a) => (
                            <li key={a.id} className="flex items-center justify-between rounded-card border border-border p-2 text-body">
                              <span>
                                {a.description} — <span className="text-text-secondary">{staffName(a.assigned_to)}, due {a.due_date}</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge tone={a.status === 'completed' ? 'success' : 'warning'}>{a.status}</Badge>
                                {canEdit && a.status === 'pending' && (
                                  <button onClick={() => handleCompleteAction(a.id, inc.id)} className="text-text-secondary hover:text-success" title="Mark complete">
                                    <ClipboardCheck size={14} />
                                  </button>
                                )}
                                {canDelete && (
                                  <button onClick={() => handleDeleteAction(a.id, inc.id)} className="text-text-secondary hover:text-danger" title="Delete">
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-caption font-medium text-text-secondary">
                          <HeartHandshake size={14} /> Counseling Referrals
                        </p>
                        {canEdit && (
                          <Button onClick={() => setShowReferralForm((s) => !s)} variant="secondary" className="!py-1 !px-2 text-caption">
                            <Plus size={12} /> Add
                          </Button>
                        )}
                      </div>
                      {canEdit && showReferralForm && (
                        <div className="mb-3 grid grid-cols-1 gap-2 rounded-card border border-border bg-canvas p-3 sm:grid-cols-3">
                          <select
                            value={referralTo}
                            onChange={(e) => setReferralTo(e.target.value)}
                            className="rounded-button border border-border px-3 py-2 text-body"
                          >
                            <option value="">Refer to…</option>
                            {staff.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                          <input
                            placeholder="Reason"
                            value={referralReason}
                            onChange={(e) => setReferralReason(e.target.value)}
                            className="rounded-button border border-border px-3 py-2 text-body sm:col-span-2"
                          />
                          <Button onClick={() => handleAddReferral(inc.id)} disabled={!referralTo || !referralReason}>
                            Save
                          </Button>
                        </div>
                      )}
                      {referrals.length === 0 ? (
                        <p className="text-body text-text-secondary">No counseling referrals yet.</p>
                      ) : (
                        <ul className="space-y-1">
                          {referrals.map((r) => (
                            <li key={r.id} className="flex items-center justify-between rounded-card border border-border p-2 text-body">
                              <span>
                                {r.reason} — <span className="text-text-secondary">{staffName(r.referred_to)}</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge tone={r.status === 'completed' ? 'success' : r.status === 'in_progress' ? 'warning' : 'neutral'}>
                                  {r.status}
                                </Badge>
                                {canDelete && (
                                  <button onClick={() => handleDeleteReferral(r.id, inc.id)} className="text-text-secondary hover:text-danger" title="Delete">
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}