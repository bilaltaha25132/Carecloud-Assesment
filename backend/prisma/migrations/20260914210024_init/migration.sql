-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'DECLINE_TO_ANSWER');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CANCELLED');

-- CreateTable
CREATE TABLE "patients" (
    "patient_id" UUID NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "sex" "Sex" NOT NULL,
    "phone_number" CHAR(10) NOT NULL,
    "email" VARCHAR(254),
    "address_line_1" VARCHAR(200) NOT NULL,
    "address_line_2" VARCHAR(200),
    "city" VARCHAR(100) NOT NULL,
    "state" CHAR(2) NOT NULL,
    "zip_code" VARCHAR(10) NOT NULL,
    "insurance_provider" VARCHAR(100),
    "insurance_member_id" VARCHAR(50),
    "preferred_language" VARCHAR(50) NOT NULL DEFAULT 'English',
    "emergency_contact_name" VARCHAR(100),
    "emergency_contact_phone" CHAR(10),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("patient_id")
);

-- CreateTable
CREATE TABLE "calls" (
    "id" VARCHAR(64) NOT NULL,
    "patient_id" UUID,
    "caller_number" VARCHAR(20),
    "status" "CallStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "ended_reason" VARCHAR(100),
    "duration_seconds" INTEGER,
    "transcript" TEXT,
    "summary" TEXT,
    "messages" JSONB,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "reason" VARCHAR(200),
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patients_phone_number_idx" ON "patients"("phone_number");

-- CreateIndex
CREATE INDEX "patients_last_name_idx" ON "patients"("last_name");

-- CreateIndex
CREATE INDEX "patients_date_of_birth_idx" ON "patients"("date_of_birth");

-- CreateIndex
CREATE INDEX "patients_deleted_at_idx" ON "patients"("deleted_at");

-- CreateIndex
CREATE INDEX "calls_patient_id_idx" ON "calls"("patient_id");

-- CreateIndex
CREATE INDEX "calls_started_at_idx" ON "calls"("started_at");

-- CreateIndex
CREATE INDEX "appointments_patient_id_idx" ON "appointments"("patient_id");

-- CreateIndex
CREATE INDEX "appointments_scheduled_at_idx" ON "appointments"("scheduled_at");

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Format rules enforced by the database, independent of application code.
ALTER TABLE "patients"
  ADD CONSTRAINT "patients_first_name_check" CHECK (char_length("first_name") BETWEEN 1 AND 50),
  ADD CONSTRAINT "patients_last_name_check" CHECK (char_length("last_name") BETWEEN 1 AND 50),
  ADD CONSTRAINT "patients_date_of_birth_check" CHECK ("date_of_birth" <= CURRENT_DATE),
  ADD CONSTRAINT "patients_phone_number_check" CHECK ("phone_number" ~ '^[0-9]{10}$'),
  ADD CONSTRAINT "patients_state_check" CHECK ("state" ~ '^[A-Z]{2}$'),
  ADD CONSTRAINT "patients_zip_code_check" CHECK ("zip_code" ~ '^[0-9]{5}(-[0-9]{4})?$'),
  ADD CONSTRAINT "patients_city_check" CHECK (char_length("city") BETWEEN 1 AND 100),
  ADD CONSTRAINT "patients_emergency_contact_phone_check"
    CHECK ("emergency_contact_phone" IS NULL OR "emergency_contact_phone" ~ '^[0-9]{10}$');
