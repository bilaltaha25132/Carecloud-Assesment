import Link from 'next/link';
import type { PatientFilters } from './api';

const INPUT_CLASS =
  'h-11 w-full rounded-xl border-0 bg-control px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15';

const LABEL_CLASS = 'text-xs font-medium text-ink-muted';

export function FilterBar({ filters }: { filters: PatientFilters }) {
  return (
    <form method="get" action="/patients" className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1.5">
        <label className={LABEL_CLASS} htmlFor="last_name">
          Last name
        </label>
        <input
          className={INPUT_CLASS}
          id="last_name"
          name="last_name"
          type="text"
          defaultValue={filters.last_name}
          placeholder="Nguyen"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <label className={LABEL_CLASS} htmlFor="date_of_birth">
          Date of birth
        </label>
        <input
          className={INPUT_CLASS}
          id="date_of_birth"
          name="date_of_birth"
          type="text"
          inputMode="numeric"
          defaultValue={filters.date_of_birth}
          placeholder="MM/DD/YYYY"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <label className={LABEL_CLASS} htmlFor="phone_number">
          Phone number
        </label>
        <input
          className={INPUT_CLASS}
          id="phone_number"
          name="phone_number"
          type="tel"
          inputMode="tel"
          defaultValue={filters.phone_number}
          placeholder="(415) 555-0142"
        />
      </div>
      <div className="flex items-center gap-4">
        <button className="h-11 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-surface" type="submit">
          Filter
        </button>
        <Link className="text-sm text-ink-muted hover:text-brand" href="/patients">
          Clear
        </Link>
      </div>
    </form>
  );
}
