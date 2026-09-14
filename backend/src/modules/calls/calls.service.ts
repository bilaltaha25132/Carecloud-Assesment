import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Call, CallStatus, Prisma } from '@prisma/client';
import { CallsRepository } from './calls.repository';

export interface CallEnded {
  endedReason: string | null;
  durationSeconds: number | null;
  transcript: string | null;
  summary: string | null;
  messages: unknown[] | null;
  endedAt: Date | null;
}

export interface CallDto {
  call_id: string;
  patient_id: string | null;
  caller_number: string | null;
  status: CallStatus;
  ended_reason: string | null;
  duration_seconds: number | null;
  transcript: string | null;
  summary: string | null;
  messages: unknown;
  started_at: string;
  ended_at: string | null;
}

const FAILED_REASONS = /error|failed|pipeline|silence-timed-out|exceeded-max-duration/i;

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(private readonly calls: CallsRepository) {}

  async begin(id: string, callerNumber: string | null): Promise<void> {
    await this.calls.ensure(id, callerNumber);
  }

  async linkPatient(id: string, patientId: string): Promise<void> {
    await this.calls.ensure(id, null);
    await this.calls.update(id, { patient: { connect: { id: patientId } } });
  }

  async linkedPatientId(id: string): Promise<string | null> {
    return (await this.calls.findById(id))?.patientId ?? null;
  }

  async finish(id: string, callerNumber: string | null, ended: CallEnded): Promise<void> {
    await this.calls.ensure(id, callerNumber);
    const status =
      ended.endedReason && FAILED_REASONS.test(ended.endedReason) ? 'FAILED' : 'COMPLETED';
    await this.calls.update(id, {
      status,
      endedReason: ended.endedReason,
      durationSeconds: ended.durationSeconds,
      transcript: ended.transcript,
      summary: ended.summary,
      messages:
        ended.messages === null ? Prisma.JsonNull : (ended.messages as Prisma.InputJsonValue),
      endedAt: ended.endedAt ?? new Date(),
    });
    this.logger.log(
      `Call ${id} ${status.toLowerCase()} (${ended.endedReason ?? 'unknown reason'})`,
    );
  }

  async get(id: string): Promise<CallDto> {
    const call = await this.calls.findById(id);
    if (!call) throw new NotFoundException('Call not found');
    return toCallDto(call);
  }

  async listRecent(): Promise<CallDto[]> {
    return (await this.calls.findRecent(100)).map(toCallDto);
  }

  async listForPatient(patientId: string): Promise<CallDto[]> {
    return (await this.calls.findByPatient(patientId)).map(toCallDto);
  }
}

function toCallDto(c: Call): CallDto {
  return {
    call_id: c.id,
    patient_id: c.patientId,
    caller_number: c.callerNumber,
    status: c.status,
    ended_reason: c.endedReason,
    duration_seconds: c.durationSeconds,
    transcript: c.transcript,
    summary: c.summary,
    messages: c.messages,
    started_at: c.startedAt.toISOString(),
    ended_at: c.endedAt?.toISOString() ?? null,
  };
}
