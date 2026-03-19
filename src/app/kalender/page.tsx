'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChefHat } from 'lucide-react';

interface CookingLogEntry {
  id: string;
  cookedAt: string;
  recipe: {
    id: string;
    title: string;
    categories: {
      categoryId: string;
      category: { id: string; name: string; color: string };
    }[];
  };
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

export default function KalenderPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [logs, setLogs] = useState<CookingLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setSelectedDay(null);
    fetch(`/api/kalender?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  // Monday = 0, Sunday = 6
  const startWeekday = (firstDay.getDay() + 6) % 7;

  // Group logs by day
  const logsByDay: Record<number, CookingLogEntry[]> = {};
  for (const log of logs) {
    const day = new Date(log.cookedAt).getDate();
    if (!logsByDay[day]) logsByDay[day] = [];
    logsByDay[day].push(log);
  }

  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() + 1 &&
    year === today.getFullYear();

  const selectedLogs = selectedDay ? logsByDay[selectedDay] || [] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
          Kalender
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Deine Koch-Historie auf einen Blick
        </p>
      </div>

      <div className="card overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between border-b border-stone-100 p-4">
          <button onClick={prevMonth} className="btn-ghost p-2">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-stone-900">
              {MONTH_NAMES[month - 1]} {year}
            </h2>
            {(month !== today.getMonth() + 1 || year !== today.getFullYear()) && (
              <button onClick={goToToday} className="badge bg-primary-50 text-primary-700 hover:bg-primary-100 cursor-pointer">
                Heute
              </button>
            )}
          </div>
          <button onClick={nextMonth} className="btn-ghost p-2">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-stone-100">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-semibold text-stone-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {/* Empty cells before first day */}
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[72px] border-b border-r border-stone-50 bg-stone-25 sm:min-h-[90px]" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayLogs = logsByDay[day] || [];
              const hasCooking = dayLogs.length > 0;
              const isSelected = selectedDay === day;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`relative min-h-[72px] border-b border-r border-stone-100 p-1.5 text-left transition-all sm:min-h-[90px] sm:p-2 ${
                    isSelected
                      ? 'bg-primary-50 ring-2 ring-inset ring-primary-300'
                      : hasCooking
                        ? 'bg-green-50/50 hover:bg-green-50'
                        : 'hover:bg-stone-50'
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium sm:h-7 sm:w-7 sm:text-sm ${
                      isToday(day)
                        ? 'bg-primary-600 text-white'
                        : 'text-stone-700'
                    }`}
                  >
                    {day}
                  </span>

                  {/* Cooking indicators */}
                  {hasCooking && (
                    <div className="mt-0.5 space-y-0.5">
                      {dayLogs.slice(0, 2).map((log) => (
                        <div
                          key={log.id}
                          className="truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight sm:text-xs"
                          style={{
                            backgroundColor:
                              (log.recipe.categories[0]?.category.color || '#22c55e') + '20',
                            color:
                              log.recipe.categories[0]?.category.color || '#16a34a',
                          }}
                        >
                          {log.recipe.title}
                        </div>
                      ))}
                      {dayLogs.length > 2 && (
                        <div className="px-1 text-[10px] text-stone-400">
                          +{dayLogs.length - 2} mehr
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected day detail */}
      {selectedDay && selectedLogs.length > 0 && (
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-stone-900">
            {selectedDay}. {MONTH_NAMES[month - 1]} {year}
          </h3>
          <div className="space-y-2">
            {selectedLogs.map((log) => (
              <Link
                key={log.id}
                href={`/rezepte/${log.recipe.id}`}
                className="flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-stone-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <ChefHat className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900 truncate">
                    {log.recipe.title}
                  </p>
                  <div className="flex gap-1.5 mt-0.5">
                    {log.recipe.categories.map((rc) => (
                      <span
                        key={rc.categoryId}
                        className="badge border text-[10px]"
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
                <span className="text-xs text-stone-400">
                  {new Date(log.cookedAt).toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {selectedDay && selectedLogs.length === 0 && (
        <div className="card p-5 text-center text-sm text-stone-400">
          An diesem Tag wurde nichts gekocht.
        </div>
      )}
    </div>
  );
}
