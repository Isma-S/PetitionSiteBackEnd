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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupportTier = exports.editSupportTier = exports.addSupportTier = exports.setImageFilename = exports.getImageFilename = exports.getCategories = exports.deleteOne = exports.editOne = exports.addOne = exports.getOne = exports.viewAll = void 0;
const db_1 = require("../../config/db");
const viewAll = (searchQuery) => __awaiter(void 0, void 0, void 0, function* () {
    // Prep the queries
    let query = `SELECT
    P.id as petitionId,
    P.title as title,
    P.category_id as categoryId,
    P.creation_date as creationDate,
    P.owner_id as ownerId,
    U.first_name as ownerFirstName,
    U.last_name as ownerLastName,
    (SELECT COUNT(id) FROM supporter WHERE petition_id = P.id) as numberOfSupporters,
    (SELECT MIN(cost) from support_tier where petition_id = P.id) as supportingCost
    FROM petition P JOIN user U on P.owner_id = U.id `;
    let countQuery = `SELECT COUNT(P.id) from petition P JOIN user U on P.owner_id = U.id `;
    // add supporterId through join
    if (searchQuery.supporterId && searchQuery.supporterId !== -1) {
        query += `INNER JOIN (SELECT DISTINCT user_id, petition_id from supporter) S on P.id = S.petition_id AND S.user_id = ${searchQuery.supporterId} `;
        countQuery += `INNER JOIN (SELECT DISTINCT user_id, petition_id from supporter) S on P.id = S.petition_id AND S.user_id = ${searchQuery.supporterId} `;
    }
    // handle other search parameters through where clauses
    const whereConditions = [];
    const values = [];
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
        whereConditions.push('(SELECT MIN(cost) from support_tier where petition_id = P.id) <= ?');
        values.push(searchQuery.supportingCost);
    }
    // add where conditions
    if (whereConditions.length) {
        query += `\nWHERE ${(whereConditions ? whereConditions.join(' AND ') : 1)}\n`;
        countQuery += `\nWHERE ${(whereConditions ? whereConditions.join(' AND ') : 1)}\n`;
    }
    const countValues = [...values];
    // add sorting
    const searchSwitch = (sort) => ({
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
    const rows = yield (0, db_1.getPool)().query(query, values);
    const petitions = rows[0];
    const countRows = yield (0, db_1.getPool)().query(countQuery, countValues);
    const count = Object.values(JSON.parse(JSON.stringify(countRows[0][0])))[0];
    return { petitions, count };
});
exports.viewAll = viewAll;
const getOne = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `SELECT
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
    const rows = yield (0, db_1.getPool)().query(query, id);
    const petition = rows[0].length === 0 ? null : rows[0][0];
    if (petition != null) {
        petition.supportTiers = yield getSupportTiers(id);
    }
    return petition;
});
exports.getOne = getOne;
const getSupportTiers = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `SELECT
    S.id as supportTierId,
    S.title as title,
    S.description as description,
    S.cost as cost
    FROM support_tier S
    WHERE S.petition_id=?`;
    const rows = yield (0, db_1.getPool)().query(query, id);
    return rows[0];
});
const addOne = (ownerId, title, description, creationDate, categoryId, supportTiers) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `INSERT INTO petition (owner_id, title, description, creation_date, category_id) VALUES (?, ?, ?, ?, ?)`;
    const [result] = yield (0, db_1.getPool)().query(query, [ownerId, title, description, creationDate, categoryId]);
    if (result.insertId > 0) {
        const values = supportTiers.map(s => [result.insertId, s.title, s.description, s.cost]);
        const supportTierQuery = `INSERT INTO support_tier (petition_id, title, description, cost) VALUES ?`;
        const [result2] = yield (0, db_1.getPool)().query(supportTierQuery, [values]);
    }
    return result;
});
exports.addOne = addOne;
const editOne = (petitionId, title, description, categoryId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `UPDATE petition SET title=?, description=?, category_id=? WHERE id=?`;
    const [result] = yield (0, db_1.getPool)().query(query, [title, description, categoryId, petitionId]);
    return result && result.affectedRows === 1;
});
exports.editOne = editOne;
const deleteOne = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `DELETE from petition where id=?`;
    const [result] = yield (0, db_1.getPool)().query(query, id);
    return result && result.affectedRows === 1;
});
exports.deleteOne = deleteOne;
const getImageFilename = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = 'SELECT `image_filename` FROM `petition` WHERE id = ?';
    const rows = yield (0, db_1.getPool)().query(query, [id]);
    return rows[0].length === 0 ? null : rows[0][0].image_filename;
});
exports.getImageFilename = getImageFilename;
const setImageFilename = (id, filename) => __awaiter(void 0, void 0, void 0, function* () {
    const query = "UPDATE `petition` SET `image_filename`=? WHERE `id`=?";
    const result = yield (0, db_1.getPool)().query(query, [filename, id]);
});
exports.setImageFilename = setImageFilename;
const getCategories = () => __awaiter(void 0, void 0, void 0, function* () {
    const query = `SELECT id as categoryId, name from category`;
    const rows = yield (0, db_1.getPool)().query(query);
    return rows[0];
});
exports.getCategories = getCategories;
const addSupportTier = (petitionId, title, description, cost) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `INSERT INTO support_tier (petition_id, title, description, cost) VALUES (?, ?, ?, ?)`;
    const [result] = yield (0, db_1.getPool)().query(query, [petitionId, title, description, cost]);
    return result && result.insertId > 0;
});
exports.addSupportTier = addSupportTier;
const editSupportTier = (supportTierId, title, description, cost) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `UPDATE support_tier SET title=?, description=?, cost=? WHERE id=?`;
    const [result] = yield (0, db_1.getPool)().query(query, [title, description, cost, supportTierId]);
    return result && result.affectedRows === 1;
});
exports.editSupportTier = editSupportTier;
const deleteSupportTier = (supportTierId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `DELETE FROM support_tier WHERE id=?`;
    const [result] = yield (0, db_1.getPool)().query(query, [supportTierId]);
    return result && result.affectedRows === 1;
});
exports.deleteSupportTier = deleteSupportTier;
//# sourceMappingURL=petition.model.js.map