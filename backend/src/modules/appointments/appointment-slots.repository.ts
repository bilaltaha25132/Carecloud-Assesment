import { Injectable } from '@nestjs/common';
import { AppointmentSlot } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class AppointmentSlotsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<AppointmentSlot[]> {
    return this.prisma.appointmentSlot.findMany({ orderBy: { startsAt: 'asc' } });
  }

  findFrom(from: Date): Promise<AppointmentSlot[]> {
    return this.prisma.appointmentSlot.findMany({
      where: { startsAt: { gt: from } },
      orderBy: { startsAt: 'asc' },
    });
  }

  findById(id: string): Promise<AppointmentSlot | null> {
    return this.prisma.appointmentSlot.findUnique({ where: { id } });
  }

  findByStartsAt(startsAt: Date): Promise<AppointmentSlot | null> {
    return this.prisma.appointmentSlot.findUnique({ where: { startsAt } });
  }

  create(startsAt: Date): Promise<AppointmentSlot> {
    return this.prisma.appointmentSlot.create({ data: { startsAt } });
  }

  update(id: string, startsAt: Date): Promise<AppointmentSlot> {
    return this.prisma.appointmentSlot.update({ where: { id }, data: { startsAt } });
  }

  delete(id: string): Promise<AppointmentSlot> {
    return this.prisma.appointmentSlot.delete({ where: { id } });
  }
}
