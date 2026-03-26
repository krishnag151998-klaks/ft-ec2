"use client";

import React, { useState, useRef, useEffect } from "react";
import type { Individual } from "@/types/familytree";

interface ExportMenuProps {
    individuals: Individual[];
}

export default function ExportMenu({ individuals }: ExportMenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const exportCSV = () => {
        const headers = ["id", "firstName", "lastName", "gender", "birthDate", "deathDate", "bio"];
        const rows = individuals.map((ind) => [
            ind.id,
            ind.firstName,
            ind.lastName,
            ind.gender,
            ind.birthDate ?? "",
            ind.deathDate ?? "",
            (ind.bio ?? "").replace(/,/g, ";").replace(/\n/g, " "),
        ]);
        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        download("family-tree.csv", "text/csv", csv);
        setOpen(false);
    };

    const exportJSON = () => {
        const json = JSON.stringify(individuals, null, 2);
        download("family-tree.json", "application/json", json);
        setOpen(false);
    };

    function download(filename: string, type: string, content: string) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="export-menu-wrapper" ref={ref}>
            <button
                className="action-btn action-btn-secondary"
                onClick={() => setOpen((o) => !o)}
                title="Export tree data"
                aria-haspopup="true"
                aria-expanded={open}
            >
                <span className="material-symbols-outlined action-icon" style={{ fontSize: '1.1rem' }}>download</span>
                Export
            </button>
            {open && (
                <div className="export-dropdown">
                    <button className="export-option" onClick={exportCSV}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>description</span> Export as CSV
                    </button>
                    <button className="export-option" onClick={exportJSON}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>data_object</span> Export as JSON
                    </button>
                </div>
            )}
        </div>
    );
}
