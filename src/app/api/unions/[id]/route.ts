import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface RouteParams {
    params: { id: string };
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;

        const { id } = params;

        const union = await prisma.union.findUnique({
            where: { id },
            include: { partner1: true }
        });

        if (!union || union.partner1.userId !== userId) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
        }

        await prisma.union.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error("Failed to delete union:", error);
        return NextResponse.json(
            { error: "Failed to delete union" },
            { status: 500 }
        );
    }
}
