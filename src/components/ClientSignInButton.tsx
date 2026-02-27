"use client";

import { signIn } from "next-auth/react";

interface ClientSignInButtonProps {
    children: React.ReactNode;
    className?: string;
}

export default function ClientSignInButton({ children, className }: ClientSignInButtonProps) {
    return (
        <button
            onClick={() => signIn("cognito", { callbackUrl: "/" })}
            className={className}
        >
            {children}
        </button>
    );
}
