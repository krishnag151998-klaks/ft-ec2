"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface PersonNodeData {
    firstName: string;
    lastName: string;
    gender: string;
    birthDate?: string | null;
    deathDate?: string | null;
    bio?: string | null;
    [key: string]: unknown;
}

function formatDate(dateStr?: string | null): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.getFullYear().toString();
}

function getGenderIcon(gender: string): string {
    switch (gender) {
        case "male":
            return "person";
        case "female":
            return "person_4";
        default:
            return "person_3";
    }
}

function PersonNodeComponent({ data }: NodeProps) {
    const d = data as unknown as PersonNodeData;
    const birth = formatDate(d.birthDate);
    const death = formatDate(d.deathDate);
    const dateStr = death ? `${birth} — ${death}` : birth ? `b. ${birth}` : "";
    const isDeceased = !!d.deathDate;

    return (
        <div className={`person-node ${d.gender}${isDeceased ? " person-node--deceased" : ""}`}>
            <Handle type="target" position={Position.Top} id="top" />
            <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />

            <div className="node-header">
                <div className="avatar">
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>{getGenderIcon(d.gender)}</span>
                </div>
                <div className="name">
                    {d.firstName} {d.lastName}
                    {isDeceased && <span className="deceased-marker" title="Deceased">†</span>}
                </div>
            </div>

            {dateStr && <div className="dates">{dateStr}</div>}
            {d.bio && <div className="bio">{d.bio}</div>}

            <Handle type="source" position={Position.Bottom} id="bottom" />
        </div>
    );
}

export default memo(PersonNodeComponent);
