"use client";

import { useSession, signOut, signIn } from "next-auth/react";
import Link from "next/link";

export default function NavBar() {
    const { data: session, status } = useSession();

    return (
        <nav className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--background)]">
            <div className="flex items-center space-x-4">
                <Link href="/" className="text-xl font-bold text-[var(--accent-color)]">
                    FamilyTree
                </Link>
            </div>

            <div className="flex items-center space-x-4">
                {status === "loading" ? (
                    <div className="w-20 h-8 bg-[var(--card-bg)] animate-pulse rounded"></div>
                ) : session?.user ? (
                    <>
                        <span className="text-sm font-medium text-[var(--text-color)]">
                            {session.user.name || session.user.email}
                        </span>
                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="px-4 py-2 text-sm font-medium text-[var(--background)] bg-[var(--text-color)] hover:opacity-90 rounded-xl transition-opacity"
                        >
                            Sign Out
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => signIn("cognito", { callbackUrl: "/" })}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                    >
                        Sign In
                    </button>
                )}
            </div>
        </nav>
    );
}
