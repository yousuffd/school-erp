'use client';

import { TopBar } from '@/components/layout/TopBar';
import { auth } from '@/lib/auth';
import { InventoryAssetsView } from '@/components/inventory-assets/InventoryAssetsView';

export default function InventoryAssetsPage() {
  const user = auth.getUser();

  return (
    <>
      <TopBar
        title="Inventory & Assets"
        description="Catalog, stock levels, individually tracked assets, and procurement requests."
      />
      <div className="p-6">
        {!user ? (
          <p className="text-body text-text-secondary">Loading…</p>
        ) : (
          <InventoryAssetsView tenantId={user.tenantId!} />
        )}
      </div>
    </>
  );
}
