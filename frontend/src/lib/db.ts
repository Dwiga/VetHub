import "dotenv/config";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const url = process.env.DATABASE_URL ?? "";

// Dynamically pick the adapter based on the DATABASE_URL scheme.
//   file:./prisma/dev.db  → SQLite (local dev via libsql)
//   postgresql://...       → PostgreSQL (production / docker compose)
let adapter: any;
if (url.startsWith("file:")) {
  adapter = new PrismaLibSql({ url });
} else {
  const pool = new pg.Pool({ connectionString: url });
  adapter = new PrismaPg(pool);
}

const prisma = new PrismaClient({ adapter });

export { prisma };
