"use client";

import React from "react";

export type ViewMode = "2d" | "timeline";

interface ViewToggleProps {
    mode: ViewMode;
    onToggle: (mode: ViewMode) => void;
}

export default function ViewToggle({ mode, onToggle }: ViewToggleProps) {
    return (
        <div className="view-toggle-container">
            <button
                className={`view-toggle-btn ${mode === "2d" ? "active" : ""}`}
                onClick={() => onToggle("2d")}
                title="2D View"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
                <span>2D</span>
            </button>

            <button
                className={`view-toggle-btn ${mode === "timeline" ? "active" : ""}`}
                onClick={() => onToggle("timeline")}
                title="Timeline View"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <circle cx="7" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="17" cy="12" r="2" />
                    <line x1="7" y1="8" x2="7" y2="10" />
                    <line x1="12" y1="8" x2="12" y2="10" />
                    <line x1="17" y1="8" x2="17" y2="10" />
                </svg>
                <span>Timeline</span>
            </button>
        </div>
    );
}
