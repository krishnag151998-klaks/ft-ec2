// =============================================================================
// Seed Script — Creates a sample 3-generation family using union-based model
// =============================================================================
// Family structure:
//   Generation 1: Harold & Margaret (grandparents, married)
//   Generation 2: Robert (their bio son), Karen (adopted)
//                Robert & Susan (1st marriage, divorced) → Emily
//                Robert & Linda (2nd marriage) → James
//   Generation 3: Emily, James

import { PrismaClient, Gender, UnionType, ParentalRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.individual.count();
    if (count > 0) {
        console.log("⏭️  Database already seeded. Skipping.");
        return;
    }

    console.log("🌱 Seeding database with sample family...");

    // ---- Generation 1: Grandparents ----
    const harold = await prisma.individual.create({
        data: {
            firstName: "Harold",
            lastName: "Whitfield",
            birthDate: new Date("1940-03-15"),
            gender: Gender.male,
            bio: "Family patriarch. Retired schoolteacher.",
        },
    });

    const margaret = await prisma.individual.create({
        data: {
            firstName: "Margaret",
            lastName: "Whitfield",
            birthDate: new Date("1942-07-22"),
            gender: Gender.female,
            bio: "Family matriarch. Avid gardener.",
        },
    });

    // ---- Generation 2 ----
    const robert = await prisma.individual.create({
        data: {
            firstName: "Robert",
            lastName: "Whitfield",
            birthDate: new Date("1965-11-08"),
            gender: Gender.male,
            bio: "Engineer. Son of Harold and Margaret.",
        },
    });

    const susan = await prisma.individual.create({
        data: {
            firstName: "Susan",
            lastName: "Whitfield",
            birthDate: new Date("1967-01-30"),
            gender: Gender.female,
            bio: "Robert's first wife. Nurse.",
        },
    });

    const linda = await prisma.individual.create({
        data: {
            firstName: "Linda",
            lastName: "Whitfield",
            birthDate: new Date("1970-05-12"),
            gender: Gender.female,
            bio: "Robert's second wife. Artist.",
        },
    });

    const karen = await prisma.individual.create({
        data: {
            firstName: "Karen",
            lastName: "Whitfield",
            birthDate: new Date("1972-09-03"),
            gender: Gender.female,
            bio: "Adopted daughter of Harold and Margaret.",
        },
    });

    // ---- Generation 3 ----
    const emily = await prisma.individual.create({
        data: {
            firstName: "Emily",
            lastName: "Whitfield",
            birthDate: new Date("1992-04-18"),
            gender: Gender.female,
            bio: "Daughter of Robert and Susan. Software developer.",
        },
    });

    const james = await prisma.individual.create({
        data: {
            firstName: "James",
            lastName: "Whitfield",
            birthDate: new Date("2000-12-25"),
            gender: Gender.male,
            bio: "Son of Robert and Linda. College student.",
        },
    });

    // ===========================================================================
    // Unions
    // ===========================================================================

    // Harold & Margaret — married
    const haroldMargaretUnion = await prisma.union.create({
        data: {
            partner1Id: harold.id,
            partner2Id: margaret.id,
            unionType: UnionType.marriage,
        },
    });

    // Robert & Susan — divorced
    const robertSusanUnion = await prisma.union.create({
        data: {
            partner1Id: robert.id,
            partner2Id: susan.id,
            unionType: UnionType.divorced,
        },
    });

    // Robert & Linda — married
    const robertLindaUnion = await prisma.union.create({
        data: {
            partner1Id: robert.id,
            partner2Id: linda.id,
            unionType: UnionType.marriage,
        },
    });

    // ===========================================================================
    // Union Children
    // ===========================================================================

    // Robert is biological child of Harold & Margaret
    await prisma.unionChild.create({
        data: {
            unionId: haroldMargaretUnion.id,
            childId: robert.id,
            parentalRole: ParentalRole.biological,
        },
    });

    // Karen is adopted child of Harold & Margaret
    await prisma.unionChild.create({
        data: {
            unionId: haroldMargaretUnion.id,
            childId: karen.id,
            parentalRole: ParentalRole.adoptive,
        },
    });

    // Emily is biological child of Robert & Susan
    await prisma.unionChild.create({
        data: {
            unionId: robertSusanUnion.id,
            childId: emily.id,
            parentalRole: ParentalRole.biological,
        },
    });

    // James is biological child of Robert & Linda
    await prisma.unionChild.create({
        data: {
            unionId: robertLindaUnion.id,
            childId: james.id,
            parentalRole: ParentalRole.biological,
        },
    });

    const indCount = await prisma.individual.count();
    const unionCount = await prisma.union.count();
    const childCount = await prisma.unionChild.count();
    console.log(`✅ Seeded ${indCount} individuals, ${unionCount} unions, ${childCount} child links.`);
}

main()
    .catch((e) => {
        console.error("❌ Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
