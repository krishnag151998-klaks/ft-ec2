"use client";

import React, { useState, useEffect } from "react";

interface EditMemberModalProps {
    isOpen: boolean;
    member: {
        id: string;
        firstName: string;
        lastName: string;
        birthDate?: string | null;
        deathDate?: string | null;
        gender: string;
        bio?: string | null;
    } | null;
    onClose: () => void;
    onSuccess: () => void;
}

function formatDateForInput(dateStr?: string | null): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toISOString().split("T")[0];
}

export default function EditMemberModal({ isOpen, member, onClose, onSuccess }: EditMemberModalProps) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [deathDate, setDeathDate] = useState("");
    const [gender, setGender] = useState("male");
    const [bio, setBio] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (member) {
            setFirstName(member.firstName);
            setLastName(member.lastName);
            setBirthDate(formatDateForInput(member.birthDate));
            setDeathDate(formatDateForInput(member.deathDate));
            setGender(member.gender);
            setBio(member.bio || "");
            setError(null);
        }
    }, [member]);

    if (!isOpen || !member) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/individuals/${member.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    birthDate: birthDate || null,
                    deathDate: deathDate || null,
                    gender,
                    bio: bio || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update member");
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Delete ${member.firstName} ${member.lastName}? This will also remove all their relationships.`)) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/individuals/${member.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete member");
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Member</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSave} className="modal-form">
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="edit-firstName">First Name *</label>
                            <input
                                id="edit-firstName"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="edit-lastName">Last Name *</label>
                            <input
                                id="edit-lastName"
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="edit-birthDate">Birth Date</label>
                            <input
                                id="edit-birthDate"
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="edit-deathDate">Death Date</label>
                            <input
                                id="edit-deathDate"
                                type="date"
                                value={deathDate}
                                onChange={(e) => setDeathDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="edit-gender">Gender *</label>
                            <select
                                id="edit-gender"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="form-field" />
                    </div>

                    <div className="form-field">
                        <label htmlFor="edit-bio">Bio</label>
                        <textarea
                            id="edit-bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {error && <div className="form-error">{error}</div>}

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-danger"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            Delete
                        </button>
                        <div className="form-actions-right">
                            <button type="button" className="btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
