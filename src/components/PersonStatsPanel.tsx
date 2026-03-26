"use client";

import React, { useMemo } from "react";
import type { Individual } from "@/types/familytree";

interface PersonStatsPanelProps {
    individual: Individual;
    allIndividuals: Individual[];
    onClose: () => void;
}

function calcAge(birthDate: string | null, deathDate: string | null): string {
    if (!birthDate) return "Unknown";
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    const years = end.getFullYear() - birth.getFullYear();
    return deathDate ? `${years} yrs (deceased)` : `${years} yrs old`;
}

export default function PersonStatsPanel({ individual, allIndividuals, onClose }: PersonStatsPanelProps) {
    const stats = useMemo(() => {
        const allUnions = [...individual.unionsAsPartner1, ...individual.unionsAsPartner2];
        const childCount = allUnions.reduce((sum, u) => sum + (u.children?.length ?? 0), 0);
        const partnerIds = new Set<string>();
        for (const u of allUnions) {
            if (u.partner1Id !== individual.id && u.partner1Id) partnerIds.add(u.partner1Id);
            if (u.partner2Id && u.partner2Id !== individual.id) partnerIds.add(u.partner2Id);
        }
        const partners = Array.from(partnerIds).map((pid) => allIndividuals.find((i) => i.id === pid)).filter(Boolean) as Individual[];

        const parentUnion = individual.childOf?.[0]?.union;
        const parents: Individual[] = [];
        if (parentUnion) {
            const p1 = allIndividuals.find((i) => i.id === parentUnion.partner1Id);
            const p2 = parentUnion.partner2Id ? allIndividuals.find((i) => i.id === parentUnion.partner2Id) : null;
            if (p1) parents.push(p1);
            if (p2) parents.push(p2);
        }

        return { childCount, partners, parents, unionCount: allUnions.length };
    }, [individual, allIndividuals]);

    const genderColor = individual.gender === "male" ? "var(--accent-male)" : individual.gender === "female" ? "var(--accent-female)" : "var(--accent-other)";
    const genderIcon = individual.gender === "male" ? "person" : individual.gender === "female" ? "person_4" : "person_3";

    return (
        <div className="stats-panel">
            <div className="stats-panel-header" style={{ borderTopColor: genderColor }}>
                <div className="stats-avatar" style={{ color: genderColor }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>{genderIcon}</span>
                </div>
                <div className="stats-name-block">
                    <h3 className="stats-full-name">
                        {individual.firstName} {individual.lastName}
                        {individual.deathDate && <span className="deceased-badge">†</span>}
                    </h3>
                    <span className="stats-gender">{individual.gender}</span>
                </div>
                <button className="stats-close" onClick={onClose} aria-label="Close panel">
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>close</span>
                </button>
            </div>

            <div className="stats-body">
                <div className="stats-grid">
                    <div className="stats-item">
                        <span className="stats-label">Age / Lifespan</span>
                        <span className="stats-value">{calcAge(individual.birthDate, individual.deathDate)}</span>
                    </div>
                    <div className="stats-item">
                        <span className="stats-label">Children</span>
                        <span className="stats-value">{stats.childCount}</span>
                    </div>
                    <div className="stats-item">
                        <span className="stats-label">Unions</span>
                        <span className="stats-value">{stats.unionCount}</span>
                    </div>
                    <div className="stats-item">
                        <span className="stats-label">Born</span>
                        <span className="stats-value">{individual.birthDate ? new Date(individual.birthDate).getFullYear() : "—"}</span>
                    </div>
                    {individual.deathDate && (
                        <div className="stats-item">
                            <span className="stats-label">Died</span>
                            <span className="stats-value">{new Date(individual.deathDate).getFullYear()}</span>
                        </div>
                    )}
                </div>

                {stats.partners.length > 0 && (
                    <div className="stats-section">
                        <span className="stats-section-label">Partners</span>
                        <div className="stats-people-list">
                            {stats.partners.map((p) => (
                                <span key={p.id} className="stats-person-chip">
                                    {p.firstName} {p.lastName}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {stats.parents.length > 0 && (
                    <div className="stats-section">
                        <span className="stats-section-label">Parents</span>
                        <div className="stats-people-list">
                            {stats.parents.map((p) => (
                                <span key={p.id} className="stats-person-chip">
                                    {p.firstName} {p.lastName}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {individual.bio && (
                    <div className="stats-section">
                        <span className="stats-section-label">Bio</span>
                        <p className="stats-bio">{individual.bio}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
