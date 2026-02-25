import { prisma } from "@/lib/prisma";
import FamilyTree from "@/components/FamilyTree";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

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
        <div className="page-wrapper">
            {/* Hero */}
            <header className="hero pt-16 pb-12">
                <div className="hero-badge">
                    <span className="dot" />
                    Live Family Tree
                </div>
                <h1>
                    Your <span className="gradient-text">Family Story</span>,<br />
                    Beautifully Mapped
                </h1>
                <p>
                    An interactive lineage visualization that handles complex
                    relationships — biological parents, step-parents, adoptions, and
                    multiple marriages — all in one place.
                </p>
                {session ? (
                    <div className="hero-stats mt-8">
                        <div className="stat-item">
                            <span className="stat-value">{individualCount}</span>
                            <span className="stat-label">Individuals</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{unionCount}</span>
                            <span className="stat-label">Unions</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{generationCount}</span>
                            <span className="stat-label">Generations</span>
                        </div>
                    </div>
                ) : (
                    <div className="mt-10 flex gap-4 justify-center">
                        <Link href="/register" className="px-6 py-3 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
                            Create your tree
                        </Link>
                        <Link href="/login" className="px-6 py-3 font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                            Log in
                        </Link>
                    </div>
                )}
            </header>

            {/* Tree Visualization */}
            <main className="tree-container">
                {session ? (
                    <FamilyTree />
                ) : (
                    <div className="h-[600px] flex items-center justify-center border border-dashed border-[var(--border-color)] rounded-xl m-8">
                        <div className="text-center p-8 max-w-md">
                            <h3 className="text-xl font-semibold mb-2 text-[var(--text-color)]">Start mapping your ancestry</h3>
                            <p className="text-[var(--muted-color)] mb-6">Create an account to start adding family members, building relationships, and tracing your lineage through generations.</p>
                            <Link href="/register" className="px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors inline-block font-medium">
                                Get Started for Free
                            </Link>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="footer">
                Family Tree App &middot; Built with Next.js, React Flow &amp; PostgreSQL
            </footer>
        </div>
    );
}
