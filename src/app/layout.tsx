import type { Metadata } from "next";
import RootLayoutClient from "./RootLayoutClient";
import "./globals.css";

export const metadata: Metadata = {
    title: "Family Tree — Interactive Lineage Visualization",
    description:
        "Explore your family history with an interactive, node-based family tree. Track complex relationships including biological parents, step-parents, adoptions, and multiple marriages.",
    keywords: ["family tree", "genealogy", "lineage", "ancestry", "family history"],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var stored = localStorage.getItem('theme');
                                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                                    if (stored === 'dark' || (!stored && prefersDark)) {
                                        document.documentElement.classList.add('dark-theme');
                                    } else {
                                        document.documentElement.classList.remove('dark-theme');
                                    }
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
            </head>
            <body>
                <RootLayoutClient>{children}</RootLayoutClient>
            </body>
        </html>
    );
}
