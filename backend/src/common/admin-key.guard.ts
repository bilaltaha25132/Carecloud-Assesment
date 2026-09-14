import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { Request } from 'express';
import { Env } from '../config/env';

/**
 * Protects admin routes with a shared key sent in `x-admin-key`. If
 * ADMIN_API_KEY is unset, the routes stay open for local development and a
 * warning is logged once, so the lack of protection is never silent.
 */
@Injectable()
export class AdminKeyGuard implements CanActivate {
  private readonly logger = new Logger(AdminKeyGuard.name);
  private readonly key: string;
  private warned = false;

  constructor(config: ConfigService<Env, true>) {
    this.key = config.get('ADMIN_API_KEY', { infer: true });
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.key) {
      if (!this.warned) {
        this.logger.warn('ADMIN_API_KEY is not set; admin routes are unprotected.');
        this.warned = true;
      }
      return true;
    }
    const provided = Buffer.from(
      context.switchToHttp().getRequest<Request>().header('x-admin-key') ?? '',
    );
    const expected = Buffer.from(this.key);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      throw new UnauthorizedException('Invalid admin key');
    }
    return true;
  }
}
