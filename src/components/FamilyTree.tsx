"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    applyNodeChanges,
    applyEdgeChanges,
    type Node,
    type Edge,
    type NodeChange,
    type EdgeChange,
    BackgroundVariant,
    ConnectionLineType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import PersonNode from "./PersonNode";
import UnionNode from "./UnionNode";
import NodeContextMenu from "./NodeContextMenu";
import EditMemberModal from "./EditMemberModal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UnionChild {
    id: string;
    childId: string;
    parentalRole: string;
    child: Individual;
}

interface UnionData {
    id: string;
    partner1Id: string;
    partner2Id: string | null;
    unionType: string;
    partner1?: Individual;
    partner2?: Individual | null;
    children: UnionChild[];
}

interface Individual {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string | null;
    deathDate: string | null;
    gender: string;
    bio: string | null;
    unionsAsPartner1: UnionData[];
    unionsAsPartner2: UnionData[];
    childOf: {
        id: string;
        unionId: string;
        parentalRole: string;
        union: UnionData;
    }[];
}

// ---------------------------------------------------------------------------
// Layout Constants
// ---------------------------------------------------------------------------

const NODE_W = 200;
const NODE_H = 120;
const UNION_DOT = 10;
const MIN_H_SPACING = 150;
const ROW_HEIGHT = 280;
const SPOUSE_GAP = 40;
const WING_OFFSET = 520;

// ---------------------------------------------------------------------------
// Edge styling presets
// ---------------------------------------------------------------------------

const LABEL_STYLE = { fontSize: "0.65rem", fontWeight: 600, fill: "#6b6b6b" };
const LABEL_BG = { fill: "#ffffff", fillOpacity: 0.95 };
const LABEL_PAD: [number, number] = [4, 8];

// ---------------------------------------------------------------------------
// DFS Generation Assignment
// ---------------------------------------------------------------------------

function assignGenerations(individuals: Individual[], unionMap: Map<string, UnionData>) {
    const indMap = new Map<string, Individual>();
    individuals.forEach((i) => indMap.set(i.id, i));

    const generation = new Map<string, number>();

    const childToUnion = new Map<string, string>();
    unionMap.forEach((u) => {
        u.children.forEach((c) => childToUnion.set(c.childId, u.id));
    });

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
// Butterfly Pedigree Layout
// ---------------------------------------------------------------------------

type Wing = "left" | "center" | "right";

function buildButterflyLayout(individuals: Individual[]) {
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

    // 2. Find the pivot — the person who has parents AND has children
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

    // 3. Classify nodes into wings
    const wing = new Map<string, Wing>();

    if (pivot) {
        // Mark pivot + all spouses + all descendants as CENTER
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
                // Mark spouse as center
                const sid = u.partner1Id === id ? u.partner2Id : u.partner1Id;
                if (sid && !centerVisited.has(sid)) {
                    wing.set(sid, "center");
                    centerVisited.add(sid);
                }
                // Mark children as center (and recurse into their descendants)
                u.children.forEach((c) => {
                    if (!centerVisited.has(c.childId)) centerQueue.push(c.childId);
                });
            });
        }

        // Determine father / mother from pivot's parents
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

            // BFS to classify an ancestor tree into a wing
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

                    // Go up to parents
                    ind.childOf.forEach((co) => {
                        if (!visited.has(co.union.partner1Id)) q.push(co.union.partner1Id);
                        if (co.union.partner2Id && !visited.has(co.union.partner2Id))
                            q.push(co.union.partner2Id);
                    });

                    // Include siblings
                    ind.childOf.forEach((co) => {
                        const sibs = unionToChildren.get(co.unionId) || [];
                        sibs.forEach((s) => {
                            if (!visited.has(s) && !wing.has(s)) q.push(s);
                        });
                    });
                }
            }

            if (fatherId) classifyWing(fatherId, "left");
            if (motherId) classifyWing(motherId, "right");
        }
    }

    // Mark unclassified as center
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

    // 5. Position nodes
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodePos = new Map<string, { x: number; y: number }>();
    const unionMidpoints = new Map<string, string>();

    function positionWing(group: Map<number, Individual[]>, centerX: number) {
        const sortedGens = Array.from(group.keys()).sort((a, b) => a - b);

        sortedGens.forEach((gen) => {
            const members = group.get(gen)!;
            const y = gen * ROW_HEIGHT;

            // Build render units (couples + singles)
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

            // Widths
            const unitWidths = units.map((u) =>
                u.ids.length === 2 ? 2 * NODE_W + SPOUSE_GAP : NODE_W
            );
            const totalWidth =
                unitWidths.reduce((s, w) => s + w, 0) +
                Math.max(0, units.length - 1) * MIN_H_SPACING;

            let xCursor = centerX - totalWidth / 2;

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

                // Union midpoints are now handled globally after positioning everything

                xCursor += unitWidths[uIdx] + MIN_H_SPACING;
            });
        });
    }

    positionWing(groups.left, -WING_OFFSET);
    positionWing(groups.center, 0);
    positionWing(groups.right, WING_OFFSET);

    // 5.5 Global Union Midpoints & Spouse Edges
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

        // Ensure nodes contains the union midpoint
        nodes.push({
            id: String(midId),
            type: "union",
            position: { x: midX, y: midY },
            data: { partner1Id: String(p1Id), partner2Id: p2Id ? String(p2Id) : undefined },
            draggable: false,
            selectable: false,
        });
        unionMidpoints.set(uId, String(midId));

        // Create spouse edges if both partners are located
        if (p2Id && pos1 && pos2) {
            const isDivorced = u.unionType === "divorced";
            const isPartnership = u.unionType === "partnership";
            const spouseLabel = isDivorced ? "Divorced" : isPartnership ? "Partners" : "Spouse";
            const spouseColor = isDivorced ? "#d45d5d" : "#7a9e7e";
            const spouseDash = "8 4";

            edges.push({
                id: String(`sp-L-${uId}`),
                source: String(p1Id),
                target: String(midId),
                type: "step",
                style: { stroke: spouseColor, strokeWidth: 2.5, strokeDasharray: spouseDash },
            });

            edges.push({
                id: String(`sp-R-${uId}`),
                source: String(midId),
                target: String(p2Id),
                type: "step",
                label: spouseLabel,
                style: { stroke: spouseColor, strokeWidth: 2.5, strokeDasharray: spouseDash },
                labelStyle: LABEL_STYLE,
                labelBgStyle: LABEL_BG,
                labelBgPadding: LABEL_PAD,
                labelBgBorderRadius: 6,
            });
        }
    });

    // 6. Child edges (smoothstep / orthogonal)
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
                target: String(childId),
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

    // 7. Generation label nodes
    const allGens = new Set<number>();
    individuals.forEach((ind) => allGens.add(generation.get(ind.id) || 0));
    const sortedGens = Array.from(allGens).sort((a, b) => a - b);

    // Find leftmost x position for label placement
    let minX = 0;
    nodePos.forEach((pos) => {
        if (pos.x < minX) minX = pos.x;
    });

    sortedGens.forEach((gen) => {
        const ordinal = gen + 1;
        const suffix =
            ordinal === 1 ? "st" : ordinal === 2 ? "nd" : ordinal === 3 ? "rd" : "th";
        const y = gen * ROW_HEIGHT;

        nodes.push({
            id: String(`gen-label-${gen}`),
            type: "default",
            position: { x: minX - 220, y: y + NODE_H / 2 - 18 },
            data: { label: `${ordinal}${suffix} Gen` },
            draggable: false,
            selectable: false,
            style: {
                background: "#ffffff",
                border: "1px solid rgba(122, 158, 126, 0.25)",
                borderRadius: "10px",
                color: "#7a9e7e",
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "6px 14px",
                width: "auto",
                textAlign: "center" as const,
                pointerEvents: "none" as const,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            },
        });
    });

    // 8. Deduplicate nodes and edges
    const uniqueNodes = Array.from(new Map(nodes.map(n => [String(n.id), n])).values());
    const uniqueEdges = Array.from(new Map(edges.map(e => [String(e.id), e])).values());

    return { nodes: uniqueNodes, edges: uniqueEdges };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const nodeTypes = { person: PersonNode, union: UnionNode };

interface ContextMenuState {
    x: number;
    y: number;
    nodeId: string;
    memberName: string;
}

export default function FamilyTree() {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [rawIndividuals, setRawIndividuals] = useState<Individual[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [editMember, setEditMember] = useState<Individual | null>(null);

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => {
            setNodes((nds) => {
                const updated = applyNodeChanges(changes, nds);
                const nodeMap = new Map(updated.map((n) => [n.id, n]));
                let neededUnionUpdate = false;

                const finalNodes = updated.map((n) => {
                    if (n.type === "union" && n.data?.partner1Id) {
                        const p1 = nodeMap.get(String(n.data.partner1Id));
                        const p2 = n.data.partner2Id && n.data.partner2Id !== "undefined"
                            ? nodeMap.get(String(n.data.partner2Id))
                            : undefined;

                        if (p1) {
                            const newX = p2
                                ? (p1.position.x + p2.position.x + NODE_W) / 2 - UNION_DOT / 2
                                : p1.position.x + NODE_W / 2 - UNION_DOT / 2;
                            const newY = p2
                                ? (p1.position.y + p2.position.y) / 2 + NODE_H / 2 - UNION_DOT / 2
                                : p1.position.y + NODE_H / 2 - UNION_DOT / 2;

                            if (Math.abs(n.position.x - newX) > 1 || Math.abs(n.position.y - newY) > 1) {
                                neededUnionUpdate = true;
                                return { ...n, position: { x: newX, y: newY } };
                            }
                        }
                    }
                    return n;
                });
                return neededUnionUpdate ? finalNodes : updated;
            });
        },
        []
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const fetchTree = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/individuals");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: Individual[] = await res.json();
            setRawIndividuals(data);
            const { nodes: n, edges: e } = buildButterflyLayout(data);
            setNodes((prevNodes) => {
                if (prevNodes.length === 0) return n;
                const prevMap = new Map(prevNodes.map(p => [p.id, p]));
                return n.map(newNode => {
                    const existing = prevMap.get(newNode.id);
                    if (existing) {
                        return { ...newNode, position: existing.position };
                    }
                    return newNode;
                });
            });
            setEdges(e);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTree();
    }, [fetchTree]);

    const handleNodeClick = useCallback(
        (event: React.MouseEvent, node: Node) => {
            if (node.type === "union" || node.id.startsWith("gen-label")) return;
            event.preventDefault();
            const data = node.data as Record<string, unknown>;
            setContextMenu({
                x: event.clientX,
                y: event.clientY,
                nodeId: node.id,
                memberName: `${data.firstName} ${data.lastName}`,
            });
        },
        []
    );

    const handlePaneClick = useCallback(() => {
        setContextMenu(null);
    }, []);

    const minimapStyle = useMemo(
        () => ({
            background: "#f0eeea",
            maskColor: "rgba(122, 158, 126, 0.1)",
        }),
        []
    );

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <span>Loading family tree…</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-icon">⚠️</div>
                <p>Could not load family data: {error}</p>
                <button className="retry-button" onClick={fetchTree}>Retry</button>
            </div>
        );
    }

    return (
        <>
            <div className="tree-actions">
                <button
                    className="action-btn action-btn-primary"
                    onClick={async () => {
                        const name = prompt("Enter name (First Last):");
                        if (!name) return;
                        const [first, ...rest] = name.trim().split(" ");
                        const last = rest.join(" ") || first;
                        const gender = prompt("Gender (male/female/other):", "male");
                        if (!gender) return;

                        await fetch("/api/individuals", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                firstName: first,
                                lastName: last,
                                gender,
                            }),
                        });
                        fetchTree();
                    }}
                >
                    <span className="action-icon">+</span> Add Person
                </button>
            </div>

            <div style={{ width: "100%", height: "100%" }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={handleNodeClick}
                    onPaneClick={handlePaneClick}
                    nodeTypes={nodeTypes}
                    nodesDraggable={true}
                    connectionLineType={ConnectionLineType.SmoothStep}
                    fitView
                    fitViewOptions={{ padding: 0.3 }}
                    minZoom={0.1}
                    maxZoom={2}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={24}
                        size={1}
                        color="rgba(0,0,0,0.06)"
                    />
                    <Controls />
                    <MiniMap
                        nodeColor={(node) => {
                            if (node.type === "union") return "#7a9e7e";
                            if (node.id.startsWith("gen-label")) return "#7a9e7e";
                            const gender = (node.data as Record<string, unknown>)?.gender;
                            switch (gender) {
                                case "male": return "#6b8cae";
                                case "female": return "#c9837a";
                                default: return "#9b8ec4";
                            }
                        }}
                        style={minimapStyle}
                        pannable
                        zoomable
                    />
                </ReactFlow>
            </div>

            {contextMenu && (
                <NodeContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    memberId={contextMenu.nodeId}
                    memberName={contextMenu.memberName}
                    onClose={() => setContextMenu(null)}
                    onAddRelative={() => {
                        setContextMenu(null);
                        fetchTree();
                    }}
                    onEdit={() => {
                        const ind = rawIndividuals.find((i) => i.id === contextMenu.nodeId);
                        if (ind) setEditMember(ind);
                        setContextMenu(null);
                    }}
                />
            )}

            <EditMemberModal
                isOpen={!!editMember}
                member={editMember}
                onClose={() => setEditMember(null)}
                onSuccess={() => {
                    setEditMember(null);
                    fetchTree();
                }}
            />
        </>
    );
}
