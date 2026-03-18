"use client";

import React, { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Environment } from "@react-three/drei";

import PersonCard3D from "./PersonCard3D";
import ConnectionLine3D from "./ConnectionLine3D";
import GenerationPlatform from "./GenerationPlatform";
import type { Node3D, Edge3D } from "@/lib/layout3DEngine";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GENERATION_HEIGHT = 4;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Tree3DCanvasProps {
    nodes: Node3D[];
    edges: Edge3D[];
    generations: number[];
    onNodeClick?: (id: string, event: React.MouseEvent) => void;
    onBackgroundClick?: () => void;
}

// ---------------------------------------------------------------------------
// Scene content (inside Canvas)
// ---------------------------------------------------------------------------

function SceneContent({
    nodes,
    edges,
    generations,
    onNodeClick,
    onBackgroundClick,
}: Tree3DCanvasProps) {
    const nodeMap = useMemo(() => {
        const map = new Map<string, Node3D>();
        nodes.forEach((n) => map.set(n.id, n));
        return map;
    }, [nodes]);

    const personNodes = useMemo(
        () => nodes.filter((n) => n.type === "person"),
        [nodes]
    );

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <directionalLight
                position={[10, 15, 10]}
                intensity={0.8}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
            />
            <directionalLight position={[-5, 10, -5]} intensity={0.3} />
            <pointLight position={[0, 5, 0]} intensity={0.3} color="#8b9d88" />

            {/* Environment */}
            <Stars
                radius={100}
                depth={50}
                count={2000}
                factor={3}
                saturation={0.1}
                fade
                speed={0.5}
            />
            <Environment preset="city" />

            {/* Controls */}
            <OrbitControls
                enableDamping
                dampingFactor={0.08}
                minDistance={3}
                maxDistance={60}
                maxPolarAngle={Math.PI * 0.85}
                makeDefault
            />

            {/* Click handler for background */}
            <mesh
                position={[0, -20, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                onClick={(e) => {
                    e.stopPropagation();
                    onBackgroundClick?.();
                }}
                visible={false}
            >
                <planeGeometry args={[200, 200]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* Generation platforms */}
            {generations.map((gen) => (
                <GenerationPlatform
                    key={`gen-${gen}`}
                    generation={gen}
                    y={-gen * GENERATION_HEIGHT}
                />
            ))}

            {/* Connection lines */}
            {edges.map((edge) => (
                <ConnectionLine3D
                    key={edge.id}
                    edge={edge}
                    nodeMap={nodeMap}
                />
            ))}

            {/* Person cards */}
            {personNodes.map((node) => (
                <PersonCard3D
                    key={node.id}
                    id={node.id}
                    position={[node.position.x, node.position.y, node.position.z]}
                    firstName={node.data.firstName || ""}
                    lastName={node.data.lastName || ""}
                    gender={node.data.gender || "other"}
                    birthDate={node.data.birthDate}
                    deathDate={node.data.deathDate}
                    bio={node.data.bio}
                    onClick={onNodeClick}
                />
            ))}
        </>
    );
}

// ---------------------------------------------------------------------------
// Loading fallback
// ---------------------------------------------------------------------------

function LoadingFallback() {
    return (
        <mesh>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial
                color="#8b9d88"
                wireframe
                transparent
                opacity={0.5}
            />
        </mesh>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Tree3DCanvas({
    nodes,
    edges,
    generations,
    onNodeClick,
    onBackgroundClick,
}: Tree3DCanvasProps) {
    return (
        <div className="tree-3d-canvas-container">
            <Canvas
                camera={{
                    position: [0, 8, 20],
                    fov: 50,
                    near: 0.1,
                    far: 200,
                }}
                shadows
                dpr={[1, 2]}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance",
                }}
                style={{ background: "transparent" }}
            >
                <Suspense fallback={<LoadingFallback />}>
                    <SceneContent
                        nodes={nodes}
                        edges={edges}
                        generations={generations}
                        onNodeClick={onNodeClick}
                        onBackgroundClick={onBackgroundClick}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
