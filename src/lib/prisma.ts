import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const getDatabaseUrl = () => {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }
    const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
    if (DB_HOST && DB_PORT && DB_USER && DB_PASSWORD && DB_NAME) {
        return `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`;
    }
    // Fallback to whatever is defined in prisma.schema
    return undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        datasourceUrl: getDatabaseUrl(),
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
