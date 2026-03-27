"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import FamilyTree from "./FamilyTree";
import ViewToggle, { type ViewMode } from "./ViewToggle";



const TimelineView = dynamic(() => import("./TimelineView"), { ssr: false });

export default function TreeViewWrapper() {
    const [mode, setMode] = useState<ViewMode>("2d");

    // For timeline: we need the individuals list — passed up from FamilyTree
    // We use a shared data bridge via window event or a simple callback prop
    const [timelineIndividuals, setTimelineIndividuals] = useState<import("@/types/familytree").Individual[]>([]);

    return (
        <div className="tree-view-wrapper">
            {mode === "2d" && (
                <FamilyTree
                    onDataLoaded={setTimelineIndividuals}
                    renderToggle={() => <ViewToggle mode={mode} onToggle={setMode} />}
                />
            )}
            {mode === "timeline" && (
                <TimelineView
                    individuals={timelineIndividuals}
                    renderToggle={() => <ViewToggle mode={mode} onToggle={setMode} />}
                />
            )}
        </div>
    );
}
