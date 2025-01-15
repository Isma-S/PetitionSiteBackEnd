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
const logger_1 = __importDefault(require("../../config/logger"));
const users = __importStar(require("../models/user.image.server.model"));
const validate_1 = require("../resources/validate");
const schemas = __importStar(require("../resources/schemas.json"));
const fs_1 = __importDefault(require("mz/fs"));
const path_1 = __importDefault(require("path"));
const mime_1 = __importDefault(require("mime"));
const getImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id, 10);
        const dbresult = yield users.getUserwithId(id);
        if (dbresult.length === 0) {
            res.status(404).send(`User id:${id} doesnt exist`);
            return;
        }
        logger_1.default.info(`ssss${dbresult}`);
        const userdb = dbresult[0];
        const imageName = userdb.image_filename;
        logger_1.default.info(`type?${imageName}`);
        if (imageName === null) {
            res.status(404).send("no image yet");
            return;
        }
        const imageType = imageName.split('.')[1];
        // const imageName = `${id}.${imageType}`;
        const imageDirectory = path_1.default.join(__dirname, "../isa50/storage/images");
        const imagePath = path_1.default.join(imageDirectory, imageName);
        // const temp = req.header("Content-Type");
        // set the content type to image??
        // Logger.info(`ssss${typeof image}`)
        logger_1.default.info(`ssss${imageType}`);
        // need to be sorted??
        const contentType = mime_1.default.lookup(imageType);
        logger_1.default.info(`mime ${contentType}`);
        res.setHeader("Content-Type", contentType);
        res.sendFile(imagePath);
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getImage = getImage;
const setImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield (0, validate_1.validate)(schemas.user_edit, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request:  ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        const id = parseInt(req.params.id, 10);
        const imageHeader = req.header("Content-Type");
        const imageType = imageHeader.split('/')[1];
        logger_1.default.info(`This is the headerfor image type:${imageType}??`);
        const image = req.body;
        const imageDirectory = path_1.default.join(__dirname, "../isa50/storage/images");
        logger_1.default.info(`Image uploaded to image directory:${imageDirectory}`);
        const imageName = `user_${id}.${imageType}`;
        logger_1.default.info(`Image uploaded to image name:${imageName}`);
        const imagePath = path_1.default.join(imageDirectory, imageName);
        logger_1.default.info(`Image uploaded to:${imagePath}`);
        yield fs_1.default.promises.mkdir(imageDirectory, { recursive: true });
        try {
            // Logger.info(`Image moved to:${imagePath}`)
            yield fs_1.default.promises.writeFile(imagePath, image);
            logger_1.default.info(`Image moved to:${typeof image}`);
            const dbresult = yield users.insertImage(imageName, id);
            // Logger.info(`dbresult:${JSON.stringify(dbresult)}`)
            if (dbresult.affectedRows > 0) {
                res.status(201).send("image file name set successfully");
            }
            else {
                res.status(403).send(`User id:${id} doesnt exist`);
            }
            logger_1.default.info("written file successfully");
        }
        catch (err) {
            logger_1.default.error("Error writing image to folder", err);
        }
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
        const validation = yield (0, validate_1.validate)(schemas.user_edit, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request:  ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        const id = parseInt(req.params.id, 10);
        const authHeader = req.header('X-Authorization').toString();
        if (isNaN(id)) {
            res.status(400).send(`Bad Request: Id is not a number`);
            return;
        }
        logger_1.default.info(`Userid:${id}`);
        const result = yield users.getUserwithId(id);
        if (result.length === 0) {
            res.status(404).send('User not found');
        }
        // not sure if username needs to b modified??
        const user = result[0];
        // This is not passing when running as collection??
        const tokenDb = user.auth_token;
        if (authHeader === tokenDb) {
            logger_1.default.info(`authenticated and deleting`);
            // look into storage and delete physical image??
            const dbresult = yield users.deleteImage(id);
            if (dbresult.affectedRows > 0) {
                res.status(200).send("successfully deleted image");
            }
            else {
                res.status(404).send("errorrr");
            }
            return;
        }
        else {
            logger_1.default.info(`mismatch authen`);
            res.status(403).send("Unauthrised User");
        }
        ;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.deleteImage = deleteImage;
//# sourceMappingURL=user.image.controller.js.map