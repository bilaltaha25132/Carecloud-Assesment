# Calls, transcripts, and appointments

## Calls

One row per phone call in `calls`, keyed by Vapi's call id.

- Created by the first webhook seen for the call (`status-update` with
  `in-progress`, or the first tool call), via an idempotent upsert, because
  Vapi's messages can arrive out of order or be retried.
- Linked to a patient when `register_patient` or `update_patient` succeeds.
- Completed by `end-of-call-report`: `status` becomes `COMPLETED`, or
  `FAILED` when the ended reason looks like an error, silence timeout, or
  pipeline failure. Transcript, summary, duration, raw messages and end time
  are stored.

Endpoints:

| Method | Path | Returns |
|---|---|---|
| GET | `/calls` | 100 most recent calls, newest first |
| GET | `/calls/:id` | one call, 404 if unknown |
| GET | `/patients/:id/calls` | calls linked to a patient |

Code: `backend/src/modules/calls/`.

## Appointments

A mock calendar with five weekday slots per day (9:00, 10:30, 13:00, 14:30,
16:00 Eastern) over the next five weekdays, minus already-booked slots.
Time-zone math uses `Intl` so daylight saving is correct without a library
(`clinic-time.ts`).

| Method | Path | Returns |
|---|---|---|
| GET | `/appointments/slots` | `[{ starts_at, label }]` |
| GET | `/patients/:id/appointments` | a patient's appointments |
| POST | `/patients/:id/appointments` | 201 with the booking; 422 if the slot is not open or in the past |

Body for POST: `{ "scheduled_at": "<starts_at from slots>", "reason": "optional" }`.

The voice agent uses the same service through `get_appointment_slots` and
`schedule_appointment`. Code: `backend/src/modules/appointments/`.
