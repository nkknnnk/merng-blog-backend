"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachmentMulter = exports.multerUpload = void 0;
const multer_1 = __importDefault(require("multer"));
exports.multerUpload = (0, multer_1.default)({
    limits: {
        fileSize: 1024 * 1024 * 5, // Maximum file size is 5MB
    },
});
exports.attachmentMulter = exports.multerUpload.array("files", 5);
//# sourceMappingURL=multer.js.map