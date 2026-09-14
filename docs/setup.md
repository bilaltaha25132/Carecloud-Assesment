# Setup

Requirements: Node 22, npm, Docker, an OpenAI API key, a Vapi account
(free tier is enough), and an ngrok account for the public tunnel.

## 1. Database

```bash
docker compose up -d            # Postgres 16 on localhost:5441
```

## 2. Backend

```bash
cd backend
cp .env.example .env            # then fill in the keys, see below
npm install
npx prisma migrate deploy       # applies prisma/migrations
npm run db:seed                 # two demo patients, idempotent
npm run build && npm run start:prod   # or: npm run start:dev
curl localhost:3000/health
```

Environment variables (`backend/.env`):

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port, default 3000 |
| `PUBLIC_BASE_URL` | Public HTTPS URL of this API. Vapi calls `${PUBLIC_BASE_URL}/voice/webhook` |
| `DATABASE_URL` | Postgres connection string |
| `OPENAI_API_KEY` | Registered with Vapi as a bring-your-own-key credential |
| `VAPI_API_KEY` | Vapi private key, used only by `npm run vapi:sync` |
| `VAPI_WEBHOOK_SECRET` | Random string (16+ chars). Vapi echoes it in `x-vapi-secret`; the API rejects anything else |

## 3. Public tunnel

```bash
ngrok http 3000
```

Copy the HTTPS URL into `PUBLIC_BASE_URL`. A free ngrok URL changes on every
restart; re-run the sync below whenever it does.

## 4. Provision the voice agent

```bash
cd backend
npm run vapi:sync
```

Idempotent. It registers the OpenAI key with Vapi, creates or updates the
assistant from `src/modules/voice/assistant/`, provisions a free Vapi phone
number on first run, and prints the number. Call it.

## 5. Tests

```bash
cd backend
npm test          # unit: validation rules
npm run test:e2e  # REST API and webhook against the running Postgres
npm run lint
npm run typecheck
```

The e2e suite creates and then hard-deletes its own rows, so it is safe to
run against the development database.

## 6. Dashboard

```bash
cd frontend
cp .env.example .env.local      # API_BASE_URL=http://localhost:3000
npm install
npm run dev                     # http://localhost:3001
```
