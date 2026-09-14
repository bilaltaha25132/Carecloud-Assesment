import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ValidationException } from '../../common/all-exceptions.filter';
import { CreatePatientDto } from './dto/create-patient.dto';
import { ListPatientsQuery } from './dto/list-patients.query';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientDto, toCreateData, toPatientDto, toUpdateData } from './patient.mapper';
import { PatientsRepository } from './patients.repository';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(private readonly patients: PatientsRepository) {}

  async create(dto: CreatePatientDto): Promise<PatientDto> {
    const patient = await this.patients.create(toCreateData(dto));
    this.logger.log(`Patient created ${patient.id} (${patient.firstName} ${patient.lastName})`);
    return toPatientDto(patient);
  }

  async list(query: ListPatientsQuery): Promise<PatientDto[]> {
    const rows = await this.patients.findMany({
      lastName: query.last_name?.trim() || undefined,
      dateOfBirth: query.date_of_birth,
      phoneNumber: query.phone_number,
    });
    return rows.map(toPatientDto);
  }

  async get(id: string): Promise<PatientDto> {
    const patient = await this.patients.findById(id);
    if (!patient) throw new NotFoundException('Patient not found');
    return toPatientDto(patient);
  }

  async findByPhone(phoneNumber: string): Promise<PatientDto | null> {
    const patient = await this.patients.findLatestByPhone(phoneNumber);
    return patient ? toPatientDto(patient) : null;
  }

  async update(id: string, dto: UpdatePatientDto): Promise<PatientDto> {
    const data = toUpdateData(dto);
    if (Object.keys(data).length === 0) {
      throw new ValidationException({ body: ['At least one field is required'] });
    }
    if (!(await this.patients.findById(id))) throw new NotFoundException('Patient not found');

    const patient = await this.patients.update(id, data);
    this.logger.log(`Patient updated ${patient.id}: ${Object.keys(data).join(', ')}`);
    return toPatientDto(patient);
  }

  async remove(id: string): Promise<PatientDto> {
    if (!(await this.patients.findById(id))) throw new NotFoundException('Patient not found');
    const patient = await this.patients.softDelete(id);
    this.logger.log(`Patient soft-deleted ${patient.id}`);
    return toPatientDto(patient);
  }
}
