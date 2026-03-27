"use client";

import React, { useRef, useCallback, useEffect, useMemo } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import type { Graph3DData, Graph3DNode, Graph3DLink } from "@/lib/graph3dBuilder";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GENDER_COLORS: Record<string, string> = {
    male: "#5b8fb9",
    female: "#c97a6d",
    other: "#7fab82",
};

const NODE_SIZE = 8;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FamilyTree3DInnerProps {
    graphData: Graph3DData;
    width: number;
    height: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FamilyTree3DInner({
    graphData,
    width,
    height,
}: FamilyTree3DInnerProps) {
    const fgRef = useRef<any>(null);

    // Use generation for Y-axis positioning
    useEffect(() => {
        if (!fgRef.current) return;

        const fg = fgRef.current;

        // Add a vertical force based on generation
        fg.d3Force("charge")?.strength(-200);
        fg.d3Force("link")?.distance((link: any) => {
            return link.type === "spouse" ? 40 : 80;
        });

        // Fit camera after initial stabilization
        const timer = setTimeout(() => {
            fg.zoomToFit(600, 80);
        }, 1500);

        return () => clearTimeout(timer);
    }, [graphData]);

    // Custom node rendering — colored spheres with text sprites
    const nodeThreeObject = useCallback((node: any) => {
        const n = node as Graph3DNode;
        const group = new THREE.Group();

        // Sphere
        const color = GENDER_COLORS[n.gender] || GENDER_COLORS.other;
        const geometry = new THREE.SphereGeometry(NODE_SIZE, 24, 24);
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(color),
            shininess: 80,
            transparent: true,
            opacity: 0.92,
        });
        const sphere = new THREE.Mesh(geometry, material);
        group.add(sphere);

        // Glow ring
        const ringGeo = new THREE.RingGeometry(NODE_SIZE + 1, NODE_SIZE + 2.5, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        group.add(ring);

        // Text sprite
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = 512;
        canvas.height = 128;

        ctx.fillStyle = "transparent";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Name
        ctx.font = "bold 36px Inter, Arial, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.name, canvas.width / 2, 40);

        // Dates
        if (n.birthYear) {
            const dateStr = n.deathYear
                ? `${n.birthYear} — ${n.deathYear}`
                : `b. ${n.birthYear}`;
            ctx.font = "24px Inter, Arial, sans-serif";
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.fillText(dateStr, canvas.width / 2, 90);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const spriteMat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(60, 15, 1);
        sprite.position.set(0, NODE_SIZE + 12, 0);
        group.add(sprite);

        return group;
    }, []);

    // Custom link rendering
    const linkColor = useCallback((link: any) => {
        const l = link as Graph3DLink;
        return l.color || "#666666";
    }, []);

    const linkWidth = useCallback((link: any) => {
        const l = link as Graph3DLink;
        return l.type === "spouse" ? 2.5 : 1.5;
    }, []);

    // Node tooltip
    const nodeLabel = useCallback((node: any) => {
        const n = node as Graph3DNode;
        const dates = n.deathYear
            ? `${n.birthYear || "?"} — ${n.deathYear}`
            : n.birthYear
                ? `Born ${n.birthYear}`
                : "";

        return `
            <div style="
                background: rgba(20,20,25,0.92);
                backdrop-filter: blur(12px);
                padding: 12px 16px;
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,0.15);
                font-family: Inter, sans-serif;
                min-width: 160px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            ">
                <div style="font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 4px;">
                    ${n.name}
                </div>
                ${dates ? `<div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-bottom: 4px;">${dates}</div>` : ""}
                ${n.bio ? `<div style="font-size: 11px; color: rgba(255,255,255,0.5); line-height: 1.5;">${n.bio}</div>` : ""}
                <div style="margin-top: 6px; font-size: 10px; color: ${GENDER_COLORS[n.gender] || "#999"}; text-transform: capitalize; font-weight: 600;">
                    ${n.gender} · Generation ${n.generation + 1}
                </div>
            </div>
        `;
    }, []);

    // Link particles for spouse relationships
    const linkDirectionalParticles = useCallback((link: any) => {
        return (link as Graph3DLink).type === "spouse" ? 3 : 0;
    }, []);

    // Background color
    const bgColor = useMemo(() => {
        if (typeof document !== "undefined") {
            return document.documentElement.classList.contains("dark-theme")
                ? "#0a0a0f"
                : "#f4f5f3";
        }
        return "#f4f5f3";
    }, []);

    // Fix Y position based on generation
    const onNodeDrag = useCallback((_node: any) => {
        // Allow free dragging
    }, []);

    const dagMode = undefined; // free-form layout

    return (
        <ForceGraph3D
            ref={fgRef}
            graphData={graphData}
            width={width}
            height={height}
            backgroundColor={bgColor}
            nodeThreeObject={nodeThreeObject}
            nodeLabel={nodeLabel}
            linkColor={linkColor}
            linkWidth={linkWidth}
            linkOpacity={0.7}
            linkDirectionalParticles={linkDirectionalParticles}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.005}
            linkDirectionalParticleColor={linkColor}
            linkCurvature={0.1}
            onNodeDrag={onNodeDrag}
            enableNodeDrag={true}
            enableNavigationControls={true}
            showNavInfo={false}
            warmupTicks={80}
            cooldownTicks={100}
        />
    );
}
