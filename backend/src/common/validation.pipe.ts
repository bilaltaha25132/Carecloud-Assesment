import { ValidationPipe } from '@nestjs/common';
import { ValidationException } from './all-exceptions.filter';
import { flattenValidationErrors } from './validate-dto';

/**
 * Strips unknown keys, rejects the request if any are present, and converts
 * class-validator's nested error tree into the flat field map the API returns.
 */
export function createValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
    exceptionFactory: (errors) => new ValidationException(flattenValidationErrors(errors)),
  });
}
