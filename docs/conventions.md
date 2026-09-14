# Conventions

## Backend layout

```
backend/src
├── config/        env schema (zod), validated at boot
├── core/          stateful infrastructure: Prisma
├── common/        stateless Nest pieces: envelope, filter, pipe, dto validation
├── modules/       one folder per domain: controller, service, repository, dto/
└── scripts/       one-off CLI entry points (vapi-sync)
```

- **Controller → service → repository.** Controllers only bind HTTP to a
  service call. Services own rules and throw Nest `HttpException`s.
  Repositories are the only place Prisma is called.
- **One rule set for every input.** `modules/patients/patient.rules.ts` holds
  the normalizers. DTOs use them through the `@Normalized` decorator; voice
  tools use them through `validateDto`. Never validate a patient field
  anywhere else.
- **Wire names are the spec's names.** DTOs, responses and tool schemas use
  snake_case (`first_name`, `patient_id`); Prisma models use camelCase. The
  mapping lives in `patient.mapper.ts` only.
- **Errors.** Throw `NotFoundException`, `ValidationException(details)`, and
  friends. Never `throw new Error` in a request path; it becomes a masked 500.
- **Env.** Read config through `ConfigService<Env, true>`; never `process.env`
  outside `config/` and scripts.
- **Logging.** Nest `Logger` per class. Structured events are single-line
  JSON with an `event` key (`tool_call`, `patient_registered`, `call_ended`).
- **Files** are kebab-case with a role suffix: `patients.service.ts`,
  `create-patient.dto.ts`, `vapi-secret.guard.ts`. Tests sit next to the code
  as `*.spec.ts`; HTTP tests live in `test/*.e2e-spec.ts`.
- **Comments** explain why, not what. If the code already says it, no comment.

## Frontend layout

```
frontend/src
├── app/          routes only, thin pages
├── components/   app-agnostic UI (shell, block, badge, empty state)
└── features/     domain UI and the server-only API client
```

- Server Components fetch; no client state libraries.
- Colors only through the tokens in `app/globals.css`; no hex in components.
- Named function components, `import type`, kebab-case files.

## Tooling

Backend: ESLint (type-checked), Prettier at 100 columns, Jest. Run
`npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e` before
calling anything done. Frontend: `npm run lint`, `npm run typecheck`,
`npm run build`.
