import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { RawResponse } from '../../common/envelope.interceptor';
import { VapiSecretGuard } from './vapi-secret.guard';
import type { VapiWebhookBody } from './vapi.types';
import { VoiceService } from './voice.service';

/** Vapi expects its own response shape, so the envelope is bypassed here. */
@Controller('voice')
@SkipThrottle()
@UseGuards(VapiSecretGuard)
export class VoiceController {
  constructor(private readonly voice: VoiceService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @RawResponse()
  webhook(@Body() body: VapiWebhookBody) {
    return this.voice.handle(body);
  }
}
