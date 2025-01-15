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
const schemas = __importStar(require("../resources/schemas.json"));
const Petition = __importStar(require("../models/petition.model"));
const Image = __importStar(require("../models/images.model"));
const validator_1 = require("../services/validator");
const Supporter = __importStar(require("../models/supporter.model"));
const getAllPetitions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield (0, validator_1.validate)(schemas.petition_search, req.query);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        if (req.query.hasOwnProperty("ownerId"))
            req.query.ownerId = parseInt(req.query.ownerId, 10);
        if (req.query.hasOwnProperty("supporterId"))
            req.query.supporterId = parseInt(req.query.supporterId, 10);
        if (req.query.hasOwnProperty("supportingCost"))
            req.query.supportingCost = parseInt(req.query.supportingCost, 10);
        if (req.query.hasOwnProperty("startIndex"))
            req.query.startIndex = parseInt(req.query.startIndex, 10);
        if (req.query.hasOwnProperty("count"))
            req.query.count = parseInt(req.query.count, 10);
        if (req.query.hasOwnProperty("categoryIds")) {
            if (!Array.isArray(req.query.categoryIds))
                req.query.categoryIds = [parseInt(req.query.categoryIds, 10)];
            else
                req.query.categoryIds = req.query.categoryIds.map((x) => parseInt(x, 10));
            const categories = yield Petition.getCategories();
            if (!req.query.categoryIds.every(c => categories.map(x => x.categoryId).includes(c))) {
                res.statusMessage = `Bad Request: No category with id`;
                res.status(400).send();
                return;
            }
        }
        let search = {
            q: '',
            ownerId: -1,
            supporterId: -1,
            supportingCost: -1,
            categoryIds: [],
            sortBy: 'CREATED_ASC',
            startIndex: 0,
            count: -1
        };
        search = Object.assign(Object.assign({}, search), req.query);
        const petitions = yield Petition.viewAll(search);
        res.status(200).send(petitions);
        return;
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
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.statusMessage = "Id must be an integer";
            res.status(400).send();
            return;
        }
        const petition = yield Petition.getOne(petitionId);
        if (petition != null) {
            res.status(200).send(petition);
            return;
        }
        else {
            res.status(404).send();
            return;
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
});
exports.getPetition = getPetition;
const addPetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield (0, validator_1.validate)(schemas.petition_post, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        const d = new Date();
        const creationDate = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
        const categories = yield Petition.getCategories();
        if (!categories.find(c => c.categoryId === req.body.categoryId)) {
            res.statusMessage = "No category with id";
            res.status(400).send();
            return;
        }
        const seenValues = new Set();
        const hasDuplicateSupportTierTitle = req.body.supportTiers.some((st) => {
            if (seenValues.has(st.title)) {
                return true;
            }
            seenValues.add(st.title);
            return false;
        });
        if (hasDuplicateSupportTierTitle) {
            res.statusMessage = "supportTiers must have unique titles";
            res.status(400).send();
            return;
        }
        const result = yield Petition.addOne(req.authId, req.body.title, req.body.description, creationDate, req.body.categoryId, req.body.supportTiers);
        if (result) {
            res.status(201).send({ "petitionId": result.insertId });
            return;
        }
        else {
            // todo: this feels like a proper edge case to catch
            res.statusMessage = "Petition could not be saved";
            res.status(500).send();
            return;
        }
    }
    catch (err) {
        logger_1.default.error(err);
        if (err.errno === 1062) { // 1062 = Duplicate entry MySQL error number
            res.statusMessage = "Forbidden: Duplicate petition";
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
exports.addPetition = addPetition;
const editPetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield (0, validator_1.validate)(schemas.petition_patch, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
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
        if (petition.ownerId !== req.authId) {
            res.statusMessage = "Cannot edit another user's petition";
            res.status(403).send();
            return;
        }
        let title = petition.title;
        if (req.body.hasOwnProperty("title")) {
            title = req.body.title;
        }
        let description = petition.description;
        if (req.body.hasOwnProperty("description")) {
            description = req.body.description;
        }
        let categoryId = petition.categoryId;
        if (req.body.hasOwnProperty("categoryId")) {
            const categories = yield Petition.getCategories();
            if (!categories.find(c => c.categoryId === req.body.categoryId)) {
                res.statusMessage = "No category with id";
                res.status(400).send();
                return;
            }
            else {
                categoryId = req.body.categoryId;
            }
        }
        const result = yield Petition.editOne(petitionId, title, description, categoryId);
        if (result) {
            res.status(200).send();
            return;
        }
        else {
            // todo: what could cause this case?
            logger_1.default.warn("Petition could not be updated");
            res.statusMessage = "Petition could not be updated";
            res.status(500).send();
        }
    }
    catch (err) {
        logger_1.default.error(err);
        if (err.errno === 1062) { // 1062 = Duplicate entry MySQL error number
            res.statusMessage = "Forbidden: Duplicate petition";
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
exports.editPetition = editPetition;
const deletePetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (petition.ownerId !== req.authId) {
            res.statusMessage = "Cannot edit another user's petition";
            res.status(403).send();
            return;
        }
        const supporters = yield Supporter.getSupporters(petitionId);
        if (supporters.length !== 0) {
            res.statusMessage = "Can not delete a petition if one or more users have supported it";
            res.status(403).send();
            return;
        }
        const filename = yield Petition.getImageFilename(petitionId);
        const result = yield Petition.deleteOne(petitionId);
        if (result) {
            if (filename !== null && filename !== "") {
                yield Image.removeImage(filename);
            }
            res.status(200).send();
            return;
        }
        else {
            // todo: what could cause this case?
            logger_1.default.error("Could not delete petition");
            res.statusMessage = "Could not delete petition";
            res.status(500).send();
            return;
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.deletePetition = deletePetition;
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield Petition.getCategories();
        res.status(200).send(categories);
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
});
exports.getCategories = getCategories;
//# sourceMappingURL=petition.controller.js.map