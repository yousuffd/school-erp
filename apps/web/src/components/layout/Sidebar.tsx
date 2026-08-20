'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, LifeBuoy } from 'lucide-react';
import clsx from 'clsx';
import { NAV_ITEMS } from './nav-config';
import { auth } from '@/lib/auth';
import { hasPermission, isStudentRole, isSuperAdminRole } from '@/lib/roles';
import { useSidebar } from '@/lib/sidebar-context';
import { api } from '@/lib/api';

export function Sidebar() {
  const pathname = usePathname();
  const user = auth.getUser();
  const { mobileOpen, close } = useSidebar();

  // Which group headers are collapsed — expanded by default (empty set).
  // Local component state only (resets on reload); revisit with
  // localStorage/user-preference persistence if that's wanted later.
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Modules disabled via TenantFeatureToggle (provisioning-time opt-out,
  // e.g. Cafeteria/Hostel/Health & Wellness) — distinct from item.enabled
  // below, which is a build-status flag ('coming in Phase N'), not a
  // per-tenant toggle. Both concepts happen to share the word 'enabled'
  // but govern completely different things; kept in separate state/checks
  // to avoid conflating them.
    const [disabledFeatureKeys, setDisabledFeatureKeys] = useState<Set<string>>(new Set());
  useEffect(() => {
    api
      .getFeatureToggles()
      .then((toggles) => {
        setDisabledFeatureKeys(new Set(toggles.filter((t) => !t.enabled).map((t) => t.feature_key)));
      })
      .catch(() => {
        // Fail open — same 'no row = enabled' convention as the backend;
        // a failed fetch here should never hide a module that's actually on.
      });
  }, []);

  // Tenant users see their own school's name in the sidebar header instead
  // of the generic platform brand — Super Admin has no tenantId (genuinely
  // platform-level, not a missing value), so keeps "SchoolERP" correctly.
  const [schoolName, setSchoolName] = useState<string | null>(null);
  useEffect(() => {
    if (!user?.tenantId) return;
    api
      .getMyTenant()
      .then((t) => setSchoolName(t.school_name))
      .catch(() => {
        // Fail quiet — falling back to "SchoolERP" is a fine default,
        // not worth an error banner over a cosmetic header.
      });
  }, [user?.tenantId]);

  function toggleGroup(group: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  /**
   * Permission-driven nav visibility — replaces the previous hardcoded
   * ADMIN_ONLY_LABELS / STUDENT_HIDDEN_LABELS / per-module role-name
   * special-casing (HOSTEL_ADMIN_ROLE, HR_MANAGER_ROLE, PAYROLL_ADMIN_ROLE),
   * which grew a new special case every time a module-specific admin role
   * shipped and had no way to ever correctly handle a CUSTOM role an Admin
   * creates via the Role & Permission matrix editor.
   *
   * Only two genuine exceptions remain, and they're both deliberate —
   * see lib/roles.ts's doc comment for the full reasoning:
   *   - 'My HR': a staff self-service page, open to any non-Student/
   *     non-Parent account regardless of permissions, not gated by a
   *     module capability at all.
   *   - 'Provision New Tenant': a hard platform-level boundary — no
   *     custom role's permissions should ever grant this, so it stays
   *     isSuperAdminRole() rather than becoming hasPermission()-driven,
   *     even though a 'tenant-provisioning' permission key technically
   *     exists in the backend matrix (see TenantProvisioningGuard).
   *
   * Items with enabled:false (not yet built) are always shown as a
   * "coming in Phase N" placeholder regardless of permissions — same as
   * before this change, and correct, since there's no real capability to
   * gate yet for those.
   */
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    // Platform-level Super Admin sees only Dashboard and Provision New
    // Tenant — nothing else in this nav is platform-level (see
    // SUPER_ADMIN_LOGIN_SCOPE.md §0/§4). Checked FIRST and returns early,
    // rather than relying on every item below having a correct
    // permissionModule gate — a module added later with no gate (like
    // Diary today) would otherwise silently leak into a Super Admin's
    // nav via the final `return true` fallback further down.
    if (isSuperAdminRole(user?.role)) {
      return item.label === 'Dashboard' || item.label === 'Provision New Tenant';
    }

    if (item.permissionModule && disabledFeatureKeys.has(item.permissionModule)) {
      return false;
    }

    if (!item.enabled) return true;

    if (item.label === 'My HR') {
      return !isStudentRole(user?.role) && user?.role !== 'Parent';
    }
    if (item.label === 'My Electives') {
      return isStudentRole(user?.role);
    }
    if (item.label === 'Provision New Tenant') {
      return isSuperAdminRole(user?.role);
    }
    if (item.label === 'Dashboard') return true;

    if (item.permissionModule === 'lms' && isStudentRole(user?.role)) {
      return true;
    }
    if (item.permissionModule === 'examinations' && (isStudentRole(user?.role) || user?.role === 'Parent')) {
      return true;
    }
    if (item.permissionModule === 'discipline' && user?.role === 'Parent') {
      return true;
    }
    if (item.permissionModule === 'communication' && (isStudentRole(user?.role) || user?.role === 'Parent')) {
      return true;
    }
    // Fee Management self-service: Parent only (Teacher access was
    // considered and explicitly reversed — Student remains excluded too,
    // per the original scope decision).
    if (item.permissionModule === 'fee-management' && user?.role === 'Parent') {
      return true;
    }
    // Attendance self-service: Parent only — Student explicitly excluded,
    // per scope decision. Teacher already sees this via the regular
    // hasPermission() path below (attendance:view/create/edit granted
    // directly in the permission matrix), so no exception needed for them.
    if (item.permissionModule === 'attendance' && user?.role === 'Parent') {
      return true;
    }
    // Transportation self-service: Parent only — same carve-out pattern
    // as Attendance/Fee Management/Discipline above. Parent sees the
    // opt-out toggle (ParentTransportOptOutView), not the Admin
    // AssignmentsSection view — routing dispatch handled in
    // transportation/page.tsx, this only controls nav visibility.
    if (item.permissionModule === 'transportation' && user?.role === 'Parent') {
      return true;
    }

    if (item.permissionModule) {
      return hasPermission(user, item.permissionModule, 'view');
    }

    return true;
  });

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex h-screen w-sidebar-expanded flex-col bg-sidebar-bg transition-transform duration-200 lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
      <div className="flex h-16 items-center px-5">
                <span className="text-card-title font-bold text-sidebar-text-active">{schoolName ?? 'SchoolERP'}</span>
      </div>

      <nav className="sidebar-scroll flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {visibleNavItems.map((item, idx) => {
          const isActive =
            item.label === 'Settings'
              ? pathname?.startsWith('/admin')
              : pathname?.startsWith(item.href);
          const isEnabled = item.enabled;
          const Icon = item.icon;

          // Header shows above the first item of each group, computed
          // against the FILTERED/visible list — so a group with zero
          // items visible to this user's permissions never leaves a
          // dangling header with nothing under it.
          const showHeader = idx === 0 || visibleNavItems[idx - 1].group !== item.group;
          const isCollapsed = collapsedGroups.has(item.group);
          const header = showHeader ? (
            <button
              type="button"
              onClick={() => toggleGroup(item.group)}
              className={clsx(
                'flex w-full items-center justify-between px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-text/40 transition-colors hover:text-sidebar-text/60',
                idx === 0 ? 'pt-0' : 'pt-4',
              )}
            >
              <span>{item.group}</span>
              <ChevronDown
                size={12}
                className={clsx('transition-transform', isCollapsed && '-rotate-90')}
              />
            </button>
          ) : null;

          if (isCollapsed) {
            return header ? <div key={item.label}>{header}</div> : null;
          }

          if (!isEnabled) {
            return (
              <div key={item.label}>
                {header}
                <div
                  className="flex cursor-not-allowed items-center justify-between rounded-button px-3 py-2 text-body text-sidebar-text/40"
                  title={`Ships in Phase ${item.phase}`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} />
                    {item.label}
                  </span>
                  <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[10px]">
                    Ph.{item.phase}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div key={item.label}>
              {header}
              <Link
                href={item.href}
                onClick={close}
                className={clsx(
                  'flex items-center gap-3 rounded-button px-3 py-2 text-body transition-colors',
                  isActive
                    ? 'bg-accent text-sidebar-text-active'
                    : 'text-sidebar-text hover:bg-white/5 hover:text-sidebar-text-active',
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="m-3 rounded-card bg-white/5 p-4">
        <div className="mb-2 flex items-center gap-2 text-sidebar-text-active">
          <LifeBuoy size={16} />
          <span className="text-caption font-semibold">Need Help?</span>
        </div>
        <button className="w-full rounded-button bg-white/10 py-1.5 text-caption font-medium text-sidebar-text-active hover:bg-white/20">
          Contact Support
        </button>
      </div>
      </aside>
    </>
  );
}
