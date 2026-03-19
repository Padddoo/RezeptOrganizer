'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChefHat, Plus, FolderOpen, Tag, CalendarDays } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { href: '/', label: 'Übersicht', icon: FolderOpen },
  { href: '/neu', label: 'Neues Rezept', icon: Plus },
  { href: '/kategorien', label: 'Kategorien', icon: Tag },
  { href: '/kalender', label: 'Kalender', icon: CalendarDays },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
            <ChefHat className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-stone-900">
            Rezept<span className="text-primary-600">Organizer</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
