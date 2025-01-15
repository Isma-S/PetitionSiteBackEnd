"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.executeSql = exports.loadData = exports.resetDb = void 0;
const db_1 = require("../../config/db");
const fs_1 = __importDefault(require("mz/fs"));
const defaultUsers = __importStar(require("../resources/default_users.json"));
const passwords = __importStar(require("../services/passwords"));
const imageDirectory = './storage/images/';
const defaultPhotoDirectory = './storage/default/';
const logger_1 = __importDefault(require("../../config/logger"));
const resetDb = () => __awaiter(void 0, void 0, void 0, function* () {
    const promises = [];
    const sql = yield fs_1.default.readFile('src/app/resources/create_database.sql', 'utf8');
    logger_1.default.info("Resetting Database...");
    promises.push((0, db_1.getPool)().query(sql)); // sync call to recreate DB
    const files = yield fs_1.default.readdir(imageDirectory);
    for (const file of files) {
        if (file !== '.gitkeep')
            promises.push(fs_1.default.unlink(imageDirectory + file)); // sync call to delete photo
    }
    return Promise.all(promises); // async wait for DB recreation and images to be deleted
});
exports.resetDb = resetDb;
const loadData = () => __awaiter(void 0, void 0, void 0, function* () {
    yield populateDefaultUsers();
    try {
        const sql = yield fs_1.default.readFile('src/app/resources/resample_database.sql', 'utf8');
        yield (0, db_1.getPool)().query(sql);
    }
    catch (err) {
        logger_1.default.error(err.sql);
        throw err;
    }
    const defaultPhotos = yield fs_1.default.readdir(defaultPhotoDirectory);
    const promises = defaultPhotos.map((file) => fs_1.default.copyFile(defaultPhotoDirectory + file, imageDirectory + file));
    return Promise.all(promises);
});
exports.loadData = loadData;
/**
 * Populates the User table in the database with the given data. Must be done here instead of within the
 * `resample_database.sql` script because passwords must be hashed according to the particular implementation.
 * @returns {Promise<void>}
 */
const populateDefaultUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    const createSQL = 'INSERT INTO `user` (`email`, `first_name`, `last_name`, `image_filename`, `password`) VALUES ?';
    const properties = defaultUsers.properties;
    let usersData = defaultUsers.usersData;
    // Shallow copy all the user arrays within the main data array
    // Ensures that the user arrays with hashed passwords won't persist across multiple calls to this function
    usersData = usersData.map((user) => ([...user]));
    const passwordIndex = properties.indexOf('password');
    yield Promise.all(usersData.map((user) => changePasswordToHash(user, passwordIndex)));
    try {
        yield (0, db_1.getPool)().query(createSQL, [usersData]);
    }
    catch (err) {
        logger_1.default.error(err.sql);
        throw err;
    }
});
function changePasswordToHash(user, passwordIndex) {
    return __awaiter(this, void 0, void 0, function* () {
        user[passwordIndex] = yield passwords.hash(user[passwordIndex]);
    });
}
const executeSql = (sql) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [rows] = yield (0, db_1.getPool)().query(sql);
        return rows;
    }
    catch (err) {
        logger_1.default.error(err.sql);
        throw err;
    }
});
exports.executeSql = executeSql;
//# sourceMappingURL=backdoor.model.js.map