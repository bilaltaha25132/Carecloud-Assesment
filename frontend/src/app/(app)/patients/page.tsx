import type { Patient, PatientFilters } from '../../../features/patients/api';
import { ApiError, listPatients } from '../../../features/patients/api';
import { EmptyState } from '../../../components/empty-state';
import { FilterBar } from '../../../features/patients/filter-bar';
import { PatientTable } from '../../../features/patients/patient-table';

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const filters: PatientFilters = {
    last_name: single(query.last_name),
    date_of_birth: single(query.date_of_birth),
    phone_number: single(query.phone_number),
  };

  let patients: Patient[] = [];
  let failure: string | null = null;

  try {
    patients = await listPatients(filters);
  } catch (error) {
    failure = error instanceof ApiError ? error.message : 'Patients could not be loaded.';
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-2 border-b-[0.5px] border-hairline pb-4">
        <h1 className="text-sm font-semibold">Patients</h1>
        <span className="text-xs font-medium tabular-nums text-ink-muted">{patients.length}</span>
      </div>

      <FilterBar filters={filters} />

      {failure ? (
        <EmptyState title={failure} detail="Start the API and reload this page." />
      ) : patients.length > 0 ? (
        <PatientTable patients={patients} />
      ) : (
        <EmptyState title="No patients match these filters." detail="Clear the filters to see everyone." />
      )}
    </div>
  );
}
