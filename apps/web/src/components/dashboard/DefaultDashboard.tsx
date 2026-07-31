import { LayoutDashboard } from 'lucide-react';
import { Card } from '@/components/ui/Card';

/**
 * Fallback for any role that doesn't match Admin/Teacher/Student/Parent —
 * a custom role (e.g. the Librarian Assistant test role from the nav-
 * visibility work), or a system role without dedicated dashboard content
 * yet (Hostel Admin, HR Manager, Payroll Admin). No data fetched here —
 * genuinely no way to know what a role we've never designed for actually
 * wants to see, so a simple welcome card beats guessing.
 */
export function DefaultDashboard() {
  return (
    <div className="p-6">
      <Card title="Welcome">
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <LayoutDashboard size={32} className="text-accent" />
          <p className="text-body text-text-secondary">
            Use the sidebar to get started — your available sections are shown based on your role's permissions.
          </p>
        </div>
      </Card>
    </div>
  );
}
