"use client";

import React, { useState } from "react";

interface NodeContextMenuProps {
    x: number;
    y: number;
    memberName: string;
    memberId: string;
    onClose: () => void;
    onAddRelative: (action: string, newPerson: NewPersonData) => void;
    onEdit: () => void;
}

interface NewPersonData {
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: string;
    bio: string;
}

type ActionType = "add_spouse" | "add_child" | "add_parent" | null;

export default function NodeContextMenu({
    x,
    y,
    memberName,
    memberId,
    onClose,
    onAddRelative,
    onEdit,
}: NodeContextMenuProps) {
    const [action, setAction] = useState<ActionType>(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [gender, setGender] = useState("male");
    const [bio, setBio] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!action) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/add-relative", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    memberId,
                    action,
                    newPerson: {
                        firstName,
                        lastName,
                        birthDate: birthDate || null,
                        gender,
                        bio: bio || null,
                    },
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to add relative");
            }

            onAddRelative(action, { firstName, lastName, birthDate, gender, bio });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    const actionLabels: Record<string, string> = {
        add_parent: "Add Parent",
        add_spouse: "Add Spouse",
        add_child: "Add Child",
    };

    // Position the menu so it doesn't overflow viewport
    const menuStyle: React.CSSProperties = {
        position: "fixed",
        left: Math.min(x, window.innerWidth - 320),
        top: Math.min(y, window.innerHeight - 400),
        zIndex: 200,
    };

    return (
        <>
            <div className="context-overlay" onClick={onClose} />
            <div className="context-menu" style={menuStyle}>
                {!action ? (
                    <>
                        <div className="context-header">{memberName}</div>
                        <button
                            className="context-item"
                            onClick={() => setAction("add_parent")}
                        >
                            <span className="context-icon">👆</span> Add Parent
                        </button>
                        <button
                            className="context-item"
                            onClick={() => setAction("add_spouse")}
                        >
                            <span className="context-icon">💍</span> Add Spouse
                        </button>
                        <button
                            className="context-item"
                            onClick={() => setAction("add_child")}
                        >
                            <span className="context-icon">👶</span> Add Child
                        </button>
                        <div className="context-divider" />
                        <button className="context-item" onClick={onEdit}>
                            <span className="context-icon">✏️</span> Edit Details
                        </button>
                    </>
                ) : (
                    <form onSubmit={handleSubmit} className="context-form">
                        <div className="context-header">
                            {actionLabels[action]}
                            <button
                                type="button"
                                className="context-back"
                                onClick={() => { setAction(null); setError(null); }}
                            >
                                ←
                            </button>
                        </div>

                        <div className="form-field">
                            <label htmlFor={`ctx-fn-${memberId}`}>First Name *</label>
                            <input
                                id={`ctx-fn-${memberId}`}
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                autoFocus
                                placeholder="First name"
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor={`ctx-ln-${memberId}`}>Last Name *</label>
                            <input
                                id={`ctx-ln-${memberId}`}
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                placeholder="Last name"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-field">
                                <label htmlFor={`ctx-bd-${memberId}`}>Birth Date</label>
                                <input
                                    id={`ctx-bd-${memberId}`}
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                />
                            </div>
                            <div className="form-field">
                                <label htmlFor={`ctx-g-${memberId}`}>Gender *</label>
                                <select
                                    id={`ctx-g-${memberId}`}
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        {error && <div className="form-error">{error}</div>}

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading}
                            >
                                {loading ? "Adding..." : actionLabels[action]}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </>
    );
}
