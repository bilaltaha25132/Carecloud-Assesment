import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { ApiError, fail } from './envelope';

/**
 * Thrown by the ValidationPipe so field-level problems reach the client as a
 * 422 with a `{ field: [messages] }` map instead of a flat string list.
 */
export class ValidationException extends HttpException {
  constructor(public readonly details: Record<string, string[]>) {
    super('Validation failed', HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, error } = this.describe(exception);

    if (status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }
    response.status(status).json(fail(error));
  }

  private describe(exception: unknown): { status: number; error: ApiError } {
    if (exception instanceof ValidationException) {
      return {
        status: exception.getStatus(),
        error: { code: 'VALIDATION_ERROR', message: exception.message, details: exception.details },
      };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message = typeof body === 'string' ? body : exception.message;
      return { status, error: { code: codeFor(status), message } };
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError && exception.code === 'P2025') {
      return {
        status: HttpStatus.NOT_FOUND,
        error: { code: 'NOT_FOUND', message: 'Record not found' },
      };
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    };
  }
}

function codeFor(status: number): string {
  const name = HttpStatus[status];
  return typeof name === 'string' ? name : 'ERROR';
}
