import {getPool} from "../../config/db";
import {ResultSetHeader} from "mysql2";


const viewAll = async (searchQuery: petitionSearchQuery): Promise<petitionReturn> => {
    // Prep the queries
    let query: string = `SELECT
    P.id as petitionId,
    P.title as title,
    P.category_id as categoryId,
    P.creation_date as creationDate,
    P.owner_id as ownerId,
    U.first_name as ownerFirstName,
    U.last_name as ownerLastName,
    (SELECT COUNT(id) FROM supporter WHERE petition_id = P.id) as numberOfSupporters,
    (SELECT MIN(cost) from support_tier where petition_id = P.id) as supportingCost
    FROM petition P JOIN user U on P.owner_id = U.id `
    let countQuery: string = `SELECT COUNT(P.id) from petition P JOIN user U on P.owner_id = U.id `

    // add supporterId through join
    if (searchQuery.supporterId && searchQuery.supporterId !== -1) {
        query += `INNER JOIN (SELECT DISTINCT user_id, petition_id from supporter) S on P.id = S.petition_id AND S.user_id = ${searchQuery.supporterId} `
        countQuery += `INNER JOIN (SELECT DISTINCT user_id, petition_id from supporter) S on P.id = S.petition_id AND S.user_id = ${searchQuery.supporterId} `
    }

    // handle other search parameters through where clauses
    const whereConditions: string[] = []
    const values: (string|number|number[])[] = []
    if (searchQuery.q && searchQuery.q !== "") {
        whereConditions.push('(title LIKE ? OR description LIKE ?)');
        values.push(`%${searchQuery.q}%`);
        values.push(`%${searchQuery.q}%`);
    }

    if (searchQuery.ownerId && searchQuery.ownerId !== -1) {
        whereConditions.push('owner_id = ?');
        values.push(searchQuery.ownerId);
    }

    if (searchQuery.categoryIds && searchQuery.categoryIds.length) {
        whereConditions.push('category_id in (?)');
        values.push(searchQuery.categoryIds);
    }

    if (searchQuery.supportingCost !== null && searchQuery.supportingCost !== -1) {
        whereConditions.push('(SELECT MIN(cost) from support_tier where petition_id = P.id) <= ?')
        values.push(searchQuery.supportingCost)
    }

    // add where conditions
    if (whereConditions.length) {
        query += `\nWHERE ${(whereConditions ? whereConditions.join(' AND ') : 1)}\n`
        countQuery += `\nWHERE ${(whereConditions ? whereConditions.join(' AND ') : 1)}\n`
    }
    const countValues: (string|number|number[])[] = [...values];

    // add sorting
    const searchSwitch = (sort: string) => ({
        'ALPHABETICAL_ASC': `ORDER BY title ASC`,
        'ALPHABETICAL_DESC': `ORDER BY title DESC`,
        'COST_ASC': `ORDER BY supportingCost ASC`,
        'COST_DESC': `ORDER BY supportingCost DESC`,
        'CREATED_ASC': `ORDER BY creationDate ASC`,
        'CREATED_DESC': `ORDER BY creationDate DESC`
    })[sort];
    query += searchSwitch(searchQuery.sortBy) + ', petitionId\n';

    // handle limit and offset
    if (searchQuery.count && searchQuery.count !== -1) {
        query += 'LIMIT ?\n';
        values.push(searchQuery.count);
    }
    if (searchQuery.startIndex && searchQuery.startIndex !== -1) {
        if (!searchQuery.count || searchQuery.count === -1) {
            query += 'LIMIT ?\n';
            values.push(10000000);
        }
        query += 'OFFSET ?\n';
        values.push(searchQuery.startIndex);
    }

    // run query
    const rows = await getPool().query(query, values);
    const petitions = rows[0];
    const countRows = await getPool().query(countQuery, countValues);
    const count = Object.values(JSON.parse(JSON.stringify(countRows[0][0])))[0];
    return {petitions, count} as petitionReturn;
};

const getOne = async (id: number): Promise<petitionFull> => {
    const query: string = `SELECT
    P.id as petitionId,
    P.title as title,
    P.description as description,
    P.category_id as categoryId,
    P.owner_id as ownerId,
    U.first_name as ownerFirstName,
    U.last_name as ownerLastName,
    P.creation_date as creationDate,
    (SELECT COUNT(id) FROM supporter WHERE petition_id = P.id) as numberOfSupporters,
    CAST((SELECT sum(cost) FROM support_tier ST JOIN supporter S on S.support_tier_id = ST.id WHERE ST.petition_id = P.id) AS INT) as moneyRaised
    FROM petition P join user U on P.owner_id = U.id
    WHERE P.id=?`;
    const rows = await getPool().query(query, id);
    const petition: petitionFull = rows[0].length === 0?null: rows[0][0] as unknown as petitionFull;
    if (petition != null) {
        petition.supportTiers = await getSupportTiers(id);
    }
    return petition
}

const getSupportTiers = async (id: number): Promise<supportTier[]> => {
    const query: string = `SELECT
    S.id as supportTierId,
    S.title as title,
    S.description as description,
    S.cost as cost
    FROM support_tier S
    WHERE S.petition_id=?`;
    const rows = await getPool().query(query, id);
    return rows[0] as supportTier[];
}

const addOne = async (ownerId: number, title: string, description: string, creationDate: string, categoryId: number, supportTiers: supportTierPost[]): Promise<ResultSetHeader> => {
    const query: string = `INSERT INTO petition (owner_id, title, description, creation_date, category_id) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await getPool().query(query, [ownerId, title, description, creationDate, categoryId])
    if (result.insertId > 0) {
        const values = supportTiers.map(s => [result.insertId, s.title, s.description, s.cost])
        const supportTierQuery: string = `INSERT INTO support_tier (petition_id, title, description, cost) VALUES ?`;
        const [result2] = await getPool().query(supportTierQuery, [values]);
    }
    return result;
}

const editOne = async (petitionId: number, title: string, description: string, categoryId: number): Promise<boolean> => {
    const query: string = `UPDATE petition SET title=?, description=?, category_id=? WHERE id=?`;
    const [result] = await getPool().query(query, [title, description, categoryId, petitionId]);
    return result && result.affectedRows === 1;
}

const deleteOne = async (id: number): Promise<boolean> => {
    const query: string = `DELETE from petition where id=?`;
    const [result] = await getPool().query(query, id);
    return result && result.affectedRows === 1;
}

const getImageFilename = async (id: number): Promise<string> => {
    const query: string = 'SELECT `image_filename` FROM `petition` WHERE id = ?';
    const rows = await getPool().query(query, [id]);
    return rows[0].length === 0 ? null : rows[0][0].image_filename;
}

const setImageFilename = async (id: number, filename: string): Promise<void> => {
    const query: string = "UPDATE `petition` SET `image_filename`=? WHERE `id`=?";
    const result = await getPool().query(query, [filename, id]);
}

const getCategories = async (): Promise<category[]> => {
    const query: string = `SELECT id as categoryId, name from category`;
    const rows = await getPool().query(query);
    return rows[0] as category[];
}

const addSupportTier = async (petitionId: number, title: string, description: string, cost: number): Promise<boolean> => {
    const query: string = `INSERT INTO support_tier (petition_id, title, description, cost) VALUES (?, ?, ?, ?)`;
    const [result] = await getPool().query(query, [petitionId, title, description, cost]);
    return result && result.insertId > 0;
}

const editSupportTier = async (supportTierId: number, title: string, description: string, cost: number): Promise<boolean> => {
    const query: string = `UPDATE support_tier SET title=?, description=?, cost=? WHERE id=?`;
    const [result] = await getPool().query(query, [title, description, cost, supportTierId]);
    return result && result.affectedRows === 1;
}

const deleteSupportTier = async (supportTierId: number): Promise<boolean> => {
    const query: string = `DELETE FROM support_tier WHERE id=?`;
    const [result] = await getPool().query(query, [supportTierId]);
    return result && result.affectedRows === 1;
}

export {viewAll, getOne, addOne, editOne, deleteOne, getCategories, getImageFilename, setImageFilename, addSupportTier, editSupportTier, deleteSupportTier}