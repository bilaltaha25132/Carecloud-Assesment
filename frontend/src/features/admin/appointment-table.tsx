import Link from 'next/link';
import type { AdminAppointment } from './api';
import { Badge } from '../../components/badge';
import { formatPhone } from '../patients/format';

const HEAD_CLASS = 'px-3 py-2 text-left text-xs font-medium text-ink-muted';
const CELL_CLASS = 'px-3 py-3 align-middle';
const CARD_LABEL_CLASS = 'text-xs font-medium text-ink-muted';

export function AppointmentTable({ appointments }: { appointments: AdminAppointment[] }) {
  return (
    <>
      <table className="hidden w-full border-collapse text-sm md:table">
        <thead>
          <tr className="border-b-[0.5px] border-hairline">
            <th className={HEAD_CLASS}>Patient</th>
            <th className={HEAD_CLASS}>Phone</th>
            <th className={HEAD_CLASS}>When</th>
            <th className={HEAD_CLASS}>Status</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appointment) => (
            <tr className="border-b-[0.5px] border-hairline hover:bg-hover" key={appointment.appointment_id}>
              <td className={CELL_CLASS}>
                <Link className="font-medium hover:text-brand" href={`/patients/${appointment.patient_id}`}>
                  {appointment.patient_name}
                </Link>
              </td>
              <td className={`${CELL_CLASS} tabular-nums`}>{formatPhone(appointment.patient_phone)}</td>
              <td className={CELL_CLASS}>{appointment.label}</td>
              <td className={CELL_CLASS}>
                <Badge label={appointment.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-3 md:hidden">
        {appointments.map((appointment) => (
          <article className="rounded-2xl bg-surface p-4" key={appointment.appointment_id}>
            <div className="flex items-baseline justify-between gap-3">
              <Link className="text-sm font-medium hover:text-brand" href={`/patients/${appointment.patient_id}`}>
                {appointment.patient_name}
              </Link>
              <Badge label={appointment.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt className={CARD_LABEL_CLASS}>Phone</dt>
                <dd className="text-sm tabular-nums">{formatPhone(appointment.patient_phone)}</dd>
              </div>
              <div>
                <dt className={CARD_LABEL_CLASS}>When</dt>
                <dd className="text-sm">{appointment.label}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}
