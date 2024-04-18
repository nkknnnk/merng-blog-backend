"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = __importDefault(require("express"));
const auth_js_1 = require("../middlewares/auth.js");
const chat_1 = require("../controllers/chat");
const multer_1 = require("../middlewares/multer");
const chatRoutes = express_1.default.Router();
// After here user be logged in to access the routes
chatRoutes.use(auth_js_1.isAuthenticated);
// http://localhost:3001/chat
chatRoutes.post("/new", chat_1.newGroupChat);
chatRoutes.get("/my", chat_1.getMyChats);
chatRoutes.get("/myGroups", chat_1.getMyGroups);
chatRoutes.put("/addMembers", chat_1.addMemberToGroup);
chatRoutes.put("/removeMember", chat_1.removeMemberFromGroup);
chatRoutes.put("/leave/:id", chat_1.leaveGroup);
// send Attachements
chatRoutes.post("/message", multer_1.attachmentMulter, chat_1.sendAttachments);
chatRoutes.get("/message/:id", chat_1.getMessage);
// Get Chat Details, rename, delete
chatRoutes
    .route("/:id")
    .get(chat_1.getChatDetails)
    .put(chat_1.renameGroup)
    .delete(chat_1.deleteChat);
exports.default = chatRoutes;
//# sourceMappingURL=chat.js.map