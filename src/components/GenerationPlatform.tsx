"use client";

import React from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";

interface GenerationPlatformProps {
    generation: number;
    y: number;
}

export default function GenerationPlatform({ generation, y }: GenerationPlatformProps) {
    const ordinal = generation + 1;
    const suffix =
        ordinal === 1 ? "st" : ordinal === 2 ? "nd" : ordinal === 3 ? "rd" : "th";
    const label = `${ordinal}${suffix} Generation`;

    return (
        <group position={[0, y - 0.75, 0]}>
            {/* Platform disc */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[18, 64]} />
                <meshStandardMaterial
                    color="#8b9d88"
                    transparent
                    opacity={0.04}
                    side={THREE.DoubleSide}
                    roughness={0.8}
                />
            </mesh>

            {/* Ring border */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[17.8, 18, 64]} />
                <meshBasicMaterial
                    color="#8b9d88"
                    transparent
                    opacity={0.12}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Label */}
            <Text
                position={[-17, 0.1, 0]}
                fontSize={0.4}
                color="#8b9d88"
                anchorX="left"
                anchorY="middle"
                font="/fonts/Inter-Regular.woff"
                fillOpacity={0.5}
            >
                {label}
            </Text>
        </group>
    );
}
