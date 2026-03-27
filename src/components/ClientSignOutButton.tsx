"use client";

import { signOut } from "next-auth/react";
import React from "react";

interface ClientSignOutButtonProps {
    children: React.ReactNode;
    className?: string;
}

export default function ClientSignOutButton({ children, className }: ClientSignOutButtonProps) {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className={className}
        >
            {children}
        </button>
    );
}
