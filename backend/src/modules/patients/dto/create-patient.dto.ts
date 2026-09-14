import { IsOptional } from 'class-validator';
import {
  CITY_MAX,
  isValidEmail,
  isValidName,
  normalizePhone,
  normalizeSex,
  normalizeState,
  normalizeZip,
  parseDateOfBirth,
} from '../patient.rules';
import { Normalized } from './normalized.decorator';

const name = (raw: string) => (isValidName(raw.trim()) ? raw.trim() : null);
const email = (raw: string) => (isValidEmail(raw.trim()) ? raw.trim().toLowerCase() : null);
const text = (max: number) => (raw: string) => {
  const value = raw.trim();
  return value.length >= 1 && value.length <= max ? value : null;
};
const memberId = (raw: string) => {
  const value = raw.replace(/\s+/g, '').toUpperCase();
  return /^[A-Z0-9-]{1,50}$/.test(value) ? value : null;
};

/**
 * Field names are the snake_case names from the spec so the API contract
 * and the voice tool schema read identically.
 */
export class CreatePatientDto {
  @Normalized(name, 'First name must be 1-50 letters, hyphens or apostrophes')
  first_name!: string;

  @Normalized(name, 'Last name must be 1-50 letters, hyphens or apostrophes')
  last_name!: string;

  @Normalized(
    parseDateOfBirth,
    'Date of birth must be a real date in MM/DD/YYYY format and not in the future',
  )
  date_of_birth!: Date;

  @Normalized(normalizeSex, 'Sex must be one of Male, Female, Other, or Decline to Answer')
  sex!: string;

  @Normalized(normalizePhone, 'Phone number must be a valid 10-digit U.S. number')
  phone_number!: string;

  @IsOptional()
  @Normalized(email, 'Email must be a valid email address')
  email?: string | null;

  @Normalized(text(200), 'Street address is required (max 200 characters)')
  address_line_1!: string;

  @IsOptional()
  @Normalized(text(200), 'Address line 2 must be 1-200 characters')
  address_line_2?: string | null;

  @Normalized(text(CITY_MAX), 'City must be 1-100 characters')
  city!: string;

  @Normalized(normalizeState, 'State must be a valid 2-letter U.S. state abbreviation')
  state!: string;

  @Normalized(normalizeZip, 'ZIP code must be 5 digits or ZIP+4 format')
  zip_code!: string;

  @IsOptional()
  @Normalized(text(100), 'Insurance provider must be 1-100 characters')
  insurance_provider?: string | null;

  @IsOptional()
  @Normalized(memberId, 'Insurance member ID must be alphanumeric')
  insurance_member_id?: string | null;

  @IsOptional()
  @Normalized(text(50), 'Preferred language must be 1-50 characters')
  preferred_language?: string | null;

  @IsOptional()
  @Normalized(text(100), 'Emergency contact name must be 1-100 characters')
  emergency_contact_name?: string | null;

  @IsOptional()
  @Normalized(normalizePhone, 'Emergency contact phone must be a valid 10-digit U.S. number')
  emergency_contact_phone?: string | null;
}
