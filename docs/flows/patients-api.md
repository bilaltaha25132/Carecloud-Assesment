# Patients REST API

Base URL: the API root (no prefix). Every response is JSON in one envelope:

```json
{ "data": { ... }, "error": null }
{ "data": null, "error": { "code": "VALIDATION_ERROR", "message": "Validation failed", "details": { "phone_number": ["..."] } } }
```

## Endpoints

| Method | Path | Success | Notes |
|---|---|---|---|
| GET | `/patients` | 200, array | Optional filters `last_name` (case-insensitive exact), `date_of_birth` (MM/DD/YYYY or YYYY-MM-DD), `phone_number` (any formatting) |
| GET | `/patients/:id` | 200 | 400 for a non-UUID id, 404 if missing or soft-deleted |
| POST | `/patients` | 201, created record | 422 with per-field details on invalid input |
| PUT | `/patients/:id` | 200, updated record | Partial: only sent fields change; `null` clears an optional field; `{}` is 422 |
| DELETE | `/patients/:id` | 200, record with `deleted_at` | Soft delete; a second call is 404 |
| GET | `/health` | 200 | 503 when Postgres is unreachable |

Unknown keys in a body are rejected (422) so typos never pass silently.

## Field rules

Normalization happens before validation, so callers can send natural input
and always read back the canonical form.

| Field | Accepts | Stored as |
|---|---|---|
| `first_name`, `last_name` | 1-50 letters (any alphabet), hyphens, apostrophes, spaces | trimmed |
| `date_of_birth` | `MM/DD/YYYY` or `YYYY-MM-DD`, real date, 1900 to today | `date`; returned as `MM/DD/YYYY` |
| `sex` | Male, Female, Other, Decline to Answer, plus m/f/decline/prefer not to say, any case | enum; returned as the label |
| `phone_number`, `emergency_contact_phone` | any punctuation, optional leading 1; area code and exchange cannot start with 0 or 1 | 10 digits |
| `email` | pragmatic shape check | lowercased |
| `address_line_1`, `address_line_2` | 1-200 chars | trimmed |
| `city` | 1-100 chars | trimmed |
| `state` | two-letter code in any case, or the full state name | uppercase code |
| `zip_code` | 5 digits, or 9 digits with or without a hyphen | `#####` or `#####-####` |
| `insurance_member_id` | letters, digits, hyphens; spaces removed | uppercase |
| `preferred_language` | 1-50 chars | defaults to `English` |

Source of truth: `backend/src/modules/patients/patient.rules.ts` and the
DTOs in `backend/src/modules/patients/dto/`. The database repeats the format
rules as CHECK constraints (see the initial migration).

## Status codes used

200, 201, 400 (malformed id or JSON), 404, 422 (validation), 429 (throttle),
500 (unexpected, logged), 503 (database down).

## Examples

```bash
curl -X POST localhost:3000/patients -H 'content-type: application/json' -d '{
  "first_name":"Jane","last_name":"Doe","date_of_birth":"03/14/1988","sex":"female",
  "phone_number":"(212) 555-0123","address_line_1":"350 Fifth Ave","city":"New York",
  "state":"new york","zip_code":"10118"}'

curl 'localhost:3000/patients?last_name=doe'
curl -X PUT localhost:3000/patients/<id> -H 'content-type: application/json' -d '{"city":"Brooklyn"}'
curl -X DELETE localhost:3000/patients/<id>
```
