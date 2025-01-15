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
exports.getSupportersForTier = exports.addSupporter = exports.getSupporters = void 0;
const db_1 = require("../../config/db");
// todo: maybe add a sorting option for tier by cost (may be a little too hard)
const getSupporters = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `SELECT
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
    const rows = yield (0, db_1.getPool)().query(query, [id]);
    return rows[0];
});
exports.getSupporters = getSupporters;
const addSupporter = (petitionId, userId, supportTierId, message) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `INSERT INTO supporter (petition_id, user_id, support_tier_id, message, timestamp ) VALUES (?, ?, ?, ?, ?)`;
    const [result] = yield (0, db_1.getPool)().query(query, [petitionId, userId, supportTierId, message, new Date()]);
    return result && result.affectedRows === 1;
});
exports.addSupporter = addSupporter;
const getSupportersForTier = (supportTierId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `SELECT
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
    const rows = yield (0, db_1.getPool)().query(query, [supportTierId]);
    return rows[0];
});
exports.getSupportersForTier = getSupportersForTier;
//# sourceMappingURL=supporter.model.js.map