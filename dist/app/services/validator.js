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
exports.validate = void 0;
const ajv_1 = __importDefault(require("ajv"));
const ajv = new ajv_1.default({ removeAdditional: 'all', strict: false });
ajv.addFormat('email', /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i);
ajv.addFormat('password', /^.{6,}$/);
ajv.addFormat('binary', /.*/);
ajv.addFormat('integer', /^\d+$/);
ajv.addFormat('datetime', /^\d\d\d\d-\d\d?-\d\d? \d\d?:\d\d?:\d\d?$/);
const validate = (schema, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validator = ajv.compile(schema);
        const valid = yield validator(data);
        if (!valid)
            return ajv.errorsText(validator.errors);
        return true;
    }
    catch (err) {
        return err.message;
    }
});
exports.validate = validate;
//# sourceMappingURL=validator.js.map