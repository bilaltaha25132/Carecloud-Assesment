import 'server-only';
import type { Call, Patient } from '../patients/api';
import { listPatients, listRecentCalls } from '../patients/api';
import type { AdminAppointment, AdminSlot } from '../admin/api';
import { listAllAppointments, listSlots } from '../admin/api';

const RECENT_LIMIT = 8;

export interface OverviewData {
  totalPatients: number;
  upcomingAppointments: number;
  totalCalls: number;
  openSlots: number;
  recentCalls: Call[];
  recentPatients: Patient[];
}

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

function byNewest(a: string, b: string): number {
  return new Date(b).getTime() - new Date(a).getTime();
}

export async function loadOverview(): Promise<OverviewData> {
  const [patients, calls, appointments, slots] = await Promise.all([
    safe<Patient[]>(listPatients({}), []),
    safe<Call[]>(listRecentCalls(), []),
    safe<AdminAppointment[]>(listAllAppointments(), []),
    safe<AdminSlot[]>(listSlots(), []),
  ]);

  const now = Date.now();
  const upcomingAppointments = appointments.filter(
    (appointment) => appointment.status === 'SCHEDULED' && new Date(appointment.scheduled_at).getTime() > now,
  ).length;
  const openSlots = slots.filter((slot) => !slot.booked && !slot.in_past).length;

  const recentCalls = [...calls].sort((a, b) => byNewest(a.started_at, b.started_at)).slice(0, RECENT_LIMIT);
  const recentPatients = [...patients].sort((a, b) => byNewest(a.created_at, b.created_at)).slice(0, RECENT_LIMIT);

  return {
    totalPatients: patients.length,
    upcomingAppointments,
    totalCalls: calls.length,
    openSlots,
    recentCalls,
    recentPatients,
  };
}
