import type { ReactNode } from 'react';
import { logoutAction } from '../features/auth/actions';
import { Logo } from './brand/logo';
import { NavLinks } from './nav-links';

const EYEBROW_CLASS = 'px-3 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-subtle';

export function AppShell({ username, children }: { username: string; children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <aside className="sticky top-0 z-30 hidden h-screen w-60 shrink-0 flex-col border-r-[0.5px] border-hairline bg-surface lg:flex">
        <div className="flex h-16 items-center border-b-[0.5px] border-hairline px-5">
          <Logo height={26} />
        </div>

        <div className="flex-1 px-3 py-5">
          <p className={`${EYEBROW_CLASS} mb-2`}>Menu</p>
          <NavLinks direction="col" />
        </div>

        <div className="border-t-[0.5px] border-hairline p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar email={username} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{username}</p>
              <p className="text-xs text-ink-subtle">Staff</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-hover hover:text-ink"
              type="submit"
            >
              <LogoutIcon />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b-[0.5px] border-hairline bg-surface px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Logo height={24} />
          <form action={logoutAction}>
            <button className="text-sm text-ink-muted hover:text-brand" type="submit">
              Sign out
            </button>
          </form>
        </div>
        <div className="scrollbar-none -mx-1 mt-2 overflow-x-auto px-1">
          <NavLinks direction="row" />
        </div>
      </header>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}

function Avatar({ email }: { email: string }) {
  const initial = email.trim().charAt(0).toUpperCase() || '?';
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/15 text-sm font-semibold text-brand">
      {initial}
    </span>
  );
}

function LogoutIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
