'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut, Menu, Search } from 'lucide-react';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api';
import { AcademicYear } from '@/lib/types';
import { useSidebar } from '@/lib/sidebar-context';

/** DESIGN_SYSTEM.md §1: page title + description (left); year selector, search, bell, user (right). */
export function TopBar({ title, description }: { title: string; description?: string }) {
  const router = useRouter();
  const { toggle } = useSidebar();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const user = auth.getUser();

  useEffect(() => {
    // Skips entirely for a platform-level Super Admin session, whose
    // tenantId is genuinely null at runtime — there's no tenant's academic
    // years to show. The old `user.tenantId!` assertion only satisfied
    // TypeScript; it didn't stop the actual null from being sent, which
    // serialized into the query string as the literal text "null" and
    // caused a 500 (invalid uuid) on every Super Admin page load.
    if (!user || !user.tenantId) return;
    api
      .getAcademicYears(user.tenantId)
      .then((data) => {
        setYears(data);
        const current = data.find((y) => y.is_current);
        if (current) setSelectedYearId(current.id);
      })
      .catch(() => {
        // Non-fatal for the top bar — dashboard/page-level fetches surface real errors.
      });
  }, [user?.tenantId]);

  // Close the sign-out menu on an outside click.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSignOut() {
    auth.clearSession();
    router.push('/login');
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-button hover:bg-canvas lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} className="text-text-secondary" />
        </button>
        <div>
          <h1 className="text-page-title font-bold text-text-primary">{title}</h1>
          {description && <p className="text-body text-text-secondary">{description}</p>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {years.length > 0 && (
          <div className="relative">
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="appearance-none rounded-button border border-border bg-card py-2 pl-3 pr-8 text-body text-text-primary"
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                  {y.is_current ? ' (Current)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary"
            />
          </div>
        )}

        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="search"
            placeholder="Search..."
            className="w-56 rounded-button border border-border bg-canvas py-2 pl-9 pr-3 text-body text-text-primary placeholder:text-text-secondary"
          />
        </div>

        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-button hover:bg-canvas"
          aria-label="Notifications"
        >
          <Bell size={18} className="text-text-secondary" />
        </button>

        {user && (
          <div className="relative border-l border-border pl-4" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-button py-1 pr-1 hover:bg-canvas"
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light text-body font-semibold text-accent">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="hidden text-left sm:block">
                <div className="text-body font-medium text-text-primary">{user.email}</div>
                <div className="text-caption text-text-secondary">{user.role}</div>
              </div>
              <ChevronDown size={14} className="hidden text-text-secondary sm:block" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-10 mt-2 w-44 rounded-card border border-border bg-card py-1 shadow-card">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-body text-danger hover:bg-danger/10"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}