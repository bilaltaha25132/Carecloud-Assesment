import { INTAKE_FIRST_MESSAGE, INTAKE_SYSTEM_PROMPT } from './intake.prompt';

export const ASSISTANT_NAME = 'CareCloud Patient Intake';

/** JSON schema for the patient fields, shared by every tool that accepts them. */
const PATIENT_FIELDS = {
  first_name: { type: 'string', description: 'Legal first name' },
  last_name: { type: 'string', description: 'Legal last name' },
  date_of_birth: { type: 'string', description: 'Date of birth as MM/DD/YYYY' },
  sex: { type: 'string', enum: ['Male', 'Female', 'Other', 'Decline to Answer'] },
  phone_number: { type: 'string', description: 'Ten digit U.S. phone number, digits only' },
  email: { type: 'string', description: 'Email address, if the caller chose to give one' },
  address_line_1: { type: 'string', description: 'Street address' },
  address_line_2: { type: 'string', description: 'Apartment, suite or unit, if any' },
  city: { type: 'string' },
  state: { type: 'string', description: 'Two-letter U.S. state abbreviation' },
  zip_code: { type: 'string', description: 'Five digit ZIP or ZIP+4' },
  insurance_provider: { type: 'string', description: 'Insurance company name' },
  insurance_member_id: { type: 'string', description: 'Insurance member or subscriber ID' },
  preferred_language: { type: 'string', description: 'Preferred language, defaults to English' },
  emergency_contact_name: { type: 'string', description: 'Emergency contact full name' },
  emergency_contact_phone: { type: 'string', description: 'Emergency contact ten digit phone' },
} as const;

const REQUIRED_PATIENT_FIELDS = [
  'first_name',
  'last_name',
  'date_of_birth',
  'sex',
  'phone_number',
  'address_line_1',
  'city',
  'state',
  'zip_code',
];

interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  messages?: unknown[];
}

const bilingual = (type: string, en: string, es: string) => ({
  type,
  contents: [
    { type: 'text', text: en, language: 'en' },
    { type: 'text', text: es, language: 'es' },
  ],
});

const TOOL_SPECS: ToolSpec[] = [
  {
    name: 'check_existing_patient',
    description:
      'Look up whether a patient with this phone number is already registered. Call it as soon as the ten digit phone number is known.',
    parameters: {
      type: 'object',
      properties: { phone_number: PATIENT_FIELDS.phone_number },
      required: ['phone_number'],
    },
  },
  {
    name: 'validate_patient_details',
    description:
      'Validate and normalize all collected patient details before reading them back. Returns per-field errors to re-ask, or the normalized values to confirm with the caller.',
    parameters: { type: 'object', properties: PATIENT_FIELDS, required: REQUIRED_PATIENT_FIELDS },
  },
  {
    name: 'register_patient',
    description:
      'Save a new patient record. Only call after the caller has explicitly confirmed the read-back is correct.',
    parameters: { type: 'object', properties: PATIENT_FIELDS, required: REQUIRED_PATIENT_FIELDS },
    messages: [
      bilingual(
        'request-start',
        'One moment while I save that.',
        'Un momento mientras guardo eso.',
      ),
      bilingual(
        'request-failed',
        "I'm sorry, I couldn't save your record just now.",
        'Lo siento, no pude guardar su registro en este momento.',
      ),
    ],
  },
  {
    name: 'update_patient',
    description:
      'Update fields on an existing patient record found by check_existing_patient. Only call after the caller confirms the changes. Send only the fields that changed.',
    parameters: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'UUID from check_existing_patient' },
        ...PATIENT_FIELDS,
      },
      required: ['patient_id'],
    },
    messages: [
      bilingual(
        'request-start',
        'One moment while I update that.',
        'Un momento mientras actualizo eso.',
      ),
      bilingual(
        'request-failed',
        "I'm sorry, I couldn't update your record just now.",
        'Lo siento, no pude actualizar su registro en este momento.',
      ),
    ],
  },
  {
    name: 'get_appointment_slots',
    description: 'List open appointment slots for the next few weekdays.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'schedule_appointment',
    description:
      'Book one of the slots returned by get_appointment_slots for a registered patient.',
    parameters: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'UUID of the registered patient' },
        starts_at: {
          type: 'string',
          description: 'The starts_at value of the chosen slot, exactly as returned',
        },
        reason: { type: 'string', description: 'Reason for the visit, if the caller gave one' },
      },
      required: ['patient_id', 'starts_at'],
    },
  },
];

export interface AssistantTarget {
  webhookUrl: string;
  webhookSecret: string;
  model: string;
}

/**
 * The full assistant as sent to Vapi's API. Everything that affects how the
 * agent sounds and behaves lives here, in version control, rather than in
 * the dashboard.
 */
export function buildAssistant(target: AssistantTarget) {
  const server = { url: target.webhookUrl, secret: target.webhookSecret, timeoutSeconds: 20 };

  return {
    name: ASSISTANT_NAME,
    firstMessage: INTAKE_FIRST_MESSAGE,
    firstMessageMode: 'assistant-speaks-first',
    model: {
      provider: 'openai',
      model: target.model,
      // Warm enough to vary acknowledgements and sound human, low enough to
      // stay reliable at tool calling and the scripted collection order.
      temperature: 0.5,
      maxTokens: 200,
      messages: [{ role: 'system', content: INTAKE_SYSTEM_PROMPT }],
      tools: TOOL_SPECS.map((tool) => ({
        type: 'function',
        async: false,
        function: { name: tool.name, description: tool.description, parameters: tool.parameters },
        server,
        ...(tool.messages ? { messages: tool.messages } : {}),
      })),
    },
    // Multilingual transcription so a mid-call switch to Spanish is understood.
    transcriber: { provider: 'deepgram', model: 'nova-3', language: 'multi' },
    // Flash is the lowest-latency multilingual ElevenLabs model.
    voice: {
      provider: '11labs',
      voiceId: 'sarah',
      model: 'eleven_flash_v2_5',
      stability: 0.5,
      similarityBoost: 0.75,
      optimizeStreamingLatency: 3,
    },
    // Start replying quickly after the caller pauses, and yield fast on barge-in.
    startSpeakingPlan: { waitSeconds: 0.4, smartEndpointingPlan: { provider: 'livekit' } },
    stopSpeakingPlan: { numWords: 2, voiceSeconds: 0.2, backoffSeconds: 1 },
    backgroundDenoisingEnabled: true,
    backgroundSound: 'off',
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 1200,
    endCallFunctionEnabled: true,
    server,
    serverMessages: ['tool-calls', 'end-of-call-report', 'status-update'],
  };
}
