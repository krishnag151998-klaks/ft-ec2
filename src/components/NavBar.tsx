"use client";

import { useSession, signOut, signIn } from "next-auth/react";
import Link from "next/link";

export default function NavBar() {
    const { data: session, status } = useSession();

    return (
        <header
            style={{
                position: "fixed",
                top: 0,
                width: "100%",
                zIndex: 50,
                padding: "0 1.5rem",
                height: "5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--bg-glass)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: "0 8px 32px rgba(70, 72, 212, 0.04)",
            }}
        >
            {/* Brand */}
            <Link
                href="/"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    textDecoration: "none",
                }}
            >
                <span
                    className="material-symbols-outlined"
                    style={{
                        fontSize: "1.8rem",
                        background: "var(--gradient-primary)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        fontVariationSettings: "'FILL' 1",
                    }}
                >
                    account_tree
                </span>
                <span
                    style={{
                        fontSize: "1.35rem",
                        fontWeight: 800,
                        background: "var(--gradient-primary)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        letterSpacing: "-0.03em",
                    }}
                >
                    AncestryMap
                </span>
            </Link>

            {/* Right: Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {status === "loading" ? (
                    <div
                        style={{
                            width: 80,
                            height: 36,
                            borderRadius: "var(--radius-sm)",
                            background: "var(--surface-container-low)",
                        }}
                    />
                ) : session?.user ? (
                    <>
                        {/* User info */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                paddingLeft: "0.75rem",
                                borderLeft: "1px solid var(--border-subtle)",
                            }}
                        >
                            <div
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: "50%",
                                    background: "var(--gradient-primary)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontSize: "0.8rem",
                                    fontWeight: 700,
                                }}
                            >
                                {(session.user.name?.[0] || session.user.email?.[0] || "U").toUpperCase()}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span
                                    style={{
                                        fontSize: "0.78rem",
                                        fontWeight: 700,
                                        color: "var(--text-primary)",
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {session.user.name || session.user.email}
                                </span>
                                <span
                                    style={{
                                        fontSize: "0.6rem",
                                        color: "var(--text-muted)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.1em",
                                        fontWeight: 700,
                                    }}
                                >
                                    Premium Member
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            title="Sign Out"
                            className="material-symbols-outlined"
                            style={{
                                fontSize: "1.3rem",
                                color: "var(--text-muted)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "0.5rem",
                                borderRadius: "50%",
                                transition: "var(--transition-fast)",
                                display: "flex",
                                alignItems: "center",
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.color = "var(--accent-danger)")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.color = "var(--text-muted)")
                            }
                        >
                            logout
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => signIn(undefined, { callbackUrl: "/" })}
                        style={{
                            padding: "0.55rem 1.5rem",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color: "white",
                            background: "var(--gradient-primary)",
                            borderRadius: "9999px",
                            border: "none",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(70, 72, 212, 0.25)",
                            transition: "all 0.2s",
                            fontFamily: "var(--font-family)",
                        }}
                    >
                        Sign In
                    </button>
                )}
            </div>
        </header>
    );
}
