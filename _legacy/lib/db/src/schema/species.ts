import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const speciesTable = pgTable("species", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon"),
});

export const insertSpeciesSchema = createInsertSchema(speciesTable).omit({ id: true });
export type InsertSpecies = z.infer<typeof insertSpeciesSchema>;
export type Species = typeof speciesTable.$inferSelect;
