# Voice AI Patient Registration

A phone number answered by an AI intake coordinator that registers new
patients through natural conversation, stores them in Postgres, and exposes
them through a REST API and a dashboard.

**Call it:** +1 (815) 415-9073
**API base URL:** https://carecloud-api.mbilaltaha.com
(`GET /health`, `GET /patients`, see [docs/flows/patients-api.md](docs/flows/patients-api.md))
**Staff console:** https://carecloud.mbilaltaha.com (sign in with `admin@carecloud.com` / `admin1234`)

Reviewers need no credentials to call the number or query the API. The API is
open; the Vapi webhook is protected by a shared secret. The system runs as a
Docker Compose stack (API, Postgres, console) behind nginx with Let's Encrypt
TLS; see [docs/deployment.md](docs/deployment.md).

## Try it

1. Call **+1 (815) 415-9073** and register a patient. The agent asks one thing
   at a time, accepts out-of-order answers, reads everything back before
   saving, and ends with a short goodbye.
2. Confirm it persisted: `curl https://carecloud-api.mbilaltaha.com/patients`,
   or open the console to see the patient, appointment, and call transcript.
3. Worth trying on a call: correct a field or a spelling mid-sentence; book an
   appointment when offered; say "Hablo español" to switch to Spanish; and call
   a second time with the same number to be recognized as a returning patient
   and offered an update.

## What it does

- Answers the call, collects the required demographics one question at a
  time, accepts answers out of order, handles corrections and spelled names,
  re-asks a specific field when it is invalid, offers the optional fields,
  reads everything back, saves only after an explicit yes, and ends with
  "You're all set, [first name]."
- Persists to Postgres with typed columns, an enum, and CHECK constraints.
- REST API with a consistent `{ data, error }` envelope, server-side
  validation, partial updates, and soft delete.
- Bonuses: duplicate detection by phone number with an offer to update,
  appointment scheduling with an admin API to manage bookable slots, Spanish
  switching, per-call transcript and summary linked to the patient, a staff
  admin console, and unit plus e2e tests.

## Staff console

A small Next.js console for staff, behind a demo login. Overview dashboard
(patient, appointment, call and open-slot counts, plus recent calls and
registrations), a patients list and detail view with call transcripts, and an
appointments page that lists every booking and lets staff open or remove
slots. Run it with `cd frontend && npm run dev`, open http://localhost:3001,
and sign in with the credentials in `frontend/.env.local` (`APP_USERNAME` /
`APP_PASSWORD`). The login is a single shared credential and a UX gate, not
real authentication.

## Architecture

```
Caller ──phone──► Vapi (telephony, STT, TTS, turn-taking, LLM on our OpenAI key)
                    │ HTTPS webhooks (tool calls, call status, end-of-call report)
                    ▼
             NestJS API ── Prisma ── Postgres
                    ▲
             Next.js dashboard
```

Vapi owns the audio. The backend owns the prompt, the tool contracts,
validation, persistence, and the record of every call. The full description
is in [docs/architecture.md](docs/architecture.md); the phone flow, prompt
design and edge-case handling are in
[docs/flows/voice-agent.md](docs/flows/voice-agent.md). The system prompt
itself is `backend/src/modules/voice/assistant/intake.prompt.ts`, with a
commented header explaining each section.

## Tech stack and why

| Layer | Choice | Reason |
|---|---|---|
| Telephony and voice | Vapi | Free U.S. number that accepts calls from anyone, sub-second pipeline, bring-your-own OpenAI key. Twilio's trial only accepts calls from verified numbers ([ADR 0001](docs/decisions/0001-vapi-over-twilio.md)) |
| LLM | OpenAI `gpt-4.1` | Fast, reliable tool calling, good instruction following for a tightly scripted flow |
| STT / TTS | Deepgram nova-3 multilingual, ElevenLabs Flash v2.5 | Lowest-latency options that still handle a switch to Spanish |
| Backend | NestJS 11, TypeScript | Enforced controller / service / repository layering, DI, first-class validation |
| Database | Postgres 16, Prisma 7 | Real enums and CHECK constraints for the schema criterion ([ADR 0002](docs/decisions/0002-postgres-prisma-and-shared-rules.md)) |
| Dashboard | Next.js 16 App Router, Tailwind v4 | Server Components read the API directly; no client state |
| Hosting | Docker Compose behind nginx with Let's Encrypt TLS on a VPS | Always-on, so the phone webhook never cold-starts; no laptop dependency. ngrok is the zero-setup option for local dev ([docs/deployment.md](docs/deployment.md)) |

## Run it locally

Full commands in [docs/setup.md](docs/setup.md). Short version:

```bash
docker compose up -d
cd backend && cp .env.example .env   # fill in the keys
npm install && npx prisma migrate deploy && npm run db:seed
npm run build && npm run start:prod
ngrok http 3000                        # put the https URL in PUBLIC_BASE_URL
npm run vapi:sync                      # creates the assistant and phone number
```

Tests (45: 32 unit on the validation rules, 13 e2e over the REST API and the
webhook): `npm test`, `npm run test:e2e`, `npm run lint`, `npm run typecheck`
inside `backend/`.

To deploy the whole thing (API, Postgres, console) as a self-contained Docker
stack behind nginx, see [docs/deployment.md](docs/deployment.md).

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port (default 3000) |
| `PUBLIC_BASE_URL` | Public HTTPS URL of this API; Vapi posts to `/voice/webhook` under it |
| `DATABASE_URL` | Postgres connection string |
| `OPENAI_API_KEY` | Registered with Vapi as a bring-your-own-key credential |
| `VAPI_API_KEY` | Vapi private key, used only by the sync script |
| `VAPI_WEBHOOK_SECRET` | Random string Vapi echoes in `x-vapi-secret`; requests without it are rejected |
| `ADMIN_API_KEY` | Optional. Guards `/admin/*` routes via the `x-admin-key` header; blank leaves them open for local dev |

No key is hardcoded; the boot fails with a clear message if one is missing.

## Observability

Every tool call, every successful registration (with the full payload), and
every call end (with transcript and summary) is logged to stdout as a
single JSON line. Transcripts are also stored on the `calls` table and shown
in the dashboard.

## Known limitations and trade-offs

- Hosting is a Docker Compose stack behind nginx on a small VPS for the review
  window. If the API URL ever changes, `npm run vapi:sync` re-points the Vapi
  assistant in seconds (then publish it in the Vapi dashboard).
- Vapi's free credits cover the demo, not sustained traffic.
- The appointment calendar is mock data: fixed weekday slots, no clinician
  or location.
- Phone numbers are not unique per patient (households share numbers), so
  duplicate detection offers the most recent record rather than enforcing
  uniqueness.
- The staff console login is a single shared credential and a UX gate, not
  real authentication; the underlying API is open, as the brief allows.
- No HIPAA controls; this is an assessment, not a clinical system.

## Next steps

- Reuse detection for a caller's own number (Vapi passes the caller ID) to
  greet returning patients before they say anything.
- Redis-backed throttling and a request id per webhook for multi-instance
  deployment.
- A `DELETE` audit trail and restore endpoint.
- Container image and CI running lint, typecheck and both test suites.
