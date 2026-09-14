import { Injectable } from '@nestjs/common';
import { Patient, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';

export interface PatientFilter {
  lastName?: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
}

/** Every read excludes soft-deleted rows; only the service decides when to bypass that. */
@Injectable()
export class PatientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PatientCreateInput): Promise<Patient> {
    return this.prisma.patient.create({ data });
  }

  findMany(filter: PatientFilter): Promise<Patient[]> {
    return this.prisma.patient.findMany({
      where: {
        deletedAt: null,
        lastName: filter.lastName ? { equals: filter.lastName, mode: 'insensitive' } : undefined,
        dateOfBirth: filter.dateOfBirth,
        phoneNumber: filter.phoneNumber,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string): Promise<Patient | null> {
    return this.prisma.patient.findFirst({ where: { id, deletedAt: null } });
  }

  findLatestByPhone(phoneNumber: string): Promise<Patient | null> {
    return this.prisma.patient.findFirst({
      where: { phoneNumber, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  update(id: string, data: Prisma.PatientUpdateInput): Promise<Patient> {
    return this.prisma.patient.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<Patient> {
    return this.prisma.patient.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
