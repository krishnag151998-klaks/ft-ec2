import { Suspense } from "react";
import SignInClient from "./SignInClient";

export default async function SignInPage() {
    // Prevent Next.js from statically replacing variables by accessing them dynamically
    const domainKey = "NEXT_PUBLIC_COGNITO_DOMAIN" as keyof NodeJS.ProcessEnv;
    const clientKey = "COGNITO_CLIENT_ID" as keyof NodeJS.ProcessEnv;

    const cognitoDomain = process.env[domainKey] || "";
    const cognitoClientId = process.env[clientKey] || "";

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
            <SignInClient cognitoDomain={cognitoDomain} cognitoClientId={cognitoClientId} />
        </Suspense>
    );
}
