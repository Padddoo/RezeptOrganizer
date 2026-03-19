'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  ChefHat,
  Clock,
  Trash2,
  Edit3,
  Save,
  X,
  FileText,
  Image,
  Calendar,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { Recipe, Category } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export default function RecipeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editIngredients, setEditIngredients] = useState('');
  const [editCategoryIds, setEditCategoryIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [cookedToast, setCookedToast] = useState(false);

  const fetchRecipe = useCallback(async () => {
    const res = await fetch(`/api/rezepte/${id}`);
    if (res.ok) {
      const data = await res.json();
      setRecipe(data);
    } else {
      router.push('/');
    }
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchRecipe();
    fetch('/api/kategorien')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, [fetchRecipe]);

  const startEditing = () => {
    if (!recipe) return;
    setEditTitle(recipe.title);
    setEditIngredients(recipe.ingredients.join('\n'));
    setEditCategoryIds(recipe.categories.map((c) => c.categoryId));
    setEditing(true);
  };

  const saveEdit = async () => {
    const ingredients = editIngredients
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const res = await fetch(`/api/rezepte/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle,
        ingredients,
        categoryIds: editCategoryIds,
      }),
    });

    if (res.ok) {
      setRecipe(await res.json());
      setEditing(false);
    }
  };

  const markCooked = async () => {
    const res = await fetch(`/api/rezepte/${id}/gekocht`, { method: 'POST' });
    if (res.ok) {
      setRecipe(await res.json());
      setCookedToast(true);
      setTimeout(() => setCookedToast(false), 2000);
    }
  };

  const deleteRecipe = async () => {
    if (!confirm('Rezept wirklich löschen?')) return;
    setDeleting(true);
    const res = await fetch(`/api/rezepte/${id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/');
    }
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Übersicht
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          {editing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="input text-xl font-bold"
            />
          ) : (
            <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
              {recipe.title}
            </h1>
          )}

          {/* Categories */}
          <div className="mt-3 flex flex-wrap gap-2">
            {editing
              ? categories.map((cat) => {
                  const selected = editCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() =>
                        setEditCategoryIds(
                          selected
                            ? editCategoryIds.filter((i) => i !== cat.id)
                            : [...editCategoryIds, cat.id]
                        )
                      }
                      className="badge border transition-all"
                      style={{
                        backgroundColor: selected
                          ? cat.color + '20'
                          : 'transparent',
                        borderColor: selected ? cat.color : '#d6d3d1',
                        color: selected ? cat.color : '#78716c',
                      }}
                    >
                      {selected && <Check className="mr-1 h-3 w-3" />}
                      {cat.name}
                    </button>
                  );
                })
              : recipe.categories.map((rc) => (
                  <span
                    key={rc.categoryId}
                    className="badge border"
                    style={{
                      backgroundColor: rc.category.color + '15',
                      borderColor: rc.category.color + '30',
                      color: rc.category.color,
                    }}
                  >
                    {rc.category.name}
                  </span>
                ))}
          </div>

          {/* Meta */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-stone-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Erstellt am{' '}
              {new Date(recipe.createdAt).toLocaleDateString('de-DE')}
            </span>
            {recipe.lastCookedAt && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Zuletzt gekocht{' '}
                {formatDistanceToNow(new Date(recipe.lastCookedAt), {
                  addSuffix: true,
                  locale: de,
                })}
              </span>
            )}
            {recipe.fileType && (
              <span className="flex items-center gap-1.5">
                {recipe.fileType === 'pdf' ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  <Image className="h-4 w-4" />
                )}
                {recipe.fileType === 'pdf' ? 'PDF' : 'Bild'}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={saveEdit} className="btn-primary">
                <Save className="h-4 w-4" />
                Speichern
              </button>
              <button
                onClick={() => setEditing(false)}
                className="btn-ghost"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button onClick={markCooked} className="btn-primary">
                <ChefHat className="h-4 w-4" />
                <span className="hidden sm:inline">Heute gekocht</span>
              </button>
              <button onClick={startEditing} className="btn-secondary">
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={deleteRecipe}
                disabled={deleting}
                className="btn-ghost text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ingredients */}
        <div className="card">
          <div className="border-b border-stone-100 px-5 py-4">
            <h2 className="font-semibold text-stone-900">Zutaten</h2>
          </div>
          <div className="p-5">
            {editing ? (
              <textarea
                value={editIngredients}
                onChange={(e) => setEditIngredients(e.target.value)}
                className="input min-h-[200px] resize-y text-sm"
                placeholder="Eine Zutat pro Zeile..."
              />
            ) : recipe.ingredients.length > 0 ? (
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-stone-700"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                    {ingredient}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-400 italic">
                Keine Zutaten hinterlegt.
              </p>
            )}
          </div>
        </div>

        {/* File preview */}
        {recipe.fileUrl && (
          <div className="card">
            <div className="border-b border-stone-100 px-5 py-4">
              <h2 className="font-semibold text-stone-900">
                Originaldokument
              </h2>
            </div>
            <div className="p-2">
              {recipe.fileType === 'pdf' ? (
                <iframe
                  src={recipe.fileUrl}
                  className="h-[500px] w-full rounded-xl"
                  title="Rezept PDF"
                />
              ) : (
                <img
                  src={recipe.fileUrl}
                  alt={recipe.title}
                  className="w-full rounded-xl object-contain"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cooked toast */}
      {cookedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-xl animate-in fade-in slide-in-from-bottom-4">
          <span className="flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-accent-400" />
            Als heute gekocht markiert!
          </span>
        </div>
      )}
    </div>
  );
}
