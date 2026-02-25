import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
    params: { id: string };
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const { id } = params;

        await prisma.union.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const prismaError = error as { code?: string };
        if (prismaError.code === "P2025") {
            return NextResponse.json(
                { error: "Union not found" },
                { status: 404 }
            );
        }
        console.error("Failed to delete union:", error);
        return NextResponse.json(
            { error: "Failed to delete union" },
            { status: 500 }
        );
    }
}
