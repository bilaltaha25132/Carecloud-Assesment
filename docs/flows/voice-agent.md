# Voice agent flow

## Pieces

| Concern | Where |
|---|---|
| Persona, collection order, rules, confirmation, language switching | `backend/src/modules/voice/assistant/intake.prompt.ts` (commented header explains each block) |
| Assistant configuration: model, voice, transcriber, timing, tools | `backend/src/modules/voice/assistant/assistant.definition.ts` |
| Provisioning to Vapi | `backend/src/scripts/vapi-sync.ts` (`npm run vapi:sync`) |
| Webhook auth | `backend/src/modules/voice/vapi-secret.guard.ts` |
| Message routing | `backend/src/modules/voice/voice.service.ts` |
| Tool implementations | `backend/src/modules/voice/voice-tools.service.ts` |

The assistant is defined in code and pushed to Vapi. Nothing is configured
by hand in the Vapi dashboard, so the prompt and tool contracts are reviewed
and versioned like any other source.

## A call, step by step

1. Vapi answers and speaks the first message ("...what's your first and last name?").
2. The model collects required fields one question at a time, accepting
   out-of-order answers and corrections. Obvious mistakes (a three-digit
   phone, a birth date in the future) are re-asked immediately for that one
   field, as the prompt instructs.
3. As soon as the phone number is known the model calls
   `check_existing_patient`. A match triggers the returning-caller offer
   ("It looks like we already have a record for ... update instead?").
4. After the required fields, the model offers the optional ones in one
   sentence and collects only what the caller opts into.
5. The model calls `validate_patient_details`. The server normalizes
   everything and returns either `{ valid: true, normalized }` or a
   per-field `errors` map. The model re-asks only the listed fields.
6. The model reads back the normalized values and asks "Is everything
   correct?". Any change loops back to step 5.
7. On an explicit yes it calls `register_patient` (or `update_patient` for
   a returning caller). The result is relayed truthfully: "You're all set,
   Jane." on success, an apology and a retry offer on failure.
8. It offers a first appointment via `get_appointment_slots` and
   `schedule_appointment`, then ends the call with Vapi's `endCall` tool.
9. Vapi sends `end-of-call-report`; the transcript, summary, duration and
   ended reason are stored on the `calls` row, which was linked to the
   patient at step 7.

## Tools

All tools are synchronous HTTP calls to `POST /voice/webhook` with the
`x-vapi-secret` header. Results are JSON strings.

| Tool | Input | Returns |
|---|---|---|
| `check_existing_patient` | `phone_number` | `{ found, patient? }` or `{ valid: false, error }` |
| `validate_patient_details` | all patient fields | `{ valid: true, normalized }` or `{ valid: false, errors }` |
| `register_patient` | all patient fields | `{ success, patient }`, `{ success, already_saved, patient }` on a retried call, `{ success: false, errors \| error }` |
| `update_patient` | `patient_id` + changed fields | same shape as register |
| `get_appointment_slots` | none | `{ slots: [{ starts_at, label }] }` (first 12) |
| `schedule_appointment` | `patient_id`, `starts_at`, `reason?` | `{ success, appointment }` or errors |

Tool inputs are validated with the exact DTOs the REST API uses, so the
voice path cannot write anything the API would reject.

## Latency choices

- `gpt-4.1-mini` with `maxTokens: 200` and a prompt that demands one or two
  sentences per turn: fewer tokens before audio starts.
- Deepgram `nova-3` with `language: multi` for transcription; ElevenLabs
  `eleven_flash_v2_5` for speech, the fastest multilingual voice model.
- `startSpeakingPlan.waitSeconds: 0.4` with smart endpointing, so the agent
  replies quickly after a pause without talking over the caller.
- `stopSpeakingPlan` yields after two words of barge-in.
- Tool handlers are single indexed queries; a whole tool round trip is a few
  milliseconds of server time plus the tunnel.

## Edge cases and what happens

| Situation | Behaviour |
|---|---|
| Invalid date of birth, phone, ZIP, state, email | Prompt re-asks the one field; `validate_patient_details` is the backstop and names the field |
| Caller corrects a spelling ("D-A-V-I-S, not D-A-V-I-E-S") | Prompt: replace and move on, no double confirmation |
| Caller says numbers aloud ("double zero", "triple seven", "oh" for zero, "twenty oh two") | Prompt expands spoken digit conventions to the actual value before storing or reading back |
| Caller spells with phonetics ("B as in boy") or dictates an email ("john dot smith at gmail dot com") | Prompt maps "as in" cues to the letter and "at"/"dot" to @ and . |
| Caller mumbles or the line drops a word | Prompt: never guess a digit or letter; ask them to repeat just that part |
| Caller makes small talk or asks a question mid-intake ("how are you?") | Prompt answers briefly, then steers back to the field it was collecting; never resets to a generic "how can I help you" |
| Caller gives several answers at once or out of order | Prompt: accept all, never re-ask known fields |
| Caller wants to start over | Prompt: "No problem, let's start fresh", discard everything, restart |
| Caller speaks Spanish | Transcriber is multilingual; prompt switches fully to Spanish and records `preferred_language: Spanish`; tool filler messages have Spanish variants |
| Database write fails | `register_patient` returns `success: false` with a plain message; prompt requires an apology and a retry offer, never a false success; Vapi's `request-failed` message covers a webhook that is down |
| Model retries `register_patient` after a timeout | The call is already linked to the patient, so the same record is returned instead of a duplicate |
| Telephony drops mid-call | Nothing partial is saved (registration is one atomic insert after confirmation); `end-of-call-report` still arrives and the partial transcript is stored with the ended reason |
| Silence | `silenceTimeoutSeconds: 30` ends the call; report is stored |
| Webhook without the secret | 401, nothing processed |
| Unknown tool name | `{ error }` result, call continues |

## Observability

Each tool call logs one JSON line `{ event: "tool_call", callId, tool, args,
result }`. A successful save logs `{ event: "patient_registered", ... }` with
the full payload. Call end logs `{ event: "call_ended", ... }` followed by the
transcript. Everything goes to stdout.
