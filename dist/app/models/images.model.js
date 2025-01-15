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
exports.addImage = exports.removeImage = exports.readImage = void 0;
const mz_1 = require("mz");
const imageTools_1 = require("./imageTools");
const rand_token_1 = require("rand-token");
const logger_1 = __importDefault(require("../../config/logger"));
const filepath = './storage/images/';
const readImage = (fileName) => __awaiter(void 0, void 0, void 0, function* () {
    const image = yield mz_1.fs.readFile(filepath + fileName);
    const mimeType = (0, imageTools_1.getImageMimetype)(fileName);
    return [image, mimeType];
});
exports.readImage = readImage;
const removeImage = (filename) => __awaiter(void 0, void 0, void 0, function* () {
    if (filename) {
        if (yield mz_1.fs.exists(filepath + filename)) {
            yield mz_1.fs.unlink(filepath + filename);
        }
    }
});
exports.removeImage = removeImage;
const addImage = (image, fileExt) => __awaiter(void 0, void 0, void 0, function* () {
    const filename = (0, rand_token_1.generate)(32) + fileExt;
    try {
        yield mz_1.fs.writeFile(filepath + filename, image);
        return filename;
    }
    catch (err) {
        logger_1.default.error(err);
        mz_1.fs.unlink(filepath + filename).catch(err => logger_1.default.error(err));
        throw err;
    }
});
exports.addImage = addImage;
//# sourceMappingURL=images.model.js.map