import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../src/app/generated/prisma";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const createPrismaClient = () => {
  if (databaseUrl.startsWith("prisma+postgres://")) {
    // Accelerate
    return new PrismaClient();
  } else {
    // Direct with pg adapter
    const pool = new pg.Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
