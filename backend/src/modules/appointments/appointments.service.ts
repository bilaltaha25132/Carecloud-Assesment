import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Appointment, AppointmentStatus } from '@prisma/client';
import { ValidationException } from '../../common/all-exceptions.filter';
import { PatientsService } from '../patients/patients.service';
import { AppointmentsRepository } from './appointments.repository';
import { CLINIC_SLOT_TIMES, clinicInstant, clinicLabel, upcomingWeekdays } from './clinic-time';

export interface SlotDto {
  starts_at: string;
  label: string;
}

export interface AppointmentDto {
  appointment_id: string;
  patient_id: string;
  scheduled_at: string;
  label: string;
  reason: string | null;
  status: AppointmentStatus;
  created_at: string;
}

const DAYS_OFFERED = 5;

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly appointments: AppointmentsRepository,
    private readonly patients: PatientsService,
  ) {}

  /** Open slots over the next five weekdays, minus anything already booked. */
  async availableSlots(): Promise<SlotDto[]> {
    const booked = new Set(
      (await this.appointments.findScheduledFrom(new Date())).map((a) => a.scheduledAt.getTime()),
    );
    const slots: SlotDto[] = [];
    for (const day of upcomingWeekdays(DAYS_OFFERED)) {
      for (const [hour, minute] of CLINIC_SLOT_TIMES) {
        const at = clinicInstant(
          day.getUTCFullYear(),
          day.getUTCMonth() + 1,
          day.getUTCDate(),
          hour,
          minute,
        );
        if (!booked.has(at.getTime()))
          slots.push({ starts_at: at.toISOString(), label: clinicLabel(at) });
      }
    }
    return slots;
  }

  async schedule(
    patientId: string,
    scheduledAt: Date,
    reason: string | null,
  ): Promise<AppointmentDto> {
    await this.patients.get(patientId);
    if (scheduledAt.getTime() <= Date.now()) {
      throw new ValidationException({ scheduled_at: ['Appointment must be in the future'] });
    }
    const open = await this.availableSlots();
    if (!open.some((s) => s.starts_at === scheduledAt.toISOString())) {
      throw new ValidationException({ scheduled_at: ['That slot is not available'] });
    }
    const appointment = await this.appointments.create(patientId, scheduledAt, reason);
    this.logger.log(
      `Appointment ${appointment.id} booked for patient ${patientId} at ${clinicLabel(scheduledAt)}`,
    );
    return toAppointmentDto(appointment);
  }

  async listForPatient(patientId: string): Promise<AppointmentDto[]> {
    if (!(await this.patients.get(patientId))) throw new NotFoundException('Patient not found');
    return (await this.appointments.findByPatient(patientId)).map(toAppointmentDto);
  }
}

function toAppointmentDto(a: Appointment): AppointmentDto {
  return {
    appointment_id: a.id,
    patient_id: a.patientId,
    scheduled_at: a.scheduledAt.toISOString(),
    label: clinicLabel(a.scheduledAt),
    reason: a.reason,
    status: a.status,
    created_at: a.createdAt.toISOString(),
  };
}
