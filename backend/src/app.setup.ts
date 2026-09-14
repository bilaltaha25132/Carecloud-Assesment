import { Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { EnvelopeInterceptor } from './common/envelope.interceptor';
import { createValidationPipe } from './common/validation.pipe';

// Vapi's end-of-call report carries the full transcript and message list, which
// runs past Express's 100kb default. Raise the JSON limit so those webhooks are
// accepted and the transcript is stored.
const JSON_BODY_LIMIT = '5mb';

/** Shared by main.ts and the e2e tests so both exercise the same pipeline. */
export function configureApp(app: NestExpressApplication): NestExpressApplication {
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.use(helmet());
  app.enableCors({ origin: true });
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new EnvelopeInterceptor(app.get(Reflector)));
  app.enableShutdownHooks();
  return app;
}
