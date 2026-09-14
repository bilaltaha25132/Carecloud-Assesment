import type { ReactNode } from 'react';

export function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-30 h-14 border-b-[0.5px] border-hairline bg-surface">
        <div className="mx-auto flex h-full max-w-6xl items-center px-4 sm:px-6 lg:px-8">
          <span className="text-sm font-semibold">CareCloud</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </>
  );
}
