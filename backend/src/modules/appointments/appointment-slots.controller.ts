import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminKeyGuard } from '../../common/admin-key.guard';
import { AppointmentSlotsService } from './appointment-slots.service';
import { SlotBodyDto } from './dto/slot.dto';

/** Staff-only management of bookable clinic times. Guarded by the admin key. */
@Controller('admin/appointment-slots')
@UseGuards(AdminKeyGuard)
export class AppointmentSlotsController {
  constructor(private readonly slots: AppointmentSlotsService) {}

  @Get()
  list() {
    return this.slots.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  add(@Body() dto: SlotBodyDto) {
    return this.slots.add(dto.starts_at);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SlotBodyDto) {
    return this.slots.update(id, dto.starts_at);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.slots.remove(id);
  }
}
