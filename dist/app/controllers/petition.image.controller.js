"use strict";
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
exports.setImage = exports.getImage = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const path_1 = __importDefault(require("path"));
const mime_1 = __importDefault(require("mime"));
const petition_server_model_1 = require("../models/petition.server.model");
const fs_1 = __importDefault(require("mz/fs"));
const filepath = "../../../storage/images";
const getImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id, 10);
        const dbresult = yield (0, petition_server_model_1.getPetitionById)(id);
        if (dbresult.length === 0) {
            res.status(404).send(`Petition with id:${id} doesn't exist`);
            return;
        }
        const imageName = dbresult.image_filename;
        if (!imageName) {
            res.status(404).send("No image found for this petition");
            return;
        }
        const imageDirectory = path_1.default.join(__dirname, filepath);
        const imagePath = path_1.default.join(imageDirectory, imageName);
        logger_1.default.info(`petition:${imagePath}`);
        const contentType = mime_1.default.lookup(imagePath); // Getting MIME type from file path
        if (!contentType) {
            res.status(500).send("Internal Server Error: Unable to determine image content type");
            return;
        }
        res.setHeader("Content-Type", contentType);
        res.sendFile(imagePath);
    }
    catch (err) {
        logger_1.default.error(err);
        res.status(500).send("Internal Server Error");
    }
});
exports.getImage = getImage;
const setImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const image = req.body;
        // Check if request contains file
        if (!image) {
            res.status(400).send("No file uploaded");
            return;
        }
        const id = parseInt(req.params.id, 10);
        const imageHeader = req.header("Content-Type");
        const imageType = imageHeader.split('/')[1];
        // Assuming you have a directory to save images
        const uploadDirectory = path_1.default.join(__dirname, filepath);
        // Check if the directory exists, if not, create it
        if (!fs_1.default.existsSync(uploadDirectory)) {
            fs_1.default.mkdirSync(uploadDirectory, { recursive: true });
        }
        // Assuming you want to save the file with the original name
        const imageName = `petition_${id}.${imageType}`;
        const filePath = path_1.default.join(uploadDirectory, imageName);
        logger_1.default.info("writing image to dir");
        // Move the uploaded file to the specified directory
        try {
            // Logger.info(`Image moved to:${imagePath}`)
            yield fs_1.default.writeFile(filePath, image);
            logger_1.default.info(`Image moved to:${filePath}`);
            const dbresult = yield (0, petition_server_model_1.insertPetitionImage)(imageName, id);
            logger_1.default.info(`Image moved to:${typeof image}`);
            if (dbresult && dbresult.affectedRows > 0) {
                if (imageType === "jpeg") {
                    res.status(201).send("Image file name set successfully");
                }
                else if (imageType === "gif") {
                    res.status(200).send("Image file name set successfully");
                }
                else {
                    res.status(400).send(`Unsupported image type: ${imageType}`);
                }
            }
            else {
                res.status(403).send(`User id:${id} doesn't exist`);
            }
            logger_1.default.info("written file successfully");
        }
        catch (err) {
            logger_1.default.error("Error writing image to folder", err);
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.status(500).send("Internal Server Error");
    }
});
exports.setImage = setImage;
//# sourceMappingURL=petition.image.controller.js.map