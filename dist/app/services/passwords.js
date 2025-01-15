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
exports.compare = exports.hash = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const logger_1 = __importDefault(require("../../config/logger"));
const saltRounds = 10;
const hash = (password) => __awaiter(void 0, void 0, void 0, function* () {
    // Todo: update this to encrypt the password
    const hpassword = yield bcrypt_1.default.hash(password, saltRounds);
    return hpassword;
});
exports.hash = hash;
const compare = (password, comp) => __awaiter(void 0, void 0, void 0, function* () {
    // Todo: (suggested) update this to compare the encrypted passwords
    const result = yield bcrypt_1.default.compare(password, comp);
    logger_1.default.info(`this is original:${result},this is database:${comp},${password}`);
    logger_1.default.info(`this is sfdsadfsad:${password === comp},this is database:${comp},${password}`);
    return result;
});
exports.compare = compare;
//# sourceMappingURL=passwords.js.map