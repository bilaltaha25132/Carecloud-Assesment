import { Transform } from 'class-transformer';
import { IsDate } from 'class-validator';

export class SlotBodyDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  @IsDate({ message: 'starts_at must be an ISO 8601 date-time' })
  starts_at!: Date;
}
