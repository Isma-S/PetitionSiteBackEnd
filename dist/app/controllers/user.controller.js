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
exports.globalToken = exports.update = exports.view = exports.logout = exports.login = exports.register = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const validate_1 = require("../resources/validate");
const schemas = __importStar(require("../resources/schemas.json"));
const users = __importStar(require("../models/user.server.model"));
const passwords_1 = require("../services/passwords");
const generateToken_1 = require("../services/generateToken");
const user_server_model_1 = require("../models/user.server.model");
let globalToken;
exports.globalToken = globalToken;
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Your code goes here
        logger_1.default.http(`POST register a user with firstname: ${req.body.firstName}`);
        const validation = yield (0, validate_1.validate)(schemas.user_register, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request:  ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const email = req.body.email;
        const password = req.body.password;
        const hashedPassword = yield (0, passwords_1.hash)(password);
        const existingUser = yield users.getUser(email);
        // Check the structure of email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(email) === false) {
            res.status(400).send('Invalid email input');
            return;
        }
        if (existingUser.length !== 0) {
            const user = existingUser[0];
            res.status(403).send(`Email is already used${user.email}`);
            return;
        }
        try {
            const result = yield users.insert(firstName, lastName, email, hashedPassword);
            const userId = result.insertId;
            res.status(201).send({ userId });
            return;
        }
        catch (err) {
            res.status(500).send(`Error creating user: ${err}`);
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.status(500).send('Internal Server Error');
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Your code goes here
        logger_1.default.info(`Logging in user with email ${req.body.email}`);
        const email = req.body.email;
        const password = req.body.password;
        const validation = yield (0, validate_1.validate)(schemas.user_login, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        try {
            const result = yield users.getUser(email);
            const user = result[0];
            const userId = user.id;
            logger_1.default.info(`this is result${user.password}`);
            if (result.length === 0) {
                res.statusMessage = 'Invalid email or password';
                res.status(401).send();
                return;
            }
            const comparePassword = yield (0, passwords_1.compare)(password, user.password);
            if (comparePassword === true) {
                const token = (0, generateToken_1.generateToken)();
                logger_1.default.info(`reached here for token ${token}`);
                exports.globalToken = globalToken = token;
                logger_1.default.info(`reached here for token ${globalToken}`);
                yield (0, user_server_model_1.createTokenDb)(token, userId);
                // res.status(200).send(token);
                res.status(200).send({ userId, token });
            }
            else {
                res.status(401).send('Password no match');
            }
        }
        catch (err) {
            logger_1.default.error(err);
            res.status(500);
        }
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
        logger_1.default.info("Logging user out");
        const token = req.header('X-Authorization');
        yield (0, user_server_model_1.logoutwithToken)(token);
        res.status(200).send("Logged out successfuly");
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
        // Your code goes here
        const id = parseInt(req.params.id, 10);
        // Get the token from the Authorization header
        logger_1.default.info(`can reach here-1`);
        const authHeader = req.header('X-Authorization').toString();
        logger_1.default.info(`can reach here`);
        logger_1.default.http(`Getting user with user id: ${id}, and token ${authHeader}`);
        try {
            const result = yield users.getUserwithId(id);
            if (result.length === 0) {
                res.status(404).send('User not found');
            }
            // not sure if username needs to b modified??
            const user = result[0];
            // This is not passing when running as collection??
            const tokenDb = user.auth_token;
            logger_1.default.info(`this is the auth from database${tokenDb}`);
            const authUser = {
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
            };
            const unAuthUser = {
                firstName: user.first_name,
                lastName: user.last_name,
            };
            logger_1.default.info(`this is auth token: ${authHeader}, and this db token ${tokenDb}`);
            if (authHeader === tokenDb) {
                logger_1.default.info(`for mike`);
                res.status(200).send(authUser);
                return;
            }
            else {
                logger_1.default.info(`for kirtys`);
                res.status(200).send(unAuthUser);
            }
            ;
        }
        catch (err) { // doesnt seem to be sending the body?? if else for parseint??
            res.status(400).send(`ERROR reading user ${id}: ${err}`);
        }
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
        logger_1.default.http(`Patch update user id: ${req.params.id}`);
        const id = parseInt(req.params.id, 10);
        const email = req.body.email;
        if (isNaN(id)) {
            res.status(400).send(`Bad Request: Id is not a number`);
        }
        // need to be validated??
        const validation = yield (0, validate_1.validate)(schemas.user_edit, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        const authHeader = req.header('X-Authorization');
        if (authHeader === undefined) {
            res.status(401).send("Unauthorized");
            return;
        }
        logger_1.default.info(`reached here ${authHeader}`);
        const userDb = yield users.getUserwithId(id);
        if (userDb.length === 0) {
            res.status(404).send("User not found in database");
        }
        const user = userDb[0];
        logger_1.default.info(`this is user id :${user.id} getting user with token`);
        if (authHeader !== user.auth_token) {
            res.status(400).send("User no authenticated,mismatch");
            return;
        }
        const newPassword = req.body.password;
        const hashedNewPassword = yield (0, passwords_1.hash)(newPassword);
        const comparePassword = yield (0, passwords_1.compare)(newPassword, user.password);
        if (comparePassword === true) {
            res.status(403).send("identical currentPassword and password");
        }
        else {
            const updateResult = yield users.updatePassword(user.id, hashedNewPassword);
            if (updateResult.affectedRows === 0) {
                res.status(404).send("something went wrong loll??");
            }
            else {
                res.status(200).send(`User ${id} password updated`);
            }
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.update = update;
//# sourceMappingURL=user.controller.js.map