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
exports.createTokenDb = exports.logoutwithToken = exports.updatePassword = exports.getUserwithToken = exports.getUserwithId = exports.getUser = exports.insert = void 0;
const db_1 = require("../../config/db");
const logger_1 = __importDefault(require("../../config/logger"));
const getAll = () => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('Getting all users from the database');
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select * from user';
    const [rows] = yield conn.query(query);
    yield conn.release();
    return rows;
});
// Getting user with user:email
const getUser = (email) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting user ${email} from the database`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT * FROM user WHERE email = ?';
    const [rows] = yield conn.query(query, [email]);
    yield conn.release();
    logger_1.default.info(`this is result from rows${JSON.stringify(rows)}`);
    return rows;
});
exports.getUser = getUser;
// Getting user with user:id
const getUserwithId = (id) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting user ${id} from the database`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT * FROM user WHERE id = ?';
    const [rows] = yield conn.query(query, [[id]]);
    yield conn.release();
    logger_1.default.info(`this is result from rows${JSON.stringify(rows)}`);
    return rows;
});
exports.getUserwithId = getUserwithId;
// Getting user with user:token
const getUserwithToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting user with token: ${token} from the database`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT id FROM user WHERE auth_token = ?';
    const [rows] = yield conn.query(query, [token]);
    yield conn.release();
    logger_1.default.info(`Result from database: ${JSON.stringify(rows)}`);
    return rows;
    // if (rows.length > 0) {
    //     Logger.info(`Thisisdbresukt ${rows[0]}`)
    //     return rows[0].id; // Return the user id if found
    // } else {
    //     return null; // Return null if no user found
    // }
});
exports.getUserwithToken = getUserwithToken;
const insert = (firstName, lastName, email, password) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Adding user ${firstName} to the database`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'INSERT INTO user (first_name,last_name,email, password) VALUES(?)';
    const [result] = yield conn.query(query, [[firstName, lastName, email, password]]);
    yield conn.release();
    return result;
});
exports.insert = insert;
const updatePassword = (id, password) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Updating user ${id} password`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'UPDATE user SET password = ? WHERE id = ?';
    const [result] = yield conn.query(query, [password, id]);
    yield conn.release();
    return result;
});
exports.updatePassword = updatePassword;
// create token for user
const createTokenDb = (token, id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger_1.default.info(`Creating token:${token} for the user:${id} in db`);
        const conn = yield (0, db_1.getPool)().getConnection();
        const createQuery = 'UPDATE user SET auth_token = ? where id = ?';
        const [rows] = yield conn.query(createQuery, [token, id]);
        yield conn.release();
        logger_1.default.info(`this is result from rows${JSON.stringify(rows)}`);
    }
    catch (err) {
        logger_1.default.error('Error creating token in db', err);
    }
});
exports.createTokenDb = createTokenDb;
// log out user with token
const logoutwithToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger_1.default.info(`Getting user with token:${token} from database`);
        const conn = yield (0, db_1.getPool)().getConnection();
        const getQuery = 'SELECT * FROM user WHERE auth_token = ?';
        const [rows] = yield conn.query(getQuery, [[token]]);
        if (rows.length === 0) {
            logger_1.default.info("User doesnt exist with that token");
            yield conn.release();
            return;
        }
        const user = rows[0];
        const updateQuery = 'UPDATE user SET auth_token = NULL where id = ?';
        yield conn.query(updateQuery, [user.id]);
        yield conn.release();
        logger_1.default.info(`Successfully logged out user with ID ${user.id}`);
    }
    catch (err) {
        logger_1.default.error('Error logging out user', err);
        throw err;
    }
});
exports.logoutwithToken = logoutwithToken;
//# sourceMappingURL=user.server.model.js.map