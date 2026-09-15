import 'server-only';
import { API_BASE_URL, ApiError, UNREACHABLE } from '../patients/api';

export interface AdminAppointment {
  appointment_id: string;
  patient_id: string;
  scheduled_at: string;
  label: string;
  reason: string | null;
  status: string;
  created_at: string;
  patient_name: string;
  patient_phone: string;
}

export interface AdminSlot {
  slot_id: string;
  starts_at: string;
  label: string;
  booked: boolean;
  in_past: boolean;
}

interface Envelope<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        'x-admin-key': process.env.ADMIN_API_KEY ?? '',
        ...(init?.body ? { 'content-type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
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

export function listAllAppointments(): Promise<AdminAppointment[]> {
  return adminFetch<AdminAppointment[]>('/admin/appointments');
}

export function listSlots(): Promise<AdminSlot[]> {
  return adminFetch<AdminSlot[]>('/admin/appointment-slots');
}

export function createSlot(startsAt: string): Promise<AdminSlot> {
  return adminFetch<AdminSlot>('/admin/appointment-slots', {
    method: 'POST',
    body: JSON.stringify({ starts_at: startsAt }),
  });
}

export function updateSlot(id: string, startsAt: string): Promise<AdminSlot> {
  return adminFetch<AdminSlot>(`/admin/appointment-slots/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ starts_at: startsAt }),
  });
}

export function deleteSlot(id: string): Promise<AdminSlot> {
  return adminFetch<AdminSlot>(`/admin/appointment-slots/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
