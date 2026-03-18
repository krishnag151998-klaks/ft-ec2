"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

import type { Individual, ContextMenuState } from "@/types/familytree";
import { build3DLayout, type Node3D, type Edge3D } from "@/lib/layout3DEngine";

import NodeContextMenu from "./NodeContextMenu";
import EditMemberModal from "./EditMemberModal";
import AddPersonButton from "./AddPersonButton";

// Dynamic import to avoid SSR issues with Three.js
const Tree3DCanvas = dynamic(() => import("./Tree3DCanvas"), {
    ssr: false,
    loading: () => (
        <div className="loading-container">
            <div className="loading-spinner" />
            <span>Loading 3D engine…</span>
        </div>
    ),
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FamilyTree3D() {
    const [nodes, setNodes] = useState<Node3D[]>([]);
    const [edges, setEdges] = useState<Edge3D[]>([]);
    const [generations, setGenerations] = useState<number[]>([]);
    const [rawIndividuals, setRawIndividuals] = useState<Individual[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [editMember, setEditMember] = useState<Individual | null>(null);

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
            const result = build3DLayout(data);
            setNodes(result.nodes);
            setEdges(result.edges);
            setGenerations(result.generations ?? []);
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
        (nodeId: string, event: React.MouseEvent) => {
            // Find node data
            const node = nodes.find((n) => n.id === nodeId);
            if (!node || node.type !== "person") return;

            event.preventDefault();
            setContextMenu({
                x: event.clientX,
                y: event.clientY,
                nodeId: node.id,
                memberName: `${node.data.firstName} ${node.data.lastName}`,
            });
        },
        [nodes]
    );

    const handleBackgroundClick = useCallback(() => {
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

            <Tree3DCanvas
                nodes={nodes}
                edges={edges}
                generations={generations}
                onNodeClick={handleNodeClick}
                onBackgroundClick={handleBackgroundClick}
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
