import type { ReactNode } from 'react';

export function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[20px] bg-surface-muted p-6">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
