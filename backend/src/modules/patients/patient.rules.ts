import { Sex } from '@prisma/client';

/**
 * The single source of truth for what a valid patient field looks like.
 * The REST DTOs and the voice-agent tools both normalize and validate
 * through these helpers, so a caller and an API client are held to the
 * same rules. Each normalizer returns `null` when the input cannot be
 * coerced into a valid value.
 */

export const NAME_MAX = 50;
export const CITY_MAX = 100;

// Letters from any alphabet plus hyphens and apostrophes; a space is allowed
// so multi-part names like "Mary Ann" or "De La Cruz" are not rejected.
const NAME_PATTERN = /^\p{L}[\p{L}' -]*$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ZIP_PATTERN = /^\d{5}(-\d{4})?$/;
// NANP: neither the area code nor the exchange may start with 0 or 1.
const US_PHONE_PATTERN = /^[2-9]\d{2}[2-9]\d{6}$/;

export const US_STATES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia',
};

const STATE_BY_NAME = new Map(
  Object.entries(US_STATES).map(([code, name]) => [name.toLowerCase(), code]),
);

export const SEX_LABELS: Record<Sex, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
  DECLINE_TO_ANSWER: 'Decline to Answer',
};

const SEX_BY_LABEL = new Map<string, Sex>([
  ['male', 'MALE'],
  ['m', 'MALE'],
  ['female', 'FEMALE'],
  ['f', 'FEMALE'],
  ['other', 'OTHER'],
  ['decline to answer', 'DECLINE_TO_ANSWER'],
  ['decline', 'DECLINE_TO_ANSWER'],
  ['prefer not to say', 'DECLINE_TO_ANSWER'],
]);

export function isValidName(value: string): boolean {
  return value.length >= 1 && value.length <= NAME_MAX && NAME_PATTERN.test(value);
}

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}

export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  return US_PHONE_PATTERN.test(digits) ? digits : null;
}

export function normalizeState(input: string): string | null {
  const trimmed = input.trim();
  const code = trimmed.toUpperCase();
  if (code in US_STATES) return code;
  return STATE_BY_NAME.get(trimmed.toLowerCase()) ?? null;
}

export function normalizeZip(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 5) return digits;
  if (digits.length === 9) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return ZIP_PATTERN.test(input.trim()) ? input.trim() : null;
}

export function normalizeSex(input: string): Sex | null {
  const key = input.trim().toLowerCase().replace(/[_-]+/g, ' ');
  return SEX_BY_LABEL.get(key) ?? null;
}

/**
 * Accepts MM/DD/YYYY (the format the spec names) or ISO YYYY-MM-DD, and
 * rejects impossible dates like 02/30 and anything after today (UTC).
 */
export function parseDateOfBirth(input: string): Date | null {
  const value = input.trim();
  let year: number, month: number, day: number;

  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (us) [month, day, year] = [Number(us[1]), Number(us[2]), Number(us[3])];
  else if (iso) [year, month, day] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  const isReal =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!isReal || year < 1900) return null;

  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return date.getTime() > todayUtc ? null : date;
}

export function formatDateOfBirth(date: Date): string {
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${mm}/${dd}/${date.getUTCFullYear()}`;
}
