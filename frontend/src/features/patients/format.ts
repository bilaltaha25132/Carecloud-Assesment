export const EM_DASH = '\u2014';

// Fixed to UTC so a rendered date never shifts with the viewer's timezone.
const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
});

export function formatPhone(value: string | null): string {
  if (!value) return EM_DASH;
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 10) return value;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return EM_DASH;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : DATE_FORMAT.format(date);
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return EM_DASH;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : DATE_TIME_FORMAT.format(date);
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return EM_DASH;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.round(seconds) % 60).padStart(2, '0')}`;
}
