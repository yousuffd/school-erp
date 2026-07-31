'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextValue {
  mobileOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

/**
 * Shares mobile-drawer open/close state between TopBar (renders the
 * hamburger button, since it's the one component present on every page)
 * and Sidebar (renders as a static column at lg+ as before, an off-canvas
 * drawer below lg). Avoids prop-drilling through every page's <TopBar />
 * call site. Added for mobile responsiveness — Sidebar previously had no
 * breakpoint logic at all and always rendered full-width.
 */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggle = () => setMobileOpen((open) => !open);
  const close = () => setMobileOpen(false);

  return (
    <SidebarContext.Provider value={{ mobileOpen, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return ctx;
}
