import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { CLINIC_SLOT_TIMES, clinicInstant, upcomingWeekdays } from '../src/modules/appointments/clinic-time';

/** Two demo records with fixed ids so re-running the seed is a no-op. */
const SEED_PATIENTS: Prisma.PatientCreateInput[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    firstName: 'Jane',
    lastName: 'Doe',
    dateOfBirth: new Date('1988-03-14T00:00:00Z'),
    sex: 'FEMALE',
    phoneNumber: '2125550123',
    email: 'jane.doe@example.com',
    addressLine1: '350 Fifth Avenue',
    addressLine2: 'Suite 2100',
    city: 'New York',
    state: 'NY',
    zipCode: '10118',
    insuranceProvider: 'Aetna',
    insuranceMemberId: 'AET4471902',
    preferredLanguage: 'English',
    emergencyContactName: 'John Doe',
    emergencyContactPhone: '2125550199',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    firstName: 'Carlos',
    lastName: 'Rivera',
    dateOfBirth: new Date('1975-11-02T00:00:00Z'),
    sex: 'MALE',
    phoneNumber: '3055550147',
    addressLine1: '1200 Brickell Avenue',
    city: 'Miami',
    state: 'FL',
    zipCode: '33131-2801',
    preferredLanguage: 'Spanish',
  },
];

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  for (const patient of SEED_PATIENTS) {
    await prisma.patient.upsert({ where: { id: patient.id }, create: patient, update: {} });
  }
  console.log(`Seeded ${SEED_PATIENTS.length} patients`);

  // Open a handful of clinic times over the next few weekdays so callers have
  // slots to book out of the box, without flooding the console. Staff add or
  // remove more through the admin API.
  const SEED_DAYS = 3;
  const SEED_TIMES = CLINIC_SLOT_TIMES.slice(0, 3);
  let slots = 0;
  for (const day of upcomingWeekdays(SEED_DAYS)) {
    for (const [hour, minute] of SEED_TIMES) {
      const startsAt = clinicInstant(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), hour, minute);
      await prisma.appointmentSlot.upsert({ where: { startsAt }, create: { startsAt }, update: {} });
      slots += 1;
    }
  }
  console.log(`Seeded ${slots} appointment slots`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
