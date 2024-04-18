"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFilesFromCloudinary = exports.uploadFilesToCloudinary = exports.emitEvent = exports.cookieOption = exports.sendToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const helper_1 = require("../lib/helper");
const cloudinary_1 = require("cloudinary");
const cookieOption = {
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "none",
    httpOnly: true,
    secure: true,
};
exports.cookieOption = cookieOption;
const sendToken = (res, user, code, message) => {
    // @ts-ignore
    const token = jsonwebtoken_1.default.sign({ _id: user._id }, process.env.JWT_SECRET);
    console.log(token);
    try {
        return res
            .status(code)
            .cookie("chat-cookie-token", token, cookieOption)
            .json({ success: true, token, message, user });
    }
    catch (error) {
        console.log(error.message);
        return res
            .status(500)
            .send({ error: "Error sending token", message: error.message });
    }
};
exports.sendToken = sendToken;
const emitEvent = (req, event, users, data) => {
    let io = req.app.get("io");
    // @ts-ignore
    const userSocket = (0, helper_1.getSockets)(users);
    io.to(userSocket).emit(event, data);
    console.log("Emmiting event: ", event, users, data);
};
exports.emitEvent = emitEvent;
const uploadFilesToCloudinary = async (files = []) => {
    try {
        const uploadPromises = files.map((file) => {
            return new Promise((resolve, reject) => {
                cloudinary_1.v2.uploader.upload((0, helper_1.getBase64)(file), {
                    resource_type: "auto",
                    public_id: (0, uuid_1.v4)(),
                }, (error, result) => {
                    if (error)
                        return reject(error);
                    resolve(result);
                });
            });
        });
        const results = await Promise.all(uploadPromises);
        const formattedResults = results.map((result) => ({
            // @ts-ignore
            public_id: result?.public_id,
            // @ts-ignore
            url: result?.secure_url,
        }));
        return formattedResults;
    }
    catch (error) {
        console.log(error.message);
        return [];
    }
};
exports.uploadFilesToCloudinary = uploadFilesToCloudinary;
const deleteFilesFromCloudinary = async (publicId) => { };
exports.deleteFilesFromCloudinary = deleteFilesFromCloudinary;
//# sourceMappingURL=features.js.map