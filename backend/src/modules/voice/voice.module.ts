import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { CallsModule } from '../calls/calls.module';
import { PatientsModule } from '../patients/patients.module';
import { VapiSecretGuard } from './vapi-secret.guard';
import { VoiceToolsService } from './voice-tools.service';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';

@Module({
  imports: [PatientsModule, CallsModule, AppointmentsModule],
  controllers: [VoiceController],
  providers: [VoiceService, VoiceToolsService, VapiSecretGuard],
})
export class VoiceModule {}
