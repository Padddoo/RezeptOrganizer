'use client';

import { useState, useEffect } from 'react';
import { Tag, Plus, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Category } from '@/types';

const PRIMARY_CATEGORY_NAMES = ['Vorspeise', 'Hauptgang', 'Dessert', 'Beilage'];

interface CategorySelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function CategorySelector({
  selectedIds,
  onChange,
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showMoreCategories, setShowMoreCategories] = useState(false);

  const primaryCategories = categories.filter((c) => PRIMARY_CATEGORY_NAMES.includes(c.name));
  const secondaryCategories = categories.filter((c) => !PRIMARY_CATEGORY_NAMES.includes(c.name));

  useEffect(() => {
    fetch('/api/kategorien')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id]
    );
  };

  const createCategory = async () => {
    if (!newName.trim()) return;
    const colors = [
      '#22c55e', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6',
      '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#06b6d4',
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const res = await fetch('/api/kategorien', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), color }),
    });
    if (res.ok) {
      const cat = await res.json();
      setCategories([...categories, cat]);
      onChange([...selectedIds, cat.id]);
      setNewName('');
      setShowCreate(false);
    }
  };

  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-stone-700">
        <Tag className="h-3.5 w-3.5" />
        Kategorien
      </label>
      <div className="space-y-2">
        {/* Primary categories - always visible */}
        <div className="flex flex-wrap gap-2">
          {primaryCategories.map((cat) => {
            const selected = selectedIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggle(cat.id)}
                className="badge border transition-all"
                style={{
                  backgroundColor: selected ? cat.color + '20' : 'transparent',
                  borderColor: selected ? cat.color : '#d6d3d1',
                  color: selected ? cat.color : '#78716c',
                }}
              >
                {selected && <Check className="mr-1 h-3 w-3" />}
                {cat.name}
              </button>
            );
          })}

          {/* Toggle for secondary categories */}
          {secondaryCategories.length > 0 && (
            <button
              onClick={() => setShowMoreCategories(!showMoreCategories)}
              className={`badge border transition-all flex items-center gap-1 ${
                showMoreCategories || secondaryCategories.some((c) => selectedIds.includes(c.id))
                  ? 'border-stone-400 text-stone-600'
                  : 'border-stone-300 text-stone-400 hover:border-stone-400 hover:text-stone-600'
              }`}
            >
              Weitere Kategorien
              {showMoreCategories ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}
        </div>

        {/* Secondary categories - toggleable */}
        {showMoreCategories && secondaryCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {secondaryCategories.map((cat) => {
              const selected = selectedIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggle(cat.id)}
                  className="badge border transition-all"
                  style={{
                    backgroundColor: selected ? cat.color + '20' : 'transparent',
                    borderColor: selected ? cat.color : '#d6d3d1',
                    color: selected ? cat.color : '#78716c',
                  }}
                >
                  {selected && <Check className="mr-1 h-3 w-3" />}
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Create new category */}
        <div className="flex flex-wrap gap-2">
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="badge border border-dashed border-stone-300 text-stone-400 hover:border-stone-400 hover:text-stone-600"
            >
              <Plus className="mr-1 h-3 w-3" />
              Neue Kategorie
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createCategory()}
                className="input w-36 py-1 text-xs"
                placeholder="Name..."
                autoFocus
              />
              <button onClick={createCategory} className="btn-primary py-1 px-2 text-xs">
                <Plus className="h-3 w-3" />
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setNewName('');
                }}
                className="btn-ghost py-1 px-2 text-xs"
              >
                Abbruch
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
