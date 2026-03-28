import { Suspense } from "react";
import SignInClient from "./SignInClient";

export default async function SignInPage() {
    // Read from the standard local EC2 environment (without NEXT_PUBLIC_ prefixes)
    // This absolutely guarantees Webpack cannot replace the strings at build-time.
    const cognitoDomain = process.env.COGNITO_DOMAIN || "";
    const cognitoClientId = process.env.COGNITO_CLIENT_ID || "";

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
