"use client";

import React, { useState } from "react";
import type { Individual } from "@/types/familytree";

interface RelationshipFinderProps {
    individuals: Individual[];
    onClose: () => void;
}

interface PathStep {
    name: string;
    link: string;
}

export default function RelationshipFinder({ individuals, onClose }: RelationshipFinderProps) {
    const [fromId, setFromId] = useState("");
    const [toId, setToId] = useState("");
    const [result, setResult] = useState<PathStep[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFind = async () => {
        if (!fromId || !toId) return;
        if (fromId === toId) {
            setResult([]);
            setError("Same person selected on both sides.");
            return;
        }
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetch(`/api/relationship?from=${fromId}&to=${toId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Request failed");
            setResult(data.path ?? null);
            if (!data.path) setError("No relationship path found between these two people.");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    const sorted = [...individuals].sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-panel rel-finder-panel" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>🔗 Find Relationship</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-form">
                    <div className="form-row">
                        <div className="form-field">
                            <label>From person</label>
                            <select value={fromId} onChange={(e) => setFromId(e.target.value)}>
                                <option value="">Select…</option>
                                {sorted.map((ind) => (
                                    <option key={ind.id} value={ind.id}>
                                        {ind.firstName} {ind.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>To person</label>
                            <select value={toId} onChange={(e) => setToId(e.target.value)}>
                                <option value="">Select…</option>
                                {sorted.map((ind) => (
                                    <option key={ind.id} value={ind.id}>
                                        {ind.firstName} {ind.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-actions">
                        <button className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button
                            className="btn-primary"
                            onClick={handleFind}
                            disabled={!fromId || !toId || loading}
                        >
                            {loading ? "Searching…" : "Find Relationship"}
                        </button>
                    </div>

                    {error && <div className="form-error">{error}</div>}

                    {result && result.length > 0 && (
                        <div className="rel-path-result">
                            <div className="rel-path-title">Relationship Path</div>
                            <div className="rel-path-steps">
                                {result.map((step, i) => (
                                    <React.Fragment key={i}>
                                        <div className="rel-path-node">{step.name}</div>
                                        {i < result.length - 1 && (
                                            <div className="rel-path-link">
                                                <span className="rel-path-arrow">↓</span>
                                                <span className="rel-path-link-label">{step.link}</span>
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
