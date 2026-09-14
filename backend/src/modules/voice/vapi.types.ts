/**
 * The subset of Vapi's server-message schema this service reads.
 * Vapi has shipped two tool-call shapes over time, so both are modeled and
 * normalized in one place (see `readToolCall`).
 */

export interface VapiCall {
  id: string;
  customer?: { number?: string };
}

interface VapiToolCallCurrent {
  id: string;
  function: { name: string; arguments: Record<string, unknown> | string };
}

interface VapiToolCallLegacy {
  id: string;
  name: string;
  parameters?: Record<string, unknown> | string;
  arguments?: Record<string, unknown> | string;
}

export type VapiToolCall = VapiToolCallCurrent | VapiToolCallLegacy;

export interface VapiTranscriptMessage {
  role: string;
  message?: string;
  time?: number;
  secondsFromStart?: number;
}

interface VapiMessageBase {
  call?: VapiCall;
  timestamp?: number;
}

export interface VapiToolCallsMessage extends VapiMessageBase {
  type: 'tool-calls';
  toolCallList: VapiToolCall[];
}

export interface VapiEndOfCallReportMessage extends VapiMessageBase {
  type: 'end-of-call-report';
  endedReason?: string;
  durationSeconds?: number;
  transcript?: string;
  summary?: string;
  messages?: VapiTranscriptMessage[];
  startedAt?: string;
  endedAt?: string;
  artifact?: { transcript?: string; messages?: VapiTranscriptMessage[] };
}

export interface VapiStatusUpdateMessage extends VapiMessageBase {
  type: 'status-update';
  status: string;
  endedReason?: string;
}

export interface VapiOtherMessage extends VapiMessageBase {
  type: string;
}

export type VapiServerMessage =
  VapiToolCallsMessage | VapiEndOfCallReportMessage | VapiStatusUpdateMessage | VapiOtherMessage;

export interface VapiWebhookBody {
  message: VapiServerMessage;
}

export interface VapiToolResult {
  toolCallId: string;
  result: string;
}

export function readToolCall(call: VapiToolCall): {
  id: string;
  name: string;
  args: Record<string, unknown>;
} {
  const raw =
    'function' in call ? call.function.arguments : (call.arguments ?? call.parameters ?? {});
  const name = 'function' in call ? call.function.name : call.name;
  return { id: call.id, name, args: parseArgs(raw) };
}

function parseArgs(raw: Record<string, unknown> | string | undefined): Record<string, unknown> {
  if (typeof raw !== 'string') return raw ?? {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}
