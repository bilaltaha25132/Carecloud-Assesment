import { Patient, Prisma, Sex } from '@prisma/client';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { formatDateOfBirth, SEX_LABELS } from './patient.rules';

/** The wire shape of a patient: snake_case, spec-named, MM/DD/YYYY birth date. */
export interface PatientDto {
  patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  sex: string;
  phone_number: string;
  email: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  zip_code: string;
  insurance_provider: string | null;
  insurance_member_id: string | null;
  preferred_language: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function toPatientDto(p: Patient): PatientDto {
  return {
    patient_id: p.id,
    first_name: p.firstName,
    last_name: p.lastName,
    date_of_birth: formatDateOfBirth(p.dateOfBirth),
    sex: SEX_LABELS[p.sex],
    phone_number: p.phoneNumber,
    email: p.email,
    address_line_1: p.addressLine1,
    address_line_2: p.addressLine2,
    city: p.city,
    state: p.state,
    zip_code: p.zipCode,
    insurance_provider: p.insuranceProvider,
    insurance_member_id: p.insuranceMemberId,
    preferred_language: p.preferredLanguage,
    emergency_contact_name: p.emergencyContactName,
    emergency_contact_phone: p.emergencyContactPhone,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
    deleted_at: p.deletedAt?.toISOString() ?? null,
  };
}

export function toCreateData(dto: CreatePatientDto): Prisma.PatientCreateInput {
  return {
    firstName: dto.first_name,
    lastName: dto.last_name,
    dateOfBirth: dto.date_of_birth,
    sex: dto.sex as Sex,
    phoneNumber: dto.phone_number,
    email: dto.email ?? null,
    addressLine1: dto.address_line_1,
    addressLine2: dto.address_line_2 ?? null,
    city: dto.city,
    state: dto.state,
    zipCode: dto.zip_code,
    insuranceProvider: dto.insurance_provider ?? null,
    insuranceMemberId: dto.insurance_member_id ?? null,
    preferredLanguage: dto.preferred_language ?? 'English',
    emergencyContactName: dto.emergency_contact_name ?? null,
    emergencyContactPhone: dto.emergency_contact_phone ?? null,
  };
}

const UPDATE_COLUMNS: Record<keyof UpdatePatientDto, keyof Prisma.PatientUpdateInput> = {
  first_name: 'firstName',
  last_name: 'lastName',
  date_of_birth: 'dateOfBirth',
  sex: 'sex',
  phone_number: 'phoneNumber',
  email: 'email',
  address_line_1: 'addressLine1',
  address_line_2: 'addressLine2',
  city: 'city',
  state: 'state',
  zip_code: 'zipCode',
  insurance_provider: 'insuranceProvider',
  insurance_member_id: 'insuranceMemberId',
  preferred_language: 'preferredLanguage',
  emergency_contact_name: 'emergencyContactName',
  emergency_contact_phone: 'emergencyContactPhone',
};

/** Only keys present in the request are written, so a partial PUT never nulls untouched columns. */
export function toUpdateData(dto: UpdatePatientDto): Prisma.PatientUpdateInput {
  const data: Record<string, unknown> = {};
  for (const [field, column] of Object.entries(UPDATE_COLUMNS)) {
    const value = dto[field as keyof UpdatePatientDto];
    if (value !== undefined) data[column] = value;
  }
  return data;
}
