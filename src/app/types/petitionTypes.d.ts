type petition = {
    petitionId: number,
    title: string,
    categoryId: number,
    creationDate: string,
    ownerId: number,
    ownerFirstName: string,
    ownerLastName: string,
    numberOfSupporters: number,
}

type petitionReturn = {
    petitions: petition[],
    count: number
}

type supportTierPost = {
    title: string,
    description: string
    cost: number
}

type supportTier = {
    supportTierId: number,
} & supportTierPost

type petitionFull = {
    description: string,
    moneyRaised: number,
    supportTiers: supportTier[]
} & petition

type category = {
    categoryId: number,
    name: string
}

type postSupport = {
    supportTierId: number,
    message: string
}

type supporter = {
    supportId: number,
    supporterId: number,
    supporterFirstName: string,
    supporterLastName: string,
    timestamp: string
} & postSupport

type petitionSearchQuery = {
    q?: string,
    ownerId?: number,
    supporterId?: number,
    categoryIds?: Array<number>,
    supportingCost?: number,
    sortBy?: string,
    startIndex: number,
    count?: number
}