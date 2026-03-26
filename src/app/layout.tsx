import type { Metadata } from "next";
import RootLayoutClient from "./RootLayoutClient";
import "./globals.css";

export const metadata: Metadata = {
    title: "AncestryMap — The Digital Curator",
    description:
        "Discover and preserve your heritage with AncestryMap. An interactive, node-based family tree for tracking complex relationships across generations.",
    keywords: ["family tree", "genealogy", "lineage", "ancestry", "family history", "heritage"],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                    rel="stylesheet"
                />
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
