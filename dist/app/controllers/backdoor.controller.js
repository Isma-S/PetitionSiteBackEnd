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
exports.executeSql = exports.reload = exports.resample = exports.resetDb = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const Backdoor = __importStar(require("../models/backdoor.model"));
const resetDb = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Backdoor.resetDb();
        res.statusMessage = "OK";
        res.status(200).send();
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
});
exports.resetDb = resetDb;
const resample = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Backdoor.loadData();
        res.statusMessage = "Created";
        res.status(201).send();
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
});
exports.resample = resample;
const reload = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Backdoor.resetDb();
        yield Backdoor.loadData();
        res.statusMessage = "Created";
        res.status(201).send();
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
});
exports.reload = reload;
const executeSql = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sqlCommand = String(req.body);
    try {
        const results = yield Backdoor.executeSql(sqlCommand);
        res.statusMessage = 'OK';
        res.status(200).json(results);
    }
    catch (err) {
        if (!err.hasBeenLogged)
            logger_1.default.error(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
});
exports.executeSql = executeSql;
//# sourceMappingURL=backdoor.controller.js.map