"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { Individual } from "@/types/familytree";
import { buildGraph3DData, type Graph3DData } from "@/lib/graph3dBuilder";

// Dynamically import the 3D renderer (no SSR — Three.js requires browser APIs)
const FamilyTree3DInner = dynamic(() => import("./FamilyTree3DInner"), {
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
    const [graphData, setGraphData] = useState<Graph3DData>({
        nodes: [],
        links: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/individuals");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: Individual[] = await res.json();
            const graph = buildGraph3DData(data);
            setGraphData(graph);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Track container size
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({
                    width: rect.width || 800,
                    height: rect.height || 600,
                });
            }
        };

        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

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
                <button className="retry-button" onClick={fetchData}>
                    Retry
                </button>
            </div>
        );
    }

    if (graphData.nodes.length === 0) {
        return (
            <div className="loading-container">
                <p style={{ color: "var(--text-secondary)" }}>
                    No family members yet. Add someone to see the 3D tree!
                </p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="tree-3d-container">
            <FamilyTree3DInner
                graphData={graphData}
                width={dimensions.width}
                height={dimensions.height}
            />
            <div className="tree-3d-legend">
                <div className="legend-item">
                    <span className="legend-dot" style={{ background: "#5b8fb9" }} />
                    Male
                </div>
                <div className="legend-item">
                    <span className="legend-dot" style={{ background: "#c97a6d" }} />
                    Female
                </div>
                <div className="legend-item">
                    <span className="legend-dot" style={{ background: "#7fab82" }} />
                    Other
                </div>
                <div className="legend-divider" />
                <div className="legend-item">
                    <span className="legend-line" style={{ background: "#5cb87a" }} />
                    Spouse
                </div>
                <div className="legend-item">
                    <span className="legend-line" style={{ background: "#999" }} />
                    Parent→Child
                </div>
            </div>
        </div>
    );
}
