"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageExtension = exports.getImageMimetype = void 0;
const getImageMimetype = (filename) => {
    if (filename.endsWith('.jpeg') || filename.endsWith('.jpg'))
        return 'image/jpeg';
    if (filename.endsWith('.png'))
        return 'image/png';
    if (filename.endsWith('.gif'))
        return 'image/gif';
    return 'application/octet-stream';
};
exports.getImageMimetype = getImageMimetype;
const getImageExtension = (mimeType) => {
    switch (mimeType) {
        case 'image/jpeg':
            return '.jpeg';
        case 'image/png':
            return '.png';
        case 'image/gif':
            return '.gif';
        default:
            return null;
    }
};
exports.getImageExtension = getImageExtension;
//# sourceMappingURL=imageTools.js.map