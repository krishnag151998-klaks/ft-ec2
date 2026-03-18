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
            <svg
                className="search-icon"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
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
