/*
  Warnings:

  - You are about to drop the column `guest_name` on the `hotel_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `guest_phone` on the `hotel_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `pet_name_raw` on the `hotel_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `pet_type_raw` on the `hotel_bookings` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_hotel_bookings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pet_id" INTEGER,
    "clinic_id" INTEGER NOT NULL,
    "check_in" TEXT NOT NULL,
    "check_out" TEXT,
    "daily_fee" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "deposit" TEXT,
    "room_type" TEXT,
    "share_token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "hotel_bookings_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "hotel_bookings_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_hotel_bookings" ("check_in", "check_out", "clinic_id", "created_at", "daily_fee", "deposit", "id", "notes", "pet_id", "room_type", "share_token", "status", "updated_at") SELECT "check_in", "check_out", "clinic_id", "created_at", "daily_fee", "deposit", "id", "notes", "pet_id", "room_type", "share_token", "status", "updated_at" FROM "hotel_bookings";
DROP TABLE "hotel_bookings";
ALTER TABLE "new_hotel_bookings" RENAME TO "hotel_bookings";
CREATE UNIQUE INDEX "hotel_bookings_share_token_key" ON "hotel_bookings"("share_token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
