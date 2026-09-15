'use client';
import { useState } from 'react';
import type { Call } from './api';
import { Badge } from '../../components/badge';
import { formatDateTime, formatDuration } from './format';
import { Transcript } from './transcript';

// Calls arrive newest-first. With more than one, a tab per call keeps each
// transcript on its own surface instead of stacking them down the page.
export function CallsPanel({ calls }: { calls: Call[] }) {
  const [active, setActive] = useState(0);
  const call = calls[active] ?? calls[0];

  return (
    <div className="flex flex-col gap-4">
      {calls.length > 1 ? (
        <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto border-b-[0.5px] border-hairline px-1 pb-3">
          {calls.map((entry, index) => (
            <button
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                index === active ? 'bg-active text-ink' : 'text-ink-muted hover:bg-hover'
              }`}
              type="button"
              key={entry.call_id}
              onClick={() => setActive(index)}
            >
              {formatDateTime(entry.started_at)}
            </button>
          ))}
        </div>
      ) : null}

      <article>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">{formatDateTime(call.started_at)}</span>
          <Badge label={call.status} />
          <span className="text-xs tabular-nums text-ink-muted">{formatDuration(call.duration_seconds)}</span>
          {call.ended_reason ? <span className="text-xs text-ink-muted">{call.ended_reason}</span> : null}
        </div>
        {call.summary ? <p className="mt-3 text-sm">{call.summary}</p> : null}
        {call.transcript ? (
          <div className="mt-4">
            <Transcript text={call.transcript} />
          </div>
        ) : null}
      </article>
    </div>
  );
}
