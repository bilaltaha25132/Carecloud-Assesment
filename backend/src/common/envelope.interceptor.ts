import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { Envelope, ok } from './envelope';

const RAW_RESPONSE = 'rawResponse';

/** Opt a handler out of the envelope when a third party dictates the body shape. */
export const RawResponse = () => SetMetadata(RAW_RESPONSE, true);

@Injectable()
export class EnvelopeInterceptor<T> implements NestInterceptor<T, Envelope<T> | T> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Envelope<T> | T> {
    if (this.reflector.get<boolean>(RAW_RESPONSE, context.getHandler())) return next.handle();
    return next.handle().pipe(map((data) => ok(data)));
  }
}
