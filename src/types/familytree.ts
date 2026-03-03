// =============================================================================
// Shared Family Tree Types
// =============================================================================

export interface UnionChild {
    id: string;
    childId: string;
    parentalRole: string;
    child: Individual;
}

export interface UnionData {
    id: string;
    partner1Id: string;
    partner2Id: string | null;
    unionType: string;
    partner1?: Individual;
    partner2?: Individual | null;
    children: UnionChild[];
}

export interface Individual {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string | null;
    deathDate: string | null;
    gender: string;
    bio: string | null;
    unionsAsPartner1: UnionData[];
    unionsAsPartner2: UnionData[];
    childOf: {
        id: string;
        unionId: string;
        parentalRole: string;
        union: UnionData;
    }[];
}

export interface ContextMenuState {
    x: number;
    y: number;
    nodeId: string;
    memberName: string;
}
