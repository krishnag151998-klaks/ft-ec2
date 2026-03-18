// =============================================================================
// 3D Family Tree Layout Engine
// Transforms family data into 3D coordinates for Three.js rendering
// =============================================================================

import type { Individual, UnionData } from "@/types/familytree";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Node3D {
    id: string;
    type: "person" | "union";
    position: { x: number; y: number; z: number };
    data: {
        firstName?: string;
        lastName?: string;
        gender?: string;
        birthDate?: string | null;
        deathDate?: string | null;
        bio?: string | null;
        partner1Id?: string;
        partner2Id?: string;
    };
}

export interface Edge3D {
    id: string;
    source: string;
    target: string;
    type: "spouse" | "child";
    label?: string;
    color: string;
    dashed: boolean;
}

// ---------------------------------------------------------------------------
// Layout Constants
// ---------------------------------------------------------------------------

const GENERATION_HEIGHT = 4;    // Y-spacing between generations
const PERSON_SPACING_X = 3.5;   // X-spacing between people
const SPOUSE_GAP = 2.5;         // Gap between spouses
const WING_OFFSET_Z = 5;        // Z-offset for paternal/maternal wings

// ---------------------------------------------------------------------------
// Generation Assignment (shared with 2D engine)
// ---------------------------------------------------------------------------

type Wing = "left" | "center" | "right";

function assignGenerations(individuals: Individual[], unionMap: Map<string, UnionData>) {
    const indMap = new Map<string, Individual>();
    individuals.forEach((i) => indMap.set(i.id, i));

    const generation = new Map<string, number>();

    const unionToChildren = new Map<string, string[]>();
    unionMap.forEach((u) => {
        unionToChildren.set(u.id, u.children.map((c) => c.childId));
    });

    function dfs(id: string, gen: number) {
        if (generation.has(id) && generation.get(id)! <= gen) return;
        generation.set(id, gen);

        const ind = indMap.get(id)!;
        const allUnions = [...ind.unionsAsPartner1, ...ind.unionsAsPartner2];

        allUnions.forEach((u) => {
            const spouseId = u.partner1Id === id ? u.partner2Id : u.partner1Id;
            if (spouseId && !generation.has(spouseId)) {
                generation.set(spouseId, gen);
            }
            const kids = unionToChildren.get(u.id) || [];
            kids.forEach((kid) => dfs(kid, gen + 1));
        });
    }

    const roots = individuals.filter((ind) => ind.childOf.length === 0);
    roots.forEach((r) => dfs(r.id, 0));

    individuals.forEach((ind) => {
        if (!generation.has(ind.id)) generation.set(ind.id, 0);
    });

    // Align spouses
    let changed = true;
    while (changed) {
        changed = false;
        unionMap.forEach((u) => {
            if (!u.partner2Id) return;
            const g1 = generation.get(u.partner1Id)!;
            const g2 = generation.get(u.partner2Id)!;
            if (g1 !== g2) {
                const deeper = Math.max(g1, g2);
                if (g1 < deeper) { generation.set(u.partner1Id, deeper); changed = true; }
                if (g2 < deeper) { generation.set(u.partner2Id, deeper); changed = true; }
            }
        });
    }

    return generation;
}

// ---------------------------------------------------------------------------
// Build 3D Layout
// ---------------------------------------------------------------------------

export function build3DLayout(individuals: Individual[]) {
    if (individuals.length === 0) return { nodes: [] as Node3D[], edges: [] as Edge3D[] };

    const indMap = new Map<string, Individual>();
    individuals.forEach((i) => indMap.set(i.id, i));

    const unionMap = new Map<string, UnionData>();
    individuals.forEach((ind) => {
        ind.unionsAsPartner1.forEach((u) => unionMap.set(u.id, u));
        ind.unionsAsPartner2.forEach((u) => unionMap.set(u.id, u));
    });

    const unionToChildren = new Map<string, string[]>();
    unionMap.forEach((u) => {
        unionToChildren.set(u.id, u.children.map((c) => c.childId));
    });

    // 1. Assign generations
    const generation = assignGenerations(individuals, unionMap);

    // 2. Find the pivot
    let pivot: Individual | null = null;
    let bestScore = -1;

    for (const ind of individuals) {
        const hasParents = ind.childOf.length > 0;
        const allU = [...ind.unionsAsPartner1, ...ind.unionsAsPartner2];
        const kidCount = allU.reduce((s, u) => s + u.children.length, 0);
        if (hasParents && kidCount > 0 && kidCount > bestScore) {
            bestScore = kidCount;
            pivot = ind;
        }
    }

    // 3. Classify wings
    const wing = new Map<string, Wing>();

    if (pivot) {
        const centerQueue = [pivot.id];
        const centerVisited = new Set<string>();

        while (centerQueue.length > 0) {
            const id = centerQueue.shift()!;
            if (centerVisited.has(id)) continue;
            centerVisited.add(id);
            wing.set(id, "center");

            const ind = indMap.get(id)!;
            const allU = [...ind.unionsAsPartner1, ...ind.unionsAsPartner2];
            allU.forEach((u) => {
                const sid = u.partner1Id === id ? u.partner2Id : u.partner1Id;
                if (sid && !centerVisited.has(sid)) {
                    wing.set(sid, "center");
                    centerVisited.add(sid);
                }
                u.children.forEach((c) => {
                    if (!centerVisited.has(c.childId)) centerQueue.push(c.childId);
                });
            });
        }

        const parentLink = pivot.childOf[0]?.union;
        if (parentLink) {
            const p1 = indMap.get(parentLink.partner1Id);
            const p2 = parentLink.partner2Id ? indMap.get(parentLink.partner2Id) : null;

            let fatherId: string | null = null;
            let motherId: string | null = null;

            if (p1?.gender === "male") {
                fatherId = p1.id;
                motherId = p2?.id || null;
            } else if (p2?.gender === "male") {
                fatherId = p2.id;
                motherId = p1?.id || null;
            } else {
                fatherId = p1?.id || null;
                motherId = p2?.id || null;
            }

            const classifyWing = (rootId: string, side: Wing) => {
                const q = [rootId];
                const visited = new Set<string>();
                while (q.length > 0) {
                    const id = q.shift()!;
                    if (visited.has(id) || wing.get(id) === "center") continue;
                    visited.add(id);
                    wing.set(id, side);

                    const ind = indMap.get(id);
                    if (!ind) continue;

                    ind.childOf.forEach((co) => {
                        if (!visited.has(co.union.partner1Id)) q.push(co.union.partner1Id);
                        if (co.union.partner2Id && !visited.has(co.union.partner2Id))
                            q.push(co.union.partner2Id);
                    });

                    ind.childOf.forEach((co) => {
                        const sibs = unionToChildren.get(co.unionId) || [];
                        sibs.forEach((s) => {
                            if (!visited.has(s) && !wing.has(s)) q.push(s);
                        });
                    });
                }
            };

            if (fatherId) classifyWing(fatherId, "left");
            if (motherId) classifyWing(motherId, "right");
        }
    }

    individuals.forEach((ind) => {
        if (!wing.has(ind.id)) wing.set(ind.id, "center");
    });

    // 4. Group by wing & generation
    const groups: Record<Wing, Map<number, Individual[]>> = {
        left: new Map(),
        center: new Map(),
        right: new Map(),
    };

    individuals.forEach((ind) => {
        const w = wing.get(ind.id) || "center";
        const g = generation.get(ind.id) || 0;
        if (!groups[w].has(g)) groups[w].set(g, []);
        groups[w].get(g)!.push(ind);
    });

    // 5. Position nodes in 3D
    const nodes: Node3D[] = [];
    const edges: Edge3D[] = [];
    const nodePos = new Map<string, { x: number; y: number; z: number }>();
    const unionMidpoints = new Map<string, string>();

    function positionWing(group: Map<number, Individual[]>, centerX: number, wingZ: number) {
        const sortedGens = Array.from(group.keys()).sort((a, b) => a - b);

        sortedGens.forEach((gen) => {
            const members = group.get(gen)!;
            const y = -gen * GENERATION_HEIGHT; // Negative Y = descending generations

            // Build render units
            type RU = { ids: string[]; unionId?: string };
            const units: RU[] = [];
            const inUnit = new Set<string>();

            // Couples first
            members.forEach((ind) => {
                if (inUnit.has(ind.id)) return;
                const allU = [...ind.unionsAsPartner1, ...ind.unionsAsPartner2];
                for (const u of allU) {
                    const sid = u.partner1Id === ind.id ? u.partner2Id : u.partner1Id;
                    if (
                        sid &&
                        generation.get(sid) === gen &&
                        wing.get(sid) === wing.get(ind.id) &&
                        !inUnit.has(sid)
                    ) {
                        units.push({ ids: [ind.id, sid], unionId: u.id });
                        inUnit.add(ind.id);
                        inUnit.add(sid);
                        break;
                    }
                }
            });

            // Singles
            members.forEach((ind) => {
                if (!inUnit.has(ind.id)) units.push({ ids: [ind.id] });
            });

            // Calculate total width
            const unitWidths: number[] = units.map((u) =>
                u.ids.length === 2 ? SPOUSE_GAP : 0
            );
            const totalWidth =
                unitWidths.reduce((s: number, w: number) => s + w, 0) +
                (units.reduce((s, u) => s + u.ids.length, 0)) * PERSON_SPACING_X;

            let xCursor = centerX - totalWidth / 2;

            units.forEach((unit) => {
                unit.ids.forEach((id, idx) => {
                    const ind = indMap.get(id)!;
                    const x = xCursor + idx * (PERSON_SPACING_X + SPOUSE_GAP);

                    nodes.push({
                        id: String(ind.id),
                        type: "person",
                        position: { x, y, z: wingZ },
                        data: {
                            firstName: ind.firstName,
                            lastName: ind.lastName,
                            gender: ind.gender,
                            birthDate: ind.birthDate,
                            deathDate: ind.deathDate,
                            bio: ind.bio,
                        },
                    });
                    nodePos.set(id, { x, y, z: wingZ });
                });

                xCursor += unit.ids.length * PERSON_SPACING_X +
                    (unit.ids.length === 2 ? SPOUSE_GAP : 0) + PERSON_SPACING_X;
            });
        });
    }

    positionWing(groups.left, -6, -WING_OFFSET_Z);
    positionWing(groups.center, 0, 0);
    positionWing(groups.right, 6, WING_OFFSET_Z);

    // 6. Create union midpoints & spouse edges
    unionMap.forEach((u) => {
        const uId = u.id;
        const p1Id = u.partner1Id;
        const p2Id = u.partner2Id;
        const pos1 = nodePos.get(p1Id);
        const pos2 = p2Id ? nodePos.get(p2Id) : undefined;

        if (!pos1 && !pos2) return;

        const midX = pos2 && pos1
            ? (pos1.x + pos2.x) / 2
            : pos1 ? pos1.x : pos2!.x;
        const midY = pos2 && pos1
            ? (pos1.y + pos2.y) / 2
            : pos1 ? pos1.y : pos2!.y;
        const midZ = pos2 && pos1
            ? (pos1.z + pos2.z) / 2
            : pos1 ? pos1.z : pos2!.z;

        const midId = `union-mid-${uId}`;

        nodes.push({
            id: midId,
            type: "union",
            position: { x: midX, y: midY, z: midZ },
            data: { partner1Id: String(p1Id), partner2Id: p2Id ? String(p2Id) : undefined },
        });
        unionMidpoints.set(uId, midId);

        // Spouse edges
        if (p2Id && pos1 && pos2) {
            const isDivorced = u.unionType === "divorced";
            const isPartnership = u.unionType === "partnership";
            const spouseLabel = isDivorced ? "Divorced" : isPartnership ? "Partners" : "Spouse";
            const spouseColor = isDivorced ? "#ff6b6b" : "#7a9e7e";

            edges.push({
                id: `sp-L-${uId}`,
                source: String(p1Id),
                target: midId,
                type: "spouse",
                color: spouseColor,
                dashed: true,
            });

            edges.push({
                id: `sp-R-${uId}`,
                source: midId,
                target: String(p2Id),
                type: "spouse",
                label: spouseLabel,
                color: spouseColor,
                dashed: true,
            });
        }
    });

    // 7. Child edges
    unionMap.forEach((u) => {
        const childIds = unionToChildren.get(u.id) || [];
        if (childIds.length === 0) return;

        const midId = unionMidpoints.get(u.id);
        const sourceId = midId || u.partner1Id;

        childIds.forEach((childId) => {
            if (!nodePos.has(childId)) return;

            const childLink = u.children.find((c) => c.childId === childId);
            const role = childLink?.parentalRole || "biological";

            let label = "Child";
            let color = "#88a0b9";
            let dashed = false;

            if (role === "adoptive") {
                label = "Adopted";
                color = "#6b8cae";
                dashed = true;
            } else if (role === "step") {
                label = "Step-child";
                color = "#c4956a";
                dashed = true;
            }

            edges.push({
                id: `child-${u.id}-${childId}`,
                source: String(sourceId),
                target: String(childId),
                type: "child",
                label,
                color,
                dashed,
            });
        });
    });

    // Deduplicate
    const uniqueNodes = Array.from(new Map(nodes.map((n) => [n.id, n])).values());
    const uniqueEdges = Array.from(new Map(edges.map((e) => [e.id, e])).values());

    // Compute generation info for platforms
    const allGens = new Set<number>();
    individuals.forEach((ind) => allGens.add(generation.get(ind.id) || 0));
    const generations = Array.from(allGens).sort((a, b) => a - b);

    return { nodes: uniqueNodes, edges: uniqueEdges, generations };
}
