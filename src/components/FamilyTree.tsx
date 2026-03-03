"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
    applyNodeChanges,
    applyEdgeChanges,
    type Node,
    type Edge,
    type NodeChange,
    type EdgeChange,
} from "@xyflow/react";

import type { Individual, ContextMenuState } from "@/types/familytree";
import { buildButterflyLayout, NODE_W, NODE_H, UNION_DOT } from "@/lib/layoutEngine";

import TreeCanvas from "./TreeCanvas";
import AddPersonButton from "./AddPersonButton";
import NodeContextMenu from "./NodeContextMenu";
import EditMemberModal from "./EditMemberModal";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FamilyTree() {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [rawIndividuals, setRawIndividuals] = useState<Individual[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [editMember, setEditMember] = useState<Individual | null>(null);

    // -----------------------------------------------------------------------
    // Node / Edge change handlers
    // -----------------------------------------------------------------------

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

    // -----------------------------------------------------------------------
    // Data fetching
    // -----------------------------------------------------------------------

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

    // -----------------------------------------------------------------------
    // Interaction handlers
    // -----------------------------------------------------------------------

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

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

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
            <AddPersonButton onPersonAdded={fetchTree} />

            <TreeCanvas
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                onPaneClick={handlePaneClick}
            />

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
