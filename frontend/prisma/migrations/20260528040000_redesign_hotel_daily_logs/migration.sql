/*
  Warnings:

  - Added the required column `type` to the `hotel_daily_logs` table (existing rows default to 'credit')
  - You are about to drop the column `condition` on the `hotel_daily_logs` table
  - You are about to drop the column `feeding` on the `hotel_daily_logs` table
  - You are about to drop the column `cost` on the `hotel_daily_logs` table
  - Added the column `description` to the `hotel_daily_logs` table
  - You are about to drop the column `deposit` on the `hotel_bookings` table

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Recreate hotel_bookings without deposit column
CREATE TABLE "new_hotel_bookings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pet_id" INTEGER,
    "clinic_id" INTEGER NOT NULL,
    "check_in" TEXT NOT NULL,
    "check_out" TEXT,
    "daily_fee" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "room_type" TEXT,
    "share_token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "hotel_bookings_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "hotel_bookings_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_hotel_bookings" ("check_in", "check_out", "clinic_id", "created_at", "daily_fee", "id", "notes", "pet_id", "room_type", "share_token", "status", "updated_at")
SELECT "check_in", "check_out", "clinic_id", "created_at", "daily_fee", "id", "notes", "pet_id", "room_type", "share_token", "status", "updated_at" FROM "hotel_bookings";
DROP TABLE "hotel_bookings";
ALTER TABLE "new_hotel_bookings" RENAME TO "hotel_bookings";
CREATE UNIQUE INDEX "hotel_bookings_share_token_key" ON "hotel_bookings"("share_token");

-- Recreate hotel_daily_logs with new columns
CREATE TABLE "new_hotel_daily_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "booking_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'credit',
    "description" TEXT,
    "amount" TEXT NOT NULL DEFAULT '0',
    "log_date" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "hotel_daily_logs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "hotel_bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_hotel_daily_logs" ("booking_id", "created_at", "description", "log_date", "updated_at", "type", "amount", "id")
SELECT "booking_id", "created_at", "notes", "log_date", "updated_at", 'credit', "cost", "id" FROM "hotel_daily_logs";
DROP TABLE "hotel_daily_logs";
ALTER TABLE "new_hotel_daily_logs" RENAME TO "hotel_daily_logs";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
