"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = void 0;
const uuid_1 = require("uuid");
const generateToken = () => {
    const token = (0, uuid_1.v4)();
    return token;
};
exports.generateToken = generateToken;
//# sourceMappingURL=generateToken.js.map