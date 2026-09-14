# 0002: Postgres with Prisma, format rules in both code and schema

Date: 2026-09-15

## Context

The schema is graded on types and constraints, and the same patient rules
must apply whether data arrives from the voice agent or from a direct API
client. SQLite would be quicker to start but has no native enums or regex
CHECKs, and the reference architecture the team already uses is NestJS with
Prisma on Postgres.

## Decision

- Postgres 16 in Docker, Prisma 7 with the `pg` driver adapter.
- `sex` is a Postgres enum; phones and state are fixed-width `char`;
  `date_of_birth` is a `date`; timestamps are `timestamptz`.
- The initial migration adds CHECK constraints for phone, ZIP, state, name
  and city lengths, and `date_of_birth <= CURRENT_DATE`, so the database
  rejects malformed rows regardless of the caller.
- One module, `patients/patient.rules.ts`, holds every normalizer. DTOs bind
  to it through `@Normalized`; voice tools reuse the DTOs through
  `validateDto`. There is exactly one definition of "valid".
- Soft delete via `deleted_at`; every repository read filters it out.
- Wire format follows the assessment literally: snake_case field names and
  `MM/DD/YYYY` birth dates, with ISO also accepted on input.

## Consequences

- Running locally needs Docker; the trade-off is documented in setup.md.
- Adding a field means touching the Prisma model, a migration, the DTO, the
  mapper and the tool schema. That is five places, but each is one line and
  the type checker catches a missed one.
