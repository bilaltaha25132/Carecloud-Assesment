import 'server-only';

export const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

export const NOT_FOUND = 'NOT_FOUND';
export const UNREACHABLE = 'UNREACHABLE';

export interface Patient {
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

export interface Call {
  call_id: string;
  patient_id: string | null;
  caller_number: string | null;
  status: string;
  ended_reason: string | null;
  duration_seconds: number | null;
  transcript: string | null;
  summary: string | null;
  started_at: string;
  ended_at: string | null;
}

export interface Appointment {
  appointment_id: string;
  scheduled_at: string;
  label: string;
  reason: string | null;
  status: string;
}

export interface PatientFilters {
  last_name?: string;
  date_of_birth?: string;
  phone_number?: string;
}

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface Envelope<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

async function request<T>(path: string, search?: URLSearchParams): Promise<T> {
  const query = search?.toString();
  const url = query ? `${API_BASE_URL}${path}?${query}` : `${API_BASE_URL}${path}`;
  let response: Response;

  try {
    response = await fetch(url, { cache: 'no-store' });
  } catch {
    throw new ApiError(UNREACHABLE, `Could not reach the API at ${API_BASE_URL}.`);
  }

  const envelope = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (!envelope) {
    throw new ApiError('MALFORMED_RESPONSE', `The API returned an unreadable response (${response.status}).`);
  }
  if (envelope.error || envelope.data === null) {
    throw new ApiError(envelope.error?.code ?? 'ERROR', envelope.error?.message ?? 'The request failed.');
  }

  return envelope.data;
}

export function listPatients(filters: PatientFilters): Promise<Patient[]> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) search.set(key, value);
  }
  return request<Patient[]>('/patients', search);
}

export function getPatient(id: string): Promise<Patient> {
  return request<Patient>(`/patients/${encodeURIComponent(id)}`);
}

export function listCalls(id: string): Promise<Call[]> {
  return request<Call[]>(`/patients/${encodeURIComponent(id)}/calls`);
}

export function listRecentCalls(): Promise<Call[]> {
  return request<Call[]>('/calls');
}

export function getCall(id: string): Promise<Call> {
  return request<Call>(`/calls/${encodeURIComponent(id)}`);
}

export function listAppointments(id: string): Promise<Appointment[]> {
  return request<Appointment[]>(`/patients/${encodeURIComponent(id)}/appointments`);
}
