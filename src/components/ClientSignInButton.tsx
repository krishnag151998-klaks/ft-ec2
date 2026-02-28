"use client";

import { signIn } from "next-auth/react";

interface ClientSignInButtonProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export default function ClientSignInButton({ children, className, style }: ClientSignInButtonProps) {
    return (
        <button
            onClick={() => signIn("cognito", { callbackUrl: "/" })}
            className={className}
            style={style}
        >
            {children}
        </button>
    );
}
