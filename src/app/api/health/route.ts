import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    let dbStatus = "disconnected";

    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = "connected";
    } catch {
        dbStatus = "disconnected";
    }

    return NextResponse.json(
        {
            status: "ok",
            database: dbStatus,
            timestamp: new Date().toISOString(),
        },
        { status: dbStatus === "connected" ? 200 : 503 }
    );
}
