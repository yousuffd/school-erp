'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarProvider } from '@/lib/sidebar-context';
import { auth } from '@/lib/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.replace('/login');
    } else {
      setChecked(true);
    }
  }, [router]);

  // Avoids a flash of protected content before the auth check above resolves.
  if (!checked) return null;

  return (
    <SidebarProvider>
      <div className="flex">
        <Sidebar />
        <main className="min-h-screen flex-1 bg-canvas">{children}</main>
      </div>
    </SidebarProvider>
  );
}
