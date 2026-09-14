import { Injectable } from '@nestjs/common';
import { Call, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class CallsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Idempotent: webhooks arrive out of order and may be retried. */
  ensure(id: string, callerNumber: string | null): Promise<Call> {
    return this.prisma.call.upsert({
      where: { id },
      create: { id, callerNumber },
      update: {},
    });
  }

  update(id: string, data: Prisma.CallUpdateInput): Promise<Call> {
    return this.prisma.call.update({ where: { id }, data });
  }

  findById(id: string): Promise<Call | null> {
    return this.prisma.call.findUnique({ where: { id } });
  }

  findRecent(limit: number): Promise<Call[]> {
    return this.prisma.call.findMany({ orderBy: { startedAt: 'desc' }, take: limit });
  }

  findByPatient(patientId: string): Promise<Call[]> {
    return this.prisma.call.findMany({ where: { patientId }, orderBy: { startedAt: 'desc' } });
  }
}
