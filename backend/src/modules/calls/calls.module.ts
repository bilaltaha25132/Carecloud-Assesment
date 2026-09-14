import { Module } from '@nestjs/common';
import { CallsController } from './calls.controller';
import { CallsRepository } from './calls.repository';
import { CallsService } from './calls.service';

@Module({
  controllers: [CallsController],
  providers: [CallsService, CallsRepository],
  exports: [CallsService],
})
export class CallsModule {}
