# Documentation index

Voice AI patient registration: a phone number answered by an LLM agent that
collects U.S. patient demographics, persists them to Postgres, and exposes
them over a REST API and a small dashboard.

Start with `architecture.md`, then the flow for the part you are touching.

| File | What it covers |
|---|---|
| [architecture.md](architecture.md) | Components, request paths, data model, where each responsibility lives |
| [setup.md](setup.md) | Exact commands to run the database, API, tunnel, Vapi sync, tests, and dashboard |
| [conventions.md](conventions.md) | Code layout, naming, validation, error, and logging rules |
| [flows/voice-agent.md](flows/voice-agent.md) | The phone call end to end: prompt, tools, webhook handling, edge cases |
| [flows/patients-api.md](flows/patients-api.md) | REST endpoints, envelope, validation rules, status codes |
| [flows/calls-and-appointments.md](flows/calls-and-appointments.md) | Call records, transcripts, and the mock appointment calendar |
| [flows/dashboard.md](flows/dashboard.md) | The Next.js dashboard and how it reads the API |
| [decisions/](decisions/) | Architecture decision records |

The LLM system prompt lives in code at
`backend/src/modules/voice/assistant/intake.prompt.ts` with a commented
header explaining each section.
