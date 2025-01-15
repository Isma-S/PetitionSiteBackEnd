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
exports.deleteSupportTier = exports.editSupportTier = exports.addSupportTier = void 0;
const schemas = __importStar(require("../resources/schemas.json"));
const Petition = __importStar(require("../models/petition.model"));
const Supporter = __importStar(require("../models/supporter.model"));
const logger_1 = __importDefault(require("../../config/logger"));
const validator_1 = require("../services/validator");
const addSupportTier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield (0, validator_1.validate)(schemas.support_tier_post, req.body);
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
        if (petition.ownerId !== req.authId) {
            res.statusMessage = "Cannot modify another user's petition";
            res.status(403).send();
            return;
        }
        if (petition.supportTiers.length >= 3) {
            res.statusMessage = "A petition can only have a maximum of 3 support tiers";
            res.status(403).send();
            return;
        }
        const added = yield Petition.addSupportTier(petitionId, req.body.title, req.body.description, req.body.cost);
        if (added) {
            res.status(201).send();
            return;
        }
        else {
            // todo: this feels like a proper edge case to catch
            res.statusMessage = "Could not add support tier";
            res.status(500).send();
            return;
        }
    }
    catch (err) {
        logger_1.default.error(err);
        if (err.errno === 1062) { // 1062 = Duplicate entry MySQL error number
            res.statusMessage = "Forbidden: Duplicate support tier";
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
exports.addSupportTier = addSupportTier;
const editSupportTier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield (0, validator_1.validate)(schemas.support_tier_patch, req.body);
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
        const supportTierId = parseInt(req.params.tierId, 10);
        if (isNaN(supportTierId)) {
            res.statusMessage = "supportTierId must be an integer";
            res.status(400).send();
            return;
        }
        const petition = yield Petition.getOne(petitionId);
        if (petition == null) {
            res.statusMessage = "Petition does not exist";
            res.status(404).send();
            return;
        }
        const supportTierToUpdate = petition.supportTiers.find(s => s.supportTierId === supportTierId);
        if (!supportTierToUpdate) {
            res.statusMessage = "Support tier does not exist on petition";
            res.status(404).send();
            return;
        }
        if (petition.ownerId !== req.authId) {
            res.statusMessage = "Cannot modify another user's petition";
            res.status(403).send();
            return;
        }
        const supporters = yield Supporter.getSupportersForTier(supportTierId);
        if (supporters.length !== 0) {
            res.statusMessage = "Can not edit a support tier if one or more users have supported it";
            res.status(403).send();
            return;
        }
        let title = supportTierToUpdate.title;
        if (req.body.hasOwnProperty("title")) {
            title = req.body.title;
        }
        let description = supportTierToUpdate.description;
        if (req.body.hasOwnProperty("description")) {
            description = req.body.description;
        }
        let cost = supportTierToUpdate.cost;
        if (req.body.hasOwnProperty("cost")) {
            cost = req.body.cost;
        }
        const updated = yield Petition.editSupportTier(supportTierId, title, description, cost);
        if (updated) {
            res.status(200).send();
            return;
        }
        else {
            logger_1.default.error("Could not edit support tier");
            res.statusMessage = "Could not edit support tier";
            res.status(500).send();
            return;
        }
    }
    catch (err) {
        logger_1.default.error(err);
        if (err.errno === 1062) { // 1062 = Duplicate entry MySQL error number
            res.statusMessage = "Forbidden: Duplicate support tier";
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
exports.editSupportTier = editSupportTier;
const deleteSupportTier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.statusMessage = "petitionId must be an integer";
            res.status(400).send();
            return;
        }
        const supportTierId = parseInt(req.params.tierId, 10);
        if (isNaN(supportTierId)) {
            res.statusMessage = "supportTierId must be an integer";
            res.status(400).send();
            return;
        }
        const petition = yield Petition.getOne(petitionId);
        if (petition == null) {
            res.statusMessage = "Petition does not exist";
            res.status(404).send();
            return;
        }
        if (!petition.supportTiers.find(s => s.supportTierId === supportTierId)) {
            res.statusMessage = "Support tier does not exist on petition";
            res.status(404).send();
            return;
        }
        if (petition.ownerId !== req.authId) {
            res.statusMessage = "Cannot modify another user's petition";
            res.status(403).send();
            return;
        }
        if (petition.supportTiers.length === 1) {
            res.statusMessage = "A petition must have at least 1 support tier";
            res.status(403).send();
            return;
        }
        const supporters = yield Supporter.getSupportersForTier(supportTierId);
        if (supporters.length !== 0) {
            res.statusMessage = "Can not delete a support tier if one or more users have supported it";
            res.status(403).send();
            return;
        }
        const deleted = yield Petition.deleteSupportTier(supportTierId);
        if (deleted) {
            res.status(200).send();
            return;
        }
        else {
            logger_1.default.error("Could not delete support tier");
            res.statusMessage = "Could not delete support tier";
            res.status(500).send();
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.deleteSupportTier = deleteSupportTier;
//# sourceMappingURL=petition.support_tier.controller.js.map