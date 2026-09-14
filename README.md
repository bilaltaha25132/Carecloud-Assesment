# Voice AI Patient Registration

A phone number answered by an AI intake coordinator that registers new
patients through natural conversation, stores them in Postgres, and exposes
them through a REST API and a dashboard.

**Call it:** +1 (815) 415-9015
**API base URL:** https://noninstinctively-exergonic-dora.ngrok-free.dev
(`GET /health`, `GET /patients`, see [docs/flows/patients-api.md](docs/flows/patients-api.md))

Reviewers need no credentials. The API is open; the Vapi webhook is protected
by a shared secret.

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
  mock appointment scheduling, Spanish switching, per-call transcript and
  summary linked to the patient, a dashboard, and unit plus e2e tests.

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
| LLM | OpenAI `gpt-4.1-mini` | Fast, reliable tool calling, good instruction following for a tightly scripted flow |
| STT / TTS | Deepgram nova-3 multilingual, ElevenLabs Flash v2.5 | Lowest-latency options that still handle a switch to Spanish |
| Backend | NestJS 11, TypeScript | Enforced controller / service / repository layering, DI, first-class validation |
| Database | Postgres 16, Prisma 7 | Real enums and CHECK constraints for the schema criterion ([ADR 0002](docs/decisions/0002-postgres-prisma-and-shared-rules.md)) |
| Dashboard | Next.js 16 App Router, Tailwind v4 | Server Components read the API directly; no client state |
| Hosting | ngrok tunnel to a local process | Accepted by the brief; zero-cost and fastest to a live number |

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

Tests: `npm test`, `npm run test:e2e`, `npm run lint`, `npm run typecheck`
inside `backend/`.

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port (default 3000) |
| `PUBLIC_BASE_URL` | Public HTTPS URL of this API; Vapi posts to `/voice/webhook` under it |
| `DATABASE_URL` | Postgres connection string |
| `OPENAI_API_KEY` | Registered with Vapi as a bring-your-own-key credential |
| `VAPI_API_KEY` | Vapi private key, used only by the sync script |
| `VAPI_WEBHOOK_SECRET` | Random string Vapi echoes in `x-vapi-secret`; requests without it are rejected |

No key is hardcoded; the boot fails with a clear message if one is missing.

## Observability

Every tool call, every successful registration (with the full payload), and
every call end (with transcript and summary) is logged to stdout as a
single JSON line. Transcripts are also stored on the `calls` table and shown
in the dashboard.

## Known limitations and trade-offs

- The ngrok URL is random on the free tier and changes when the tunnel
  restarts; `npm run vapi:sync` re-points the assistant in seconds. A
  container deploy to Railway or Render would remove this step.
- Vapi's free credits cover the demo, not sustained traffic.
- The appointment calendar is mock data: fixed weekday slots, no clinician
  or location.
- Phone numbers are not unique per patient (households share numbers), so
  duplicate detection offers the most recent record rather than enforcing
  uniqueness.
- The dashboard is read-only and unauthenticated, as the brief allows.
- No HIPAA controls; this is an assessment, not a clinical system.

## Next steps

- Reuse detection for a caller's own number (Vapi passes the caller ID) to
  greet returning patients before they say anything.
- Redis-backed throttling and a request id per webhook for multi-instance
  deployment.
- A `DELETE` audit trail and restore endpoint.
- Container image and CI running lint, typecheck and both test suites.
