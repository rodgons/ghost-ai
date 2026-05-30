/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

let prismaClient: PrismaClient;

function createClient() {
  const dbUrl = process.env.DATABASE_URL || "";

  // Use PostgreSQL adapter (including Accelerate URLs)
  const adapter = new PrismaPg({ connectionString: dbUrl });
  return new PrismaClient({ adapter });
}

if (process.env.NODE_ENV === "development") {
  if (!global.prisma) {
    global.prisma = createClient();
  }
  prismaClient = global.prisma as PrismaClient;
} else {
  prismaClient = createClient();
}

export default prismaClient;
