'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import { DailyMenu, MealType, MenuItem } from '@/lib/types';

interface Props {
  tenantId: string;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export function DailyMenusSection({ tenantId }: Props) {
  const [menus, setMenus] = useState<DailyMenu[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuDate, setMenuDate] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');

  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [selectedMenuItems, setSelectedMenuItems] = useState<MenuItem[]>([]);
  const [addItemId, setAddItemId] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([api.getDailyMenus(tenantId), api.getMenuItems(tenantId)])
      .then(([m, i]) => {
        setMenus(m);
        setAllMenuItems(i);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tenantId]);

  function resetForm() {
    setShowForm(false);
    setMenuDate('');
    setMealType('lunch');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createDailyMenu({ tenant_id: tenantId, menu_date: menuDate, meal_type: mealType });
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create daily menu');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.deleteDailyMenu(id);
      if (selectedMenuId === id) setSelectedMenuId('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete daily menu');
    }
  }

  async function handleSelectMenu(menu: DailyMenu) {
    setSelectedMenuId(menu.id);
    try {
      const full = await api.getDailyMenu(menu.id);
      setSelectedMenuItems(full.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load menu items');
    }
  }

  async function handleAddItem(e: FormEvent) {
    e.preventDefault();
    if (!addItemId) return;
    setAddingItem(true);
    setError(null);
    try {
      await api.addMenuItemToDailyMenu(selectedMenuId, { tenant_id: tenantId, menu_item_id: addItemId });
      const full = await api.getDailyMenu(selectedMenuId);
      setSelectedMenuItems(full.items);
      setAddItemId('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add item');
    } finally {
      setAddingItem(false);
    }
  }

  const selectedMenu = menus.find((m) => m.id === selectedMenuId);
  const availableToAdd = allMenuItems.filter((mi) => !selectedMenuItems.some((si) => si.id === mi.id));

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4 text-body text-danger">{error}</div>
      )}

      <Card
        title="Daily Menus"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5">
            <Plus size={16} /> New Daily Menu
          </Button>
        }
      >
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-5 grid grid-cols-1 gap-4 rounded-card border border-border bg-canvas p-4 sm:grid-cols-3"
          >
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Date</label>
              <input
                required
                type="date"
                value={menuDate}
                onChange={(e) => setMenuDate(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              />
            </div>
            <div>
              <label className="mb-1 block text-caption text-text-secondary">Meal</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="w-full rounded-button border border-border px-3 py-2 text-body"
              >
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Create'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="py-6 text-center text-body text-text-secondary">Loading…</p>
        ) : menus.length === 0 ? (
          <p className="py-6 text-center text-body text-text-secondary">No daily menus yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-canvas text-caption text-text-secondary">
                  <th className="py-2 px-3 font-medium">Date</th>
                  <th className="py-2 px-3 font-medium">Meal</th>
                  <th className="py-2 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {menus.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => handleSelectMenu(m)}
                    className={
                      selectedMenuId === m.id
                        ? 'cursor-pointer border-b border-border bg-accent-light last:border-0'
                        : 'cursor-pointer border-b border-border last:border-0 hover:bg-canvas'
                    }
                  >
                    <td className="py-2 px-3 font-mono text-body text-text-primary">{m.menu_date}</td>
                    <td className="py-2 px-3 text-body capitalize text-text-primary">{m.meal_type}</td>
                    <td className="py-2 px-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(m.id);
                        }}
                        className="text-text-secondary hover:text-danger"
                        title="Delete daily menu"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedMenu && (
        <Card title={`Dishes — ${selectedMenu.menu_date} (${selectedMenu.meal_type})`}>
          <form onSubmit={handleAddItem} className="mb-4 flex gap-2">
            <select
              value={addItemId}
              onChange={(e) => setAddItemId(e.target.value)}
              className="flex-1 rounded-button border border-border px-3 py-2 text-body"
            >
              <option value="">Select a dish to add…</option>
              {availableToAdd.map((mi) => (
                <option key={mi.id} value={mi.id}>
                  {mi.name}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={!addItemId || addingItem}>
              {addingItem ? 'Adding…' : 'Add'}
            </Button>
          </form>

          {selectedMenuItems.length === 0 ? (
            <p className="py-6 text-center text-body text-text-secondary">No dishes on this menu yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedMenuItems.map((mi) => (
                <Badge key={mi.id} tone="info">
                  <span className="flex items-center gap-1">
                    <UtensilsCrossed size={12} /> {mi.name}
                  </span>
                </Badge>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
