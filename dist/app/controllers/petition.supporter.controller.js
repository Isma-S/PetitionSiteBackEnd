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
exports.addSupporter = exports.getAllSupportersForPetition = void 0;
const schemas = __importStar(require("../resources/schemas.json"));
const Petition = __importStar(require("../models/petition.model"));
const Supporters = __importStar(require("../models/supporter.model"));
const logger_1 = __importDefault(require("../../config/logger"));
const validator_1 = require("../services/validator");
const getAllSupportersForPetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.statusMessage = "id must be an integer";
            res.status(400).send();
            return;
        }
        const petition = yield Petition.getOne(petitionId);
        if (petition == null) {
            res.status(404).send();
            return;
        }
        const supporters = yield Supporters.getSupporters(petitionId);
        res.status(200).send(supporters);
    }
    catch (err) {
        logger_1.default.warn(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getAllSupportersForPetition = getAllSupportersForPetition;
const addSupporter = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield (0, validator_1.validate)(schemas.support_post, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.statusMessage = "petitionId must be an integer";
            res.status(400).send();
            return;
        }
        const petition = yield Petition.getOne(petitionId);
        if (petition == null) {
            res.statusMessage = "Petition does not exist";
            res.status(404).send();
            return;
        }
        if (petition.ownerId === req.authId) {
            res.statusMessage = "Cannot support your own petition";
            res.status(403).send();
            return;
        }
        if (!petition.supportTiers.find(s => s.supportTierId === req.body.supportTierId)) {
            res.statusMessage = "Support tier does not exist";
            res.status(404).send();
            return;
        }
        let message = null;
        if (req.body.hasOwnProperty("message")) {
            message = req.body.message;
        }
        const added = yield Supporters.addSupporter(petitionId, req.authId, req.body.supportTierId, message);
        if (added) {
            res.status(201).send();
            return;
        }
        else {
            // todo what could cause this?
            res.statusMessage = "Could not add support for petition";
            res.status(500).send();
        }
    }
    catch (err) {
        if (err.errno === 1062) { // 1062 = Duplicate entry MySQL error number
            res.statusMessage = "Forbidden: Duplicate supporter";
            res.status(403).send();
            return;
        }
        else {
            logger_1.default.warn(err);
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }
    }
});
exports.addSupporter = addSupporter;
//# sourceMappingURL=petition.supporter.controller.js.map