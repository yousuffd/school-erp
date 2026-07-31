'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { api } from '@/lib/api';
import { MenuItemsSection } from './MenuItemsSection';
import { DailyMenusSection } from './DailyMenusSection';
import { MealAttendanceSection } from './MealAttendanceSection';
import { DietaryRestrictionsSection } from './DietaryRestrictionsSection';

interface Props {
  tenantId: string;
}

type Tab = 'menu-items' | 'daily-menus' | 'meal-attendance' | 'dietary-restrictions';

const BASE_TABS: { key: Tab; label: string }[] = [
  { key: 'menu-items', label: 'Menu Items' },
  { key: 'daily-menus', label: 'Daily Menus' },
];

/**
 * Single view with internal section switching (local state), not separate
 * URL-routed pages — matches the consolidated CafeteriaController, same
 * default pattern as Transportation/Health & Wellness/Inventory & Assets.
 *
 * Meal Attendance and Dietary Restrictions tabs are now wired to the real
 * per-tenant TenantFeatureToggle system (cafeteria.meal_attendance /
 * cafeteria.dietary_restrictions) instead of what used to be a hardcoded
 * global hide with both entries manually removed from the tab list. A
 * school that wants them off still gets that — as a real per-tenant
 * toggle flip via Admin > Feature Toggles, not a removed array entry — so
 * other schools aren't held back by one school's specific request.
 *
 * Mirrors the "no row for this key = treated as enabled by default"
 * convention already established on the Feature Toggles admin page
 * (app/admin/feature-toggles/page.tsx) rather than inventing a different
 * default here. If the toggle fetch itself fails, both default to enabled
 * (fail-open) rather than blocking the rest of this view — the backend's
 * own FeatureToggleGuard remains the real enforcement point regardless of
 * what the frontend happens to show.
 */
export function CafeteriaView({ tenantId }: Props) {
  const [tab, setTab] = useState<Tab>('menu-items');
  const [mealAttendanceEnabled, setMealAttendanceEnabled] = useState(true);
  const [dietaryRestrictionsEnabled, setDietaryRestrictionsEnabled] = useState(true);

  useEffect(() => {
    api
      .getFeatureToggles()
      .then((toggles) => {
        const mealAttendance = toggles.find((t) => t.feature_key === 'cafeteria.meal_attendance');
        const dietaryRestrictions = toggles.find((t) => t.feature_key === 'cafeteria.dietary_restrictions');
        setMealAttendanceEnabled(mealAttendance ? mealAttendance.enabled : true);
        setDietaryRestrictionsEnabled(dietaryRestrictions ? dietaryRestrictions.enabled : true);
      })
      .catch(() => {
        // Fail-open — see doc comment above. Don't let a toggle-fetch
        // hiccup take away tabs that should otherwise be visible; the
        // backend guard is the real gate on any actual write attempt.
        setMealAttendanceEnabled(true);
        setDietaryRestrictionsEnabled(true);
      });
  }, [tenantId]);

  const tabs: { key: Tab; label: string }[] = [
    ...BASE_TABS,
    ...(mealAttendanceEnabled ? [{ key: 'meal-attendance' as Tab, label: 'Meal Attendance' }] : []),
    ...(dietaryRestrictionsEnabled ? [{ key: 'dietary-restrictions' as Tab, label: 'Dietary Restrictions' }] : []),
  ];

  // If the currently-selected tab becomes unavailable (a toggle flips off
  // mid-session, or the initial optimistic 'enabled' default gets
  // corrected downward once the real toggle state loads), fall back to
  // the always-available first tab rather than rendering a dead selection.
  useEffect(() => {
    if (!tabs.some((t) => t.key === tab)) {
      setTab('menu-items');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealAttendanceEnabled, dietaryRestrictionsEnabled]);

  return (
    <div>
      <div className="mb-6 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'border-b-2 px-4 py-2.5 text-body font-medium transition-colors',
              tab === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'menu-items' && <MenuItemsSection tenantId={tenantId} />}
      {tab === 'daily-menus' && <DailyMenusSection tenantId={tenantId} />}
      {tab === 'meal-attendance' && <MealAttendanceSection tenantId={tenantId} />}
      {tab === 'dietary-restrictions' && <DietaryRestrictionsSection tenantId={tenantId} />}
    </div>
  );
}