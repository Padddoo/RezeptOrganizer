'use client';

import Link from 'next/link';
import { Clock, FileText, Image, ChefHat, Calendar } from 'lucide-react';
import { Recipe } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface RecipeCardProps {
  recipe: Recipe;
  onMarkCooked?: (id: string) => void;
}

export default function RecipeCard({ recipe, onMarkCooked }: RecipeCardProps) {
  const ingredients = recipe.ingredients;
  const lastCooked = recipe.lastCookedAt
    ? formatDistanceToNow(new Date(recipe.lastCookedAt), {
        addSuffix: true,
        locale: de,
      })
    : null;

  return (
    <div className="card-hover group relative overflow-hidden">
      <Link href={`/rezepte/${recipe.id}`} className="block p-5">
        {/* File type indicator */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {recipe.fileType === 'pdf' ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500">
                <FileText className="h-4 w-4" />
              </div>
            ) : recipe.fileType === 'image' ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                <Image className="h-4 w-4" />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                <ChefHat className="h-4 w-4" />
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {recipe.categories?.map((rc) => (
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
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-semibold text-stone-900 group-hover:text-primary-700 transition-colors line-clamp-2">
          {recipe.title}
        </h3>

        {/* Ingredients preview */}
        {ingredients.length > 0 && (
          <p className="mb-3 text-sm text-stone-500 line-clamp-2">
            {ingredients.slice(0, 4).join(' · ')}
            {ingredients.length > 4 && ` (+${ingredients.length - 4})`}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-4 text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(recipe.createdAt).toLocaleDateString('de-DE')}
          </span>
          {lastCooked && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lastCooked}
            </span>
          )}
        </div>
      </Link>

      {/* Quick cook button */}
      {onMarkCooked && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMarkCooked(recipe.id);
          }}
          className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-white opacity-0 shadow-lg transition-all group-hover:opacity-100 hover:bg-accent-600 hover:scale-110"
          title="Heute gekocht!"
        >
          <ChefHat className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
