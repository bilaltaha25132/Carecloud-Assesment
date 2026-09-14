export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-ink-muted">{title}</p>
      {detail ? <p className="mt-1 text-xs text-ink-subtle">{detail}</p> : null}
    </div>
  );
}
