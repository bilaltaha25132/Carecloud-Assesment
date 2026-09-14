/**
 * Mock clinic calendar: five weekday slots per day in Eastern time.
 * Offsets are derived through Intl so DST is handled without a date library.
 */
export const CLINIC_TIME_ZONE = 'America/New_York';
export const CLINIC_SLOT_TIMES: ReadonlyArray<[hour: number, minute: number]> = [
  [9, 0],
  [10, 30],
  [13, 0],
  [14, 30],
  [16, 0],
];

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CLINIC_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const labelFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CLINIC_TIME_ZONE,
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
});

function zoneOffsetMs(utcMs: number): number {
  const parts = partsFormatter.formatToParts(new Date(utcMs));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  const wallClockAsUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return wallClockAsUtc - utcMs;
}

/** The instant at which the clinic's wall clock reads the given local date and time. */
export function clinicInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  return new Date(naive - zoneOffsetMs(naive));
}

export function clinicLabel(date: Date): string {
  return labelFormatter.format(date);
}

/** Calendar days (as UTC midnight dates) for the next `count` weekdays after today in clinic time. */
export function upcomingWeekdays(count: number, from = new Date()): Date[] {
  const parts = partsFormatter.formatToParts(from);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  const cursor = new Date(Date.UTC(get('year'), get('month') - 1, get('day')));

  const days: Date[] = [];
  while (days.length < count) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const weekday = cursor.getUTCDay();
    if (weekday !== 0 && weekday !== 6) days.push(new Date(cursor));
  }
  return days;
}
