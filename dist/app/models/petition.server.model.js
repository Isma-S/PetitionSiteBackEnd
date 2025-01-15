"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertSupportTiers = exports.deletePetitionById = exports.updatePetition = exports.insertPetition = exports.getAllCategories = exports.getPetitionById = exports.getAll = exports.addSupportTierToDatabase = exports.getAuthTokenDb = exports.getSupportTierById = exports.updateSupportTier = exports.deleteSupportTierById = exports.getSupportersForPetitionFromDB = exports.insertSupportDb = exports.insertPetitionImage = void 0;
const db_1 = require("../../config/db");
const logger_1 = __importDefault(require("../../config/logger"));
const getAllCategories = () => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('Getting all catgehgrou from the database');
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select * from category';
    const [rows] = yield conn.query(query);
    logger_1.default.info(rows);
    yield conn.release();
    return rows;
});
exports.getAllCategories = getAllCategories;
const getAll = (searchQuery, supportingCost, supporterId, categoryIds, ownerId, sortBy) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('Getting all users from the database');
    const conn = yield (0, db_1.getPool)().getConnection();
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
        logger_1.default.info(`dbThisisownerid:${ownerId}`);
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
    }
    else {
        query += "ORDER BY petition.creation_date ASC, petition.id ASC";
    }
    logger_1.default.info(`${query}`);
    const [rows] = yield conn.query(query, queryParams);
    yield conn.release();
    return rows;
});
exports.getAll = getAll;
const getPetitionById = (petitionId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting petition with ID ${petitionId} from the database`);
    try {
        const conn = yield (0, db_1.getPool)().getConnection();
        const query = "SELECT petition.id AS petitionId, " +
            "petition.title, petition.image_filename AS image_filename, petition.category_id AS categoryId,petition.description AS description, petition.owner_id " +
            "AS owner_id, user.first_name AS first_name, user.last_name AS last_name, " +
            "petition.creation_date AS creation_date, support_tier.id AS supportTierIds, MIN(support_tier.cost) AS supportingCost, " +
            "supporter.id as supporterId, supporter.user_id as supporterUserId " +
            "FROM petition JOIN user ON petition.owner_id = user.id LEFT JOIN support_tier " +
            "ON support_tier.petition_id = petition.id LEFT JOIN supporter ON supporter.petition_id = " +
            "petition.id WHERE petition.id = ? GROUP BY petition.id, petition.title, petition.category_id, petition.owner_id, " +
            "user.first_name, user.last_name, petition.creation_date";
        const [rows] = yield conn.query(query, [petitionId]);
        if (rows[0] === undefined) {
            return -1;
        }
        logger_1.default.info(`This is petition by id ${JSON.stringify(rows[0])}`);
        yield conn.release();
        const supportTierIds = rows[0].supportTierIds;
        const supportTierId = yield getSupportTierById(supportTierIds);
        logger_1.default.info(`This is petition by id ${JSON.stringify(supportTierId)}`);
        rows[0].supportTiers = [supportTierId];
        logger_1.default.info(`This is petition by id ${JSON.stringify(rows[0])}`);
        return rows[0]; // Assuming petitionId is unique, so returning the first row
    }
    catch (error) {
        // Logger.error(`Error fetching petition with ID ${petitionId}: ${error.message}`);
        return error;
    }
});
exports.getPetitionById = getPetitionById;
const insertPetition = (petition) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Adding petition ${petition.title} to the database`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Get the current timestamp
    // Construct the INSERT query including the user ID
    const query = 'INSERT INTO petition (owner_id, title, description, creation_date, category_id) VALUES (?, ?, ?, ?, ?)';
    // Execute the query
    const [result] = yield conn.query(query, [petition.userId, petition.title, petition.description, currentDate, petition.categoryId]);
    const petitionId = result.insertId;
    // petition.supportTiers  = [{"title":"Free tier","description":"Its free","cost":0}]
    logger_1.default.info(`this is petitionid:${petitionId}`);
    logger_1.default.info(`This is current:${petitionId},${JSON.stringify(petition.supportTiers)}`);
    const results = yield insertSupportTiers(petitionId, petition.supportTiers);
    logger_1.default.info(logger_1.default.info(`this is dbresult::${JSON.stringify(results)}`));
    yield conn.release();
    return [result, results];
});
exports.insertPetition = insertPetition;
const insertSupportTiers = (petitionId, supportTiers) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const insertQuery = 'INSERT INTO support_tier (petition_id, title, description, cost) VALUES (?, ?, ?, ?)';
    let lastResult; // Variable to store the result of the last insertion query
    try {
        for (const tier of supportTiers) {
            const [result] = yield conn.query(insertQuery, [petitionId, tier.title, tier.description, tier.cost]);
            lastResult = result; // Update lastResult with the result of the current insertion query
        }
    }
    catch (err) {
        // Handle any errors that occur during the insertion process
        throw err; // Rethrow the error to be caught by the caller
    }
    finally {
        yield conn.release(); // Always release the database connection, even if an error occurs
    }
    logger_1.default.info(`gothere${JSON.stringify(lastResult)}`);
    return lastResult; // Return the result of the last insertion query
});
exports.insertSupportTiers = insertSupportTiers;
const addSupportTierToDatabase = (id, supportTier) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    let lastResult; // Variable to store the result of the last insertion query
    try {
        const countQuery = 'SELECT COUNT(*) AS tierCount FROM support_tier WHERE petition_id = ?';
        const [countResult] = yield conn.query(countQuery, [id]);
        const tierCount = countResult[0].tierCount;
        if (tierCount >= 3) {
            // res.status(403).send('Cannot add more than three support tiers for a petition.')
            throw new Error('Cannot add more than three support tiers for a petition.');
        }
        const insertQuery = 'INSERT INTO support_tier (petition_id, title, description, cost) VALUES (?, ?, ?, ?)';
        logger_1.default.info(`${id} Support Tier: ${JSON.stringify(supportTier)}`);
        const [result] = yield conn.query(insertQuery, [id, supportTier.title, supportTier.description, supportTier.cost]);
        logger_1.default.info(`Support tier insertion result: ${JSON.stringify(result)}`);
        lastResult = result; // Update lastResult with the result of the current query
    }
    catch (err) {
        // Handle any errors that occur during the insertion process
        throw err; // Rethrow the error to be caught by the caller
    }
    finally {
        yield conn.release(); // Always release the database connection, even if an error occurs
    }
    return lastResult; // Return the result of the last insertion query
});
exports.addSupportTierToDatabase = addSupportTierToDatabase;
const updatePetition = (id, title, description, categoryId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Updating petition ${id}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'UPDATE petition SET title = ?, description = ?, category_id = ? WHERE id = ?';
    const result = yield conn.query(query, [title, description, categoryId, id]);
    yield conn.release();
    return result;
});
exports.updatePetition = updatePetition;
const deletePetitionById = (petitionId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger_1.default.http(`Deleting petition ${petitionId}`);
        const conn = yield (0, db_1.getPool)().getConnection();
        const query = 'DELETE FROM petition WHERE id = ?';
        const result = yield conn.query(query, [petitionId]);
        yield conn.release();
        return result;
    }
    catch (error) {
        logger_1.default.info(`this is error ${error}`, error);
        return error;
    }
});
exports.deletePetitionById = deletePetitionById;
const getAuthTokenDb = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const conn = yield (0, db_1.getPool)().getConnection();
        const query = 'SELECT auth_token FROM user WHERE auth_token IS NOT NULL LIMIT 1';
        const [rows] = yield conn.query(query);
        yield conn.release();
        logger_1.default.info(`Current user ${JSON.stringify(rows)}`);
        if (rows.length > 0) {
            return rows[0].auth_token;
        }
        else {
            throw new Error('No auth token found in the database');
        }
    }
    catch (error) {
        logger_1.default.error(`Error fetching auth token from the database: ${error.message}`);
        throw error;
    }
});
exports.getAuthTokenDb = getAuthTokenDb;
const getSupportTierById = (tierId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const conn = yield (0, db_1.getPool)().getConnection();
        const query = 'SELECT support_tier.id AS supportTierId, petition_id, title, description, cost FROM support_tier WHERE id = ?';
        const [rows] = yield conn.query(query, [tierId]);
        yield conn.release();
        return rows[0]; // Assuming tierId is unique, so returning the first row
    }
    catch (error) {
        logger_1.default.error(`Error fetching support tier with ID ${tierId}: ${error.message}`);
        throw error;
    }
});
exports.getSupportTierById = getSupportTierById;
const updateSupportTier = (tierId, title, description, cost) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const conn = yield (0, db_1.getPool)().getConnection();
        const query = 'UPDATE support_tier SET title = ?, description = ?, cost = ? WHERE id = ?';
        const result = yield conn.query(query, [title, description, cost, tierId]);
        yield conn.release();
        return result;
    }
    catch (error) {
        logger_1.default.error(`Error updating support tier: ${error.message}`);
        throw error;
    }
});
exports.updateSupportTier = updateSupportTier;
const deleteSupportTierById = (tierId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger_1.default.http(`Deleting petition ${tierId}`);
        const conn = yield (0, db_1.getPool)().getConnection();
        const query = 'DELETE FROM support_tier WHERE id = ?';
        const result = yield conn.query(query, [tierId]);
        yield conn.release();
        return result;
    }
    catch (error) {
        logger_1.default.info(`this is error ${error}`, error);
        return error;
    }
});
exports.deleteSupportTierById = deleteSupportTierById;
const getSupportersForPetitionFromDB = (petitionId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting supporters for petition ${petitionId} from the database`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `SELECT supporter.id as supportId, supporter.support_tier_id as supportTierId, supporter.message as message, supporter.user_id as supporterId, user.first_name as supporterFirstName, user.last_name as supporterLastName, supporter.timestamp as timestamp FROM supporter LEFT JOIN support_tier ON supporter.support_tier_id = support_tier.id LEFT JOIN user ON supporter.user_id = user.id WHERE supporter.petition_id = ? ORDER BY supporter.timestamp DESC`;
    const [rows] = yield conn.query(query, [petitionId]);
    yield conn.release();
    logger_1.default.info(`Retrieved supporters for petition ${petitionId}: ${JSON.stringify(rows)}`);
    return rows;
});
exports.getSupportersForPetitionFromDB = getSupportersForPetitionFromDB;
const insertSupportDb = (petitionId, userId, supportTierId, message) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Inserting support for supportTierId ${supportTierId} into the database`);
    try {
        const conn = yield (0, db_1.getPool)().getConnection();
        const query = `INSERT INTO supporter (petition_id, user_id, support_tier_id, message) VALUES (?, ?, ?, ?)`;
        const [result] = yield conn.query(query, [petitionId, userId, supportTierId, message]);
        yield conn.release();
        logger_1.default.info(`Support inserted successfully for supportTierId ${supportTierId}`);
        return result;
    }
    catch (error) {
        logger_1.default.error(`Error inserting support for supportTierId ${supportTierId}: ${error.message}`);
        throw error;
    }
});
exports.insertSupportDb = insertSupportDb;
const insertPetitionImage = (imageName, petitionId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger_1.default.info(`Inserting image ${imageName} for petition ${petitionId} into the database`);
        // Get a connection from the pool
        const conn = yield (0, db_1.getPool)().getConnection();
        // Prepare the SQL query
        const query = 'UPDATE petition SET image_filename = ? WHERE id = ?';
        // Execute the query
        const [result] = yield conn.query(query, [imageName, petitionId]);
        // Release the connection
        yield conn.release();
        logger_1.default.info(`Image inserted successfully for petition ${petitionId}`);
        // Return the result
        return result;
    }
    catch (error) {
        logger_1.default.error(`Error inserting image for petition ${petitionId}: ${error.message}`);
        throw error;
    }
});
exports.insertPetitionImage = insertPetitionImage;
//# sourceMappingURL=petition.server.model.js.map