import { Transform } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAppointmentDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  @IsDate({ message: 'scheduled_at must be an ISO 8601 date-time' })
  scheduled_at!: Date;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
