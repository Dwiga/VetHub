import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const healthEventsTable = pgTable("health_events", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").notNull(),
  title: text("title").notNull(),
  notes: text("notes"),
  eventDate: text("event_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHealthEventSchema = createInsertSchema(healthEventsTable).omit({ id: true, createdAt: true });
export type InsertHealthEvent = z.infer<typeof insertHealthEventSchema>;
export type HealthEvent = typeof healthEventsTable.$inferSelect;
