import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { CallsService } from './calls.service';

@Controller()
export class CallsController {
  constructor(private readonly calls: CallsService) {}

  @Get('calls')
  listRecent() {
    return this.calls.listRecent();
  }

  @Get('calls/:id')
  get(@Param('id') id: string) {
    return this.calls.get(id);
  }

  @Get('patients/:id/calls')
  listForPatient(@Param('id', ParseUUIDPipe) id: string) {
    return this.calls.listForPatient(id);
  }
}
