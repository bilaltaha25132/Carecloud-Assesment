import Link from 'next/link';
import { Badge } from '../../components/badge';
import { Block } from '../../components/block';
import { EmptyState } from '../../components/empty-state';
import { formatDate, formatDateTime, formatDuration, formatPhone } from '../../features/patients/format';
import { loadOverview } from '../../features/overview/api';

const STAT_TONES = ['bg-card-lavender', 'bg-card-blue', 'bg-card-mint', 'bg-card-amber'] as const;
const VIEW_LINK_CLASS =
  'ml-auto inline-flex items-center rounded-lg border-[0.5px] border-hairline px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-hover hover:text-ink';

export default async function OverviewPage() {
  const overview = await loadOverview();

  const stats = [
    { label: 'Total patients', value: overview.totalPatients },
    { label: 'Upcoming appointments', value: overview.upcomingAppointments },
    { label: 'Calls', value: overview.totalCalls },
    { label: 'Open slots', value: overview.openSlots },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-2 border-b-[0.5px] border-hairline pb-4">
        <h1 className="text-sm font-semibold">Overview</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div className={`${STAT_TONES[index]} rounded-[20px] p-6`} key={stat.label}>
            <p className="text-2xl font-semibold tabular-nums text-card-ink">{stat.value}</p>
            <p className="mt-1 text-sm text-card-ink-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <Block title="Recent calls">
        {overview.recentCalls.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {overview.recentCalls.map((call) => (
              <li
                className="flex flex-col gap-1.5 border-b-[0.5px] border-hairline pb-4 last:border-b-0 last:pb-0"
                key={call.call_id}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium">{formatDateTime(call.started_at)}</span>
                  <Badge label={call.status} />
                  <span className="text-xs tabular-nums text-ink-muted">{formatDuration(call.duration_seconds)}</span>
                  <Link className={VIEW_LINK_CLASS} href={`/calls/${call.call_id}`}>
                    View transcript
                  </Link>
                </div>
                {call.summary ? <p className="text-sm text-ink-muted">{call.summary}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No calls recorded yet." />
        )}
      </Block>

      <Block title="Recent registrations">
        {overview.recentPatients.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {overview.recentPatients.map((patient) => (
              <li
                className="flex flex-wrap items-baseline justify-between gap-3 border-b-[0.5px] border-hairline pb-3 last:border-b-0 last:pb-0"
                key={patient.patient_id}
              >
                <Link className="text-sm font-medium hover:text-brand" href={`/patients/${patient.patient_id}`}>
                  {patient.first_name} {patient.last_name}
                </Link>
                <span className="text-xs tabular-nums text-ink-muted">{formatPhone(patient.phone_number)}</span>
                <span className="text-xs text-ink-muted">{formatDate(patient.created_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No patients registered yet." />
        )}
      </Block>
    </div>
  );
}
