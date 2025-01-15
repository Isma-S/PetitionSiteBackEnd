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
exports.deleteImage = exports.setImage = exports.getImage = void 0;
const Users = __importStar(require("../models/user.model"));
const images_model_1 = require("../models/images.model");
const logger_1 = __importDefault(require("../../config/logger"));
const imageTools_1 = require("../models/imageTools");
const getImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.statusMessage = "Id must be an integer";
            res.status(400).send();
            return;
        }
        const filename = yield Users.getImageFilename(userId);
        if (filename == null) {
            res.status(404).send();
            return;
        }
        const [image, mimetype] = yield (0, images_model_1.readImage)(filename);
        res.status(200).contentType(mimetype).send(image);
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
});
exports.getImage = getImage;
const setImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let isNew = true;
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.statusMessage = "Id must be an integer";
            res.status(400).send();
            return;
        }
        const image = req.body;
        const user = yield Users.findUserById(userId);
        if (req.authId !== userId) {
            res.statusMessage = "Forbidden";
            res.status(403).send();
            return;
        }
        if (user == null) {
            res.status(404).send();
            return;
        }
        const mimeType = req.header('Content-Type');
        const fileExt = (0, imageTools_1.getImageExtension)(mimeType);
        if (fileExt === null) {
            res.statusMessage = 'Bad Request: photo must be image/jpeg, image/png, image/gif type, but it was: ' + mimeType;
            res.status(400).send();
            return;
        }
        if (image.length === undefined) {
            res.statusMessage = 'Bad request: empty image';
            res.status(400).send();
            return;
        }
        const filename = yield Users.getImageFilename(userId);
        if (filename != null && filename !== "") {
            yield (0, images_model_1.removeImage)(filename);
            isNew = false;
        }
        const newFilename = yield (0, images_model_1.addImage)(image, fileExt);
        yield Users.setImageFileName(userId, newFilename);
        if (isNew)
            res.status(201).send();
        else
            res.status(200).send();
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.setImage = setImage;
const deleteImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.statusMessage = "Id must be an integer";
            res.status(400).send();
            return;
        }
        const user = yield Users.findUserById(userId);
        if (req.authId !== userId) {
            res.statusMessage = "Forbidden";
            res.status(403).send();
            return;
        }
        if (user == null) {
            res.status(404).send();
            return;
        }
        const filename = yield Users.getImageFilename(userId);
        if (filename == null || filename === "") {
            res.status(404).send();
            return;
        }
        yield (0, images_model_1.removeImage)(filename);
        yield Users.removeImageFilename(userId);
        res.status(200).send();
    }
    catch (err) {
        logger_1.default.error(err);
        res.status(500).send();
    }
});
exports.deleteImage = deleteImage;
//# sourceMappingURL=user.image.controller.js.map