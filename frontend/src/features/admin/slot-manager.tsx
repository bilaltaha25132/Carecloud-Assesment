'use client';
import type { FormEvent } from 'react';
import { useState, useTransition } from 'react';
import type { AdminSlot } from './api';
import { addSlotAction, removeSlotAction } from './actions';
import { Badge } from '../../components/badge';
import { EmptyState } from '../../components/empty-state';
import { formatDateTime } from '../patients/format';

const INPUT_CLASS =
  'h-11 w-full rounded-xl border-0 bg-control px-3 py-2 text-base text-ink placeholder:text-ink-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15 sm:text-sm';
const LABEL_CLASS = 'text-xs font-medium text-ink-muted';

export function SlotManager({ slots }: { slots: AdminSlot[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await addSlotAction(formData);
      setError(result.error);
      if (!result.error) form.reset();
    });
  }

  function onRemove(id: string) {
    startTransition(async () => {
      const result = await removeSlotAction(id);
      setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={onAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className={LABEL_CLASS} htmlFor="starts_at">
            New slot
          </label>
          <input className={INPUT_CLASS} id="starts_at" name="starts_at" type="datetime-local" required />
        </div>
        <button
          className="h-11 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-surface disabled:opacity-60"
          type="submit"
          disabled={pending}
        >
          {pending ? 'Working...' : 'Open slot'}
        </button>
      </form>

      {error ? <p className="rounded-lg bg-card-rose px-3 py-2 text-xs text-card-ink">{error}</p> : null}

      {slots.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {slots.map((slot) => (
            <li
              className="flex items-center justify-between gap-3 border-b-[0.5px] border-hairline pb-2 last:border-b-0 last:pb-0"
              key={slot.slot_id}
            >
              <div>
                <p className="text-sm">{slot.label}</p>
                <p className="mt-0.5 text-xs tabular-nums text-ink-muted">{formatDateTime(slot.starts_at)}</p>
              </div>
              {slot.booked ? (
                <Badge label="Booked" />
              ) : (
                <button
                  className="text-sm text-ink-muted hover:text-brand disabled:opacity-60"
                  type="button"
                  onClick={() => onRemove(slot.slot_id)}
                  disabled={pending}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No open slots." detail="Add a time above to make it bookable." />
      )}
    </div>
  );
}
