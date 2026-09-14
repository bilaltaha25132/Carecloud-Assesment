# 0001: Vapi for telephony and the voice pipeline

Date: 2026-09-15

## Context

The assessment needs a real, dialable U.S. number that reviewers can call
from any phone, and the only paid key available is OpenAI. Twilio's free
trial only accepts inbound calls from caller IDs verified by SMS on the
account, which would block reviewers. Building the audio pipeline directly
(Twilio Media Streams to a speech-to-speech model) also spends most of the
time budget on plumbing the assessment explicitly says it does not grade.

## Decision

Use Vapi. It provisions a free U.S. number, accepts inbound calls from
anyone, runs transcription, turn-taking and speech synthesis with sub-second
latency, and lets us register our own OpenAI key so the LLM cost stays on
the key we already have. The assistant is defined in code and pushed with
`npm run vapi:sync`, so nothing lives only in the vendor dashboard.

## Consequences

- Telephony, STT and TTS are a dependency we do not control; the backend
  owns every decision that must be correct (prompt, tools, validation,
  persistence, transcripts).
- Free Vapi credits cover the demo; sustained traffic would need a paid plan
  or a switch to a different provider behind the same webhook contract.
- The webhook is the single integration surface, authenticated by a shared
  secret, which keeps the provider swappable.
