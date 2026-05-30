/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

let prismaClient: PrismaClient;

function createClient() {
  const dbUrl = process.env.DATABASE_URL || "";

  // Use Accelerate if URL indicates it
  if (dbUrl.startsWith("prisma+postgres://")) {
    return new PrismaClient();
  }

  // Otherwise, use the pg adapter
  const adapter = new PrismaPg({ connectionString: dbUrl });
  return new PrismaClient({ adapter });
}

if (process.env.NODE_ENV === "development") {
  if (!global.prisma) {
    global.prisma = createClient();
  }
  prismaClient = global.prisma as Prisma.PrismaClient;
} else {
  prismaClient = createClient();
}

export default prismaClient;
