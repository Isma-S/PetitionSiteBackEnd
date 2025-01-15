import { getPool} from "../../config/db";
import Logger from "../../config/logger";
import {ResultSetHeader} from "mysql2";

interface Category {
    id: number;
    name: string;
}
const getAllCategories = async ():Promise<any> => {
    Logger.info('Getting all catgehgrou from the database');
    const conn = await getPool().getConnection();
    const query = 'select * from category';
    const [rows] = await conn.query(query);
    Logger.info(rows);
    await conn.release();
    return rows as Category[];
};
const getAll = async (searchQuery: string, supportingCost: number, supporterId: number, categoryIds: number[], ownerId: string, sortBy: string): Promise<any> => {
    Logger.info('Getting all users from the database');
    const conn = await getPool().getConnection();
    let query = "SELECT petition.id AS petitionId, " +
        "petition.title, petition.category_id AS category_id, petition.owner_id " +
        "AS owner_id, user.first_name AS first_name, user.last_name AS last_name, " +
        "petition.creation_date AS creation_date, MIN(support_tier.cost) AS supportingCost, " +
        "supporter.id as supporterId, supporter.user_id as supporterUserId " +
        "FROM petition JOIN user ON petition.owner_id = user.id LEFT JOIN support_tier " +
        "ON support_tier.petition_id = petition.id LEFT JOIN supporter ON supporter.petition_id = " +
        "petition.id";

    const queryParams = [];

    const conditions = [];

    if (!isNaN(supportingCost) && supportingCost > 0) {
        conditions.push("support_tier.cost <= ?");
        queryParams.push(supportingCost);
    }
    if (searchQuery) {
        conditions.push("(petition.title LIKE ? OR petition.description LIKE ?)");
        queryParams.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }
    if (supporterId) {
        conditions.push("supporter.user_id = ?");
        queryParams.push(supporterId);
    }
    if (categoryIds.length > 0) {
        const dbcategoryIds = categoryIds.map(() => '?').join(',');
        conditions.push(`petition.category_id IN (${dbcategoryIds})`);
        queryParams.push(...categoryIds);
    }
    if (ownerId) {
        Logger.info(`dbThisisownerid:${ownerId}`)
        conditions.push("petition.owner_id = ?");
        queryParams.push(ownerId);
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }
    query += " GROUP BY petition.id, petition.title, petition.category_id, petition.owner_id, " +
        "user.first_name, user.last_name, petition.creation_date ";

    if (sortBy === "COST_DESC") {
        query += "ORDER BY supportingCost DESC, petition.id ASC";
    } else {
        query += "ORDER BY petition.creation_date ASC, petition.id ASC";
    }

    Logger.info(`${query}`);
    const [rows] = await conn.query(query, queryParams);
    await conn.release();
    return rows;
};
const getPetitionById = async (petitionId: number): Promise<any> => {
    Logger.info(`Getting petition with ID ${petitionId} from the database`);
    try {
        const conn = await getPool().getConnection();
        const query = "SELECT petition.id AS petitionId, " +
            "petition.title, petition.image_filename AS image_filename, petition.category_id AS categoryId,petition.description AS description, petition.owner_id " +
            "AS owner_id, user.first_name AS first_name, user.last_name AS last_name, " +
            "petition.creation_date AS creation_date, support_tier.id AS supportTierIds, MIN(support_tier.cost) AS supportingCost, " +
            "supporter.id as supporterId, supporter.user_id as supporterUserId " +
            "FROM petition JOIN user ON petition.owner_id = user.id LEFT JOIN support_tier " +
            "ON support_tier.petition_id = petition.id LEFT JOIN supporter ON supporter.petition_id = " +
            "petition.id WHERE petition.id = ? GROUP BY petition.id, petition.title, petition.category_id, petition.owner_id, " +
            "user.first_name, user.last_name, petition.creation_date";
        const [rows] = await conn.query(query, [petitionId]);
        if (rows[0] ===  undefined) {
            return -1;
        }
        Logger.info(`This is petition by id ${JSON.stringify(rows[0])}`)
        await conn.release();
        const supportTierIds = rows[0].supportTierIds;
        const supportTierId = await getSupportTierById(supportTierIds);
        Logger.info(`This is petition by id ${JSON.stringify(supportTierId)}`)
        rows[0].supportTiers = [supportTierId];
        Logger.info(`This is petition by id ${JSON.stringify(rows[0])}`)
        return rows[0]; // Assuming petitionId is unique, so returning the first row
    } catch (error) {
        // Logger.error(`Error fetching petition with ID ${petitionId}: ${error.message}`);
        return error
    }
};
interface Petition {
    userId: number;
    title: string;
    description: string;
    categoryId: number;
    supportTiers: SupportTier[];
}
const insertPetition = async (petition: Petition) => {
    Logger.info(`Adding petition ${petition.title} to the database`);
    const conn = await getPool().getConnection();
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Get the current timestamp

    // Construct the INSERT query including the user ID
    const query = 'INSERT INTO petition (owner_id, title, description, creation_date, category_id) VALUES (?, ?, ?, ?, ?)';

    // Execute the query
    const [result] = await conn.query(query, [petition.userId, petition.title, petition.description, currentDate, petition.categoryId]);
    const petitionId = result.insertId;
    // petition.supportTiers  = [{"title":"Free tier","description":"Its free","cost":0}]
    Logger.info(`this is petitionid:${petitionId}`)
    Logger.info(`This is current:${petitionId},${JSON.stringify(petition.supportTiers)}`)
    const results = await insertSupportTiers(petitionId,petition.supportTiers);
    Logger.info(Logger.info(`this is dbresult::${JSON.stringify(results)}`))
    await conn.release();
    return [result,results];
}
interface SupportTier {
    petitionId: number;
    title: string;
    description: string;
    cost: number;
}
const insertSupportTiers = async (petitionId: number, supportTiers: SupportTier[]) => {
    const conn = await getPool().getConnection();
    const insertQuery = 'INSERT INTO support_tier (petition_id, title, description, cost) VALUES (?, ?, ?, ?)';
    let lastResult; // Variable to store the result of the last insertion query

    try {
        for (const tier of supportTiers) {
            const [result] = await conn.query(insertQuery, [petitionId, tier.title, tier.description, tier.cost]);
            lastResult = result; // Update lastResult with the result of the current insertion query
        }
    } catch (err) {
        // Handle any errors that occur during the insertion process
        throw err; // Rethrow the error to be caught by the caller
    } finally {
        await conn.release(); // Always release the database connection, even if an error occurs
    }
    Logger.info(`gothere${JSON.stringify(lastResult)}`)
    return lastResult; // Return the result of the last insertion query
}

interface SupportTier {
    title: string;
    description: string;
    cost: number;
}

const addSupportTierToDatabase = async (id: number, supportTier: SupportTier) => {
    const conn = await getPool().getConnection();
    let lastResult; // Variable to store the result of the last insertion query

    try {
        const countQuery = 'SELECT COUNT(*) AS tierCount FROM support_tier WHERE petition_id = ?';
        const [countResult] = await conn.query(countQuery, [id]);
        const tierCount = countResult[0].tierCount;

        if (tierCount >= 3) {
            // res.status(403).send('Cannot add more than three support tiers for a petition.')
            throw new Error('Cannot add more than three support tiers for a petition.');
        }

        const insertQuery = 'INSERT INTO support_tier (petition_id, title, description, cost) VALUES (?, ?, ?, ?)';

        Logger.info(`${id} Support Tier: ${JSON.stringify(supportTier)}`);

        const [result] = await conn.query(insertQuery, [id, supportTier.title, supportTier.description, supportTier.cost]);

        Logger.info(`Support tier insertion result: ${JSON.stringify(result)}`);

        lastResult = result; // Update lastResult with the result of the current query
    } catch (err) {
        // Handle any errors that occur during the insertion process
        throw err; // Rethrow the error to be caught by the caller
    } finally {
        await conn.release(); // Always release the database connection, even if an error occurs
    }

    return lastResult; // Return the result of the last insertion query
}

const updatePetition = async (id: number, title: string, description: string, categoryId: number) => {
    Logger.http(`Updating petition ${id}`);
    const conn = await getPool().getConnection();
    const query = 'UPDATE petition SET title = ?, description = ?, category_id = ? WHERE id = ?';
    const result = await conn.query(query, [title, description, categoryId, id]);
    await conn.release();
    return result;
}

const deletePetitionById = async (petitionId: number) => {
    try {
        Logger.http(`Deleting petition ${petitionId}`);
        const conn = await getPool().getConnection();
        const query = 'DELETE FROM petition WHERE id = ?';
        const result = await conn.query(query, [petitionId]);
        await conn.release();
        return result;
    } catch (error) {
        Logger.info(`this is error ${error}`,error)
        return error;
    }
}
const getAuthTokenDb = async (): Promise<string> => {
    try {
        const conn = await getPool().getConnection();
        const query = 'SELECT auth_token FROM user WHERE auth_token IS NOT NULL LIMIT 1';
        const [rows] = await conn.query(query);
        await conn.release();
        Logger.info(`Current user ${JSON.stringify(rows)}`);
        if (rows.length > 0) {
            return rows[0].auth_token;
        } else {
            throw new Error('No auth token found in the database');
        }
    } catch (error) {
        Logger.error(`Error fetching auth token from the database: ${error.message}`);
        throw error;
    }
};

const getSupportTierById = async (tierId: number): Promise<any> => {
    try {
        const conn = await getPool().getConnection();
        const query = 'SELECT support_tier.id AS supportTierId, petition_id, title, description, cost FROM support_tier WHERE id = ?';
        const [rows] = await conn.query(query, [tierId]);
        await conn.release();
        return rows[0]; // Assuming tierId is unique, so returning the first row
    } catch (error) {
        Logger.error(`Error fetching support tier with ID ${tierId}: ${error.message}`);
        throw error;
    }
};
const updateSupportTier = async (tierId: number, title: string, description: string, cost: number): Promise<any> => {
    try {
        const conn = await getPool().getConnection();
        const query = 'UPDATE support_tier SET title = ?, description = ?, cost = ? WHERE id = ?';
        const result = await conn.query(query, [title, description, cost, tierId]);
        await conn.release();
        return result;
    } catch (error) {
        Logger.error(`Error updating support tier: ${error.message}`);
        throw error;
    }
};
const deleteSupportTierById = async (tierId: number) => {
    try {
        Logger.http(`Deleting petition ${tierId}`);
        const conn = await getPool().getConnection();
        const query = 'DELETE FROM support_tier WHERE id = ?';
        const result = await conn.query(query, [tierId]);
        await conn.release();
        return result;
    } catch (error) {
        Logger.info(`this is error ${error}`,error)
        return error;
    }
}
const getSupportersForPetitionFromDB = async (petitionId: number): Promise<any> => {
    Logger.info(`Getting supporters for petition ${petitionId} from the database`);
    const conn = await getPool().getConnection();
    const query = `SELECT supporter.id as supportId, supporter.support_tier_id as supportTierId, supporter.message as message, supporter.user_id as supporterId, user.first_name as supporterFirstName, user.last_name as supporterLastName, supporter.timestamp as timestamp FROM supporter LEFT JOIN support_tier ON supporter.support_tier_id = support_tier.id LEFT JOIN user ON supporter.user_id = user.id WHERE supporter.petition_id = ? ORDER BY supporter.timestamp DESC`;

    const [rows] = await conn.query(query, [petitionId]);
    await conn.release();
    Logger.info(`Retrieved supporters for petition ${petitionId}: ${JSON.stringify(rows)}`);
    return rows;
}
const insertSupportDb = async (petitionId: number, userId: number, supportTierId: number, message: string): Promise<any> => {
    Logger.info(`Inserting support for supportTierId ${supportTierId} into the database`);
    try {
        const conn = await getPool().getConnection();
        const query = `INSERT INTO supporter (petition_id, user_id, support_tier_id, message) VALUES (?, ?, ?, ?)`;
        const [result] = await conn.query(query, [petitionId, userId, supportTierId, message]);
        await conn.release();
        Logger.info(`Support inserted successfully for supportTierId ${supportTierId}`);
        return result;
    } catch (error) {
        Logger.error(`Error inserting support for supportTierId ${supportTierId}: ${error.message}`);
        throw error;
    }
}

const insertPetitionImage = async (imageName: string, petitionId: number): Promise<ResultSetHeader> => {
    try {
        Logger.info(`Inserting image ${imageName} for petition ${petitionId} into the database`);

        // Get a connection from the pool
        const conn = await getPool().getConnection();

        // Prepare the SQL query
        const query = 'UPDATE petition SET image_filename = ? WHERE id = ?';

        // Execute the query
        const [result] = await conn.query(query, [imageName, petitionId]);

        // Release the connection
        await conn.release();

        Logger.info(`Image inserted successfully for petition ${petitionId}`);

        // Return the result
        return result;
    } catch (error) {
        Logger.error(`Error inserting image for petition ${petitionId}: ${error.message}`);
        throw error;
    }
};


export {insertPetitionImage,insertSupportDb,getSupportersForPetitionFromDB,deleteSupportTierById, updateSupportTier,getSupportTierById,getAuthTokenDb,addSupportTierToDatabase,getAll, getPetitionById, getAllCategories,insertPetition, updatePetition, deletePetitionById, insertSupportTiers };
