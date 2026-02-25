import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
    params: { id: string };
}

export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const { id } = params;
        const body = await request.json();
        const { firstName, lastName, birthDate, deathDate, gender, bio } = body;

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
        const prismaError = error as { code?: string };
        if (prismaError.code === "P2025") {
            return NextResponse.json(
                { error: "Individual not found" },
                { status: 404 }
            );
        }
        console.error("Failed to update individual:", error);
        return NextResponse.json(
            { error: "Failed to update individual" },
            { status: 500 }
        );
    }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const { id } = params;

        await prisma.individual.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const prismaError = error as { code?: string };
        if (prismaError.code === "P2025") {
            return NextResponse.json(
                { error: "Individual not found" },
                { status: 404 }
            );
        }
        console.error("Failed to delete individual:", error);
        return NextResponse.json(
            { error: "Failed to delete individual" },
            { status: 500 }
        );
    }
}
