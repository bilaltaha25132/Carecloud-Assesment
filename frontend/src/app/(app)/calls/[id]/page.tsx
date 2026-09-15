import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '../../../../components/badge';
import { Block } from '../../../../components/block';
import { EmptyState } from '../../../../components/empty-state';
import { ApiError, NOT_FOUND, getCall } from '../../../../features/patients/api';
import { formatDateTime, formatDuration } from '../../../../features/patients/format';
import { Transcript } from '../../../../features/patients/transcript';

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let call;
  try {
    call = await getCall(id);
  } catch (error) {
    if (error instanceof ApiError && error.code === NOT_FOUND) notFound();
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <EmptyState title="This call could not be loaded." detail="Start the API and reload this page." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

      <div className="flex flex-wrap items-center gap-3 border-b-[0.5px] border-hairline pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">Call</p>
          <h1 className="mt-1 text-sm font-semibold">{formatDateTime(call.started_at)}</h1>
        </div>
        <Badge label={call.status} />
        <span className="text-xs tabular-nums text-ink-muted">{formatDuration(call.duration_seconds)}</span>
        {call.ended_reason ? <span className="text-xs text-ink-muted">{call.ended_reason}</span> : null}
        {call.patient_id ? (
          <Link className="text-xs font-medium text-brand hover:opacity-80" href={`/patients/${call.patient_id}`}>
            View patient
          </Link>
        ) : null}
      </div>

      <Block title="Transcript">
        {call.summary ? <p className="mb-4 text-sm text-ink-muted">{call.summary}</p> : null}
        {call.transcript ? (
          <Transcript text={call.transcript} />
        ) : (
          <EmptyState title="No transcript was captured for this call." />
        )}
      </Block>
    </div>
  );
}

function BackLink() {
  return (
    <Link className="text-sm text-ink-muted hover:text-brand" href="/">
      &larr; Overview
    </Link>
  );
}
