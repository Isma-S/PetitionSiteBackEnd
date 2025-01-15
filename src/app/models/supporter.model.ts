import {getPool} from "../../config/db";


// todo: maybe add a sorting option for tier by cost (may be a little too hard)
const getSupporters = async (id: number): Promise<supporter[]> => {
    const query: string = `SELECT
    S.id as supportId,
    S.support_tier_id as supportTierId,
    S.message as message,
    S.user_id as supporterId,
    U.first_name as supporterFirstName,
    U.last_name as supporterLastName,
    S.timestamp as timestamp
    FROM supporter S LEFT JOIN user U on S.user_id = U.id
    WHERE S.petition_id=?
    ORDER BY timestamp DESC`;
    const rows = await getPool().query(query, [id]);
    return rows[0] as supporter[];
}

const addSupporter = async (petitionId: number, userId: number, supportTierId: number, message: string): Promise<boolean> => {
    const query: string = `INSERT INTO supporter (petition_id, user_id, support_tier_id, message, timestamp ) VALUES (?, ?, ?, ?, ?)`
    const [result] = await getPool().query(query, [petitionId, userId, supportTierId, message, new Date()])
    return result && result.affectedRows === 1;
}

const getSupportersForTier = async (supportTierId: number): Promise<supporter[]> => {
    const query: string = `SELECT
    S.id as supportId,
    S.support_tier_id as supportTierId,
    S.message as message,
    S.user_id as supporterId,
    U.first_name as supporterFirstName,
    U.last_name as supporterLastName,
    S.timestamp as timestamp
    FROM supporter S LEFT JOIN user U on S.user_id = U.id
    WHERE S.support_tier_id=?
    ORDER BY timestamp DESC`;
    const rows = await getPool().query(query, [supportTierId]);
    return rows[0] as supporter[];
}

export {getSupporters, addSupporter, getSupportersForTier}
