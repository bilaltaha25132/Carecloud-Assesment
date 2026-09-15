import { Injectable } from '@nestjs/common';
import { Appointment, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';

export type AppointmentWithPatient = Prisma.AppointmentGetPayload<{
  include: { patient: { select: { firstName: true; lastName: true; phoneNumber: true } } };
}>;

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(patientId: string, scheduledAt: Date, reason: string | null): Promise<Appointment> {
    return this.prisma.appointment.create({ data: { patientId, scheduledAt, reason } });
  }

  findAllWithPatient(): Promise<AppointmentWithPatient[]> {
    return this.prisma.appointment.findMany({
      include: { patient: { select: { firstName: true, lastName: true, phoneNumber: true } } },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  findByPatient(patientId: string): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { patientId },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  findScheduledFrom(from: Date): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { status: 'SCHEDULED', scheduledAt: { gte: from } },
    });
  }
}
