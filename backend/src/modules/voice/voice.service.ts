import { Injectable, Logger } from '@nestjs/common';
import { CallsService } from '../calls/calls.service';
import {
  readToolCall,
  VapiEndOfCallReportMessage,
  VapiServerMessage,
  VapiStatusUpdateMessage,
  VapiToolCallsMessage,
  VapiToolResult,
  VapiWebhookBody,
} from './vapi.types';
import { VoiceToolsService } from './voice-tools.service';

const TOOL_CRASHED = 'Something went wrong on our side. Apologize and offer to try again.';

/**
 * Routes Vapi server messages. Tool calls are answered synchronously because
 * the caller is waiting on the line; everything else is bookkeeping and
 * returns an empty body as soon as it is persisted.
 */
@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  constructor(
    private readonly calls: CallsService,
    private readonly tools: VoiceToolsService,
  ) {}

  async handle(body: VapiWebhookBody): Promise<unknown> {
    const message = body.message;
    switch (message.type) {
      case 'tool-calls':
        return this.onToolCalls(message as VapiToolCallsMessage);
      case 'end-of-call-report':
        return this.onEndOfCall(message as VapiEndOfCallReportMessage);
      case 'status-update':
        return this.onStatusUpdate(message as VapiStatusUpdateMessage);
      default:
        return {};
    }
  }

  private async onToolCalls(message: VapiToolCallsMessage): Promise<{ results: VapiToolResult[] }> {
    const { callId, callerNumber } = identify(message);
    await this.calls.begin(callId, callerNumber);

    const results: VapiToolResult[] = [];
    for (const raw of message.toolCallList ?? []) {
      const { id, name, args } = readToolCall(raw);
      const result = await this.tools
        .execute(name, args, { callId, callerNumber })
        .catch((err: unknown) => {
          this.logger.error(
            `Tool ${name} threw on call ${callId}`,
            err instanceof Error ? err.stack : String(err),
          );
          return { success: false, error: TOOL_CRASHED };
        });
      this.logger.log(JSON.stringify({ event: 'tool_call', callId, tool: name, args, result }));
      results.push({ toolCallId: id, result: JSON.stringify(result) });
    }
    return { results };
  }

  private async onEndOfCall(message: VapiEndOfCallReportMessage): Promise<Record<string, never>> {
    const { callId, callerNumber } = identify(message);
    const transcript = message.artifact?.transcript ?? message.transcript ?? null;
    const messages = message.artifact?.messages ?? message.messages ?? null;

    await this.calls.finish(callId, callerNumber, {
      endedReason: message.endedReason ?? null,
      durationSeconds: message.durationSeconds != null ? Math.round(message.durationSeconds) : null,
      transcript,
      summary: message.summary ?? null,
      messages,
      endedAt: message.endedAt ? new Date(message.endedAt) : null,
    });

    this.logger.log(
      JSON.stringify({
        event: 'call_ended',
        callId,
        endedReason: message.endedReason,
        summary: message.summary,
      }),
    );
    if (transcript) this.logger.log(`Transcript for call ${callId}:\n${transcript}`);
    return {};
  }

  private async onStatusUpdate(message: VapiStatusUpdateMessage): Promise<Record<string, never>> {
    const { callId, callerNumber } = identify(message);
    if (message.status === 'in-progress') {
      await this.calls.begin(callId, callerNumber);
      this.logger.log(JSON.stringify({ event: 'call_started', callId, callerNumber }));
    }
    return {};
  }
}

function identify(message: VapiServerMessage): { callId: string; callerNumber: string | null } {
  return {
    callId: message.call?.id ?? 'unknown',
    callerNumber: message.call?.customer?.number ?? null,
  };
}
