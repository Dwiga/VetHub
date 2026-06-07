-- CreateTable
CREATE TABLE "monitoring" (
    "id" SERIAL NOT NULL,
    "pet_id" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "notes" TEXT,
    "recorded_by" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitoring_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "monitoring" ADD CONSTRAINT "monitoring_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
