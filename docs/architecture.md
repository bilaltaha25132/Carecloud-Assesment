# Architecture

## Components

```
 Caller ──phone──► Vapi (telephony, STT, TTS, LLM orchestration)
                     │  HTTPS webhooks: tool-calls, status-update, end-of-call-report
                     ▼
              NestJS API  (backend/)
              ├─ modules/voice        webhook auth, tool dispatch, transcript capture
              ├─ modules/patients     validation rules, REST CRUD, soft delete
              ├─ modules/calls        one row per call, linked to the patient it produced
              ├─ modules/appointments mock clinic calendar
              └─ core/database        Prisma + Postgres
                     ▲
 Dashboard (frontend/, Next.js) ──HTTP──┘   reads the same REST API
```

Vapi owns the audio pipeline. Our backend owns everything that has to be
correct: the prompt, the tool contracts, validation, persistence, and the
record of what happened on each call. The LLM runs on the user's OpenAI key,
registered with Vapi as a bring-your-own-key credential by the sync script.

## Request paths

**Phone call.** Vapi answers, speaks the first message, and streams the
conversation to the model. When the model calls a tool, Vapi POSTs to
`/voice/webhook` with the `x-vapi-secret` header. `VoiceService` dispatches
by message type; `VoiceToolsService` runs the tool against the same services
the REST API uses and returns a JSON string the model can relay. At hang-up,
Vapi sends `end-of-call-report` and the transcript is stored on the call row.

**REST.** `PatientsController` → `PatientsService` → `PatientsRepository` →
Prisma. Controllers hold no logic. Services hold the rules and throw Nest
exceptions. Repositories are the only Prisma consumers.

**Dashboard.** Server Components fetch the REST API on each request through
one `apiFetch` helper and render tables; there is no client-side state.

## Data model

Three tables, defined in `backend/prisma/schema.prisma` and enforced by the
initial migration:

- `patients`: every field from the assessment's data model in snake_case,
  `sex` as a Postgres enum, `phone_number` and `emergency_contact_phone` as
  `char(10)`, `state` as `char(2)`, `deleted_at` for soft delete. CHECK
  constraints guard the phone, ZIP, state and date-of-birth formats so an
  invalid row cannot be written even by bypassing the API. Indexed on the
  three filterable columns and on `deleted_at`.
- `calls`: keyed by Vapi's call id, holds status, ended reason, duration,
  transcript, summary, raw messages, and an optional `patient_id`.
- `appointments`: `patient_id`, `scheduled_at`, reason, status.

## Cross-cutting pieces

- `config/env.ts` validates every environment variable at boot with zod.
- `common/envelope.ts` defines the `{ data, error }` response shape; the
  interceptor applies it and `@RawResponse()` opts the Vapi webhook out.
- `common/all-exceptions.filter.ts` maps every thrown error to that envelope
  with the right status: 422 for validation, 404 for missing records, 500
  for anything unexpected (logged with its stack).
- `common/validate-dto.ts` runs the same transform-and-validate pass as the
  HTTP pipe for inputs that arrive through voice tools, so both entry points
  share `patients/patient.rules.ts`.
- Throttling is global (120 requests per minute per IP) and skipped for the
  webhook, which is protected by the shared secret instead.
