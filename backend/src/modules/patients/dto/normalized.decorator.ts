import { Transform } from 'class-transformer';
import { registerDecorator } from 'class-validator';

type Normalizer = (raw: string) => string | Date | null;

/**
 * Pairs a normalizer from patient.rules with a validator so a field is
 * coerced into its canonical form ("california" -> "CA") when valid and
 * rejected with one specific message when it is not. Keeps each DTO field
 * to a single line and guarantees API and voice inputs share one rule set.
 */
export function Normalized(normalize: Normalizer, message: string): PropertyDecorator {
  return (target, propertyName) => {
    Transform(({ value }: { value: unknown }) => {
      if (typeof value !== 'string') return value;
      return normalize(value) ?? value;
    })(target, propertyName);

    registerDecorator({
      name: 'normalized',
      target: target.constructor,
      propertyName: propertyName as string,
      options: { message },
      validator: {
        validate: (value: unknown) =>
          value instanceof Date || (typeof value === 'string' && normalize(value) !== null),
      },
    });
  };
}
