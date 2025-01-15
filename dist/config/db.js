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
exports.getPool = exports.connect = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("./logger"));
dotenv_1.default.config();
// technically typed : {pool: mysql.Pool}
const state = {
    pool: null
};
const connect = () => __awaiter(void 0, void 0, void 0, function* () {
    state.pool = yield promise_1.default.createPool({
        connectionLimit: 100,
        multipleStatements: true,
        host: process.env.SENG365_MYSQL_HOST,
        user: process.env.SENG365_MYSQL_USER,
        password: process.env.SENG365_MYSQL_PASSWORD,
        database: process.env.SENG365_MYSQL_DATABASE,
        port: parseInt(process.env.SENG365_MYSQL_PORT, 10) || 3306
    });
    yield state.pool.getConnection(); // Check connection
    logger_1.default.info(`Successfully connected to database`);
    return;
});
exports.connect = connect;
// technically typed : () => mysql.Pool
const getPool = () => {
    return state.pool;
};
exports.getPool = getPool;
//# sourceMappingURL=db.js.map