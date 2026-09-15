import { Injectable, Logger } from '@nestjs/common';
import { Appointment, AppointmentStatus } from '@prisma/client';
import { ValidationException } from '../../common/all-exceptions.filter';
import { PatientsService } from '../patients/patients.service';
import { AppointmentSlotsRepository } from './appointment-slots.repository';
import { AppointmentsRepository } from './appointments.repository';
import { clinicLabel } from './clinic-time';

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

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly appointments: AppointmentsRepository,
    private readonly slots: AppointmentSlotsRepository,
    private readonly patients: PatientsService,
  ) {}

  /** Future slots that staff have opened, minus anything already booked. */
  async availableSlots(): Promise<SlotDto[]> {
    const now = new Date();
    const booked = new Set(
      (await this.appointments.findScheduledFrom(now)).map((a) => a.scheduledAt.getTime()),
    );
    return (await this.slots.findFrom(now))
      .filter((slot) => !booked.has(slot.startsAt.getTime()))
      .map((slot) => ({
        starts_at: slot.startsAt.toISOString(),
        label: clinicLabel(slot.startsAt),
      }));
  }

  async schedule(
    patientId: string,
    scheduledAt: Date,
    reason: string | null,
  ): Promise<AppointmentDto> {
    await this.patients.get(patientId);
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
    await this.patients.get(patientId);
    return (await this.appointments.findByPatient(patientId)).map(toAppointmentDto);
  }

  /** Every appointment with its patient's name and phone, for the staff console. */
  async listAll(): Promise<AdminAppointmentDto[]> {
    return (await this.appointments.findAllWithPatient()).map((a) => ({
      ...toAppointmentDto(a),
      patient_name: `${a.patient.firstName} ${a.patient.lastName}`,
      patient_phone: a.patient.phoneNumber,
    }));
  }
}

export interface AdminAppointmentDto extends AppointmentDto {
  patient_name: string;
  patient_phone: string;
}

export function toAppointmentDto(a: Appointment): AppointmentDto {
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
