'use client';
import type { ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppointmentsIcon, OverviewIcon, PatientsIcon } from './nav-icons';

const NAV_ITEMS: ReadonlyArray<{ href: string; label: string; icon: ComponentType<{ className?: string }> }> = [
  { href: '/', label: 'Overview', icon: OverviewIcon },
  { href: '/patients', label: 'Patients', icon: PatientsIcon },
  { href: '/appointments', label: 'Appointments', icon: AppointmentsIcon },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ direction }: { direction: 'col' | 'row' }) {
  const pathname = usePathname();

  return (
    <nav className={direction === 'col' ? 'flex flex-col gap-1' : 'flex flex-row gap-1'}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
              active ? 'bg-active font-medium text-ink' : 'text-ink-muted hover:bg-hover hover:text-ink'
            }`}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            key={item.href}
          >
            <Icon className={active ? 'text-brand' : ''} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
