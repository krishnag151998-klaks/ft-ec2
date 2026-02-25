import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/add-relative
 *
 * Smart endpoint for the selection-first UI.
 * Body: { memberId, action, newPerson, parentalRole? }
 *
 * Actions:
 *   "add_spouse"  → create new person, create union(memberId, newPerson)
 *   "add_child"   → create new person, find/create union for memberId, link child
 *   "add_parent"  → create new person, create union above memberId, link memberId as child
 */
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;

        const body = await request.json();
        const { memberId, action, newPerson, parentalRole = "biological" } = body;

        if (!memberId || !action || !newPerson) {
            return NextResponse.json(
                { error: "memberId, action, and newPerson are required" },
                { status: 400 }
            );
        }

        const { firstName, lastName, birthDate, gender, bio } = newPerson;
        if (!firstName || !lastName || !gender) {
            return NextResponse.json(
                { error: "newPerson must include firstName, lastName, gender" },
                { status: 400 }
            );
        }

        // Verify the member exists and belongs to the user
        const member = await prisma.individual.findUnique({ where: { id: memberId } });
        if (!member || member.userId !== userId) {
            return NextResponse.json({ error: "Member not found or unauthorized" }, { status: 404 });
        }

        // Create the new person assigned to the user
        const created = await prisma.individual.create({
            data: {
                firstName,
                lastName,
                birthDate: birthDate ? new Date(birthDate) : null,
                gender,
                bio: bio || null,
                userId,
            },
        });

        if (action === "add_spouse") {
            // Create a union between the existing member and the new person
            await prisma.union.create({
                data: {
                    partner1Id: memberId,
                    partner2Id: created.id,
                    unionType: "marriage",
                },
            });

            return NextResponse.json(
                { message: "Spouse added", individual: created },
                { status: 201 }
            );
        }

        if (action === "add_child") {
            // Find an active (non-divorced) union for the member, or create a single-parent union
            let union = await prisma.union.findFirst({
                where: {
                    OR: [
                        { partner1Id: memberId, unionType: { not: "divorced" } },
                        { partner2Id: memberId, unionType: { not: "divorced" } },
                    ],
                },
            });

            if (!union) {
                // Create single-parent union
                union = await prisma.union.create({
                    data: {
                        partner1Id: memberId,
                        partner2Id: null,
                        unionType: "partnership",
                    },
                });
            }

            await prisma.unionChild.create({
                data: {
                    unionId: union.id,
                    childId: created.id,
                    parentalRole: parentalRole,
                },
            });

            return NextResponse.json(
                { message: "Child added", individual: created, unionId: union.id },
                { status: 201 }
            );
        }

        if (action === "add_parent") {
            // Create a new union above the member (the new person as a single parent initially)
            const parentUnion = await prisma.union.create({
                data: {
                    partner1Id: created.id,
                    partner2Id: null,
                    unionType: "marriage",
                },
            });

            // Link the member as a child of this new union
            await prisma.unionChild.create({
                data: {
                    unionId: parentUnion.id,
                    childId: memberId,
                    parentalRole: parentalRole,
                },
            });

            return NextResponse.json(
                { message: "Parent added", individual: created, unionId: parentUnion.id },
                { status: 201 }
            );
        }

        return NextResponse.json(
            { error: "action must be add_spouse, add_child, or add_parent" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Failed to add relative:", error);
        return NextResponse.json(
            { error: "Failed to add relative" },
            { status: 500 }
        );
    }
}
