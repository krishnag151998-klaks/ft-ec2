"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface PersonCard3DProps {
    id: string;
    position: [number, number, number];
    firstName: string;
    lastName: string;
    gender: string;
    birthDate?: string | null;
    deathDate?: string | null;
    bio?: string | null;
    onClick?: (id: string, event: React.MouseEvent) => void;
}

function formatYear(dateStr?: string | null): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.getFullYear().toString();
}

function getGenderEmoji(gender: string): string {
    switch (gender) {
        case "male": return "👤";
        case "female": return "👩";
        default: return "🧑";
    }
}

function getGenderColor(gender: string): string {
    switch (gender) {
        case "male": return "#7b9dc4";
        case "female": return "#c9938a";
        default: return "#a699c8";
    }
}

export default function PersonCard3D({
    id,
    position,
    firstName,
    lastName,
    gender,
    birthDate,
    deathDate,
    bio,
    onClick,
}: PersonCard3DProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = React.useState(false);

    const genderColor = useMemo(() => new THREE.Color(getGenderColor(gender)), [gender]);
    const birth = formatYear(birthDate);
    const death = formatYear(deathDate);
    const dateStr = death ? `${birth} — ${death}` : birth ? `b. ${birth}` : "";

    useFrame((_, delta) => {
        if (meshRef.current) {
            const targetScale = hovered ? 1.08 : 1;
            meshRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                delta * 8
            );
        }
        if (glowRef.current) {
            const mat = glowRef.current.material as THREE.MeshBasicMaterial;
            const targetOpacity = hovered ? 0.35 : 0.12;
            mat.opacity += (targetOpacity - mat.opacity) * delta * 8;
        }
    });

    return (
        <group position={position}>
            {/* Glow ring */}
            <mesh ref={glowRef} position={[0, 0, -0.05]} rotation={[0, 0, 0]}>
                <ringGeometry args={[1.2, 1.6, 32]} />
                <meshBasicMaterial
                    color={genderColor}
                    transparent
                    opacity={0.12}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Card body */}
            <mesh
                ref={meshRef}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
            >
                <boxGeometry args={[2.2, 1.4, 0.08]} />
                <meshStandardMaterial
                    color="#ffffff"
                    roughness={0.3}
                    metalness={0.05}
                    transparent
                    opacity={0.95}
                />
            </mesh>

            {/* Top accent strip */}
            <mesh position={[0, 0.68, 0.041]}>
                <boxGeometry args={[2.2, 0.05, 0.001]} />
                <meshStandardMaterial color={genderColor} />
            </mesh>

            {/* HTML overlay */}
            <Html
                center
                distanceFactor={6}
                style={{
                    pointerEvents: "auto",
                    cursor: "pointer",
                    userSelect: "none",
                }}
                transform
                occlude={false}
            >
                <div
                    className="person-card-3d"
                    data-gender={gender}
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick?.(id, e);
                    }}
                    onPointerEnter={() => setHovered(true)}
                    onPointerLeave={() => setHovered(false)}
                >
                    <div className="card3d-header">
                        <div className={`card3d-avatar ${gender}`}>
                            {getGenderEmoji(gender)}
                        </div>
                        <div className="card3d-info">
                            <div className="card3d-name">{firstName} {lastName}</div>
                            {dateStr && <div className="card3d-dates">{dateStr}</div>}
                        </div>
                    </div>
                    {bio && <div className="card3d-bio">{bio}</div>}
                </div>
            </Html>
        </group>
    );
}
