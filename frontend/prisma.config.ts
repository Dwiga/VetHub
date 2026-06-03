import { defineConfig } from "prisma/config";

// This config is used for production (PostgreSQL only).
// For local SQLite dev, run: DATABASE_URL="file:./prisma/dev.db" npx prisma db push

export default defineConfig({
  schema: "prisma/schema.postgresql.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
