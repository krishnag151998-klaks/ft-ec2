"use client";

import React, { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import type { Edge3D, Node3D } from "@/lib/layout3DEngine";

interface ConnectionLine3DProps {
    edge: Edge3D;
    nodeMap: Map<string, Node3D>;
}

export default function ConnectionLine3D({ edge, nodeMap }: ConnectionLine3DProps) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    const points = useMemo(() => {
        if (!sourceNode || !targetNode) return null;

        const sp = sourceNode.position;
        const tp = targetNode.position;

        if (edge.type === "spouse") {
            // Direct line for spouse connections
            return [
                new THREE.Vector3(sp.x, sp.y, sp.z),
                new THREE.Vector3(tp.x, tp.y, tp.z),
            ];
        }

        // Curved line for parent-child connections
        const midY = (sp.y + tp.y) / 2;
        const midX = (sp.x + tp.x) / 2;
        const midZ = (sp.z + tp.z) / 2;

        return [
            new THREE.Vector3(sp.x, sp.y, sp.z),
            new THREE.Vector3(sp.x, midY + 0.5, sp.z),
            new THREE.Vector3(midX, midY, midZ),
            new THREE.Vector3(tp.x, midY - 0.5, tp.z),
            new THREE.Vector3(tp.x, tp.y, tp.z),
        ];
    }, [sourceNode, targetNode, edge.type]);

    if (!points) return null;

    return (
        <Line
            points={points}
            color={edge.color}
            lineWidth={edge.type === "spouse" ? 2 : 1.5}
            dashed={edge.dashed}
            dashSize={edge.dashed ? 0.3 : undefined}
            gapSize={edge.dashed ? 0.15 : undefined}
            transparent
            opacity={0.7}
        />
    );
}
