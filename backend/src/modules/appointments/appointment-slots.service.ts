import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AppointmentSlot, Prisma } from '@prisma/client';
import { ValidationException } from '../../common/all-exceptions.filter';
import { AppointmentSlotsRepository } from './appointment-slots.repository';
import { AppointmentsRepository } from './appointments.repository';
import { clinicLabel } from './clinic-time';

export interface AdminSlotDto {
  slot_id: string;
  starts_at: string;
  label: string;
  booked: boolean;
  in_past: boolean;
}

/** Staff-facing management of the bookable clinic times. */
@Injectable()
export class AppointmentSlotsService {
  private readonly logger = new Logger(AppointmentSlotsService.name);

  constructor(
    private readonly slots: AppointmentSlotsRepository,
    private readonly appointments: AppointmentsRepository,
  ) {}

  async list(): Promise<AdminSlotDto[]> {
    const now = Date.now();
    const bookedTimes = new Set(
      (await this.appointments.findScheduledFrom(new Date(0))).map((a) => a.scheduledAt.getTime()),
    );
    return (await this.slots.findAll()).map((slot) => this.toDto(slot, bookedTimes, now));
  }

  async add(startsAt: Date): Promise<AdminSlotDto> {
    if (startsAt.getTime() <= Date.now()) {
      throw new ValidationException({ starts_at: ['Slot must be in the future'] });
    }
    const slot = await this.slots.create(startsAt).catch((err: unknown) => {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A slot already exists at that time');
      }
      throw err;
    });
    this.logger.log(`Admin added slot ${slot.id} at ${clinicLabel(startsAt)}`);
    return this.toDto(slot, new Set(), Date.now());
  }

  async update(id: string, startsAt: Date): Promise<AdminSlotDto> {
    await this.require(id);
    if (startsAt.getTime() <= Date.now()) {
      throw new ValidationException({ starts_at: ['Slot must be in the future'] });
    }
    const clash = await this.slots.findByStartsAt(startsAt);
    if (clash && clash.id !== id) throw new ConflictException('A slot already exists at that time');

    const slot = await this.slots.update(id, startsAt);
    this.logger.log(`Admin moved slot ${slot.id} to ${clinicLabel(startsAt)}`);
    return this.toDto(slot, new Set(), Date.now());
  }

  async remove(id: string): Promise<AdminSlotDto> {
    const slot = await this.require(id);
    await this.slots.delete(id);
    this.logger.log(`Admin removed slot ${id}`);
    return this.toDto(slot, new Set(), Date.now());
  }

  private async require(id: string): Promise<AppointmentSlot> {
    const slot = await this.slots.findById(id);
    if (!slot) throw new NotFoundException('Slot not found');
    return slot;
  }

  private toDto(slot: AppointmentSlot, bookedTimes: Set<number>, now: number): AdminSlotDto {
    return {
      slot_id: slot.id,
      starts_at: slot.startsAt.toISOString(),
      label: clinicLabel(slot.startsAt),
      booked: bookedTimes.has(slot.startsAt.getTime()),
      in_past: slot.startsAt.getTime() <= now,
    };
  }
}
