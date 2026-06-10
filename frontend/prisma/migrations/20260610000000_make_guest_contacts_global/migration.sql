-- Drop composite unique constraint
DROP INDEX IF EXISTS "guest_contacts_phone_hotel_id_key";

-- Drop foreign key constraint on hotel_id
ALTER TABLE "guest_contacts" DROP CONSTRAINT IF EXISTS "guest_contacts_hotel_id_fkey";

-- Drop the hotel_id column
ALTER TABLE "guest_contacts" DROP COLUMN "hotel_id";

-- Add unique constraint on phone (global)
CREATE UNIQUE INDEX "guest_contacts_phone_key" ON "guest_contacts"("phone");
