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
exports.removeImageFilename = exports.setImageFileName = exports.getImageFilename = exports.update = exports.view = exports.logout = exports.login = exports.findUserById = exports.findUserByToken = exports.findUserByEmail = exports.register = void 0;
const db_1 = require("../../config/db");
const humps_1 = require("humps");
const register = (u) => __awaiter(void 0, void 0, void 0, function* () {
    const query = "INSERT INTO user (first_name, last_name, email, password) VALUES (?)";
    const [result] = yield (0, db_1.getPool)().query(query, [[u.firstName, u.lastName, u.email, u.password]]);
    return result;
});
exports.register = register;
const findUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const query = 'SELECT * FROM `user` WHERE `email` = ?';
    const rows = yield (0, db_1.getPool)().query(query, [email]);
    return rows[0].length === 0 ? null : (0, humps_1.camelizeKeys)(rows[0][0]);
});
exports.findUserByEmail = findUserByEmail;
const findUserByToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const query = 'SELECT * FROM `user` WHERE `auth_token` = ?';
    const rows = yield (0, db_1.getPool)().query(query, [token]);
    return rows[0].length === 0 ? null : (0, humps_1.camelizeKeys)(rows[0][0]);
});
exports.findUserByToken = findUserByToken;
const findUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = 'SELECT * FROM `user` WHERE `id` = ?';
    const rows = yield (0, db_1.getPool)().query(query, [id]);
    return rows[0].length === 0 ? null : (0, humps_1.camelizeKeys)(rows[0][0]);
});
exports.findUserById = findUserById;
const login = (id, token) => __awaiter(void 0, void 0, void 0, function* () {
    const query = "UPDATE user SET auth_token = ? WHERE id = ?";
    const [result] = yield (0, db_1.getPool)().query(query, [token, id]);
    return result;
});
exports.login = login;
const logout = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = "UPDATE user SET auth_token = ? WHERE id = ?";
    const [result] = yield (0, db_1.getPool)().query(query, [null, id]);
    return result;
});
exports.logout = logout;
const view = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = "SELECT `first_name`, `last_name`, `email` FROM `user` WHERE `id` = ?";
    const [rows] = yield (0, db_1.getPool)().query(query, [id]);
    return rows.length === 0 ? null : (0, humps_1.camelizeKeys)(rows[0]);
});
exports.view = view;
const update = (u) => __awaiter(void 0, void 0, void 0, function* () {
    const query = "UPDATE user SET first_name = ?, last_name = ?, email =?, password=? WHERE id = ?";
    const [result] = yield (0, db_1.getPool)().query(query, [u.firstName, u.lastName, u.email, u.password, u.id]);
    return result;
});
exports.update = update;
const getImageFilename = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = 'SELECT `image_filename` FROM `user` WHERE id = ?';
    const rows = yield (0, db_1.getPool)().query(query, [id]);
    return rows[0].length === 0 ? null : rows[0][0].image_filename;
});
exports.getImageFilename = getImageFilename;
const setImageFileName = (id, filename) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `UPDATE \`user\` SET image_filename = ? WHERE id = ?`;
    const result = yield (0, db_1.getPool)().query(query, [filename, id]);
});
exports.setImageFileName = setImageFileName;
const removeImageFilename = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `UPDATE \`user\` SET image_filename = NULL WHERE id = ?`;
    const result = yield (0, db_1.getPool)().query(query, [id]);
});
exports.removeImageFilename = removeImageFilename;
//# sourceMappingURL=user.model.js.map