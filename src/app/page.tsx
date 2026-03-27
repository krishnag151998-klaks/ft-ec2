import { prisma } from "@/lib/prisma";
import TreeViewWrapper from "@/components/TreeViewWrapper";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ClientSignInButton from "@/components/ClientSignInButton";
import ClientSignOutButton from "@/components/ClientSignOutButton";

export const dynamic = "force-dynamic";

export default async function HomePage() {
    let individualCount = 0;
    let unionCount = 0;
    let generationCount = 0;

    const session = await getServerSession(authOptions);

    if (session?.user?.id) {
        try {
            const userId = session.user.id;
            individualCount = await prisma.individual.count({ where: { userId } });
            unionCount = await prisma.union.count({
                where: { partner1: { userId } }
            });
            // Rough generation estimate based on birth year spread
            const oldest = await prisma.individual.findFirst({
                orderBy: { birthDate: "asc" },
                where: { birthDate: { not: null }, userId },
            });
            const youngest = await prisma.individual.findFirst({
                orderBy: { birthDate: "desc" },
                where: { birthDate: { not: null }, userId },
            });
            if (oldest?.birthDate && youngest?.birthDate) {
                const yearSpan =
                    youngest.birthDate.getFullYear() - oldest.birthDate.getFullYear();
                generationCount = Math.max(1, Math.ceil(yearSpan / 25) + 1);
            }
        } catch {
            // DB not yet available — render with zeros
        }
    }

    return (
        <div className="lp-wrapper">
            {/* Navigation / Header */}
            <nav className="lp-nav">
                <div className="lp-logo-container">
                    <span className="material-symbols-outlined" style={{ fontSize: '1.6rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontVariationSettings: "'FILL' 1" }}>account_tree</span>
                    <span className="lp-brand">AncestryMap</span>
                </div>
                {!session ? (
                    <div className="lp-nav-actions">
                        <ClientSignInButton className="lp-btn-login-text">
                            Log in
                        </ClientSignInButton>
                        <ClientSignInButton className="lp-btn-get-started-small">
                            Get Started
                        </ClientSignInButton>
                    </div>
                ) : (
                    <div className="lp-nav-actions">
                        <ClientSignOutButton className="lp-btn-login-text">
                            Log out
                        </ClientSignOutButton>
                    </div>
                )}
            </nav>

            <main className="lp-main">
                {/* Background Decorative Elements */}
                <div className="lp-blob lp-blob-blue" />
                <div className="lp-blob lp-blob-indigo" />

                <div className="lp-container">
                    {session ? (
                        <div className="lp-fade-in">
                            <div className="lp-welcome-header">
                                <h1>
                                    Welcome back to your <span className="lp-gradient-text">Family Tree</span>
                                </h1>
                                <p className="lp-subtitle">
                                    Pick up where you left off. Continue expanding your lineage and preserving your history.
                                </p>
                            </div>

                            <div className="lp-stats-grid">
                                <div className="lp-stat-card">
                                    <span className="lp-stat-number lp-text-blue">{individualCount}</span>
                                    <span className="lp-stat-label">Individuals</span>
                                </div>
                                <div className="lp-stat-card">
                                    <span className="lp-stat-number lp-text-indigo">{unionCount}</span>
                                    <span className="lp-stat-label">Unions</span>
                                </div>
                                <div className="lp-stat-card">
                                    <span className="lp-stat-number lp-text-violet">{generationCount}</span>
                                    <span className="lp-stat-label">Generations</span>
                                </div>
                            </div>

                            <div className="lp-tree-container">
                                <TreeViewWrapper />
                            </div>
                        </div>
                    ) : (
                        <div className="lp-hero-layout">
                            {/* Left Column: Copy & CTA */}
                            <div className="lp-hero-copy">
                                <div className="lp-badge">
                                    <span className="lp-badge-dot"></span>
                                    The Digital Curator
                                </div>
                                <h1>
                                    Map your <br className="lp-hide-mobile" />
                                    <span className="lp-gradient-text">heritage</span> with elegance.
                                </h1>
                                <p className="lp-subtitle">
                                    A beautifully engineered platform to trace your lineage, document complex relationships, and preserve your family story for generations to come.
                                </p>

                                <div className="lp-hero-actions">
                                    <ClientSignInButton className="lp-btn-primary">
                                        Start Your Tree Free
                                    </ClientSignInButton>
                                    <ClientSignInButton className="lp-btn-secondary">
                                        Sign In to Account
                                    </ClientSignInButton>
                                </div>

                                <p className="lp-hero-footnote">
                                    No credit card required. Setup takes seconds.
                                </p>
                            </div>

                            {/* Right Column: Visual Preview Graphic */}
                            <div className="lp-hero-visual">
                                <div className="lp-visual-card group">
                                    {/* Abstract Tree Representation */}
                                    <div className="lp-visual-grid layout-grid">
                                        {/* Row 1 */}
                                        <div className="lp-node lp-node-root animate-bounce-slow"></div>
                                        <div className="lp-line-vertical"></div>
                                        {/* Row 2 */}
                                        <div className="lp-node-row">
                                            <div className="lp-line-horizontal"></div>
                                            <div className="lp-node lp-node-blue lp-hover-scale"></div>
                                            <div className="lp-node-union"><div className="lp-union-dot"></div></div>
                                            <div className="lp-node lp-node-teal lp-hover-scale"></div>
                                        </div>
                                        <div className="lp-lines-split">
                                            <div className="lp-line-vertical"></div>
                                            <div className="lp-line-vertical"></div>
                                        </div>
                                        {/* Row 3 */}
                                        <div className="lp-node-row-children">
                                            <div className="lp-node lp-node-child"></div>
                                            <div className="lp-node lp-node-child"></div>
                                            <div className="lp-node lp-node-child"></div>
                                        </div>
                                    </div>

                                    {/* Glass Overlay UI Elements */}
                                    <div className="lp-overlay-top">
                                        <div className="lp-glass-badge">
                                            <span className="lp-status-dot"></span> Live Syncing
                                        </div>
                                        <div className="lp-glass-users">
                                            <div className="lp-user-avatar"></div>
                                            <div className="lp-user-avatar lp-avatar-overlap"></div>
                                            <div className="lp-user-count">+</div>
                                        </div>
                                    </div>

                                    <div className="lp-overlay-bottom">
                                        <div className="lp-toast-icon">
                                            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>auto_awesome</span>
                                        </div>
                                        <div className="lp-toast-text">
                                            <div className="lp-toast-title">Curator Insight</div>
                                            <div className="lp-toast-desc">3 matching archive records found</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
