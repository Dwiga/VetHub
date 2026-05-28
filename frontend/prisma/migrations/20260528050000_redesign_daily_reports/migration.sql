/*
  Warnings:

  - You are about to drop the column `deposit` on the `visits` table
  - You are about to drop the column `condition` on the `daily_reports` table
  - You are about to drop the column `treatment` on the `daily_reports` table
  - You are about to drop the column `cost` on the `daily_reports` table
  - Added the required column `type` to the `daily_reports` table
  - Added the column `daily_fee` to the `visits` table
  - Added the column `description` to the `daily_reports` table
  - Renamed `cost` → `amount` on `daily_reports`

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Recreate visits without deposit, with daily_fee
CREATE TABLE "new_visits" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pet_id" INTEGER NOT NULL,
    "clinic_id" INTEGER NOT NULL,
    "vet_id" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'outpatient',
    "status" TEXT NOT NULL DEFAULT 'active',
    "anamnesis" TEXT,
    "therapy" TEXT,
    "visit_date" TEXT NOT NULL,
    "discharge_date" TEXT,
    "daily_fee" TEXT,
    "share_token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "visits_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "visits_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "visits_vet_id_fkey" FOREIGN KEY ("vet_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_visits" ("id", "pet_id", "clinic_id", "vet_id", "type", "status", "anamnesis", "therapy", "visit_date", "discharge_date", "share_token", "created_at", "updated_at")
SELECT "id", "pet_id", "clinic_id", "vet_id", "type", "status", "anamnesis", "therapy", "visit_date", "discharge_date", "share_token", "created_at", "updated_at" FROM "visits";
DROP TABLE "visits";
ALTER TABLE "new_visits" RENAME TO "visits";
CREATE UNIQUE INDEX "visits_share_token_key" ON "visits"("share_token");

-- Recreate daily_reports with new columns
CREATE TABLE "new_daily_reports" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "visit_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'credit',
    "description" TEXT,
    "amount" TEXT NOT NULL DEFAULT '0',
    "report_date" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "daily_reports_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_daily_reports" ("id", "visit_id", "type", "description", "amount", "report_date", "created_at", "updated_at")
SELECT "id", "visit_id", 'credit', "notes", "cost", "report_date", "created_at", "updated_at" FROM "daily_reports";
DROP TABLE "daily_reports";
ALTER TABLE "new_daily_reports" RENAME TO "daily_reports";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
