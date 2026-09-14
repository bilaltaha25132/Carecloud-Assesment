import Link from 'next/link';
import type { Patient } from './api';
import { formatDate, formatPhone } from './format';

const HEAD_CLASS = 'px-3 py-2 text-left text-xs font-medium text-ink-muted';
const CELL_CLASS = 'px-3 py-3 align-middle';
const CARD_LABEL_CLASS = 'text-xs font-medium text-ink-muted';

export function PatientTable({ patients }: { patients: Patient[] }) {
  return (
    <>
      <table className="hidden w-full border-collapse text-sm md:table">
        <thead>
          <tr className="border-b-[0.5px] border-hairline">
            <th className={HEAD_CLASS}>Name</th>
            <th className={HEAD_CLASS}>Date of birth</th>
            <th className={HEAD_CLASS}>Sex</th>
            <th className={HEAD_CLASS}>Phone</th>
            <th className={HEAD_CLASS}>City / State</th>
            <th className={HEAD_CLASS}>Language</th>
            <th className={HEAD_CLASS}>Registered</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr className="border-b-[0.5px] border-hairline hover:bg-hover" key={patient.patient_id}>
              <td className={CELL_CLASS}>
                <Link className="font-medium hover:text-brand" href={`/patients/${patient.patient_id}`}>
                  {patient.first_name} {patient.last_name}
                </Link>
              </td>
              <td className={`${CELL_CLASS} tabular-nums`}>{patient.date_of_birth}</td>
              <td className={CELL_CLASS}>{patient.sex}</td>
              <td className={`${CELL_CLASS} tabular-nums`}>{formatPhone(patient.phone_number)}</td>
              <td className={CELL_CLASS}>
                {patient.city}, {patient.state}
              </td>
              <td className={CELL_CLASS}>{patient.preferred_language}</td>
              <td className={`${CELL_CLASS} text-ink-muted`}>{formatDate(patient.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-3 md:hidden">
        {patients.map((patient) => (
          <article className="rounded-2xl bg-surface-muted p-4" key={patient.patient_id}>
            <div className="flex items-baseline justify-between gap-3">
              <Link className="text-sm font-medium hover:text-brand" href={`/patients/${patient.patient_id}`}>
                {patient.first_name} {patient.last_name}
              </Link>
              <span className="text-xs text-ink-muted">{formatDate(patient.created_at)}</span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt className={CARD_LABEL_CLASS}>Date of birth</dt>
                <dd className="text-sm tabular-nums">{patient.date_of_birth}</dd>
              </div>
              <div>
                <dt className={CARD_LABEL_CLASS}>Sex</dt>
                <dd className="text-sm">{patient.sex}</dd>
              </div>
              <div>
                <dt className={CARD_LABEL_CLASS}>Phone</dt>
                <dd className="text-sm tabular-nums">{formatPhone(patient.phone_number)}</dd>
              </div>
              <div>
                <dt className={CARD_LABEL_CLASS}>City / State</dt>
                <dd className="text-sm">
                  {patient.city}, {patient.state}
                </dd>
              </div>
              <div>
                <dt className={CARD_LABEL_CLASS}>Language</dt>
                <dd className="text-sm">{patient.preferred_language}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}
