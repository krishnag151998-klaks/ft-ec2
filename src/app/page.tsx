import { prisma } from "@/lib/prisma";
import FamilyTree from "@/components/FamilyTree";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import ClientSignInButton from "@/components/ClientSignInButton";

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
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans overflow-x-hidden selection:bg-blue-200">
            {/* Navigation / Header */}
            <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-50 max-w-7xl mx-auto left-0 right-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                    </div>
                    <span className="font-bold text-xl tracking-tight text-slate-900">AncestryMap</span>
                </div>
                {!session && (
                    <div className="hidden sm:flex items-center gap-4">
                        <ClientSignInButton className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                            Log in
                        </ClientSignInButton>
                        <ClientSignInButton className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-full transition-all shadow-md hover:shadow-lg">
                            Get Started
                        </ClientSignInButton>
                    </div>
                )}
            </nav>

            <main className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pb-32 overflow-hidden min-h-screen flex flex-col justify-center">
                {/* Background Decorative Elements */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                    {session ? (
                        <div className="animate-fade-in-up">
                            <div className="mb-10 text-center">
                                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                                    Welcome back to your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Family Tree</span>
                                </h1>
                                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                    Pick up where you left off. Continue expanding your lineage and preserving your history.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
                                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col items-center justify-center transition-transform hover:-translate-y-1">
                                    <span className="text-4xl font-black text-blue-600 mb-1">{individualCount}</span>
                                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Individuals</span>
                                </div>
                                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col items-center justify-center transition-transform hover:-translate-y-1">
                                    <span className="text-4xl font-black text-indigo-600 mb-1">{unionCount}</span>
                                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Unions</span>
                                </div>
                                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col items-center justify-center transition-transform hover:-translate-y-1">
                                    <span className="text-4xl font-black text-violet-600 mb-1">{generationCount}</span>
                                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Generations</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden h-[700px]">
                                <FamilyTree />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                            {/* Left Column: Copy & CTA */}
                            <div className="flex-1 text-center lg:text-left pt-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8">
                                    <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
                                    Interactive Genealogy Platform
                                </div>
                                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                                    Map your <br className="hidden lg:block" />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">heritage</span> with elegance.
                                </h1>
                                <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                                    A beautifully engineered platform to trace your lineage, document complex relationships, and preserve your family story for generations to come.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                    <ClientSignInButton className="px-8 py-4 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 text-lg">
                                        Start Your Tree Free
                                    </ClientSignInButton>
                                    <ClientSignInButton className="px-8 py-4 font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all shadow-sm hover:shadow text-lg">
                                        Sign In to Account
                                    </ClientSignInButton>
                                </div>

                                <p className="mt-6 text-sm text-slate-500">
                                    No credit card required. Setup takes seconds.
                                </p>
                            </div>

                            {/* Right Column: Visual Preview Graphic */}
                            <div className="flex-1 w-full max-w-2xl lg:max-w-none relative">
                                <div className="aspect-[4/3] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative group">
                                    {/* Abstract Tree Representation */}
                                    <div className="absolute inset-0 bg-slate-50/50 flex flex-col items-center justify-center p-8 layout-grid">
                                        {/* Row 1 */}
                                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg border-2 border-white z-10 animate-bounce-slow"></div>
                                        <div className="w-0.5 h-10 bg-slate-300"></div>
                                        {/* Row 2 */}
                                        <div className="flex items-center gap-16 relative">
                                            <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-slate-300 -z-10"></div>
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-md border-2 border-white z-10 transition-transform group-hover:scale-110"></div>
                                            <div className="w-12 h-12 bg-white rounded-full shadow-sm border-4 border-slate-100 z-10 flex items-center justify-center"><div className="w-3 h-3 bg-rose-400 rounded-full"></div></div>
                                            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl shadow-md border-2 border-white z-10 transition-transform group-hover:scale-110"></div>
                                        </div>
                                        <div className="flex gap-[8.5rem] mt-0">
                                            <div className="w-0.5 h-10 bg-slate-300"></div>
                                            <div className="w-0.5 h-10 bg-slate-300"></div>
                                        </div>
                                        {/* Row 3 */}
                                        <div className="flex items-center gap-12 mt-0">
                                            <div className="w-14 h-14 bg-white rounded-xl shadow-md border border-slate-200 z-10"></div>
                                            <div className="w-14 h-14 bg-white rounded-xl shadow-md border border-slate-200 z-10"></div>
                                            <div className="w-14 h-14 bg-white rounded-xl shadow-md border border-slate-200 z-10"></div>
                                        </div>
                                    </div>

                                    {/* Glass Overlay UI Elements */}
                                    <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
                                        <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-sm border border-white/50 text-xs font-semibold text-slate-600 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live Syncing
                                        </div>
                                        <div className="bg-white/80 backdrop-blur-md p-2 rounded-lg shadow-sm border border-white/50 flex gap-1">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
                                            <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white -ml-2"></div>
                                            <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white -ml-2 flex items-center justify-center text-[10px] font-bold text-blue-600">+</div>
                                        </div>
                                    </div>

                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border border-white/50 flex items-center gap-4 pointer-events-none">
                                        <div className="bg-rose-100 text-rose-600 p-2 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg></div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">New Connection Added</div>
                                            <div className="text-xs text-slate-500">Sarah & Michael created a union</div>
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
