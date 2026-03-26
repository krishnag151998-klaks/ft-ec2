"use client";

import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/* Map NextAuth error codes to user-friendly messages */
const ERROR_MESSAGES: Record<string, string> = {
    OAuthSignin: "Could not start the sign-in process. Please try again.",
    OAuthCallback: "Authentication failed during callback. Please try again.",
    OAuthCreateAccount: "Could not create your account. Please try again.",
    EmailCreateAccount: "Could not create your account via email.",
    Callback: "An unexpected error occurred. Please try again.",
    OAuthAccountNotLinked: "This email is already linked to another provider. Sign in with the original provider.",
    SessionRequired: "You must be signed in to access this page.",
    Default: "Something went wrong. Please try again.",
};

function SignInContent() {
    const searchParams = useSearchParams();
    const errorCode = searchParams.get("error");
    const [providers, setProviders] = useState<Record<string, { id: string; name: string }> | null>(null);
    const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        getProviders().then((p) => setProviders(p as any));
    }, []);

    const handleSignIn = (providerId: string) => {
        setLoadingProvider(providerId);
        signIn(providerId, { callbackUrl: "/" });
    };

    const errorMessage = errorCode && !dismissed
        ? ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.Default
        : null;

    const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN || "";
    const cognitoClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";
    const redirectUri = typeof window !== "undefined"
        ? encodeURIComponent(window.location.origin + "/api/auth/callback/cognito")
        : "";
    const signupUrl = cognitoDomain
        ? `${cognitoDomain}/signup?client_id=${cognitoClientId}&response_type=code&redirect_uri=${redirectUri}`
        : "#";
    const forgotPasswordUrl = cognitoDomain
        ? `${cognitoDomain}/forgotPassword?client_id=${cognitoClientId}&response_type=code&redirect_uri=${redirectUri}`
        : "#";

    return (
        <div className="si-page">
            {/* Left Visual Panel */}
            <div className="si-visual-panel">
                <div className="si-visual-bg" />
                <div className="si-visual-overlay" />
                <div className="si-visual-content">
                    <div className="si-visual-brand">
                        <span
                            className="material-symbols-outlined"
                            style={{
                                fontSize: "2.2rem",
                                color: "rgba(255,255,255,0.95)",
                                fontVariationSettings: "'FILL' 1",
                            }}
                        >
                            account_tree
                        </span>
                        <span className="si-visual-logo">AncestryMap</span>
                    </div>
                    <h1 className="si-visual-headline">
                        Discover Your<br />Heritage
                    </h1>
                    <p className="si-visual-desc">
                        The Living Archive — documenting the stories that matter most,
                        for generations to come.
                    </p>
                    <div className="si-visual-stats">
                        <div className="si-visual-stat">
                            <span className="si-stat-number">10K+</span>
                            <span className="si-stat-label">Families Connected</span>
                        </div>
                        <div className="si-visual-stat-divider" />
                        <div className="si-visual-stat">
                            <span className="si-stat-number">50K+</span>
                            <span className="si-stat-label">Heritage Records</span>
                        </div>
                        <div className="si-visual-stat-divider" />
                        <div className="si-visual-stat">
                            <span className="si-stat-number">120+</span>
                            <span className="si-stat-label">Countries</span>
                        </div>
                    </div>
                </div>
                <div className="si-float si-float-1" />
                <div className="si-float si-float-2" />
                <div className="si-float si-float-3" />
            </div>

            {/* Right Sign-In Panel */}
            <div className="si-form-panel">
                <div className="si-card">
                    {/* Mobile brand */}
                    <div className="si-card-brand-mobile">
                        <span
                            className="material-symbols-outlined"
                            style={{
                                fontSize: "1.6rem",
                                background: "var(--gradient-primary)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                                fontVariationSettings: "'FILL' 1",
                            }}
                        >
                            account_tree
                        </span>
                        <span className="gradient-text" style={{ fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                            AncestryMap
                        </span>
                    </div>

                    <h2 className="si-heading">Welcome back</h2>
                    <p className="si-subheading">
                        Sign in to continue curating your heritage
                    </p>

                    {/* Error Banner */}
                    {errorMessage && (
                        <div className="si-error-banner" role="alert">
                            <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>error</span>
                            <span className="si-error-text">{errorMessage}</span>
                            <button className="si-error-dismiss" onClick={() => setDismissed(true)} aria-label="Dismiss">
                                <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>close</span>
                            </button>
                        </div>
                    )}

                    {/* Provider Buttons */}
                    <div className="si-providers">
                        {providers ? (
                            <>
                                {/* Cognito Primary */}
                                {Object.values(providers).find(p => p.id === "cognito") && (
                                    <button
                                        onClick={() => handleSignIn("cognito")}
                                        className="si-btn si-btn-primary"
                                        disabled={loadingProvider !== null}
                                    >
                                        {loadingProvider === "cognito" ? (
                                            <div className="si-btn-spinner" />
                                        ) : (
                                            <span className="material-symbols-outlined" style={{ fontSize: "1.2rem", fontVariationSettings: "'FILL' 1" }}>
                                                shield_person
                                            </span>
                                        )}
                                        {loadingProvider === "cognito" ? "Redirecting…" : "Continue with AWS Cognito"}
                                    </button>
                                )}

                                {/* Divider */}
                                {Object.values(providers).length > 1 && (
                                    <div className="si-divider"><span>or</span></div>
                                )}

                                {/* Google */}
                                {Object.values(providers).find(p => p.id === "google") && (
                                    <button
                                        onClick={() => handleSignIn("google")}
                                        className="si-btn si-btn-secondary"
                                        disabled={loadingProvider !== null}
                                    >
                                        {loadingProvider === "google" ? (
                                            <div className="si-btn-spinner" />
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                        )}
                                        {loadingProvider === "google" ? "Redirecting…" : "Continue with Google"}
                                    </button>
                                )}

                                {/* Other providers */}
                                {Object.values(providers)
                                    .filter(p => p.id !== "cognito" && p.id !== "google")
                                    .map((provider) => (
                                        <button
                                            key={provider.id}
                                            onClick={() => handleSignIn(provider.id)}
                                            className="si-btn si-btn-secondary"
                                            disabled={loadingProvider !== null}
                                        >
                                            {loadingProvider === provider.id ? (
                                                <div className="si-btn-spinner" />
                                            ) : (
                                                <span className="material-symbols-outlined" style={{ fontSize: "1.2rem", color: "var(--accent-primary)" }}>lock</span>
                                            )}
                                            {loadingProvider === provider.id ? "Redirecting…" : `Continue with ${provider.name}`}
                                        </button>
                                    ))}
                            </>
                        ) : (
                            <div className="si-loading">
                                <div className="loading-spinner" style={{ width: 28, height: 28 }} />
                            </div>
                        )}
                    </div>

                    {/* Forgot Password */}
                    <div className="si-forgot">
                        <a href={forgotPasswordUrl} className="si-forgot-link">
                            Forgot your password?
                        </a>
                    </div>

                    {/* Create Account */}
                    <div className="si-signup">
                        <span>New to AncestryMap?</span>{" "}
                        <a href={signupUrl} className="si-signup-link">
                            Create an account
                        </a>
                    </div>

                    {/* Footer */}
                    <div className="si-footer">
                        <p className="si-terms">
                            By continuing, you agree to our{" "}
                            <a href="#">Terms of Service</a> &{" "}
                            <a href="#">Privacy Policy</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={
            <div className="si-page">
                <div className="si-visual-panel">
                    <div className="si-visual-bg" />
                    <div className="si-visual-overlay" />
                </div>
                <div className="si-form-panel">
                    <div className="si-loading">
                        <div className="loading-spinner" style={{ width: 32, height: 32 }} />
                    </div>
                </div>
            </div>
        }>
            <SignInContent />
        </Suspense>
    );
}
