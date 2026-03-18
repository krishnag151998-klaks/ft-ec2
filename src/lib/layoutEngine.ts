// =============================================================================
// Standard Top-Down Pedigree Layout Engine
// =============================================================================

import type { Node, Edge } from "@xyflow/react";
import type { Individual, UnionData } from "@/types/familytree";

export const NODE_W = 200;
export const NODE_H = 120;
export const UNION_DOT = 10;
const MIN_H_SPACING = 80;
const ROW_HEIGHT = 220;
const SPOUSE_GAP = 60;

const LABEL_STYLE = { fontSize: "0.65rem", fontWeight: 600, fill: "#6b6b6b" };
const LABEL_BG = { fill: "#ffffff", fillOpacity: 0.95 };
const LABEL_PAD: [number, number] = [4, 8];

function assignGenerations(individuals: Individual[], unionMap: Map<string, UnionData>) {
    const indMap = new Map<string, Individual>();
    individuals.forEach((i) => indMap.set(i.id, i));
    const generation = new Map<string, number>();

    const unionToChildren = new Map<string, string[]>();
    unionMap.forEach((u) => {
        unionToChildren.set(u.id, u.children.map((c) => c.childId));
    });

    function dfs(id: string, gen: number) {
        if (generation.has(id) && generation.get(id)! >= gen) return;
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

    // Normalize generations so min is 0
    let minGen = Infinity;
    generation.forEach((g) => { if (g < minGen) minGen = g; });
    if (minGen < 0) {
        generation.forEach((g, id) => generation.set(id, g - minGen));
    }

    return generation;
}

export function buildStandardLayout(individuals: Individual[]) {
    if (individuals.length === 0) return { nodes: [], edges: [] };

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

    // 2. Group by generation
    const genGroups = new Map<number, Individual[]>();
    individuals.forEach((ind) => {
        const g = generation.get(ind.id) || 0;
        if (!genGroups.has(g)) genGroups.set(g, []);
        genGroups.get(g)!.push(ind);
    });

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodePos = new Map<string, { x: number; y: number }>();
    const unionMidpoints = new Map<string, string>();

    const sortedGens = Array.from(genGroups.keys()).sort((a, b) => a - b);

    // 3. Position nodes generation by generation
    sortedGens.forEach((gen) => {
        const members = genGroups.get(gen)!;
        const y = gen * ROW_HEIGHT;

        type RenderUnit = { ids: string[]; unionId?: string };
        const units: RenderUnit[] = [];
        const inUnit = new Set<string>();

        // Build couples
        members.forEach((ind) => {
            if (inUnit.has(ind.id)) return;
            const allU = [...ind.unionsAsPartner1, ...ind.unionsAsPartner2];
            for (const u of allU) {
                const sid = u.partner1Id === ind.id ? u.partner2Id : u.partner1Id;
                if (sid && generation.get(sid) === gen && !inUnit.has(sid)) {
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

        // Sort units to align children under parents
        const getUnitAvgX = (unit: RenderUnit) => {
            let sumX = 0, count = 0;
            unit.ids.forEach(id => {
                const ind = indMap.get(id)!;
                ind.childOf.forEach(co => {
                    const p1x = nodePos.get(co.union.partner1Id)?.x;
                    const p2x = co.union.partner2Id ? nodePos.get(co.union.partner2Id)?.x : undefined;

                    if (p1x !== undefined && p2x !== undefined) {
                        sumX += (p1x + p2x) / 2;
                        count++;
                    } else if (p1x !== undefined) {
                        sumX += p1x;
                        count++;
                    } else if (p2x !== undefined) {
                        sumX += p2x;
                        count++;
                    }
                });
            });
            return count > 0 ? sumX / count : 0;
        };

        // If not gen 0, sort based on parent positions
        if (gen > 0) {
            units.sort((a, b) => getUnitAvgX(a) - getUnitAvgX(b));
        }

        // Layout units horizontally
        const unitWidths = units.map((u) => u.ids.length === 2 ? 2 * NODE_W + SPOUSE_GAP : NODE_W);
        const totalWidth = unitWidths.reduce((s, w) => s + w, 0) + Math.max(0, units.length - 1) * MIN_H_SPACING;

        // If parents exist, try to center the whole row roughly around the average parent X
        let rowTargetCenter = 0;
        let pSum = 0, pCount = 0;
        units.forEach(u => {
            const avg = getUnitAvgX(u);
            if (avg !== 0) { pSum += avg; pCount++; }
        });
        if (pCount > 0) rowTargetCenter = pSum / pCount;

        let xCursor = rowTargetCenter - totalWidth / 2;

        units.forEach((unit, uIdx) => {
            unit.ids.forEach((id, idx) => {
                const ind = indMap.get(id)!;
                const x = xCursor + idx * (NODE_W + SPOUSE_GAP);

                nodes.push({
                    id: String(ind.id),
                    type: "person",
                    position: { x, y },
                    selectable: true,
                    data: {
                        firstName: ind.firstName,
                        lastName: ind.lastName,
                        gender: ind.gender,
                        birthDate: ind.birthDate,
                        deathDate: ind.deathDate,
                        bio: ind.bio,
                    },
                });
                nodePos.set(id, { x, y });
            });
            xCursor += unitWidths[uIdx] + MIN_H_SPACING;
        });
    });

    // 4. Global Union Midpoints & Spouse Edges
    unionMap.forEach((u) => {
        const uId = u.id;
        const p1Id = u.partner1Id;
        const p2Id = u.partner2Id;
        const pos1 = nodePos.get(p1Id);
        const pos2 = p2Id ? nodePos.get(p2Id) : undefined;

        if (!pos1 && !pos2) return;

        const midX = pos2 && pos1
            ? (pos1.x + pos2.x + NODE_W) / 2 - UNION_DOT / 2
            : pos1 ? pos1.x + NODE_W / 2 - UNION_DOT / 2 : pos2!.x + NODE_W / 2 - UNION_DOT / 2;
        const midY = pos2 && pos1
            ? (pos1.y + pos2.y) / 2 + NODE_H / 2 - UNION_DOT / 2
            : pos1 ? pos1.y + NODE_H / 2 - UNION_DOT / 2 : pos2!.y + NODE_H / 2 - UNION_DOT / 2;

        const midId = `union-mid-${uId}`;

        nodes.push({
            id: String(midId),
            type: "union",
            position: { x: midX, y: midY },
            data: { partner1Id: String(p1Id), partner2Id: p2Id ? String(p2Id) : undefined },
            draggable: false,     // Allow layout engine to rigidly fix positions
            selectable: false,
        });
        unionMidpoints.set(uId, String(midId));

        if (p2Id && pos1 && pos2) {
            const isDivorced = u.unionType === "divorced";
            const isPartnership = u.unionType === "partnership";
            const spouseLabel = isDivorced ? "Divorced" : isPartnership ? "Partners" : "Spouse";
            const spouseColor = isDivorced ? "#d45d5d" : "#7a9e7e";
            const spouseDash = "8 4";

            const p1IsLeft = pos1.x < pos2.x;
            const leftId = p1IsLeft ? String(p1Id) : String(p2Id);
            const rightId = p1IsLeft ? String(p2Id) : String(p1Id);

            edges.push({
                id: String(`sp-L-${uId}`),
                source: leftId,
                sourceHandle: "right",
                target: String(midId),
                targetHandle: "left",
                type: "straight",
                style: { stroke: spouseColor, strokeWidth: 2.5, strokeDasharray: spouseDash },
            });

            edges.push({
                id: String(`sp-R-${uId}`),
                source: String(midId),
                sourceHandle: "right",
                target: rightId,
                targetHandle: "left",
                type: "straight",
                label: spouseLabel,
                style: { stroke: spouseColor, strokeWidth: 2.5, strokeDasharray: spouseDash },
                labelStyle: LABEL_STYLE,
                labelBgStyle: LABEL_BG,
                labelBgPadding: LABEL_PAD,
                labelBgBorderRadius: 6,
            });
        }
    });

    // 5. Child Edges 
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
            let color = "#b0b0b0";
            let dash: string | undefined;

            if (role === "adoptive") {
                label = "Adopted";
                color = "#6b8cae";
                dash = "6 3";
            } else if (role === "step") {
                label = "Step-child";
                color = "#c4956a";
                dash = "6 3";
            }

            edges.push({
                id: String(`child-${u.id}-${childId}`),
                source: String(sourceId),
                sourceHandle: "bottom",
                target: String(childId),
                targetHandle: "top",
                type: "smoothstep",
                label,
                style: { stroke: color, strokeWidth: 2, strokeDasharray: dash },
                labelStyle: { ...LABEL_STYLE, fill: color },
                labelBgStyle: LABEL_BG,
                labelBgPadding: LABEL_PAD,
                labelBgBorderRadius: 6,
            });
        });
    });

    const uniqueNodes = Array.from(new Map(nodes.map(n => [String(n.id), n])).values());
    const uniqueEdges = Array.from(new Map(edges.map(e => [String(e.id), e])).values());

    return { nodes: uniqueNodes, edges: uniqueEdges };
}
