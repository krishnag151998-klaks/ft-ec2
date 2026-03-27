// =============================================================================
// 3D Graph Data Builder
// Converts Individual[] to { nodes, links } format for react-force-graph-3d
// =============================================================================

import type { Individual, UnionData } from "@/types/familytree";

export interface Graph3DNode {
    id: string;
    name: string;
    gender: string;
    birthYear: number | null;
    deathYear: number | null;
    bio: string | null;
    generation: number;
    group: string; // "male" | "female" | "other"
}

export interface Graph3DLink {
    source: string;
    target: string;
    type: "spouse" | "parent-child";
    label?: string;
    color?: string;
}

export interface Graph3DData {
    nodes: Graph3DNode[];
    links: Graph3DLink[];
}

// ---------------------------------------------------------------------------
// Generation Assignment (simplified from layoutEngine.ts)
// ---------------------------------------------------------------------------

function assignGenerations(
    individuals: Individual[],
    unionMap: Map<string, UnionData>
): Map<string, number> {
    const indMap = new Map<string, Individual>();
    individuals.forEach((i) => indMap.set(i.id, i));

    const generation = new Map<string, number>();

    const unionToChildren = new Map<string, string[]>();
    unionMap.forEach((u) => {
        unionToChildren.set(
            u.id,
            u.children.map((c) => c.childId)
        );
    });

    function dfs(id: string, gen: number) {
        if (generation.has(id) && generation.get(id)! <= gen) return;
        generation.set(id, gen);

        const ind = indMap.get(id);
        if (!ind) return;

        const allUnions = [...ind.unionsAsPartner1, ...ind.unionsAsPartner2];

        allUnions.forEach((u) => {
            const spouseId =
                u.partner1Id === id ? u.partner2Id : u.partner1Id;
            if (spouseId && !generation.has(spouseId)) {
                generation.set(spouseId, gen);
            }
            const kids = unionToChildren.get(u.id) || [];
            kids.forEach((kid) => dfs(kid, gen + 1));
        });
    }

    // Start from roots (those without parents)
    const roots = individuals.filter((ind) => ind.childOf.length === 0);
    roots.forEach((r) => dfs(r.id, 0));

    // Assign generation 0 to any unvisited
    individuals.forEach((ind) => {
        if (!generation.has(ind.id)) generation.set(ind.id, 0);
    });

    return generation;
}

// ---------------------------------------------------------------------------
// Main Builder
// ---------------------------------------------------------------------------

function getYear(dateStr: string | null): number | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.getFullYear();
}

export function buildGraph3DData(individuals: Individual[]): Graph3DData {
    if (individuals.length === 0) return { nodes: [], links: [] };

    // Build union map
    const unionMap = new Map<string, UnionData>();
    individuals.forEach((ind) => {
        ind.unionsAsPartner1.forEach((u) => unionMap.set(u.id, u));
        ind.unionsAsPartner2.forEach((u) => unionMap.set(u.id, u));
    });

    // Assign generations
    const generation = assignGenerations(individuals, unionMap);

    // Build nodes
    const nodes: Graph3DNode[] = individuals.map((ind) => ({
        id: ind.id,
        name: `${ind.firstName} ${ind.lastName}`,
        gender: ind.gender,
        birthYear: getYear(ind.birthDate),
        deathYear: getYear(ind.deathDate),
        bio: ind.bio,
        generation: generation.get(ind.id) || 0,
        group: ind.gender,
    }));

    // Build links
    const links: Graph3DLink[] = [];
    const addedSpouseLinks = new Set<string>();

    unionMap.forEach((u) => {
        // Spouse link
        if (u.partner2Id) {
            const key = [u.partner1Id, u.partner2Id].sort().join("-");
            if (!addedSpouseLinks.has(key)) {
                addedSpouseLinks.add(key);
                links.push({
                    source: u.partner1Id,
                    target: u.partner2Id,
                    type: "spouse",
                    label:
                        u.unionType === "divorced"
                            ? "Divorced"
                            : u.unionType === "partnership"
                                ? "Partners"
                                : "Married",
                    color:
                        u.unionType === "divorced"
                            ? "#e05555"
                            : "#5cb87a",
                });
            }
        }

        // Parent-child links (from both parents to each child)
        u.children.forEach((child) => {
            // Link from partner1 to child
            links.push({
                source: u.partner1Id,
                target: child.childId,
                type: "parent-child",
                label: child.parentalRole !== "biological" ? child.parentalRole : undefined,
                color: child.parentalRole === "adoptive"
                    ? "#5b8fb9"
                    : child.parentalRole === "step"
                        ? "#d4a76a"
                        : "#999999",
            });

            // Link from partner2 to child (if exists)
            if (u.partner2Id) {
                links.push({
                    source: u.partner2Id,
                    target: child.childId,
                    type: "parent-child",
                    label: child.parentalRole !== "biological" ? child.parentalRole : undefined,
                    color: child.parentalRole === "adoptive"
                        ? "#5b8fb9"
                        : child.parentalRole === "step"
                            ? "#d4a76a"
                            : "#999999",
                });
            }
        });
    });

    return { nodes, links };
}
