import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminKeyGuard } from '../../common/admin-key.guard';
import { AppointmentsService } from './appointments.service';

/** Read-only list of every appointment for the staff console. */
@Controller('admin/appointments')
@UseGuards(AdminKeyGuard)
export class AdminAppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  listAll() {
    return this.appointments.listAll();
  }
}
