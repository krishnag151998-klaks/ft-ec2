import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// BFS relationship finder
// ---------------------------------------------------------------------------

interface GraphNode {
    id: string;
    name: string;
}

interface GraphEdge {
    from: string;
    to: string;
    label: string;
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fromId = searchParams.get("from");
    const toId = searchParams.get("to");

    if (!fromId || !toId) {
        return NextResponse.json({ error: "Missing from/to params" }, { status: 400 });
    }

    const userId = session.user.id;

    // Fetch all data for this user
    const [individuals, unions, unionChildren] = await Promise.all([
        prisma.individual.findMany({ where: { userId }, select: { id: true, firstName: true, lastName: true } }),
        prisma.union.findMany({
            where: { partner1: { userId } },
            select: { id: true, partner1Id: true, partner2Id: true },
        }),
        prisma.unionChild.findMany({
            where: { child: { userId } },
            select: { unionId: true, childId: true },
        }),
    ]);

    // Build name map
    const nameMap = new Map(individuals.map((i) => [i.id, `${i.firstName} ${i.lastName}`]));

    // Build adjacency graph: edges between individuals via unions
    const edges: GraphEdge[] = [];

    for (const union of unions) {
        const p1 = union.partner1Id;
        const p2 = union.partner2Id;

        // Partners are related to each other
        if (p1 && p2) {
            edges.push({ from: p1, to: p2, label: "partner of" });
            edges.push({ from: p2, to: p1, label: "partner of" });
        }

        // Children of this union
        const children = unionChildren.filter((uc) => uc.unionId === union.id).map((uc) => uc.childId);

        for (const childId of children) {
            if (p1) {
                edges.push({ from: p1, to: childId, label: "parent of" });
                edges.push({ from: childId, to: p1, label: "child of" });
            }
            if (p2) {
                edges.push({ from: p2, to: childId, label: "parent of" });
                edges.push({ from: childId, to: p2, label: "child of" });
            }
            // Siblings
            for (const sibling of children) {
                if (sibling !== childId) {
                    edges.push({ from: childId, to: sibling, label: "sibling of" });
                }
            }
        }
    }

    // BFS from fromId to toId
    const queue: { id: string; path: { name: string; link: string }[] }[] = [
        { id: fromId, path: [{ name: nameMap.get(fromId) ?? fromId, link: "" }] },
    ];
    const visited = new Set<string>([fromId]);

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (current.id === toId) {
            return NextResponse.json({ path: current.path });
        }

        const neighbors = edges.filter((e) => e.from === current.id && !visited.has(e.to));
        for (const edge of neighbors) {
            visited.add(edge.to);
            queue.push({
                id: edge.to,
                path: [
                    ...current.path.slice(0, -1),
                    { name: current.path[current.path.length - 1].name, link: edge.label },
                    { name: nameMap.get(edge.to) ?? edge.to, link: "" },
                ],
            });
        }
    }

    return NextResponse.json({ path: null }); // No path found
}
