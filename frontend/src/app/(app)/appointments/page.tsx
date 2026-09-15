import type { AdminAppointment, AdminSlot } from '../../../features/admin/api';
import { listAllAppointments, listSlots } from '../../../features/admin/api';
import { ApiError } from '../../../features/patients/api';
import { Block } from '../../../components/block';
import { EmptyState } from '../../../components/empty-state';
import { AppointmentTable } from '../../../features/admin/appointment-table';
import { SlotManager } from '../../../features/admin/slot-manager';

function sortUpcomingFirst(appointments: AdminAppointment[]): AdminAppointment[] {
  const now = Date.now();
  return [...appointments].sort((a, b) => {
    const aTime = new Date(a.scheduled_at).getTime();
    const bTime = new Date(b.scheduled_at).getTime();
    const aFuture = aTime >= now;
    const bFuture = bTime >= now;
    if (aFuture !== bFuture) return aFuture ? -1 : 1;
    return aFuture ? aTime - bTime : bTime - aTime;
  });
}

export default async function AppointmentsPage() {
  let appointments: AdminAppointment[] = [];
  let appointmentsError: string | null = null;
  try {
    appointments = await listAllAppointments();
  } catch (error) {
    appointmentsError = error instanceof ApiError ? error.message : 'Appointments could not be loaded.';
  }

  let slots: AdminSlot[] = [];
  let slotsError: string | null = null;
  try {
    slots = await listSlots();
  } catch (error) {
    slotsError = error instanceof ApiError ? error.message : 'Slots could not be loaded.';
  }

  const sortedAppointments = sortUpcomingFirst(appointments);
  const openSlots = slots.filter((slot) => !slot.in_past);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-2 border-b-[0.5px] border-hairline pb-4">
        <h1 className="text-sm font-semibold">Appointments</h1>
        <span className="text-xs font-medium tabular-nums text-ink-muted">{appointments.length}</span>
      </div>

      <Block title="Appointments">
        {appointmentsError ? (
          <EmptyState title={appointmentsError} detail="Start the API and reload this page." />
        ) : sortedAppointments.length > 0 ? (
          <AppointmentTable appointments={sortedAppointments} />
        ) : (
          <EmptyState title="No appointments booked yet." />
        )}
      </Block>

      <Block title="Open slots">
        {slotsError ? (
          <EmptyState title={slotsError} detail="Start the API and reload this page." />
        ) : (
          <SlotManager slots={openSlots} />
        )}
      </Block>
    </div>
  );
}
