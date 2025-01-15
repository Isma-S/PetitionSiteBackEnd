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
const logger_1 = __importDefault(require("../../config/logger"));
const petition_server_model_1 = require("../models/petition.server.model");
const validate_1 = require("../resources/validate");
const schemas = __importStar(require("../resources/schemas.json"));
const user_server_model_1 = require("../models/user.server.model");
const getAllSupportersForPetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const petitionId = parseInt(req.params.id, 10); // Assuming the petitionId is provided as a route parameter
        if (isNaN(petitionId)) {
            res.status(400).send("Invalid petition ID parameter");
            return;
        }
        // Assuming you have a function to fetch supporters for a petition from the database
        const supporters = yield (0, petition_server_model_1.getSupportersForPetitionFromDB)(petitionId);
        const returnData = {};
        // Respond with the retrieved supporters
        res.status(200).send(supporters);
    }
    catch (err) {
        logger_1.default.error(`Error fetching supporters for petition: ${err.message}`);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getAllSupportersForPetition = getAllSupportersForPetition;
const addSupporter = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield (0, validate_1.validate)(schemas.support_post, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.status(400).send("Invalid petition ID");
            return;
        }
        const supportTierId = req.body.supportTierId;
        const message = req.body.message;
        const token = req.header("X-Authorization");
        logger_1.default.info(`this is user token :${token}`);
        const userDb = yield (0, user_server_model_1.getUserwithToken)(token);
        const userId = userDb[0].id;
        const getPetitionB = yield (0, petition_server_model_1.getPetitionById)(petitionId);
        if (getPetitionB === undefined) {
            res.status(404).send("not in db");
            return;
        }
        logger_1.default.info(`this is json db :${JSON.stringify(getPetitionB)}`);
        logger_1.default.info(`this is user db :${userDb[0].id}`);
        logger_1.default.info(JSON.stringify(req.params));
        logger_1.default.info(JSON.stringify(req.body));
        logger_1.default.info(`this is params:${petitionId}, body:${supportTierId}`);
        logger_1.default.info(`this is params:${typeof petitionId}, body:${typeof supportTierId}`);
        if (getPetitionB.owner_id === userId) {
            res.status(403).send("Forbidden own petition");
            return;
        }
        // const dbGetResult = await getSupportTierById(supportId);
        // if (!supporterId || isNaN(supporterId)) {
        //     res.status(404).send("Invalid supporter ID");
        //     return;
        // }
        const dbresult = yield (0, petition_server_model_1.insertSupportDb)(petitionId, userId, supportTierId, message);
        if (dbresult.affectedRows > 0) {
            res.status(201).send("Supporter added successfully");
        }
    }
    catch (err) {
        logger_1.default.error(`Error adding supporter to petition: ${err.message}`);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.addSupporter = addSupporter;
//# sourceMappingURL=petition.supporter.controller.js.map