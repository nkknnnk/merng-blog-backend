"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = __importDefault(require("express"));
const admin_1 = require("../controllers/admin");
const adminRoutes = express_1.default.Router();
adminRoutes.get("/");
adminRoutes.post("/verify");
adminRoutes.get("/logout");
adminRoutes.get("/users", admin_1.allUsers);
adminRoutes.get("/chats", admin_1.allChats);
adminRoutes.get("/messages", admin_1.allMessages);
adminRoutes.get("/stats", admin_1.getDashboardStats);
exports.default = adminRoutes;
//# sourceMappingURL=admin.js.map