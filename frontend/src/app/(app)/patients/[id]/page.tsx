import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Appointment, Call, Patient } from '../../../../features/patients/api';
import { ApiError, NOT_FOUND, getPatient, listAppointments, listCalls } from '../../../../features/patients/api';
import { Badge } from '../../../../components/badge';
import { Block } from '../../../../components/block';
import { EmptyState } from '../../../../components/empty-state';
import { EM_DASH, formatDateTime, formatPhone } from '../../../../features/patients/format';
import { CallsPanel } from '../../../../features/patients/calls-panel';

interface PatientRecord {
  patient: Patient | null;
  appointments: Appointment[];
  calls: Call[];
  failure: string | null;
}

async function loadPatient(id: string): Promise<PatientRecord> {
  try {
    const patient = await getPatient(id);
    const [appointments, calls] = await Promise.all([listAppointments(id), listCalls(id)]);
    return { patient, appointments, calls, failure: null };
  } catch (error) {
    if (error instanceof ApiError && error.code === NOT_FOUND) notFound();
    return {
      patient: null,
      appointments: [],
      calls: [],
      failure: error instanceof ApiError ? error.message : 'This patient could not be loaded.',
    };
  }
}

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { patient, appointments, calls, failure } = await loadPatient(id);

  if (!patient) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <EmptyState title={failure ?? 'This patient could not be loaded.'} detail="Start the API and reload this page." />
      </div>
    );
  }

  const demographics = [
    { label: 'First name', value: patient.first_name },
    { label: 'Last name', value: patient.last_name },
    { label: 'Date of birth', value: patient.date_of_birth },
    { label: 'Sex', value: patient.sex },
    { label: 'Phone', value: formatPhone(patient.phone_number) },
    { label: 'Email', value: patient.email },
    { label: 'Address line 1', value: patient.address_line_1 },
    { label: 'Address line 2', value: patient.address_line_2 },
    { label: 'City', value: patient.city },
    { label: 'State', value: patient.state },
    { label: 'ZIP code', value: patient.zip_code },
    { label: 'Insurance provider', value: patient.insurance_provider },
    { label: 'Insurance member ID', value: patient.insurance_member_id },
    { label: 'Preferred language', value: patient.preferred_language },
    { label: 'Emergency contact', value: patient.emergency_contact_name },
    { label: 'Emergency contact phone', value: formatPhone(patient.emergency_contact_phone) },
    { label: 'Registered', value: formatDateTime(patient.created_at) },
    { label: 'Last updated', value: formatDateTime(patient.updated_at) },
    { label: 'Deleted', value: patient.deleted_at ? formatDateTime(patient.deleted_at) : null },
  ];

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

      <div className="flex flex-wrap items-center gap-3 border-b-[0.5px] border-hairline pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">Patient</p>
          <h1 className="mt-1 text-sm font-semibold">
            {patient.first_name} {patient.last_name}
          </h1>
        </div>
        <Badge label={patient.patient_id} />
      </div>

      <Block title="Demographics">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {demographics.map((field) => (
            <div key={field.label}>
              <dt className="text-xs font-medium text-ink-muted">{field.label}</dt>
              <dd className="mt-0.5 text-sm break-words">{field.value ?? EM_DASH}</dd>
            </div>
          ))}
        </dl>
      </Block>

      <Block title="Appointments">
        {appointments.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {appointments.map((appointment) => (
              <li
                className="flex flex-wrap items-start justify-between gap-3 border-b-[0.5px] border-hairline pb-4 last:border-b-0 last:pb-0"
                key={appointment.appointment_id}
              >
                <div>
                  <p className="text-sm">{appointment.label}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{appointment.reason ?? EM_DASH}</p>
                </div>
                <Badge label={appointment.status} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No appointments booked yet." />
        )}
      </Block>

      <Block title="Calls">
        {calls.length > 0 ? (
          <CallsPanel calls={calls} />
        ) : (
          <EmptyState title="No calls recorded for this patient." />
        )}
      </Block>
    </div>
  );
}

function BackLink() {
  return (
    <Link className="text-sm text-ink-muted hover:text-brand" href="/patients">
      &larr; Patients
    </Link>
  );
}
