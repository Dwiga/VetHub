-- CreateTable
CREATE TABLE "guest_contacts" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "hotel_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guest_contacts_phone_hotel_id_key" ON "guest_contacts"("phone", "hotel_id");

-- AddForeignKey
ALTER TABLE "guest_contacts" ADD CONSTRAINT "guest_contacts_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
