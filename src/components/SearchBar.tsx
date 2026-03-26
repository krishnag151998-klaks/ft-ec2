"use client";

import React, { useRef } from "react";

interface SearchBarProps {
    value: string;
    onChange: (query: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="search-bar-wrapper">
            <span className="material-symbols-outlined search-icon" style={{ fontSize: '1.1rem' }}>search</span>
            <input
                ref={inputRef}
                className="search-bar-input"
                type="text"
                placeholder="Search people…"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-label="Search family members"
            />
            {value && (
                <button
                    className="search-clear-btn"
                    onClick={() => {
                        onChange("");
                        inputRef.current?.focus();
                    }}
                    aria-label="Clear search"
                >
                    ×
                </button>
            )}
        </div>
    );
}
