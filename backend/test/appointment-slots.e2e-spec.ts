import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/core/database/prisma.service';

function futureIso(daysAhead: number, hourUtc: number, minute = 0): string {
  const d = new Date(Date.now() + daysAhead * 86_400_000);
  d.setUTCHours(hourUtc, minute, 0, 0);
  return d.toISOString();
}

describe('Admin appointment slots (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminKey: string;
  let http: ReturnType<typeof request>;
  const created: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();
    prisma = app.get(PrismaService);
    adminKey = app.get(ConfigService).get<string>('ADMIN_API_KEY') ?? '';
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    if (created.length) await prisma.appointmentSlot.deleteMany({ where: { id: { in: created } } });
    await app.close();
  });

  const auth = (r: request.Test) => (adminKey ? r.set('x-admin-key', adminKey) : r);

  it('rejects admin access without the key when one is configured', async () => {
    if (!adminKey) return; // guard is intentionally open when unconfigured
    expect((await http.get('/admin/appointment-slots')).status).toBe(401);
  });

  it('adds, lists, updates, and removes a slot, and reflects it in public availability', async () => {
    const startsAt = futureIso(6, 20, 15);

    const add = await auth(http.post('/admin/appointment-slots').send({ starts_at: startsAt }));
    expect(add.status).toBe(201);
    const slotId = add.body.data.slot_id;
    created.push(slotId);
    expect(add.body.data).toMatchObject({ starts_at: startsAt, booked: false, in_past: false });

    const publicSlots = await http.get('/appointments/slots');
    expect(publicSlots.body.data.map((s: { starts_at: string }) => s.starts_at)).toContain(
      startsAt,
    );

    const dup = await auth(http.post('/admin/appointment-slots').send({ starts_at: startsAt }));
    expect(dup.status).toBe(409);

    const past = await auth(
      http.post('/admin/appointment-slots').send({ starts_at: '2020-01-01T10:00:00.000Z' }),
    );
    expect(past.status).toBe(422);

    const moved = futureIso(7, 21, 30);
    const update = await auth(
      http.put(`/admin/appointment-slots/${slotId}`).send({ starts_at: moved }),
    );
    expect(update.status).toBe(200);
    expect(update.body.data.starts_at).toBe(moved);

    const del = await auth(http.delete(`/admin/appointment-slots/${slotId}`));
    expect(del.status).toBe(200);
    created.pop();

    expect((await auth(http.delete(`/admin/appointment-slots/${slotId}`))).status).toBe(404);

    const after = await http.get('/appointments/slots');
    expect(after.body.data.map((s: { starts_at: string }) => s.starts_at)).not.toContain(moved);
  });

  it('rejects a malformed starts_at with 422', async () => {
    const res = await auth(http.post('/admin/appointment-slots').send({ starts_at: 'notadate' }));
    expect(res.status).toBe(422);
  });

  it('only offers a slot for booking after an admin opens it', async () => {
    const startsAt = futureIso(8, 19, 45);
    const patient = await http.post('/patients').send({
      first_name: 'Slot',
      last_name: 'Tester',
      date_of_birth: '01/01/1990',
      sex: 'other',
      phone_number: '6465550111',
      address_line_1: '1 Test Way',
      city: 'Albany',
      state: 'NY',
      zip_code: '12207',
    });
    const patientId = patient.body.data.patient_id;

    const before = await http
      .post(`/patients/${patientId}/appointments`)
      .send({ scheduled_at: startsAt });
    expect(before.status).toBe(422);

    const add = await auth(http.post('/admin/appointment-slots').send({ starts_at: startsAt }));
    created.push(add.body.data.slot_id);

    const after = await http
      .post(`/patients/${patientId}/appointments`)
      .send({ scheduled_at: startsAt });
    expect(after.status).toBe(201);

    await prisma.appointment.deleteMany({ where: { patientId } });
    await prisma.patient.delete({ where: { id: patientId } });
  });
});
