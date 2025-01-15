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
const logger_1 = __importDefault(require("../../config/logger"));
const validate_1 = require("../resources/validate");
const schemas = __importStar(require("../resources/schemas.json"));
const petition_server_model_1 = require("../models/petition.server.model");
const user_controller_1 = require("./user.controller");
const user_server_model_1 = require("../models/user.server.model");
const addSupportTier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).send("Invalid ID parameter");
            return;
        }
        const validation = yield (0, validate_1.validate)(schemas.support_tier_post, req.body);
        logger_1.default.info(`Thisisownerid:${validation}`);
        if (validation !== true) {
            res.statusMessage = `Bad Request:  ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        const data = req.body;
        try {
            yield (0, petition_server_model_1.addSupportTierToDatabase)(id, data);
            res.status(201).send("Support tier added successfully");
        }
        catch (error) {
            logger_1.default.error(`Error adding support tier: ${error.message}`);
            if (error.message.includes("Cannot add more than three support tiers for a petition.")) {
                res.status(403).send("Cannot add more than three support tiers for a petition.");
            }
            else {
                res.status(500).send("Internal Server Error");
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
exports.addSupportTier = addSupportTier;
const editSupportTier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.header('X-Authorization');
        if (authHeader === undefined) {
            res.status(401).send("Unauthorized");
            return;
        }
        logger_1.default.info(`global token ${user_controller_1.globalToken}, currentToken:${authHeader}`);
        logger_1.default.info(`reached here ${user_controller_1.globalToken}`);
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.status(400).send("Invalid ID parameter");
            return;
        }
        const petition = yield (0, petition_server_model_1.getPetitionById)(petitionId);
        logger_1.default.info(`thisiispettiton: ${JSON.stringify(petition)}`);
        const userDb = petition.owner_id;
        logger_1.default.info(userDb);
        const userTokenDb = yield (0, user_server_model_1.getUserwithToken)(authHeader);
        logger_1.default.info(JSON.stringify(userTokenDb));
        const userTokenDbId = userTokenDb[0].id;
        logger_1.default.info(`this is user current :${typeof userTokenDbId} , this userDb${typeof userDb}`);
        logger_1.default.info(`this is user current :${userTokenDbId} , this userDb${userDb}`);
        if (userTokenDbId !== userDb) {
            logger_1.default.info("got here");
            res.status(404).send("User not authenticated,mismatch");
            return;
        }
        const tierId = parseInt(req.params.tierId, 10);
        const supportTierDb = yield (0, petition_server_model_1.getSupportTierById)(tierId);
        logger_1.default.info(`req.params: ${JSON.stringify(supportTierDb)}`);
        // const petitionDb = await getPetitionById(petitionId);
        const title = req.body.title !== undefined ? req.body.title : supportTierDb.title;
        const description = req.body.description !== undefined ? req.body.description : supportTierDb.description;
        const cost = req.body.cost !== undefined ? req.body.cost : supportTierDb.cost;
        logger_1.default.info(`supportTier:${JSON.stringify(req.body)}`);
        // Validating the request body
        const validation = yield (0, validate_1.validate)(schemas.support_tier_post, {
            title,
            description,
            cost
        });
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        const dbresult = yield (0, petition_server_model_1.updateSupportTier)(tierId, title, description, cost);
        if (dbresult[0].affectedRows > 0) {
            res.status(200).send("supporteier updated");
        }
        else {
            res.status(400).send("gone wrong");
        }
    }
    catch (err) {
        logger_1.default.error(`Error editing support tier: ${err.message}`);
        res.status(500).send("Internal Server Error");
    }
});
exports.editSupportTier = editSupportTier;
const deleteSupportTier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tierId = parseInt(req.params.tierId, 10); // Assuming the tierId is provided as a route parameter
        if (isNaN(tierId)) {
            res.status(400).send("Invalid tier ID parameter");
            return;
        }
        // Perform the deletion operation by calling the appropriate model function
        const deleteResult = yield (0, petition_server_model_1.deleteSupportTierById)(tierId);
        // Check if the deletion was successful
        if (deleteResult.affectedRows > 0) {
            res.status(200).send("Support tier deleted successfully");
        }
        else {
            res.status(404).send("Support tier not found or already deleted");
        }
    }
    catch (err) {
        logger_1.default.error(`Error deleting support tier: ${err.message}`);
        res.status(500).send("Internal Server Error");
    }
});
exports.deleteSupportTier = deleteSupportTier;
//# sourceMappingURL=petition.support_tier.controller.js.map