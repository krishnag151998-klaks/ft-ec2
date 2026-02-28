import Link from "next/link";
import ClientSignInButton from "@/components/ClientSignInButton";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
    return (
        <div className="lp-wrapper reg-wrapper">
            {/* Background Elements */}
            <div className="lp-blob lp-blob-blue" />
            <div className="lp-blob lp-blob-indigo" />

            <div className="reg-container animate-fade-in-up">

                {/* Left Side: Context / Visual */}
                <div className="reg-hero">
                    <Link href="/" className="reg-back-link">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Home
                    </Link>

                    <div className="reg-hero-content">
                        <div className="lp-logo-container reg-logo-mb">
                            <div className="lp-logo-icon">
                                <svg className="lp-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                            </div>
                            <span className="lp-brand">AncestryMap</span>
                        </div>

                        <h1 className="reg-hero-title">
                            Begin your <span className="lp-gradient-text">lineage journey</span> today.
                        </h1>
                        <p className="reg-hero-subtitle">
                            Create a free account to start mapping your family tree, documenting relationships, and discovering your roots with our beautiful, interactive platform.
                        </p>

                        <div className="reg-hero-stats">
                            <div className="reg-stat">
                                <span className="reg-stat-val">100%</span>
                                <span className="reg-stat-label">Free Setup</span>
                            </div>
                            <div className="reg-stat">
                                <span className="reg-stat-val">Secure</span>
                                <span className="reg-stat-label">AWS Storage</span>
                            </div>
                            <div className="reg-stat">
                                <span className="reg-stat-val">Live</span>
                                <span className="reg-stat-label">Syncing</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Registration Form */}
                <div className="reg-form-col">
                    <div className="reg-card">
                        <div className="reg-card-header">
                            <h2>Create Account</h2>
                            <p>Enter your details to register.</p>
                        </div>

                        <form className="reg-form">
                            <div className="reg-input-group">
                                <label htmlFor="name">Full Name</label>
                                <input type="text" id="name" placeholder="John Doe" required />
                            </div>
                            <div className="reg-input-group">
                                <label htmlFor="email">Email Address</label>
                                <input type="email" id="email" placeholder="john@example.com" required />
                            </div>
                            <div className="reg-input-group">
                                <label htmlFor="password">Password</label>
                                <input type="password" id="password" placeholder="••••••••" required />
                            </div>
                            <div className="reg-input-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input type="password" id="confirmPassword" placeholder="••••••••" required />
                            </div>

                            <button type="submit" className="lp-btn-primary reg-submit-btn">
                                Create Account
                            </button>
                        </form>

                        <div className="reg-divider">
                            <span>or continue with</span>
                        </div>

                        <div className="reg-socials">
                            {/* Uses Cognito via NextAuth to Login/Signup */}
                            <ClientSignInButton className="reg-social-btn">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Amazon Cognito SSO
                            </ClientSignInButton>
                        </div>

                        <p className="reg-footer-text">
                            Already have an account?{" "}
                            {/* In standard setup, login uses the same ClientSignInButton to trigger Cognito */}
                            <ClientSignInButton className="reg-login-link">
                                Sign in
                            </ClientSignInButton>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
