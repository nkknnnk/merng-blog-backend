"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBase64 = exports.getSockets = exports.getOtherMember = void 0;
const app_1 = require("../app");
const getOtherMember = (members, userId) => {
    return members.find((member) => member._id !== userId);
};
exports.getOtherMember = getOtherMember;
const getSockets = (users = []) => {
    const sockets = users.map((user) => app_1.userSocketIDs.get(user));
    console.log("sockets: ", sockets, users);
    return sockets;
};
exports.getSockets = getSockets;
const getBase64 = (file) => `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
exports.getBase64 = getBase64;
//# sourceMappingURL=helper.js.map