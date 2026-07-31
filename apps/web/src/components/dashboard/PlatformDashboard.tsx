'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { Tenant, FeatureToggle, TenantSubscription, PaymentRecord, PlanTier, PaymentMode } from '@/lib/types';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  active: 'success',
  provisioning: 'info',
  suspended: 'warning',
  offboarded: 'danger',
};

const TIER_OPTIONS: PlanTier[] = ['starter', 'growth', 'enterprise', 'platform'];
const PAYMENT_MODE_OPTIONS: PaymentMode[] = ['bank_transfer', 'card', 'cheque', 'invoice', 'other'];

interface TenantExpandedState {
  toggles?: FeatureToggle[];
  toggleError?: string;
  subscription?: TenantSubscription | null;
  subscriptionLoaded?: boolean;
  subscriptionError?: string;
  payments?: PaymentRecord[];
  paymentsError?: string;
}

export function PlatformDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dataByTenant, setDataByTenant] = useState<Record<string, TenantExpandedState>>({});
  const [sectionLoading, setSectionLoading] = useState<Record<string, boolean>>({});
  const [tierChanging, setTierChanging] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  useEffect(() => {
    api
      .getPlatformTenants()
      .then(setTenants)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load tenants'))
      .finally(() => setLoading(false));
  }, []);

  function updateTenantData(tenantId: string, patch: Partial<TenantExpandedState>) {
    setDataByTenant((prev) => ({ ...prev, [tenantId]: { ...prev[tenantId], ...patch } }));
  }

  function loadSubscription(tenantId: string) {
    setSectionLoading((prev) => ({ ...prev, [`${tenantId}-sub`]: true }));
    api
      .getPlatformTenantSubscription(tenantId)
      .then((subscription) => updateTenantData(tenantId, { subscription, subscriptionLoaded: true }))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          updateTenantData(tenantId, { subscription: null, subscriptionLoaded: true });
        } else {
          updateTenantData(tenantId, {
            subscriptionError: err instanceof ApiError ? err.message : 'Failed to load subscription',
          });
        }
      })
      .finally(() => setSectionLoading((prev) => ({ ...prev, [`${tenantId}-sub`]: false })));
  }

  function loadExpandedData(tenantId: string) {
    const existing = dataByTenant[tenantId];
    if (existing?.toggles === undefined && !existing?.toggleError) {
      setSectionLoading((prev) => ({ ...prev, [`${tenantId}-toggles`]: true }));
      api
        .getPlatformTenantToggles(tenantId)
        .then((toggles) => updateTenantData(tenantId, { toggles }))
        .catch((err) =>
          updateTenantData(tenantId, {
            toggleError: err instanceof ApiError ? err.message : 'Failed to load module toggles',
          }),
        )
        .finally(() => setSectionLoading((prev) => ({ ...prev, [`${tenantId}-toggles`]: false })));
    }
    if (!existing?.subscriptionLoaded && !existing?.subscriptionError) {
      loadSubscription(tenantId);
    }
    if (existing?.payments === undefined && !existing?.paymentsError) {
      setSectionLoading((prev) => ({ ...prev, [`${tenantId}-payments`]: true }));
      api
        .getPlatformTenantPayments(tenantId)
        .then((payments) => updateTenantData(tenantId, { payments }))
        .catch((err) =>
          updateTenantData(tenantId, {
            paymentsError: err instanceof ApiError ? err.message : 'Failed to load payments',
          }),
        )
        .finally(() => setSectionLoading((prev) => ({ ...prev, [`${tenantId}-payments`]: false })));
    }
  }

  function toggleExpand(tenantId: string) {
    if (expandedId === tenantId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(tenantId);
    setShowPaymentForm(null);
    loadExpandedData(tenantId);
  }

  function handleTierChange(tenantId: string, newTier: PlanTier) {
    setTierChanging(tenantId);
    api
      .changePlatformTenantTier(tenantId, newTier)
      .then((subscription) => updateTenantData(tenantId, { subscription, subscriptionLoaded: true }))
      .catch((err) => {
        updateTenantData(tenantId, {
          subscriptionError: err instanceof ApiError ? err.message : 'Failed to change tier',
        });
      })
      .finally(() => setTierChanging(null));
  }

  function handleCancelSubscription(tenantId: string) {
    setCancelling(tenantId);
    api
      .cancelPlatformTenantSubscription(tenantId)
      .then(() => updateTenantData(tenantId, { subscription: null, subscriptionLoaded: true }))
      .catch((err) => {
        updateTenantData(tenantId, {
          subscriptionError: err instanceof ApiError ? err.message : 'Failed to cancel subscription',
        });
      })
      .finally(() => setCancelling(null));
  }

  function handleVoidPayment(tenantId: string, paymentId: string) {
    setVoidingId(paymentId);
    api
      .voidPlatformTenantPayment(tenantId, paymentId)
      .then((voided) => {
        const current = dataByTenant[tenantId]?.payments ?? [];
        updateTenantData(tenantId, {
          payments: current.map((p) => (p.id === paymentId ? voided : p)),
        });
      })
      .catch((err) => {
        updateTenantData(tenantId, {
          paymentsError: err instanceof ApiError ? err.message : 'Failed to void payment',
        });
      })
      .finally(() => setVoidingId(null));
  }

  function handlePaymentSubmit(tenantId: string, e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      payment_mode: formData.get('payment_mode') as PaymentMode,
      amount: formData.get('amount') as string,
      payment_date: formData.get('payment_date') as string,
      notes: (formData.get('notes') as string) || undefined,
    };
    setPaymentSubmitting(true);
    api
      .recordPlatformTenantPayment(tenantId, payload)
      .then((newPayment) => {
        updateTenantData(tenantId, {
          payments: [newPayment, ...(dataByTenant[tenantId]?.payments ?? [])],
        });
        setShowPaymentForm(null);
        form.reset();
      })
      .catch((err) => {
        updateTenantData(tenantId, {
          paymentsError: err instanceof ApiError ? err.message : 'Failed to record payment',
        });
      })
      .finally(() => setPaymentSubmitting(false));
  }

  return (
    <div className="space-y-6 p-6">
      <Card title={`Tenants (${loading ? '…' : tenants.length})`}>
        {error && (
          <p className="rounded-button bg-danger/10 px-3 py-2 text-body text-danger">{error}</p>
        )}
        {loading ? (
          <p className="py-10 text-center text-body text-text-secondary">Loading tenants…</p>
        ) : tenants.length === 0 ? (
          <p className="py-10 text-center text-body text-text-secondary">No tenants provisioned yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {tenants.map((tenant) => {
              const isExpanded = expandedId === tenant.id;
              const data = dataByTenant[tenant.id] ?? {};
              const disabledToggles = data.toggles?.filter((t) => !t.enabled) ?? [];

              return (
                <div key={tenant.id}>
                  <button
                    type="button"
                    onClick={() => toggleExpand(tenant.id)}
                    className="flex w-full items-center justify-between py-3 text-left hover:bg-canvas"
                  >
                    <span className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span>
                        <div className="text-body font-medium text-text-primary">{tenant.school_name}</div>
                        <div className="text-caption text-text-secondary">{tenant.subdomain}</div>
                      </span>
                    </span>
                    <Badge tone={STATUS_TONE[tenant.status] ?? 'info'}>{tenant.status}</Badge>
                  </button>

                  {isExpanded && (
                    <div className="space-y-4 pb-4 pl-6">
                      <div>
                        <div className="mb-1 text-caption font-semibold uppercase tracking-wide text-text-secondary">
                          Modules
                        </div>
                        {sectionLoading[`${tenant.id}-toggles`] ? (
                          <p className="text-caption text-text-secondary">Loading module toggles…</p>
                        ) : data.toggleError ? (
                          <p className="text-caption text-danger">{data.toggleError}</p>
                        ) : disabledToggles.length === 0 ? (
                          <p className="text-caption text-text-secondary">All modules enabled (no overrides).</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {disabledToggles.map((t) => (
                              <Badge key={t.id} tone="warning">
                                {t.feature_key} — disabled
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="mb-1 text-caption font-semibold uppercase tracking-wide text-text-secondary">
                          Plan Tier
                        </div>
                        {sectionLoading[`${tenant.id}-sub`] ? (
                          <p className="text-caption text-text-secondary">Loading subscription…</p>
                        ) : data.subscriptionError ? (
                          <p className="text-caption text-danger">{data.subscriptionError}</p>
                        ) : data.subscription === null ? (
                          <div className="flex items-center gap-3">
                            <Badge tone="danger">No active plan</Badge>
                            <select
                              className="rounded-button border border-border px-2 py-1 text-caption text-text-primary"
                              value=""
                              disabled={tierChanging === tenant.id}
                              onChange={(e) => {
                                const newTier = e.target.value as PlanTier;
                                if (newTier) handleTierChange(tenant.id, newTier);
                              }}
                            >
                              <option value="">
                                {tierChanging === tenant.id ? 'Setting…' : 'Set tier…'}
                              </option>
                              {TIER_OPTIONS.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : data.subscription ? (
                          <div className="flex items-center gap-3">
                            <Badge tone="info">{data.subscription.plan_tier}</Badge>
                            <select
                              className="rounded-button border border-border px-2 py-1 text-caption text-text-primary"
                              value=""
                              disabled={tierChanging === tenant.id}
                              onChange={(e) => {
                                const newTier = e.target.value as PlanTier;
                                if (newTier) handleTierChange(tenant.id, newTier);
                              }}
                            >
                              <option value="">
                                {tierChanging === tenant.id ? 'Changing…' : 'Change tier to…'}
                              </option>
                              {TIER_OPTIONS.filter((t) => t !== data.subscription!.plan_tier).map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={cancelling === tenant.id}
                              onClick={() => handleCancelSubscription(tenant.id)}
                              className="text-caption text-danger underline underline-offset-2"
                            >
                              {cancelling === tenant.id ? 'Cancelling…' : 'Cancel subscription'}
                            </button>
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-caption font-semibold uppercase tracking-wide text-text-secondary">
                            Payments
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setShowPaymentForm(showPaymentForm === tenant.id ? null : tenant.id)
                            }
                            className="text-caption text-accent underline underline-offset-2"
                          >
                            {showPaymentForm === tenant.id ? 'Cancel' : '+ Record payment'}
                          </button>
                        </div>

                        {showPaymentForm === tenant.id && (
                          <form
                            onSubmit={(e) => handlePaymentSubmit(tenant.id, e)}
                            className="mb-3 space-y-2 rounded-button border border-border p-3"
                          >
                            <div className="flex gap-2">
                              <select
                                name="payment_mode"
                                required
                                className="flex-1 rounded-button border border-border px-2 py-1 text-caption"
                              >
                                {PAYMENT_MODE_OPTIONS.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>
                              <input
                                name="amount"
                                type="number"
                                step="0.01"
                                required
                                placeholder="Amount"
                                className="w-28 rounded-button border border-border px-2 py-1 text-caption"
                              />
                              <input
                                name="payment_date"
                                type="date"
                                required
                                className="rounded-button border border-border px-2 py-1 text-caption"
                              />
                            </div>
                            <input
                              name="notes"
                              type="text"
                              placeholder="Notes (optional)"
                              className="w-full rounded-button border border-border px-2 py-1 text-caption"
                            />
                            <Button type="submit" disabled={paymentSubmitting}>
                              {paymentSubmitting ? 'Saving…' : 'Save Payment'}
                            </Button>
                          </form>
                        )}

                        {sectionLoading[`${tenant.id}-payments`] ? (
                          <p className="text-caption text-text-secondary">Loading payments…</p>
                        ) : data.paymentsError ? (
                          <p className="text-caption text-danger">{data.paymentsError}</p>
                        ) : !data.payments || data.payments.length === 0 ? (
                          <p className="text-caption text-text-secondary">No payments recorded yet.</p>
                        ) : (
                          <table className="w-full text-left text-caption">
                            <tbody>
                              {data.payments.map((p) => {
                                const isVoided = !!p.voided_at;
                                return (
                                  <tr
                                    key={p.id}
                                    className={`border-b border-border last:border-0 ${isVoided ? 'text-text-secondary line-through' : ''}`}
                                  >
                                    <td className="py-1 pr-3">{p.payment_date}</td>
                                    <td className="py-1 pr-3">{p.payment_mode}</td>
                                    <td className="py-1 pr-3 font-medium">{p.amount}</td>
                                    <td className="py-1 pr-3 text-text-secondary">{p.notes ?? ''}</td>
                                    <td className="py-1 text-right no-underline">
                                      {isVoided ? (
                                        <Badge tone="danger">voided</Badge>
                                      ) : (
                                        <button
                                          type="button"
                                          disabled={voidingId === p.id}
                                          onClick={() => handleVoidPayment(tenant.id, p.id)}
                                          className="text-danger underline underline-offset-2"
                                        >
                                          {voidingId === p.id ? 'Voiding…' : 'Void'}
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
