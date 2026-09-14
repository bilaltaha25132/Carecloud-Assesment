import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

export type FieldErrors = Record<string, string[]>;

export function flattenValidationErrors(errors: ValidationError[], parent = ''): FieldErrors {
  return errors.reduce<FieldErrors>((acc, err) => {
    const path = parent ? `${parent}.${err.property}` : err.property;
    if (err.constraints) acc[path] = Object.values(err.constraints);
    if (err.children?.length) Object.assign(acc, flattenValidationErrors(err.children, path));
    return acc;
  }, {});
}

/**
 * Runs the same transform-and-validate pass the HTTP pipe does, for inputs
 * that arrive outside a controller (voice tool arguments).
 */
export async function validateDto<T extends object>(
  cls: ClassConstructor<T>,
  plain: unknown,
): Promise<{ dto: T; errors: FieldErrors }> {
  const dto = plainToInstance(cls, plain ?? {});
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  return { dto, errors: flattenValidationErrors(errors) };
}
