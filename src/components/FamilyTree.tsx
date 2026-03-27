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
import { buildStandardLayout, NODE_W, NODE_H, UNION_DOT } from "@/lib/layoutEngine";

import TreeCanvas from "./TreeCanvas";
import AddPersonButton from "./AddPersonButton";
import NodeContextMenu from "./NodeContextMenu";
import EditMemberModal from "./EditMemberModal";
import FamilyTree3D from "./FamilyTree3D";
import SearchBar from "./SearchBar";
import ExportMenu from "./ExportMenu";
import PersonStatsPanel from "./PersonStatsPanel";
import RelationshipFinder from "./RelationshipFinder";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FamilyTreeProps {
    onDataLoaded?: (individuals: Individual[]) => void;
    renderToggle?: () => React.ReactNode;
}

export default function FamilyTree({ onDataLoaded, renderToggle }: FamilyTreeProps) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [rawIndividuals, setRawIndividuals] = useState<Individual[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [editMember, setEditMember] = useState<Individual | null>(null);
    const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");

    // New feature states
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIndividual, setSelectedIndividual] = useState<Individual | null>(null);
    const [showRelFinder, setShowRelFinder] = useState(false);

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
            onDataLoaded?.(data);
            const { nodes: n, edges: e } = buildStandardLayout(data);
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
    }, [onDataLoaded]);

    useEffect(() => {
        fetchTree();
    }, [fetchTree]);

    // -----------------------------------------------------------------------
    // Search filtering — dim non-matching nodes
    // -----------------------------------------------------------------------

    const filteredNodes = React.useMemo(() => {
        if (!searchQuery.trim()) return nodes;
        const q = searchQuery.toLowerCase();
        return nodes.map((node) => {
            if (node.type === "union" || node.id.startsWith("gen-label")) return node;
            const d = node.data as Record<string, unknown>;
            const name = `${d.firstName ?? ""} ${d.lastName ?? ""}`.toLowerCase();
            const matches = name.includes(q);
            return {
                ...node,
                style: {
                    ...node.style,
                    opacity: matches ? 1 : 0.2,
                    transition: "opacity 200ms ease",
                },
            };
        });
    }, [nodes, searchQuery]);

    // -----------------------------------------------------------------------
    // Interaction handlers
    // -----------------------------------------------------------------------

    const handleNodeClick = useCallback(
        (event: React.MouseEvent, node: Node) => {
            if (node.type === "union" || node.id.startsWith("gen-label")) return;
            event.preventDefault();
            const data = node.data as Record<string, unknown>;
            const ind = rawIndividuals.find((i) => i.id === node.id);
            if (ind) {
                setSelectedIndividual(ind);
            }
            setContextMenu({
                x: event.clientX,
                y: event.clientY,
                nodeId: node.id,
                memberName: `${data.firstName} ${data.lastName}`,
            });
        },
        [rawIndividuals]
    );

    const handlePaneClick = useCallback(() => {
        setContextMenu(null);
        setSelectedIndividual(null);
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
            {/* Toolbar */}
            <div className="tree-toolbar">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
                {renderToggle && renderToggle()}
                <div className="tree-toolbar-actions">
                    <AddPersonButton onPersonAdded={fetchTree} />
                    <button
                        className="action-btn action-btn-secondary"
                        onClick={() => setShowRelFinder(true)}
                        title="Find relationship between two people"
                    >
                        <span className="action-icon">🔗</span>
                        Find Rel
                    </button>
                    <ExportMenu individuals={rawIndividuals} />
                    <button
                        className={`action-btn ${viewMode === "3d" ? "action-btn-primary" : "action-btn-secondary"}`}
                        onClick={() => setViewMode(viewMode === "2d" ? "3d" : "2d")}
                        title={viewMode === "2d" ? "Switch to 3D view" : "Switch to 2D view"}
                    >
                        <span className="action-icon">{viewMode === "2d" ? "🧊" : "📋"}</span>
                        {viewMode === "2d" ? "3D View" : "2D View"}
                    </button>
                </div>
            </div>

            {viewMode === "3d" ? (
                <FamilyTree3D />
            ) : (
                <>
                    <TreeCanvas
                        nodes={filteredNodes}
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
            )}
            {/* Stats panel — slides in from right when a person is selected */}
            {selectedIndividual && (
                <PersonStatsPanel
                    individual={selectedIndividual}
                    allIndividuals={rawIndividuals}
                    onClose={() => setSelectedIndividual(null)}
                />
            )}

            {/* Relationship Finder modal */}
            {showRelFinder && (
                <RelationshipFinder
                    individuals={rawIndividuals}
                    onClose={() => setShowRelFinder(false)}
                />
            )}
        </>
    );
}
