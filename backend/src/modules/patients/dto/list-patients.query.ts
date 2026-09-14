import { IsOptional, IsString, MaxLength } from 'class-validator';
import { normalizePhone, parseDateOfBirth } from '../patient.rules';
import { Normalized } from './normalized.decorator';

export class ListPatientsQuery {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  last_name?: string;

  @IsOptional()
  @Normalized(parseDateOfBirth, 'date_of_birth must be a valid date in MM/DD/YYYY format')
  date_of_birth?: Date;

  @IsOptional()
  @Normalized(normalizePhone, 'phone_number must be a valid 10-digit U.S. number')
  phone_number?: string;
}
