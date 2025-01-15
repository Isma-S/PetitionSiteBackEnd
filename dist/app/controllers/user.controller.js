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
exports.update = exports.view = exports.logout = exports.login = exports.register = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const User = __importStar(require("../models/user.model"));
const passwords = __importStar(require("../services/passwords"));
const schemas = __importStar(require("../resources/schemas.json"));
const validator_1 = require("../services/validator");
const rand_token_1 = require("rand-token");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield (0, validator_1.validate)(schemas.user_register, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        req.body.password = yield passwords.hash(req.body.password);
        const result = yield User.register(req.body);
        res.status(201).send({ "userId": result.insertId });
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        if (err.errno === 1062) { // 1062 = Duplicate entry MySQL error number
            res.statusMessage = "Forbidden: Email already in use";
            res.status(403).send();
            return;
        }
        else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield (0, validator_1.validate)(schemas.user_login, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        const user = yield User.findUserByEmail(req.body.email);
        if (user === null || !(yield passwords.compare(req.body.password, user.password))) {
            res.statusMessage = 'Invalid email/password';
            res.status(401).send();
            return;
        }
        const token = (0, rand_token_1.uid)(64);
        yield User.login(user.id, token);
        res.status(200).send({ "userId": user.id, "token": token });
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.login = login;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.authId;
        yield User.logout(userId);
        res.status(200).send();
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.logout = logout;
const view = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = "Id must be an integer";
            res.status(400).send();
            return;
        }
        const user = yield User.view(id);
        if (user === null) {
            res.statusMessage = "User not found";
            res.status(404).send();
            return;
        }
        if (req.authId === id) {
            res.status(200).send(user);
            return;
        }
        delete user.email;
        res.status(200).send(user);
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.view = view;
const update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = "Id must be an integer";
            res.status(400).send();
            return;
        }
        const user = yield User.findUserById(id);
        if (user === null) {
            res.status(404).send();
            return;
        }
        if (req.authId !== parseInt(req.params.id, 10)) {
            res.status(403).send();
            return;
        }
        const validation = yield (0, validator_1.validate)(schemas.user_edit, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        if (req.body.hasOwnProperty("password")) {
            if (req.body.hasOwnProperty("currentPassword")) {
                if (!(yield passwords.compare(req.body.currentPassword, user.password))) {
                    res.statusMessage = "Incorrect currentPassword";
                    res.status(401).send();
                    return;
                }
                else {
                    if (yield passwords.compare(req.body.password, user.password)) {
                        res.statusMessage = "New password can not be the same as old password";
                        res.status(403).send();
                        return;
                    }
                    user.password = yield passwords.hash(req.body.password);
                }
            }
            else {
                res.statusMessage = "currentPassword must be supplied to change password";
                res.status(400).send();
                return;
            }
        }
        if (req.body.hasOwnProperty("email")) {
            user.email = req.body.email;
        }
        if (req.body.hasOwnProperty("firstName")) {
            user.firstName = req.body.firstName;
        }
        if (req.body.hasOwnProperty("lastName")) {
            user.lastName = req.body.lastName;
        }
        yield User.update(user);
        res.status(200).send();
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        if (err.errno === 1062) { // 1062 = Duplicate entry MySQL error number
            res.statusMessage = "Forbidden: Email already in use";
            res.status(403).send();
            return;
        }
        else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }
    }
});
exports.update = update;
//# sourceMappingURL=user.controller.js.map