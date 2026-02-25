import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface RouteParams {
    params: { id: string };
}

export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;

        const { id } = params;
        const body = await request.json();
        const { firstName, lastName, birthDate, deathDate, gender, bio } = body;

        // Verify ownership
        const existing = await prisma.individual.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
        }

        const individual = await prisma.individual.update({
            where: { id },
            data: {
                ...(firstName !== undefined && { firstName }),
                ...(lastName !== undefined && { lastName }),
                ...(birthDate !== undefined && {
                    birthDate: birthDate ? new Date(birthDate) : null,
                }),
                ...(deathDate !== undefined && {
                    deathDate: deathDate ? new Date(deathDate) : null,
                }),
                ...(gender !== undefined && { gender }),
                ...(bio !== undefined && { bio: bio || null }),
            },
        });

        return NextResponse.json(individual);
    } catch (error: unknown) {
        console.error("Failed to update individual:", error);
        return NextResponse.json(
            { error: "Failed to update individual" },
            { status: 500 }
        );
    }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;

        const { id } = params;

        // Verify ownership
        const existing = await prisma.individual.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
        }

        await prisma.individual.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error("Failed to delete individual:", error);
        return NextResponse.json(
            { error: "Failed to delete individual" },
            { status: 500 }
        );
    }
}
