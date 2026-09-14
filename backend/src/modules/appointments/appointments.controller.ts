import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller()
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get('appointments/slots')
  slots() {
    return this.appointments.availableSlots();
  }

  @Get('patients/:id/appointments')
  listForPatient(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointments.listForPatient(id);
  }

  @Post('patients/:id/appointments')
  @HttpCode(HttpStatus.CREATED)
  schedule(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateAppointmentDto) {
    return this.appointments.schedule(id, dto.scheduled_at, dto.reason ?? null);
  }
}
