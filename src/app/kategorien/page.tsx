'use client';

import { useEffect, useState } from 'react';
import { Tag, Plus, Trash2, Palette } from 'lucide-react';
import { Category } from '@/types';

const COLORS = [
  '#22c55e', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#06b6d4',
  '#84cc16', '#e11d48', '#0891b2', '#7c3aed', '#d97706',
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/kategorien')
      .then((r) => r.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const createCategory = async () => {
    if (!newName.trim()) return;
    const res = await fetch('/api/kategorien', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), color: selectedColor }),
    });
    if (res.ok) {
      const cat = await res.json();
      setCategories([...categories, cat]);
      setNewName('');
      setSelectedColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Kategorie wirklich löschen?')) return;
    const res = await fetch(`/api/kategorien?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCategories(categories.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Kategorien</h1>
        <p className="mt-1 text-sm text-stone-500">
          Verwalte deine Rezept-Kategorien und Tags.
        </p>
      </div>

      {/* Create new */}
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-stone-900">
          Neue Kategorie erstellen
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createCategory()}
            className="input flex-1"
            placeholder="z.B. Italienisch, Hauptgang, Dessert..."
          />
          <button
            onClick={createCategory}
            disabled={!newName.trim()}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Erstellen
          </button>
        </div>

        {/* Color picker */}
        <div className="mt-3">
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-stone-500">
            <Palette className="h-3.5 w-3.5" />
            Farbe wählen
          </label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`h-7 w-7 rounded-full transition-all outline-2 outline-offset-2 ${
                  selectedColor === color
                    ? 'outline scale-110'
                    : 'outline-transparent hover:scale-110'
                }`}
                style={{
                  backgroundColor: color,
                  outlineColor: selectedColor === color ? color : undefined,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="card divide-y divide-stone-100">
        <div className="px-5 py-4">
          <h2 className="font-semibold text-stone-900">
            Alle Kategorien ({categories.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100">
              <Tag className="h-6 w-6 text-stone-400" />
            </div>
            <p className="text-sm text-stone-500">
              Noch keine Kategorien erstellt.
            </p>
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between px-5 py-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm font-medium text-stone-700">
                  {cat.name}
                </span>
              </div>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
