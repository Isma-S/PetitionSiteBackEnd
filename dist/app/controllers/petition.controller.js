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
exports.getCategories = exports.deletePetition = exports.editPetition = exports.addPetition = exports.getPetition = exports.getAllPetitions = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const petition_server_model_1 = require("../models/petition.server.model");
const validate_1 = require("../resources/validate");
const schemas = __importStar(require("../resources/schemas.json"));
const user_server_model_1 = require("../models/user.server.model");
const user_controller_1 = require("./user.controller");
const getAllPetitions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield (0, validate_1.validate)(schemas.petition_search, req.query);
        logger_1.default.info(`Thisisownerid:${validation}`);
        if (validation !== true) {
            res.statusMessage = `Bad Request:  ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        const petitions = [];
        const startIndex = parseInt(req.query.startIndex, 10);
        const count = parseInt(req.query.count, 10);
        const searchQuery = req.query.q;
        const supportingCost = parseInt(req.query.supportingCost, 10);
        const supporterId = parseInt(req.query.supporterId, 10);
        const ownerId = req.query.ownerId;
        const sortBy = req.query.sortBy;
        // Should be handled in schemajson??
        logger_1.default.info(`Thisis the supid${supporterId}`);
        // Check if supporterId exists and is not empty
        // if (isNaN(supporterId)) {
        //     res.status(400).send("Not a number");
        //     return;
        // }
        let categoryIds = [];
        if (req.query.categoryIds) {
            if (Array.isArray(req.query.categoryIds))
                categoryIds = req.query.categoryIds.map(id => parseInt(id, 10));
            else
                categoryIds = [parseInt(req.query.categoryIds, 10)];
        }
        const dbresult = yield (0, petition_server_model_1.getAll)(searchQuery, supportingCost, supporterId, categoryIds, ownerId, sortBy);
        const dbData = JSON.stringify(dbresult);
        for (const item of dbresult) {
            // Logger.info(item);
            // const supportTierId = await getSupportTierById(item.supporterId);
            petitions.push({
                petitionId: item.petitionId,
                title: item.title,
                categoryId: item.category_id,
                ownerId: item.owner_id,
                ownerFirstName: item.first_name,
                ownerLastName: item.last_name,
                creationDate: item.creation_date,
                supportingCost: item.supportingCost,
                supporterId: item.supporterId,
                // supporteruserid:item.supporteruserid,
                // supportTierId,
            });
        }
        const responseData = {
            count: dbresult.length,
            petitions,
        };
        if (startIndex >= 0) {
            logger_1.default.info(`this is the count:${startIndex}`);
            const slicedPetitions = responseData.petitions.slice(startIndex, startIndex + count);
            logger_1.default.info(`this is the petitions:${slicedPetitions}`);
            responseData.petitions = slicedPetitions;
            res.status(200).send(responseData);
            return;
        }
        // Logger.info(`type ${ responseData.count}`)
        // Logger.info(`type ${ typeof responseData}`)
        res.status(200).send(responseData);
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getAllPetitions = getAllPetitions;
const getPetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const petitionId = parseInt(req.params.id, 10); // Assuming the petitionId is provided as a route parameter
        const petition = yield (0, petition_server_model_1.getPetitionById)(petitionId); // Fetch the petition by its ID
        if (petition === -1) { // If petition not found
            res.statusMessage = "Petition not found";
            res.status(404).send();
            return;
        }
        res.status(200).json(petition); // Respond with the retrieved petition
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getPetition = getPetition;
const addPetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, categoryId, supportTiers } = req.body;
        // Check if the title is empty
        logger_1.default.info(`thisistitlt${title}`);
        const auth = req.header("X-Authorization");
        logger_1.default.info(`thisisauth${auth}`);
        // this had auth with db??
        if (auth === undefined) {
            res.status(401).send("Not autharized");
            return;
        }
        if (!title) {
            res.status(400).send("Title cannot be empty");
            return;
        }
        if (!supportTiers) {
            res.status(400).send("supportTiers cannot be empty, or too many or cost Nan");
            return;
        }
        if (supportTiers.length > 3) {
            res.status(400).send("supportTiers cannot be empty, or too many or cost Nan");
            return;
        }
        for (const items of supportTiers) {
            if (typeof (items.cost) !== 'number') {
                res.status(400).send("cost must be provided");
                return;
            }
        }
        logger_1.default.info(`useridfor petition:${auth}`);
        const dbtokenresult = yield (0, user_server_model_1.getUserwithToken)(auth);
        const userId = dbtokenresult[0].id;
        const dbresult = yield (0, petition_server_model_1.insertPetition)({ userId, title, description, categoryId, supportTiers });
        logger_1.default.info(`dbresult petition:${dbresult}`);
        const petitionId = dbresult[0].insertId;
        const supportId = dbresult[1].insertId;
        logger_1.default.info(`This is the response${JSON.stringify(dbresult[0])}`);
        logger_1.default.info(supportId);
        res.status(201).send({ petitionId });
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.addPetition = addPetition;
const editPetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield (0, validate_1.validate)(schemas.petition_patch, req.body);
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
        logger_1.default.info(`global token ${user_controller_1.globalToken}, currentToken:${authHeader}`);
        // if (authHeader !== globalToken) {
        //     res.status(404).send("User no authenticated,mismatch");
        //     return ;
        // }
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
        // need to be dynamic??
        // const title = req.body.title;
        logger_1.default.info(`thisiisdescription ${petition.description}`);
        const title = req.body.title || petition.title; // Keep the existing title if not provided
        const description = req.body.description || petition.description; // Keep the existing description if not provided
        const categoryId = req.body.categoryId || petition.categoryId;
        const dbresult = yield (0, petition_server_model_1.updatePetition)(petitionId, title, description, categoryId);
        logger_1.default.info(dbresult);
        if (dbresult[0].affectedRows > 0) {
            res.status(200).send("title updated");
        }
        else {
            res.status(400).send("gone wrong");
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.editPetition = editPetition;
const deletePetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.header('X-Authorization');
        if (!authHeader) {
            res.status(401).send("Unauthorized");
            return;
        }
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.status(400).send("Invalid ID parameter");
            return;
        }
        // Retrieve petition details
        const petition = yield (0, petition_server_model_1.getPetitionById)(petitionId);
        if (!petition) {
            res.status(404).send("Petition not found");
            return;
        }
        // Check if the user is the owner of the petition
        // const userTokenDb = await getUserwithToken(authHeader);
        // const userTokenDbId = userTokenDb[0].id;
        // if (userTokenDbId !== petition.owner_id) {
        //     res.status(403).send("Forbidden: You are not the owner of this petition");
        //     return;
        // }
        // Delete the petition from the database
        const deleteResult = yield (0, petition_server_model_1.deletePetitionById)(petitionId);
        if (deleteResult.message) {
            res.status(403).send("Error in sql");
            return;
        }
        logger_1.default.info(`this is delete result${JSON.stringify(deleteResult)}`);
        if (deleteResult[0].affectedRows > 0) {
            res.status(200).send("Petition deleted successfully");
            // Logger.info('WHHHHHH')
            return;
        }
        else {
            // Logger.info(`${deleteResult.affectedRows}`)
            res.status(403).send(`Failed to delete petition${deleteResult}`);
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.status(500).send("Internal Server Error");
    }
});
exports.deletePetition = deletePetition;
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield (0, petition_server_model_1.getAllCategories)(); // Assuming you have a function to fetch categories
        res.status(200).json(categories); // Send categories as a JSON response
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
});
exports.getCategories = getCategories;
//# sourceMappingURL=petition.controller.js.map