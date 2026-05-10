import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const petsTable = pgTable("pets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender").notNull().default("unknown"),
  sterilized: boolean("sterilized").notNull().default(false),
  color: text("color"),
  speciesId: integer("species_id").notNull(),
  ownerId: integer("owner_id").notNull(),
  status: text("status").notNull().default("healthy"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPetSchema = createInsertSchema(petsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPet = z.infer<typeof insertPetSchema>;
export type Pet = typeof petsTable.$inferSelect;

export const monitoringTable = pgTable("monitoring", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").notNull(),
  weight: text("weight"),
  height: text("height"),
  temperature: text("temperature"),
  notes: text("notes"),
  recordedBy: text("recorded_by"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMonitoringSchema = createInsertSchema(monitoringTable).omit({ id: true, recordedAt: true });
export type InsertMonitoring = z.infer<typeof insertMonitoringSchema>;
export type Monitoring = typeof monitoringTable.$inferSelect;
