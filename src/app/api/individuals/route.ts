import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const individuals = await prisma.individual.findMany({
            include: {
                unionsAsPartner1: {
                    include: {
                        partner2: true,
                        children: { include: { child: true } },
                    },
                },
                unionsAsPartner2: {
                    include: {
                        partner1: true,
                        children: { include: { child: true } },
                    },
                },
                childOf: {
                    include: {
                        union: {
                            include: {
                                partner1: true,
                                partner2: true,
                            },
                        },
                    },
                },
            },
            orderBy: { birthDate: "asc" },
        });

        return NextResponse.json(individuals);
    } catch (error) {
        console.error("Failed to fetch individuals:", error);
        return NextResponse.json(
            { error: "Failed to fetch individuals" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { firstName, lastName, birthDate, gender, bio } = body;

        if (!firstName || !lastName || !gender) {
            return NextResponse.json(
                { error: "firstName, lastName, and gender are required" },
                { status: 400 }
            );
        }

        const individual = await prisma.individual.create({
            data: {
                firstName,
                lastName,
                birthDate: birthDate ? new Date(birthDate) : null,
                gender,
                bio: bio || null,
            },
        });

        return NextResponse.json(individual, { status: 201 });
    } catch (error) {
        console.error("Failed to create individual:", error);
        return NextResponse.json(
            { error: "Failed to create individual" },
            { status: 500 }
        );
    }
}
