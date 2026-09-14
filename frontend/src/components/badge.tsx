const TONE_BY_STATUS: Record<string, string> = {
  COMPLETED: 'bg-card-mint',
  SCHEDULED: 'bg-card-mint',
  FAILED: 'bg-card-rose',
  CANCELLED: 'bg-card-rose',
  IN_PROGRESS: 'bg-card-amber',
};

const LABEL_BY_STATUS: Record<string, string> = {
  COMPLETED: 'Completed',
  SCHEDULED: 'Scheduled',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  IN_PROGRESS: 'In progress',
};

const NEUTRAL_TONE = 'bg-control';

export function Badge({ label }: { label: string }) {
  return (
    <span
      className={`${TONE_BY_STATUS[label] ?? NEUTRAL_TONE} inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-ink`}
    >
      {LABEL_BY_STATUS[label] ?? label}
    </span>
  );
}
