import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { Request } from 'express';
import { Env } from '../../config/env';

/** Vapi echoes the assistant's configured secret in this header on every webhook. */
@Injectable()
export class VapiSecretGuard implements CanActivate {
  private readonly secret: Buffer;

  constructor(config: ConfigService<Env, true>) {
    this.secret = Buffer.from(config.get('VAPI_WEBHOOK_SECRET', { infer: true }));
  }

  canActivate(context: ExecutionContext): boolean {
    const header = context.switchToHttp().getRequest<Request>().header('x-vapi-secret') ?? '';
    const provided = Buffer.from(header);
    const matches =
      provided.length === this.secret.length && timingSafeEqual(provided, this.secret);
    if (!matches) throw new UnauthorizedException('Invalid webhook secret');
    return true;
  }
}
