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

Bookable times are rows in `appointment_slots`, managed by staff through the
admin API (below). A slot is offered to a caller when it is in the future and
no appointment is booked at that time. The seed opens the standard clinic
times (9:00, 10:30, 13:00, 14:30, 16:00 Eastern) across the next five
weekdays; time-zone math uses `Intl` so daylight saving is correct without a
library (`clinic-time.ts`).

| Method | Path | Returns |
|---|---|---|
| GET | `/appointments/slots` | open slots `[{ starts_at, label }]` |
| GET | `/patients/:id/appointments` | a patient's appointments |
| POST | `/patients/:id/appointments` | 201 with the booking; 422 if the slot is not open or in the past |

Body for POST: `{ "scheduled_at": "<starts_at from slots>", "reason": "optional" }`.

The voice agent uses the same service through `get_appointment_slots` and
`schedule_appointment`. Code: `backend/src/modules/appointments/`.

## Admin: managing slots

Staff open, move, and remove bookable times through these routes. They are
guarded by the `AdminKeyGuard`: send the `ADMIN_API_KEY` value in an
`x-admin-key` header. If that env var is blank the routes stay open for local
dev and log a warning.

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/appointment-slots` | every slot with `booked` and `in_past` flags |
| POST | `/admin/appointment-slots` | open a slot; 409 if one exists at that time, 422 if in the past |
| PUT | `/admin/appointment-slots/:id` | move a slot to a new time |
| DELETE | `/admin/appointment-slots/:id` | remove a slot; 404 if unknown |

Body for POST and PUT: `{ "starts_at": "2026-09-18T14:00:00.000Z" }` (ISO 8601).
Code: `backend/src/modules/appointments/appointment-slots.*`.
