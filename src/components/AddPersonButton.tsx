"use client";

import React, { useState } from "react";

interface AddPersonButtonProps {
    onPersonAdded: () => void;
}

export default function AddPersonButton({ onPersonAdded }: AddPersonButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [gender, setGender] = useState("male");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpen = () => {
        setFirstName("");
        setLastName("");
        setGender("male");
        setError(null);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName.trim()) {
            setError("First name is required.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/individuals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: firstName.trim(),
                    lastName: lastName.trim() || undefined,
                    gender,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to add person.");
            }
            onPersonAdded();
            handleClose();
        } catch (err: any) {
            setError(err.message || "Unknown error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                className="action-btn action-btn-primary"
                onClick={handleOpen}
                disabled={loading}
            >
                <span className="action-icon">👤</span>
                Add Person
            </button>

            {isModalOpen && (
                <div className="modal-overlay" onClick={handleClose}>
                    <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Person</h2>
                            <button className="modal-close" onClick={handleClose}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            {error && <div className="si-error-banner">{error}</div>}
                            <div className="form-row">
                                <div className="form-field">
                                    <label htmlFor="add-firstName">First Name *</label>
                                    <input
                                        id="add-firstName"
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                        autoFocus
                                        placeholder="e.g. John"
                                    />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="add-lastName">Last Name</label>
                                    <input
                                        id="add-lastName"
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="e.g. Doe"
                                    />
                                </div>
                            </div>
                            <div className="form-field">
                                <label htmlFor="add-gender">Gender</label>
                                <select
                                    id="add-gender"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={handleClose} disabled={loading}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? "Adding..." : "Add Person"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
