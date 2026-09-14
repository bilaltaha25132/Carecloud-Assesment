-- CreateTable
CREATE TABLE "appointment_slots" (
    "id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "appointment_slots_starts_at_key" ON "appointment_slots"("starts_at");

-- CreateIndex
CREATE INDEX "appointment_slots_starts_at_idx" ON "appointment_slots"("starts_at");
