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
exports.relaxedAuthenticate = exports.authenticate = void 0;
const user_model_1 = require("../models/user.model");
const logger_1 = __importDefault(require("../../config/logger"));
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.header('X-Authorization');
        const user = yield (0, user_model_1.findUserByToken)(token);
        if (user === null) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        req.authId = user.id;
        next();
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
        return;
    }
});
exports.authenticate = authenticate;
const relaxedAuthenticate = (req, _res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.header('X-Authorization');
        const user = yield (0, user_model_1.findUserByToken)(token);
        if (user !== null) {
            req.authId = user.id;
            next();
        }
        else {
            req.authId = -1;
            next();
        }
    }
    catch (err) {
        req.authId = -1;
        next();
    }
});
exports.relaxedAuthenticate = relaxedAuthenticate;
//# sourceMappingURL=auth.middleware.js.map