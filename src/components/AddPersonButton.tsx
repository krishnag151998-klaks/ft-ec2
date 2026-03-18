"use client";

import React, { useCallback, useState } from "react";

interface AddPersonButtonProps {
    onPersonAdded: () => void;
}

export default function AddPersonButton({ onPersonAdded }: AddPersonButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleClick = useCallback(async () => {
        const name = prompt("Enter name (First Last):");
        if (!name) return;
        const [first, ...rest] = name.trim().split(" ");
        const last = rest.join(" ") || first;
        const gender = prompt("Gender (male/female/other):", "male");
        if (!gender) return;

        setLoading(true);
        try {
            await fetch("/api/individuals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: first,
                    lastName: last,
                    gender,
                }),
            });
            onPersonAdded();
        } finally {
            setLoading(false);
        }
    }, [onPersonAdded]);

    return (
        <button
            className="action-btn action-btn-primary"
            onClick={handleClick}
            disabled={loading}
        >
            <span className="action-icon">+</span>
            {loading ? "Adding..." : "Add Person"}
        </button>
    );
}
