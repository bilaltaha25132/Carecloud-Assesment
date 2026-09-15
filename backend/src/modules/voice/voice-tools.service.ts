import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ValidationException } from '../../common/all-exceptions.filter';
import { validateDto } from '../../common/validate-dto';
import { AppointmentsService } from '../appointments/appointments.service';
import { CallsService } from '../calls/calls.service';
import { CreatePatientDto } from '../patients/dto/create-patient.dto';
import { UpdatePatientDto } from '../patients/dto/update-patient.dto';
import {
  formatDateOfBirth,
  normalizePhone,
  SEX_LABELS,
  US_STATES,
} from '../patients/patient.rules';
import { PatientsService } from '../patients/patients.service';

export interface ToolContext {
  callId: string;
  callerNumber: string | null;
}

type ToolArgs = Record<string, unknown>;
type ToolHandler = (args: ToolArgs, ctx: ToolContext) => Promise<unknown>;

// Hand the agent only the soonest few slots so it offers a short, natural
// choice instead of reading a long list. The prompt offers two or three of
// these at a time.
const SLOTS_OFFERED = 5;
const SAVE_FAILED = 'The record could not be saved because of a system problem on our side.';

/**
 * Each handler returns a plain object that is serialized for the model.
 * Results are phrased so the model can relay them without interpretation:
 * `errors` maps field names to what to re-ask, `success` is never implied.
 */
@Injectable()
export class VoiceToolsService {
  private readonly logger = new Logger(VoiceToolsService.name);

  private readonly handlers: Record<string, ToolHandler> = {
    check_existing_patient: (args) => this.checkExisting(args),
    validate_patient_details: (args) => this.validateDetails(args),
    register_patient: (args, ctx) => this.register(args, ctx),
    update_patient: (args, ctx) => this.update(args, ctx),
    get_appointment_slots: () => this.slots(),
    schedule_appointment: (args) => this.schedule(args),
  };

  constructor(
    private readonly patients: PatientsService,
    private readonly calls: CallsService,
    private readonly appointments: AppointmentsService,
  ) {}

  execute(name: string, args: ToolArgs, ctx: ToolContext): Promise<unknown> {
    const handler = this.handlers[name];
    if (!handler) return Promise.resolve({ error: `Unknown tool: ${name}` });
    return handler(compact(args), ctx);
  }

  private async checkExisting(args: ToolArgs) {
    const phone = normalizePhone(text(args.phone_number));
    if (!phone)
      return { valid: false, error: 'Phone number must be a valid ten digit U.S. number' };
    const patient = await this.patients.findByPhone(phone);
    return patient ? { found: true, patient } : { found: false };
  }

  private async validateDetails(args: ToolArgs) {
    const { dto, errors } = await validateDto(CreatePatientDto, args);
    if (Object.keys(errors).length) return { valid: false, errors };
    return { valid: true, normalized: readback(dto) };
  }

  private async register(args: ToolArgs, ctx: ToolContext) {
    // A retried tool call must not create a second record for the same call.
    const alreadyLinked = await this.calls.linkedPatientId(ctx.callId);
    if (alreadyLinked) {
      return {
        success: true,
        already_saved: true,
        patient: await this.patients.get(alreadyLinked),
      };
    }

    const { dto, errors } = await validateDto(CreatePatientDto, args);
    if (Object.keys(errors).length) return { success: false, errors };

    try {
      const patient = await this.patients.create(dto);
      await this.calls.linkPatient(ctx.callId, patient.patient_id);
      this.logger.log(JSON.stringify({ event: 'patient_registered', callId: ctx.callId, patient }));
      return { success: true, patient };
    } catch (err) {
      this.logger.error(`register_patient failed for call ${ctx.callId}`, errorStack(err));
      return { success: false, error: SAVE_FAILED };
    }
  }

  private async update(args: ToolArgs, ctx: ToolContext) {
    const { patient_id: patientId, ...fields } = args;
    if (typeof patientId !== 'string') return { success: false, error: 'patient_id is required' };

    const { dto, errors } = await validateDto(UpdatePatientDto, fields);
    if (Object.keys(errors).length) return { success: false, errors };

    try {
      const patient = await this.patients.update(patientId, dto);
      await this.calls.linkPatient(ctx.callId, patient.patient_id);
      this.logger.log(JSON.stringify({ event: 'patient_updated', callId: ctx.callId, patient }));
      return { success: true, patient };
    } catch (err) {
      return this.failure(err, `update_patient failed for call ${ctx.callId}`);
    }
  }

  private async slots() {
    const slots = await this.appointments.availableSlots();
    return { slots: slots.slice(0, SLOTS_OFFERED) };
  }

  private async schedule(args: ToolArgs) {
    const patientId = text(args.patient_id);
    const startsAt = new Date(text(args.starts_at));
    if (Number.isNaN(startsAt.getTime())) {
      return { success: false, errors: { starts_at: ['Pick one of the offered slots'] } };
    }
    const reason = typeof args.reason === 'string' ? args.reason.slice(0, 200) : null;
    try {
      const appointment = await this.appointments.schedule(patientId, startsAt, reason);
      return { success: true, appointment };
    } catch (err) {
      return this.failure(err, `schedule_appointment failed for patient ${patientId}`);
    }
  }

  /** Expected domain errors are relayed as-is; anything else is masked and logged. */
  private failure(err: unknown, context: string) {
    if (err instanceof ValidationException) return { success: false, errors: err.details };
    if (err instanceof HttpException) return { success: false, error: err.message };
    this.logger.error(context, errorStack(err));
    return { success: false, error: SAVE_FAILED };
  }
}

/** Models send empty strings for fields they never collected; treat those as absent. */
function compact(args: ToolArgs): ToolArgs {
  return Object.fromEntries(
    Object.entries(args).filter(([, v]) => v !== null && v !== undefined && v !== ''),
  );
}

function readback(dto: CreatePatientDto) {
  return {
    first_name: dto.first_name,
    last_name: dto.last_name,
    date_of_birth: formatDateOfBirth(dto.date_of_birth),
    sex: SEX_LABELS[dto.sex as keyof typeof SEX_LABELS],
    phone_number: dto.phone_number,
    email: dto.email ?? null,
    address_line_1: dto.address_line_1,
    address_line_2: dto.address_line_2 ?? null,
    city: dto.city,
    state: dto.state,
    state_name: US_STATES[dto.state],
    zip_code: dto.zip_code,
    insurance_provider: dto.insurance_provider ?? null,
    insurance_member_id: dto.insurance_member_id ?? null,
    preferred_language: dto.preferred_language ?? 'English',
    emergency_contact_name: dto.emergency_contact_name ?? null,
    emergency_contact_phone: dto.emergency_contact_phone ?? null,
  };
}

function errorStack(err: unknown): string | undefined {
  return err instanceof Error ? err.stack : String(err);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
