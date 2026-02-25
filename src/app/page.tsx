import { prisma } from "@/lib/prisma";
import FamilyTree from "@/components/FamilyTree";

export const dynamic = "force-dynamic";

export default async function HomePage() {
    let individualCount = 0;
    let unionCount = 0;
    let generationCount = 0;

    try {
        individualCount = await prisma.individual.count();
        unionCount = await prisma.union.count();
        // Rough generation estimate based on birth year spread
        const oldest = await prisma.individual.findFirst({
            orderBy: { birthDate: "asc" },
            where: { birthDate: { not: null } },
        });
        const youngest = await prisma.individual.findFirst({
            orderBy: { birthDate: "desc" },
            where: { birthDate: { not: null } },
        });
        if (oldest?.birthDate && youngest?.birthDate) {
            const yearSpan =
                youngest.birthDate.getFullYear() - oldest.birthDate.getFullYear();
            generationCount = Math.max(1, Math.ceil(yearSpan / 25) + 1);
        }
    } catch {
        // DB not yet available — render with zeros
    }

    return (
        <div className="page-wrapper">
            {/* Hero */}
            <header className="hero">
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
                <div className="hero-stats">
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
            </header>

            {/* Tree Visualization */}
            <main className="tree-container">
                <FamilyTree />
            </main>

            {/* Footer */}
            <footer className="footer">
                Family Tree App &middot; Built with Next.js, React Flow &amp; PostgreSQL
            </footer>
        </div>
    );
}
