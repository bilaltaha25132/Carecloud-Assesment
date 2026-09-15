import { Module } from '@nestjs/common';
import { AdminKeyGuard } from '../../common/admin-key.guard';
import { PatientsModule } from '../patients/patients.module';
import { AdminAppointmentsController } from './admin-appointments.controller';
import { AppointmentSlotsController } from './appointment-slots.controller';
import { AppointmentSlotsRepository } from './appointment-slots.repository';
import { AppointmentSlotsService } from './appointment-slots.service';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsRepository } from './appointments.repository';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [PatientsModule],
  controllers: [AppointmentsController, AppointmentSlotsController, AdminAppointmentsController],
  providers: [
    AppointmentsService,
    AppointmentsRepository,
    AppointmentSlotsService,
    AppointmentSlotsRepository,
    AdminKeyGuard,
  ],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
