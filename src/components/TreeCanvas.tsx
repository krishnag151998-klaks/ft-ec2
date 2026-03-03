"use client";

import React, { useMemo } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
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

// ---------------------------------------------------------------------------
// Node type registry (must be stable reference to avoid re-renders)
// ---------------------------------------------------------------------------

const nodeTypes = { person: PersonNode, union: UnionNode };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TreeCanvasProps {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onNodeClick: (event: React.MouseEvent, node: Node) => void;
    onPaneClick: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TreeCanvas({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodeClick,
    onPaneClick,
}: TreeCanvasProps) {
    const minimapStyle = useMemo(
        () => ({
            background: "#f0eeea",
            maskColor: "rgba(122, 158, 126, 0.1)",
        }),
        []
    );

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
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
    );
}
