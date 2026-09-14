import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/core/database/prisma.service';

const CALL_ID = 'call_e2e_voice';
const TEST_PHONE = '3125550166';

const PATIENT_ARGS = {
  first_name: 'Luis',
  last_name: 'Ortega',
  date_of_birth: '09/18/1979',
  sex: 'Male',
  phone_number: TEST_PHONE,
  address_line_1: '233 S Wacker Dr',
  city: 'Chicago',
  state: 'IL',
  zip_code: '60606',
  email: '',
};

describe('Voice webhook (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let secret: string;
  let http: ReturnType<typeof request>;

  const toolCall = (name: string, args: Record<string, unknown>) =>
    http
      .post('/voice/webhook')
      .set('x-vapi-secret', secret)
      .send({
        message: {
          type: 'tool-calls',
          call: { id: CALL_ID, customer: { number: '+13125550100' } },
          toolCallList: [{ id: 'tc', type: 'function', function: { name, arguments: args } }],
        },
      })
      .then((res) => ({ status: res.status, result: JSON.parse(res.body.results[0].result) }));

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();
    prisma = app.get(PrismaService);
    secret = app.get(ConfigService).get<string>('VAPI_WEBHOOK_SECRET')!;
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await prisma.call.deleteMany({ where: { id: CALL_ID } });
    await prisma.patient.deleteMany({ where: { phoneNumber: TEST_PHONE } });
    await app.close();
  });

  it('rejects requests without the shared secret', async () => {
    const res = await http
      .post('/voice/webhook')
      .send({ message: { type: 'status-update', status: 'in-progress' } });
    expect(res.status).toBe(401);
  });

  it('surfaces validation errors per field before saving', async () => {
    const { result } = await toolCall('validate_patient_details', {
      ...PATIENT_ARGS,
      phone_number: '312',
      zip_code: '6',
    });
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).sort()).toEqual(['phone_number', 'zip_code']);
  });

  it('registers once per call, links the call, and stores the transcript', async () => {
    const first = await toolCall('register_patient', PATIENT_ARGS);
    expect(first.result.success).toBe(true);
    const patientId = first.result.patient.patient_id;

    const retry = await toolCall('register_patient', PATIENT_ARGS);
    expect(retry.result).toMatchObject({ success: true, already_saved: true });
    expect(retry.result.patient.patient_id).toBe(patientId);

    const lookup = await toolCall('check_existing_patient', { phone_number: '(312) 555-0166' });
    expect(lookup.result.found).toBe(true);
    expect(lookup.result.patient.patient_id).toBe(patientId);

    const report = await http
      .post('/voice/webhook')
      .set('x-vapi-secret', secret)
      .send({
        message: {
          type: 'end-of-call-report',
          endedReason: 'customer-ended-call',
          durationSeconds: 95.6,
          transcript: 'AI: Hi\nUser: Luis Ortega',
          summary: 'Registered Luis Ortega.',
          call: { id: CALL_ID, customer: { number: '+13125550100' } },
        },
      });
    expect(report.status).toBe(200);

    const calls = await http.get(`/patients/${patientId}/calls`);
    expect(calls.body.data).toHaveLength(1);
    expect(calls.body.data[0]).toMatchObject({
      call_id: CALL_ID,
      status: 'COMPLETED',
      duration_seconds: 96,
      summary: 'Registered Luis Ortega.',
    });
  });

  it('relays an unknown tool without throwing', async () => {
    const { status, result } = await toolCall('nonexistent_tool', {});
    expect(status).toBe(200);
    expect(result.error).toMatch(/Unknown tool/);
  });

  it('accepts an end-of-call report larger than the default body limit', async () => {
    const bigCallId = 'call_e2e_big';
    const transcript = 'AI: Hi\nUser: '.repeat(20_000); // ~260 KB, past Express's 100 KB default
    const res = await http
      .post('/voice/webhook')
      .set('x-vapi-secret', secret)
      .send({
        message: {
          type: 'end-of-call-report',
          endedReason: 'customer-ended-call',
          transcript,
          call: { id: bigCallId },
        },
      });
    expect(res.status).toBe(200);

    const stored = await http.get(`/calls/${bigCallId}`);
    expect(stored.body.data.transcript).toHaveLength(transcript.length);
    await prisma.call.deleteMany({ where: { id: bigCallId } });
  });
});
