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

function getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getGenderEmoji(gender: string): string {
    switch (gender) {
        case "male":
            return "👤";
        case "female":
            return "👩";
        default:
            return "🧑";
    }
}

function PersonNodeComponent({ data }: NodeProps) {
    const d = data as unknown as PersonNodeData;
    const birth = formatDate(d.birthDate);
    const death = formatDate(d.deathDate);
    const dateStr = death ? `${birth} — ${death}` : birth ? `b. ${birth}` : "";

    return (
        <div className={`person-node ${d.gender}`}>
            <Handle type="target" position={Position.Top} />

            <div className="node-header">
                <div className="avatar">{getGenderEmoji(d.gender)}</div>
                <div className="name">
                    {d.firstName} {d.lastName}
                </div>
            </div>

            {dateStr && <div className="dates">{dateStr}</div>}
            {d.bio && <div className="bio">{d.bio}</div>}

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}

export default memo(PersonNodeComponent);
