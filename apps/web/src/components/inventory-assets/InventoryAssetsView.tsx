'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { ItemsSection } from './ItemsSection';
import { StockSection } from './StockSection';
import { AssetTagsSection } from './AssetTagsSection';
import { ProcurementSection } from './ProcurementSection';

interface Props {
  tenantId: string;
}

type Tab = 'items' | 'stock' | 'asset-tags' | 'procurement';

const TABS: { key: Tab; label: string }[] = [
  { key: 'items', label: 'Item Catalog' },
  { key: 'stock', label: 'Stock' },
  { key: 'asset-tags', label: 'Asset Tags' },
  { key: 'procurement', label: 'Procurement Requests' },
];

/**
 * Single view with internal section switching (local state), not separate
 * URL-routed pages — matches the consolidated InventoryAssetsController,
 * same default pattern as Transportation and Health & Wellness.
 */
export function InventoryAssetsView({ tenantId }: Props) {
  const [tab, setTab] = useState<Tab>('items');

  return (
    <div>
      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
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

      {tab === 'items' && <ItemsSection tenantId={tenantId} />}
      {tab === 'stock' && <StockSection tenantId={tenantId} />}
      {tab === 'asset-tags' && <AssetTagsSection tenantId={tenantId} />}
      {tab === 'procurement' && <ProcurementSection tenantId={tenantId} />}
    </div>
  );
}
