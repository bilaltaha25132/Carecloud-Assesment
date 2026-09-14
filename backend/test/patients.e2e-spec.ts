import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/core/database/prisma.service';

const TEST_PHONE = '2015550177';

const VALID_PATIENT = {
  first_name: 'Ada',
  last_name: "O'Neil",
  date_of_birth: '04/02/1985',
  sex: 'female',
  phone_number: '(201) 555-0177',
  address_line_1: '10 Hudson Yards',
  city: 'New York',
  state: 'new york',
  zip_code: '10001',
};

describe('Patients API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();
    prisma = app.get(PrismaService);
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await prisma.patient.deleteMany({ where: { phoneNumber: TEST_PHONE } });
    await app.close();
  });

  it('rejects an invalid payload with a 422 field map', async () => {
    const res = await http.post('/patients').send({
      ...VALID_PATIENT,
      first_name: 'J0hn',
      date_of_birth: '02/30/2030',
      phone_number: '123',
      state: 'ZZ',
      unknown: 'x',
    });
    expect(res.status).toBe(422);
    expect(res.body.data).toBeNull();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(res.body.error.details).sort()).toEqual(
      ['date_of_birth', 'first_name', 'phone_number', 'state', 'unknown'].sort(),
    );
  });

  it('creates, normalizes, reads, filters, updates and soft-deletes a patient', async () => {
    const created = await http.post('/patients').send(VALID_PATIENT);
    expect(created.status).toBe(201);
    expect(created.body.error).toBeNull();
    const patient = created.body.data;
    expect(patient).toMatchObject({
      first_name: 'Ada',
      last_name: "O'Neil",
      date_of_birth: '04/02/1985',
      sex: 'Female',
      phone_number: TEST_PHONE,
      state: 'NY',
      preferred_language: 'English',
      email: null,
      deleted_at: null,
    });
    expect(patient.patient_id).toMatch(/^[0-9a-f-]{36}$/);

    const byId = await http.get(`/patients/${patient.patient_id}`);
    expect(byId.status).toBe(200);
    expect(byId.body.data.patient_id).toBe(patient.patient_id);

    for (const query of [
      'last_name=o%27neil',
      `phone_number=201-555-0177`,
      'date_of_birth=1985-04-02',
    ]) {
      const list = await http.get(`/patients?${query}`);
      expect(list.status).toBe(200);
      expect(list.body.data.map((p: { patient_id: string }) => p.patient_id)).toContain(
        patient.patient_id,
      );
    }

    const updated = await http
      .put(`/patients/${patient.patient_id}`)
      .send({ city: 'Jersey City', email: 'Ada@Example.com' });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({
      city: 'Jersey City',
      email: 'ada@example.com',
      state: 'NY',
    });

    const emptyUpdate = await http.put(`/patients/${patient.patient_id}`).send({});
    expect(emptyUpdate.status).toBe(422);

    const deleted = await http.delete(`/patients/${patient.patient_id}`);
    expect(deleted.status).toBe(200);
    expect(deleted.body.data.deleted_at).not.toBeNull();

    expect((await http.get(`/patients/${patient.patient_id}`)).status).toBe(404);
    expect((await http.delete(`/patients/${patient.patient_id}`)).status).toBe(404);

    const row = await prisma.patient.findUnique({ where: { id: patient.patient_id } });
    expect(row?.deletedAt).toBeInstanceOf(Date);
  });

  it('returns 400 for a malformed id and 404 for an unknown one', async () => {
    expect((await http.get('/patients/not-a-uuid')).status).toBe(400);
    const missing = await http.get('/patients/00000000-0000-4000-8000-000000000000');
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({
      data: null,
      error: { code: 'NOT_FOUND', message: 'Patient not found' },
    });
  });

  it('rejects an invalid filter value with 422', async () => {
    const res = await http.get('/patients?date_of_birth=yesterday');
    expect(res.status).toBe(422);
    expect(res.body.error.details.date_of_birth).toBeDefined();
  });
});
