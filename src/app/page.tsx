'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChefHat, SortAsc, Filter, BookOpen } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import RecipeCard from '@/components/RecipeCard';
import { Recipe, Category } from '@/types';

type SortOption = 'newest' | 'oldest' | 'last_cooked' | 'title';

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [loading, setLoading] = useState(true);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedCategory) params.set('category', selectedCategory);
    params.set('sort', sort);

    const res = await fetch(`/api/rezepte?${params}`);
    if (res.ok) {
      setRecipes(await res.json());
    }
    setLoading(false);
  }, [search, selectedCategory, sort]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  useEffect(() => {
    fetch('/api/kategorien')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const markCooked = async (id: string) => {
    const res = await fetch(`/api/rezepte/${id}/gekocht`, { method: 'POST' });
    if (res.ok) {
      fetchRecipes();
    }
  };

  const sortLabels: Record<SortOption, string> = {
    newest: 'Neueste zuerst',
    oldest: 'Älteste zuerst',
    last_cooked: 'Längst nicht gekocht',
    title: 'Alphabetisch',
  };

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
            Meine Rezepte
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {recipes.length} {recipes.length === 1 ? 'Rezept' : 'Rezepte'} in
            deiner Sammlung
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <div className="flex gap-2">
          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="input appearance-none py-2 pl-9 pr-8 text-sm"
            >
              {Object.entries(sortLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <SortAsc className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          </div>

          {/* Category filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input appearance-none py-2 pl-9 pr-8 text-sm"
            >
              <option value="">Alle Kategorien</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          </div>
        </div>
      </div>

      {/* Recipe grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
            {search || selectedCategory ? (
              <BookOpen className="h-8 w-8 text-stone-400" />
            ) : (
              <ChefHat className="h-8 w-8 text-stone-400" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-stone-700">
            {search || selectedCategory
              ? 'Keine Rezepte gefunden'
              : 'Noch keine Rezepte'}
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            {search || selectedCategory
              ? 'Versuche andere Suchbegriffe oder Filter.'
              : 'Füge dein erstes Rezept hinzu, um loszulegen!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onMarkCooked={markCooked}
            />
          ))}
        </div>
      )}
    </div>
  );
}
