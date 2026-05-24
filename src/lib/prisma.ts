import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";

function createPrismaClient() {
  const sql = neon(process.env.DATABASE_URL!);
  const adapter = new PrismaNeonHTTP(sql);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>;
const globalForPrisma = globalThis as unknown as { prisma: PrismaClientSingleton | undefined };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
