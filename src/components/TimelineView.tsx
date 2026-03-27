"use client";

import React, { useMemo } from "react";
import type { Individual } from "@/types/familytree";

interface TimelineViewProps {
    individuals: Individual[];
    renderToggle?: () => React.ReactNode;
}

interface TimelineEvent {
    year: number;
    type: "birth" | "death" | "union";
    label: string;
    personName: string;
}

export default function TimelineView({ individuals, renderToggle }: TimelineViewProps) {
    const events = useMemo<TimelineEvent[]>(() => {
        const evts: TimelineEvent[] = [];
        for (const ind of individuals) {
            if (ind.birthDate) {
                evts.push({
                    year: new Date(ind.birthDate).getFullYear(),
                    type: "birth",
                    label: `Born`,
                    personName: `${ind.firstName} ${ind.lastName}`,
                });
            }
            if (ind.deathDate) {
                evts.push({
                    year: new Date(ind.deathDate).getFullYear(),
                    type: "death",
                    label: `Died`,
                    personName: `${ind.firstName} ${ind.lastName}`,
                });
            }
            for (const u of ind.unionsAsPartner1) {
                const partner = u.partner2;
                if (partner && ind.birthDate) {
                    // Estimate union year as a midpoint of partners' births + 25
                    const y1 = new Date(ind.birthDate).getFullYear();
                    const y2 = partner.birthDate ? new Date(partner.birthDate).getFullYear() : y1;
                    evts.push({
                        year: Math.round((y1 + y2) / 2) + 25,
                        type: "union",
                        label: u.unionType === "marriage" ? "Married" : u.unionType,
                        personName: `${ind.firstName} ${ind.lastName} & ${partner.firstName} ${partner.lastName}`,
                    });
                }
            }
        }
        return evts.sort((a, b) => a.year - b.year);
    }, [individuals]);

    if (events.length === 0) {
        return (
            <div className="timeline-empty">
                <span>📅</span>
                <p>No date information available to build a timeline.</p>
                <p className="timeline-empty-sub">Add birth or death dates to family members to see them here.</p>
            </div>
        );
    }

    const minYear = events[0].year;
    const maxYear = events[events.length - 1].year;
    const range = Math.max(maxYear - minYear, 1);

    const typeIcon = (t: string) => t === "birth" ? "🟢" : t === "death" ? "🔴" : "💍";
    const typeColor = (t: string) =>
        t === "birth" ? "var(--accent-success)" : t === "death" ? "var(--accent-danger)" : "var(--accent-secondary)";

    return (
        <div className="timeline-container">
            <div className="timeline-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className="timeline-title">📅 Family Timeline</span>
                    {renderToggle && renderToggle()}
                </div>
                <div className="timeline-legend">
                    <span>🟢 Birth</span>
                    <span>🔴 Death</span>
                    <span>💍 Union</span>
                </div>
            </div>
            <div className="timeline-scroll">
                <div className="timeline-track">
                    {/* Year axis */}
                    <div className="timeline-axis" />

                    {events.map((evt, i) => {
                        const pct = ((evt.year - minYear) / range) * 100;
                        const isAbove = i % 2 === 0;
                        return (
                            <div
                                key={i}
                                className={`timeline-event ${isAbove ? "above" : "below"}`}
                                style={{ left: `${pct}%` }}
                            >
                                <div className="timeline-dot" style={{ background: typeColor(evt.type) }} />
                                <div className="timeline-card">
                                    <span className="timeline-icon">{typeIcon(evt.type)}</span>
                                    <div>
                                        <div className="timeline-year">{evt.year}</div>
                                        <div className="timeline-card-label">{evt.label}</div>
                                        <div className="timeline-person">{evt.personName}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
